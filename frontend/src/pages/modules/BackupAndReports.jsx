import React, { useState, useEffect } from 'react';
import { Download, FileText, Database, Clock, CheckCircle, AlertCircle, Loader2, Calendar, Filter, User, Users, Building2, IndianRupee, Receipt, Settings } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import { useSearchParams } from 'react-router-dom';
import { useUI } from '../../context/UIContext';

export default function BackupAndReports() {
    const { confirm } = useUI();
    const [searchParams] = useSearchParams();
    const queryCompanyId = searchParams.get('companyId');

    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState(queryCompanyId || localStorage.getItem('companyId') || '');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [filters, setFilters] = useState({
        dateRange: 'all',
        includeFiles: true,
        includePII: false,
        modules: []
    });
    const [companyConfig, setCompanyConfig] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const sa = user.role === 'SUPER_ADMIN' || user.isSuperAdmin;
        setIsSuperAdmin(sa);

        if (sa) {
            fetchCompanies();
        }

        if (selectedCompanyId) {
            fetchBackups();
            fetchConfig();
        } else {
            setLoading(false);
        }
    }, [selectedCompanyId]);

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/sa/companies', { params: { limit: 100 } });
            setCompanies(res.data.companies || []);
        } catch (e) {
            console.error("Failed to fetch companies");
        }
    };



    // Polling for active backups
    useEffect(() => {
        const hasActive = backups.some(b => b.status === 'QUEUED' || b.status === 'PROCESSING');
        if (hasActive) {
            const interval = setInterval(fetchBackups, 5000);
            return () => clearInterval(interval);
        }
    }, [backups]);

    const fetchConfig = async () => {
        if (!selectedCompanyId) return;
        try {
            const res = await api.get('/company/config', { headers: { 'x-company-id': selectedCompanyId } });
            setCompanyConfig(res.data.company);
        } catch (e) {
            console.error("Failed to load company config");
        }
    };

    const fetchBackups = async () => {
        if (!selectedCompanyId) return;
        try {
            const res = await api.get('/backups', { headers: { 'x-company-id': selectedCompanyId } });
            setBackups(res.data);
        } catch (error) {
            console.error("Failed to fetch backups", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        if (!selectedCompanyId) return toast.error("Please select a company first");
        try {
            setCreating(true);
            const res = await api.post('/backups', { filters }, { headers: { 'x-company-id': selectedCompanyId } });
            setBackups([res.data, ...backups]);
            toast.success("Backup job started!");
        } catch (error) {
            toast.error("Failed to start backup");
        } finally {
            setCreating(false);
        }
    };

    const handleDownload = async (id, fileName) => {
        if (!selectedCompanyId) return;
        try {
            toast.loading("Preparing download...");
            const response = await api.get(`/backups/${id}/download`, {
                headers: { 'x-company-id': selectedCompanyId },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || `backup_${id}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.dismiss();
            toast.success("Download started");
        } catch (error) {
            console.error("Download failed", error);
            toast.dismiss();
            toast.error("Download failed. Your session might have expired.");
        }
    };

    const handleDelete = async (id) => {
        const ok = await confirm('Delete Backup', "Are you sure you want to delete this backup?", 'Delete');
        if (!ok) return;
        try {
            await api.delete(`/backups/${id}`, { headers: { 'x-company-id': selectedCompanyId } });
            setBackups(backups.filter(b => b._id !== id));
            toast.success("Backup deleted");
        } catch (error) {
            toast.error("Failed to delete backup");
        }
    };

    // --- QUICK REPORTS LOGIC (Migrated) ---

    const generateFinanceReport = async () => {
        if (!selectedCompanyId) return toast.error("Select a company first");
        try {
            toast.loading("Generating Finance Report...");
            const [invoiceRes, expenseRes] = await Promise.all([
                api.get('/invoices', { params: { companyId: selectedCompanyId } }),
                api.get('/expenses', { params: { companyId: selectedCompanyId } })
            ]);
            // ... (rest of function unchanged, just uses locally fetched data)
            const expenses = expenseRes.data;
            const invoices = invoiceRes.data;

            const element = document.createElement('div');
            element.style.padding = '20px';
            element.innerHTML = `
                <div style="font-family: sans-serif;">
                    <h1 style="text-align: center;">Financial Report - ${companyConfig?.name || 'YVO Company'}</h1>
                    <p style="text-align: center; color: #666;">Generated on ${new Date().toLocaleDateString()}</p>
                    <hr/>
                    <h3>Summary</h3>
                    <p>Total Revenue: ₹${invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.grandTotal || 0), 0)}</p>
                    <p>Total Expenses: ₹${expenses.reduce((s, e) => s + (e.amount || 0), 0)}</p>
                    <hr/>
                    <h3>Expenses</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #eee;">
                            <th style="border: 1px solid #ddd; padding: 8px;">Date</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Category</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Amount</th>
                        </tr>
                        ${expenses.map(e => `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 8px;">${new Date(e.date).toLocaleDateString()}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${e.category}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">₹${e.amount}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `;

            html2pdf().from(element).save(`Finance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.dismiss();
            toast.success("Finance report downloaded");
        } catch (e) {
            toast.dismiss();
            toast.error("Failed to generate report");
        }
    };

    const downloadCSVReport = async (type) => {
        if (!selectedCompanyId) return toast.error("Select a company first");
        try {
            toast.loading(`Generating ${type} report...`);
            let data = [];
            let filename = `report_${type}_${new Date().toISOString().split('T')[0]}.csv`;

            if (type === 'payroll') {
                const res = await api.get('/employees', { params: { companyId: selectedCompanyId } });
                data = res.data.map(emp => ({ Name: `${emp.firstName} ${emp.lastName}`, Position: emp.position, Salary: emp.salary }));
            } else if (type === 'revenue') {
                const res = await api.get('/invoices', { params: { companyId: selectedCompanyId } });
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
            toast.success(`${type} report downloaded`);
        } catch (e) {
            toast.dismiss();
            toast.error("Failed to generate CSV");
        }
    };

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Backup & Reports</h1>
                    <p className="text-slate-500 mt-2">Manage your company data exports and financial reports from one central location.</p>
                </div>

                {isSuperAdmin && (
                    <div className="w-full md:w-64 bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Select Company Context</label>
                        <select
                            className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                        >
                            <option value="">-- Select Company --</option>
                            {companies.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {!selectedCompanyId && isSuperAdmin ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center">
                    <div className="p-4 bg-blue-50 text-blue-500 rounded-full mb-4">
                        <Building2 size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700">Please Select a Company</h3>
                    <p className="text-slate-500 max-w-sm mt-2">Select a company from the dropdown at the top right to manage its backups and reports.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Backup Configuration */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Database size={20} className="text-indigo-600" /> New Backup
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 block mb-2">Date Range</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm"
                                        value={filters.dateRange}
                                        onChange={e => setFilters({ ...filters, dateRange: e.target.value })}
                                    >
                                        <option value="all">Full Export (All Time)</option>
                                        <option value="last_7">Last 7 Days</option>
                                        <option value="last_30">Last 30 Days</option>
                                        <option value="last_90">Last 90 Days</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-not-allowed opacity-70">
                                        <input type="checkbox" checked={true} readOnly className="rounded text-indigo-600" />
                                        <span className="text-sm font-medium text-slate-700">Database Records (.json, .csv)</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                        <input
                                            type="checkbox"
                                            checked={filters.includeFiles}
                                            onChange={e => setFilters({ ...filters, includeFiles: e.target.checked })}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Include Uploaded Files</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                        <input
                                            type="checkbox"
                                            checked={filters.includePII}
                                            onChange={e => setFilters({ ...filters, includePII: e.target.checked })}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-700">Include Personal Data (PII)</span>
                                            <span className="text-[10px] text-slate-400">Emails, Phone Numbers (unmasked)</span>
                                        </div>
                                    </label>
                                </div>

                                <button
                                    onClick={handleCreateBackup}
                                    disabled={creating}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                                >
                                    {creating ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                                    Generate Full Backup
                                </button>
                                <p className="text-[11px] text-center text-slate-400">Backups are stored for 7 days before expiring.</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-2xl text-white shadow-xl shadow-indigo-200">
                            <h3 className="font-bold text-lg mb-2">Quick Reports</h3>
                            <p className="text-indigo-100 text-sm mb-6">Instantly download specific summaries.</p>
                            <div className="space-y-3">
                                <ReportAction icon={<Receipt size={18} />} label="Finance Report (PDF)" onClick={generateFinanceReport} />
                                <ReportAction icon={<Users size={18} />} label="Payroll Export (CSV)" onClick={() => downloadCSVReport('payroll')} />
                                <ReportAction icon={<IndianRupee size={18} />} label="Revenue Export (CSV)" onClick={() => downloadCSVReport('revenue')} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Backup History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-xl font-bold text-slate-800">Backup History</h2>
                                <button onClick={fetchBackups} className="p-2 text-slate-400 hover:text-indigo-600 transition">
                                    <Clock size={20} />
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                                    <Loader2 size={40} className="animate-spin mb-4" />
                                    <span>Loading your backups...</span>
                                </div>
                            ) : backups.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {backups.map((bk) => (
                                        <BackupRow
                                            key={bk._id}
                                            backup={bk}
                                            onDownload={() => handleDownload(bk._id, `backup_${bk.backupId}.zip`)}
                                            onDelete={() => handleDelete(bk._id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[400px] text-center p-10">
                                    <div className="p-6 bg-slate-50 rounded-full mb-4">
                                        <Database size={40} className="text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700">No backups yet</h3>
                                    <p className="text-slate-400 text-sm max-w-xs mt-2">Generate your first company backup to see it listed here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


const ReportAction = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition text-sm font-medium border border-white/10"
    >
        {icon}
        <span>{label}</span>
    </button>
);

const BackupRow = ({ backup, onDownload, onDelete }) => {
    const statusIcons = {
        QUEUED: <Clock size={16} className="text-amber-500" />,
        PROCESSING: <Loader2 size={16} className="text-indigo-500 animate-spin" />,
        READY: <CheckCircle size={16} className="text-green-500" />,
        FAILED: <AlertCircle size={16} className="text-red-500" />,
        EXPIRED: <AlertCircle size={16} className="text-slate-400" />
    };

    return (
        <div className="p-6 hover:bg-slate-50/50 transition group">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${backup.status === 'READY' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                        <FileText size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-800">{backup.backupId}</span>
                            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${backup.status === 'READY' ? 'bg-green-100 text-green-700' :
                                backup.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                {statusIcons[backup.status]}
                                {backup.status}
                            </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3">
                            <span>{new Date(backup.createdAt).toLocaleString()}</span>
                            {backup.fileSize && <span>• {(backup.fileSize / (1024 * 1024)).toFixed(2)} MB</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {backup.status === 'READY' && (
                        <button
                            onClick={onDownload}
                            className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition shadow-sm"
                            title="Download ZIP"
                        >
                            <Download size={18} />
                        </button>
                    )}
                    <button
                        onClick={onDelete}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Backup"
                    >
                        <AlertCircle size={18} />
                    </button>
                </div>
            </div>

            {backup.status === 'PROCESSING' && (
                <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-medium">
                        <span>Processing {backup.currentModule || 'data'}...</span>
                        <span>{backup.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${backup.progress}%` }}></div>
                    </div>
                </div>
            )}

            {backup.status === 'FAILED' && backup.error && (
                <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
                    Error: {backup.error}
                </div>
            )}
        </div>
    );
};
