import React, { useState, useEffect } from 'react';
import { BadgeDollarSign, Search, Calendar, CheckCircle, Clock, Calculator, Trash2, FileText, Download } from 'lucide-react';
import api from '../../services/api';
import html2pdf from 'html2pdf.js';
import { useUI } from '../../context/UIContext';

export default function Payroll() {
    const { confirm, alert, toast } = useUI();
    const [employees, setEmployees] = useState([]);
    const [salaryRecords, setSalaryRecords] = useState([]);
    const [companyConfig, setCompanyConfig] = useState({ name: '', address: '' });
    const [loading, setLoading] = useState(true);
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [payForm, setPayForm] = useState({
        amount: '',
        bonus: 0,
        payPeriod: '', // e.g., 'October 2023'
        paymentDate: new Date().toISOString().slice(0, 10),
        remarks: '',
    });

    const [calculation, setCalculation] = useState(null);
    const [calculating, setCalculating] = useState(false);

    const calculateSalary = async (employeeId, period) => {
        if (!employeeId || !period) return;
        setCalculating(true);
        try {
            // Parse period to get month and year
            // Assuming format "Month Year" e.g., "October 2023"
            const parts = period.split(' ');
            if (parts.length !== 2) {
                // If invalid format, maybe just don't calculate or default to current?
                // For now, let's try to parse simple "Month Year"
                setCalculating(false);
                return;
            }

            const monthName = parts[0];
            const year = parts[1];
            const month = new Date(`${monthName} 1, 2000`).getMonth() + 1; // 1-12

            const res = await api.get(`/employees/${employeeId}/calculate-salary`, {
                params: { month, year, bonus: payForm.bonus } // Send bonus to calc
            });
            setCalculation(res.data);
            // Auto-fill amount, preserving current bonus if needed, or just use finalSalary which includes bonus
            // But wait, if calculation comes back, it includes bonus passed in params.
            setPayForm(prev => ({ ...prev, amount: parseFloat(res.data.finalSalary.toFixed(2)) }));
        } catch (err) {
            console.error("Calculation Error:", err);
            // Fallback or user alert
        } finally {
            setCalculating(false);
        }
    };

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchData();
    }, []);

    // Helper to get payment status for an employee in selected period
    const getPaymentStatus = (employeeId) => {
        return salaryRecords.find(record => {
            const recordDate = new Date(record.paymentDate);
            return (record.employeeId?.id || record.employeeId) === employeeId &&
                recordDate.getMonth() + 1 === selectedMonth &&
                recordDate.getFullYear() === selectedYear;
        });
    };

    const periodLabel = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    // Calculate Stats
    const totalMonthlyLiability = employees.reduce((acc, emp) => acc + (emp.salary || 0) / 12, 0);
    const paidAmount = salaryRecords
        .filter(r => {
            const d = new Date(r.paymentDate);
            return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
        })
        .reduce((acc, r) => acc + r.amount, 0);
    const pendingAmount = Math.max(0, totalMonthlyLiability - paidAmount);

    const fetchData = async () => {
        try {
            const companyId = localStorage.getItem('companyId');
            const [empRes, salaryRes, configRes] = await Promise.all([
                api.get('/employees', { params: { companyId } }),
                api.get('/employees/salary-records', { params: { companyId } }),
                api.get('/company/config')
            ]);
            setEmployees(empRes.data);
            setSalaryRecords(salaryRes.data);
            if (configRes.data?.company) {
                setCompanyConfig({
                    name: configRes.data.company.name || '',
                    address: configRes.data.company.address || '',
                    logo: configRes.data.company.logo || ''
                });
            }
        } catch (err) {
            console.error('Payroll Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPayModal = (emp) => {
        // Pre-fill period based on selection
        const period = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

        setSelectedEmployee(emp);
        setPayForm({
            amount: emp.salary ? (emp.salary / 12).toFixed(2) : '',
            payPeriod: period,
            paymentDate: new Date().toISOString().slice(0, 10),
            remarks: 'Monthly Salary',
            bonus: 0
        });

        // Auto-calculate on open
        // calculateSalary(emp._id, period); // Optional: Auto trigger calculation
        setShowPayModal(true);
    };

    const handlePaySalary = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/employees/${selectedEmployee.id}/pay`, {
                amount: payForm.amount,
                payPeriod: payForm.payPeriod,
                paymentDate: payForm.paymentDate,
                remarks: payForm.remarks,
                bonus: payForm.bonus,
                companyId: localStorage.getItem('companyId'),
                ...(calculation || {}),
                deductionAmount: calculation?.deduction ?? 0
            });
            toast.success('Salary Paid Successfully!');
            setShowPayModal(false);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Error', 'Failed to pay salary: ' + (err?.response?.data?.message || err.message), 'error');
        }
    };

    const handleDeleteSalary = async (recordId) => {
        const ok = await confirm('Delete Salary Record', "Are you sure you want to delete this salary record? This will revert the status to Pending.", 'Delete');
        if (!ok) return;
        try {
            await api.delete(`/employees/salary-records/${recordId}`);
            fetchData();
        } catch (err) {
            console.error("Failed to delete salary record", err);
            confirm("Error", "Failed to delete salary record", "OK", "danger");
        }
    };

    const generatePaySlip = (employee, record) => {
        const element = document.createElement('div');
        element.innerHTML = `
            <div style="padding: 40px; font-family: sans-serif; max-width: 800px; margin: 0 auto; border: 1px solid #eee;">
                <h2 style="text-align: center; margin-bottom: 30px; color: #333;">PAYSLIP</h2>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                    <div>
                        <strong>${companyConfig.name || 'Company'}</strong><br>
                        ${(companyConfig.address || '').replace(/\n/g, '<br>')}
                    </div>
                    <div style="text-align: right;">
                        <strong>Payslip For:</strong> ${record.payPeriod}<br>
                        <strong>Payment Date:</strong> ${new Date(record.paymentDate).toLocaleDateString()}
                    </div>
                </div>

                <div style="margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px;">
                    <strong>Employee Details:</strong><br>
                    Name: ${employee.firstName} ${employee.lastName}<br>
                    Designation: ${employee.position}<br>
                    Employee ID: ${(employee.id || '').slice(-6).toUpperCase()}
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Description</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;">Basic Salary</td>
                            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">₹${record.baseSalary?.toLocaleString() || (record.amount + (record.deductionAmount || 0)).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;">Bonus</td>
                            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee; color: #16a34a;">+ ₹${(record.bonus || 0).toLocaleString()}</td>
                        </tr>
                        ${record.deductionAmount > 0 ? `
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #dc2626;">Deductions (Leaves)</td>
                            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee; color: #dc2626;">- ₹${record.deductionAmount.toLocaleString()}</td>
                        </tr>
                        ` : ''}
                        <tr style="font-weight: bold; background-color: #f8f9fa;">
                            <td style="padding: 12px; border-bottom: 1px solid #ddd;">Net Payable</td>
                            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">₹${record.amount.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
                    This is a computer-generated payslip and does not require a signature.
                </div>
            </div>
        `;

        html2pdf().from(element).save(`Payslip_${employee.firstName}_${record.payPeriod}.pdf`);
    };

    if (loading) return <div className="p-10 text-center">Loading Payroll...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Payroll Management</h1>
                    <p className="text-sm text-slate-500">Manage salaries for {periodLabel}</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                        <button onClick={() => {
                            if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
                            else { setSelectedMonth(m => m - 1); }
                        }} className="p-1 hover:bg-slate-100 rounded">&lt;</button>
                        <span className="text-sm font-semibold w-32 text-center">{periodLabel}</span>
                        <button onClick={() => {
                            if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
                            else { setSelectedMonth(m => m + 1); }
                        }} className="p-1 hover:bg-slate-100 rounded">&gt;</button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500">Total Liability</div>
                    <div className="text-2xl font-bold text-slate-900">₹{totalMonthlyLiability.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500">Paid this Month</div>
                    <div className="text-2xl font-bold text-emerald-600">₹{paidAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500">Pending Amount</div>
                    <div className="text-2xl font-bold text-orange-600">₹{pendingAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-6 py-4">Position</th>
                            <th className="px-6 py-4">Annual Salary</th>
                            <th className="px-6 py-4">Monthly (Approx)</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {employees.filter(emp => {
                            const selectedPeriodEnd = new Date(selectedYear, selectedMonth, 0); // Last day of selected month
                            const joiningDate = new Date(emp.dateHired);
                            // Show only if joined before or during the selected month
                            return joiningDate <= selectedPeriodEnd;
                        }).map(emp => {
                            const payment = getPaymentStatus(emp.id);
                            const isPaid = !!payment;

                            return (
                                <tr key={emp.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                {emp.firstName[0]}{emp.lastName[0]}
                                            </div>
                                            {emp.firstName} {emp.lastName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{emp.position}</td>
                                    <td className="px-6 py-4 text-slate-900 font-medium">₹{emp.salary?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-emerald-600 font-medium">₹{(emp.salary / 12).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 text-center">
                                        {isPaid ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle size={12} /> Paid
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                <Clock size={12} /> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {isPaid ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => generatePaySlip(emp, payment)}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                                                    title="View Slip"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSalary(payment.id)}
                                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Revert Payment"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleOpenPayModal(emp)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                                            >
                                                <BadgeDollarSign size={14} /> Pay
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* PAY MODAL */}
            {showPayModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800">Process Salary Payment</h2>
                            <p className="text-sm text-slate-500">For {selectedEmployee?.firstName} {selectedEmployee?.lastName}</p>
                        </div>
                        <form onSubmit={handlePaySalary} className="p-6 space-y-4">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Pay Period</label>
                                    <input
                                        required
                                        className="w-full border border-slate-200 p-2 rounded-lg"
                                        value={payForm.payPeriod}
                                        onChange={e => setPayForm({ ...payForm, payPeriod: e.target.value })}
                                        placeholder="e.g. October 2023"
                                        onBlur={() => calculateSalary(selectedEmployee.id, payForm.payPeriod)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Bonus (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full border border-slate-200 p-2 rounded-lg"
                                        value={payForm.bonus}
                                        onChange={e => {
                                            const newBonus = Number(e.target.value);
                                            // Auto-update amount locally
                                            setPayForm(prev => {
                                                const base = calculation ? calculation.baseSalary : (Number(prev.amount) - prev.bonus);
                                                const newTotal = parseFloat((base + newBonus).toFixed(2));
                                                return {
                                                    ...prev,
                                                    bonus: newBonus,
                                                    amount: newTotal
                                                };
                                            });

                                            // Also update calculation summary if it exists
                                            if (calculation) {
                                                setCalculation(prev => ({
                                                    ...prev,
                                                    finalSalary: calculation.baseSalary + newBonus
                                                }));
                                            }
                                        }}
                                    // onBlur removed as we calculate locally. Api calc still happens on period change or button click
                                    />
                                </div>
                                <div className="flex items-end mb-1">
                                    <button
                                        type="button"
                                        onClick={() => calculateSalary(selectedEmployee.id, payForm.payPeriod)}
                                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                                        title="Recalculate"
                                    >
                                        <Calculator size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* CALCULATION BREAKDOWN */}
                            {calculating ? (
                                <div className="text-center py-4 text-sm text-slate-500">Calculating deductions...</div>
                            ) : calculation ? (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Base Monthly Salary:</span>
                                        <span className="font-medium">₹{calculation.baseSalary.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Leaves Taken:</span>
                                        <span>{calculation.totalLeaves} days</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Free Leaves:</span>
                                        <span>{calculation.freeLeaves} days</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Working Days (Avg):</span>
                                        <span>{calculation.workingDaysUsed} days</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-600">
                                        <span>Bonus:</span>
                                        <span>+ ₹{payForm.bonus.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600">
                                        {/* Deductions Visible */}
                                        <span>Deduction ({calculation.chargeableLeaves} days):</span>
                                        <span>- ₹{calculation.deduction.toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between font-bold text-slate-900">
                                        <span>Net Payable:</span>
                                        <span>₹{calculation.finalSalary.toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : null}

                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Payment Date</label>
                                <input required type="date" className="w-full border border-slate-200 p-2 rounded-lg" value={payForm.paymentDate} onChange={e => setPayForm({ ...payForm, paymentDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Final Amount (₹)</label>
                                <input required type="number" className="w-full border border-slate-200 p-2 rounded-lg font-semibold text-slate-900" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Remarks</label>
                                <input className="w-full border border-slate-200 p-2 rounded-lg" value={payForm.remarks} onChange={e => setPayForm({ ...payForm, remarks: e.target.value })} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowPayModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Confirm Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
