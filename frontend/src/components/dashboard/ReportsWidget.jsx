import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Users, IndianRupee, Receipt, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';

export default function ReportsWidget() {
    const navigate = useNavigate();

    const generateFinanceReport = async () => {
        try {
            toast.loading("Generating Finance Report...");
            const companyId = localStorage.getItem('companyId');
            const [invoiceRes, expenseRes, configRes] = await Promise.all([
                api.get('/invoices', { params: { companyId } }),
                api.get('/expenses', { params: { companyId } }),
                api.get('/company/config')
            ]);

            const expenses = expenseRes.data;
            const invoices = invoiceRes.data;
            const companyConfig = configRes.data.company;

            const revenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.grandTotal || 0), 0);
            const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

            const element = document.createElement('div');
            element.style.padding = '20px';
            element.innerHTML = `
                <div style="font-family: sans-serif; color: #1e293b;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="margin: 0;">Financial Summary</h1>
                        <p style="color: #64748b;">${companyConfig?.name || 'YVO Company'}</p>
                    </div>
                    <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                        <div style="flex: 1; padding: 15px; background: #f0fdf4; border-radius: 8px;">
                            <div style="font-size: 12px; color: #166534;">REVENUE</div>
                            <div style="font-size: 20px; font-weight: bold;">₹${revenue}</div>
                        </div>
                        <div style="flex: 1; padding: 15px; background: #fef2f2; border-radius: 8px;">
                            <div style="font-size: 12px; color: #991b1b;">EXPENSES</div>
                            <div style="font-size: 20px; font-weight: bold;">₹${totalExpenses}</div>
                        </div>
                    </div>
                    <p style="font-size: 12px; color: #94a3b8; text-align: center;">Generated on ${new Date().toLocaleDateString()}</p>
                </div>
            `;

            html2pdf().from(element).save(`Quick_Finance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.dismiss();
            toast.success("Finance report downloaded");
        } catch {
            toast.dismiss();
            toast.error("Failed to generate report");
        }
    };

    const downloadCSV = async (type) => {
        try {
            toast.loading(`Preparing ${type} export...`);
            const companyId = localStorage.getItem('companyId');
            let data = [];
            let filename = `export_${type}_${new Date().toISOString().split('T')[0]}.csv`;

            if (type === 'payroll') {
                const res = await api.get('/employees', { params: { companyId } });
                data = res.data.map(emp => ({ Name: `${emp.firstName} ${emp.lastName}`, Position: emp.position, Salary: emp.salary }));
            } else if (type === 'revenue') {
                const res = await api.get('/invoices', { params: { companyId } });
                data = res.data.filter(i => i.status === 'PAID').map(i => ({ Invoice: i.invoiceNumber, Client: i.customerName, Amount: i.grandTotal, Date: i.date }));
            }

            if (!data.length) {
                toast.dismiss();
                toast.error("No data available");
                return;
            }

            const headers = Object.keys(data[0]);
            const csvContent = [headers.join(','), ...data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();

            toast.dismiss();
            toast.success(`${type} export complete`);
        } catch {
            toast.dismiss();
            toast.error("Export failed");
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <FileText size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Quick Reports</h3>
                </div>
                <button
                    onClick={() => navigate('/dashboard/backup-reports')}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 uppercase tracking-wider"
                >
                    View All <ChevronRight size={12} />
                </button>
            </div>
            <div className="p-4 space-y-3 flex-grow">
                <ReportButton
                    icon={<Receipt size={16} className="text-emerald-600" />}
                    label="Finance Summary (PDF)"
                    onClick={generateFinanceReport}
                />
                <ReportButton
                    icon={<Users size={16} className="text-blue-600" />}
                    label="Payroll Export (CSV)"
                    onClick={() => downloadCSV('payroll')}
                />
                <ReportButton
                    icon={<IndianRupee size={16} className="text-amber-600" />}
                    label="Revenue Export (CSV)"
                    onClick={() => downloadCSV('revenue')}
                />
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 text-center">
                    Data is synced in real-time.
                </p>
            </div>
        </div>
    );
}

const ReportButton = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition group"
    >
        <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-md border border-slate-100 shadow-sm group-hover:shadow transition">
                {icon}
            </div>
            <span className="text-xs font-semibold text-slate-700">{label}</span>
        </div>
        <Download size={14} className="text-slate-300 group-hover:text-indigo-600 transition" />
    </button>
);
