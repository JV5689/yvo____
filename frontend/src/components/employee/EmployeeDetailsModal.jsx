import React, { useState, useEffect } from 'react';
import { X, User, Calendar, IndianRupee, Briefcase, Mail, Phone, Clock, FileText } from 'lucide-react';
import api from '../../services/api';

export default function EmployeeDetailsModal({ employee, onClose }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [payrollHistory, setPayrollHistory] = useState([]);
    const [leaveStats, setLeaveStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
    const [upcomingLeaves, setUpcomingLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (employee?.id) {
            fetchEmployeeDetails();
        }
    }, [employee]);

    const fetchEmployeeDetails = async () => {
        try {
            setLoading(true);
            const companyId = localStorage.getItem('companyId');

            // Fetch real salary records for this employee
            const salaryRes = await api.get('/employees/salary-records', {
                params: { companyId, employeeId: employee.id }
            });

            const records = salaryRes.data.map((record, index) => {
                // Robustness: If bonus is 0 but Math doesn't add up, infer it (for legacy data)
                const storedBonus = record.bonus || 0;
                const storedDeduction = record.deductionAmount || 0;
                const calculatedBonus = record.amount - record.baseSalary + storedDeduction;
                const finalBonus = (storedBonus === 0 && calculatedBonus > 0) ? calculatedBonus : storedBonus;

                return {
                    id: record._id,
                    month: record.payPeriod,
                    basic: record.baseSalary,
                    bonus: finalBonus,
                    deductions: storedDeduction,
                    net: record.amount,
                    status: record.status
                };
            });

            setPayrollHistory(records);

            // Fetch real leave stats
            // Get all leave requests for this employee
            const leaveRes = await api.get('/employees/leaves', {
                params: { companyId, employeeId: employee.id }
            });
            const leaves = leaveRes.data;

            const pending = leaves.filter(l => l.status === 'Pending').length;
            const approved = leaves.filter(l => l.status === 'Approved').length;
            const rejected = leaves.filter(l => l.status === 'Rejected').length;

            setLeaveStats({
                pending,
                approved,
                rejected,
                total: employee.freeLeavesPerMonth * 12
            });

            // Filter upcoming leaves (Pending or Approved, from today onwards)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = leaves
                .filter(l => {
                    const startDate = new Date(l.startDate);
                    return startDate >= today && (l.status === 'Approved' || l.status === 'Pending');
                })
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .slice(0, 3); // Show next 3

            setUpcomingLeaves(upcoming);

        } catch (error) {
            console.error("Failed to fetch details", error);
        } finally {
            setLoading(false);
        }
    };

    if (!employee) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl shadow-inner">
                            {employee.firstName?.[0]}{employee.lastName?.[0]}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{employee.firstName} {employee.lastName}</h2>
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mt-2 \${employee.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full \${employee.status === 'Active' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                {employee.status}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('payroll')}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'payroll' ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Payroll History
                    </button>
                    <button
                        onClick={() => setActiveTab('leaves')}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'leaves' ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Leave Status
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
                    {loading ? (
                        <div className="h-40 flex items-center justify-center text-slate-400">Loading details...</div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                                                <User size={16} className="text-brand" /> Personal Information
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <span className="text-slate-500">Email</span>
                                                    <span className="col-span-2 font-medium text-slate-900 break-all">{employee.email}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <span className="text-slate-500">Phone</span>
                                                    <span className="col-span-2 font-medium text-slate-900">{employee.phone}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <span className="text-slate-500">Joined</span>
                                                    <span className="col-span-2 font-medium text-slate-900">{new Date(employee.dateHired || Date.now()).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                                                <Briefcase size={16} className="text-brand" /> Job Details
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <span className="text-slate-500">Category</span>
                                                    <span className="col-span-2 font-medium text-slate-900">{employee.category}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <span className="text-slate-500">Work Days</span>
                                                    <span className="col-span-2 font-medium text-slate-900">{employee.workingDaysPerWeek} days/week</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                                                <IndianRupee size={16} className="text-brand" /> Compensation
                                            </h3>
                                            <div className="p-4 bg-green-50 rounded-lg border border-green-100 flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="text-xs text-green-600 font-bold uppercase">Annual Salary</p>
                                                    <p className="text-2xl font-black text-green-700">₹{employee.salary?.toLocaleString()}</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700">
                                                    <IndianRupee size={20} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                    <p className="text-xs text-slate-500 mb-1">Monthly (Approx)</p>
                                                    <p className="font-bold text-slate-800">₹{Math.round(employee.salary / 12).toLocaleString()}</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                    <p className="text-xs text-slate-500 mb-1">Hourly (Est)</p>
                                                    <p className="font-bold text-slate-800">₹{Math.round(employee.salary / (12 * 22 * 8)).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'payroll' && (
                                <div className="space-y-4">
                                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-3 whitespace-nowrap">Month</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">Basic</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">Bonus</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">Deductions</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">Net Pay</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {payrollHistory.map((pay) => (
                                                    <tr key={pay.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{pay.month}</td>
                                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">₹{pay.basic.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-green-600 whitespace-nowrap">+₹{pay.bonus.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-red-600 whitespace-nowrap">-₹{pay.deductions.toLocaleString()}</td>
                                                        <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">₹{pay.net.toLocaleString()}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                                {pay.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {payrollHistory.length === 0 && <p className="text-center text-slate-400 py-10">No payroll history found.</p>}
                                </div>
                            )}

                            {activeTab === 'leaves' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                                            <p className="text-xs text-slate-400 font-bold uppercase">Total Allowance</p>
                                            <p className="text-2xl font-black text-slate-800 mt-1">{employee.freeLeavesPerMonth * 12}/yr</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                                            <p className="text-xs text-green-500 font-bold uppercase">Approved</p>
                                            <p className="text-2xl font-black text-green-700 mt-1">{leaveStats.approved}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                                            <p className="text-xs text-amber-500 font-bold uppercase">Pending</p>
                                            <p className="text-2xl font-black text-amber-700 mt-1">{leaveStats.pending}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                                            <p className="text-xs text-red-400 font-bold uppercase">Rejected</p>
                                            <p className="text-2xl font-black text-red-700 mt-1">{leaveStats.rejected}</p>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                                <Clock size={20} />
                                            </div>
                                            <h4 className="font-bold text-blue-900">Upcoming Leaves</h4>
                                        </div>

                                        {upcomingLeaves.length > 0 ? (
                                            <div className="space-y-3">
                                                {upcomingLeaves.map(leave => (
                                                    <div key={leave.id} className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm flex justify-between items-center">
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{leave.type}</p>
                                                            <p className="text-xs text-slate-500">
                                                                {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <span className={`text-xs px-2 py-1 rounded-full font-bold \${
                                                            leave.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {leave.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-blue-700">No upcoming leaves scheduled.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition shadow-sm">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
