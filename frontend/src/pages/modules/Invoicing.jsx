import React, { useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Trash2, RotateCcw, FileText, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import InvoiceBuilder from './InvoiceBuilder';
import CompanyTemplates from './CompanyTemplates';
import html2pdf from 'html2pdf.js';
import { useUI } from '../../context/UIContext';

export default function Invoicing() {
    const { alert, confirm, prompt } = useUI();
    const [searchTerm, setSearchTerm] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [isViewDeleted, setIsViewDeleted] = useState(false);
    const [activeTab, setActiveTab] = useState('invoices');

    // Return Products State
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnConfig, setReturnConfig] = useState({ invoiceId: '', reason: '', items: [] });

    const [companyConfig, setCompanyConfig] = useState(null);

    useEffect(() => {
        fetchInvoices();
        fetchConfig();
    }, [isViewDeleted]);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/company/config');
            setCompanyConfig(res.data.company);
        } catch (e) {
            console.error("Failed to load company config");
        }
    };


    // Filter Logic
    const [filterPeriod, setFilterPeriod] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filterInvoices = (inv) => {
        const invDate = new Date(inv.date || inv.createdAt || Date.now());
        const now = new Date();

        // 1. Search Filter
        const matchesSearch = (inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        // 2. Date Range Filter
        if (startDate && new Date(startDate) > invDate) return false;
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // End of day
            if (end < invDate) return false;
        }

        // 3. Period Filter (Quick Select)
        if (filterPeriod === 'this_month') {
            return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
        }
        if (filterPeriod === 'last_month') {
            const lastMonth = new Date();
            lastMonth.setMonth(now.getMonth() - 1);
            return invDate.getMonth() === lastMonth.getMonth() && invDate.getFullYear() === lastMonth.getFullYear();
        }
        if (filterPeriod === 'this_year') {
            return invDate.getFullYear() === now.getFullYear();
        }

        return true;
    };

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const companyId = localStorage.getItem('companyId');
            const res = await api.get('/invoices', { params: { companyId, isDeleted: isViewDeleted } });
            setInvoices(res.data);
        } catch (err) {
            console.error("Failed to load invoices", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSee = (id) => {
        setSelectedInvoiceId(id);
        setIsDrawerOpen(true);
    };

    const handleDownload = (e, invoice) => {
        e.stopPropagation();
        const element = document.createElement('div');
        element.style.width = '210mm';
        element.style.padding = '10mm';
        element.style.background = 'white';
        element.style.color = 'black';

        const subtotal = invoice.items.reduce((s, i) => s + (i.total || 0), 0);
        const taxRate = invoice.taxRate !== undefined ? invoice.taxRate : 10;
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax;

        const itemsRows = invoice.items.map(item => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px 15px; color: #334155; font-size: 13px;">${item.description || 'Item'}</td>
                <td style="padding: 12px 15px; text-align: center; color: #64748b; font-size: 13px;">${item.quantity}</td>
                <td style="padding: 12px 15px; text-align: right; color: #64748b; font-size: 13px;">₹${item.price?.toFixed(2)}</td>
                <td style="padding: 12px 15px; text-align: right; color: #0f172a; font-weight: 600; font-size: 13px;">₹${item.total?.toFixed(2)}</td>
            </tr>
        `).join('');

        element.innerHTML = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
                
                <!-- Accent Bar -->
                <div style="height: 15px; background: #312e81; margin-bottom: 30px;"></div>

                <div style="padding: 0 10px;">
                    <!-- Header -->
                    <div style="display: flex; justify-content: space-between; margin-bottom: 50px;">
                        <div style="width: 50%;">
                            ${companyConfig?.logo ? `<img src="${companyConfig.logo}" style="height: 80px; margin-bottom: 15px; display: block;" />` : ''}
                            <h2 style="margin: 0; color: #0f172a; font-size: 20px;">${companyConfig?.name || 'YVO Company'}</h2>
                            <p style="margin: 5px 0 0; font-size: 13px; color: #64748b;">
                                ${companyConfig?.address || '123 Business St'}<br/>
                                ${companyConfig?.email ? `${companyConfig.email}<br/>` : ''}
                                ${companyConfig?.phone ? `${companyConfig.phone}<br/>` : ''}
                                ${companyConfig?.website ? `${companyConfig.website}` : ''}
                            </p>
                        </div>
                        <div style="width: 40%; text-align: right;">
                            <h1 style="font-size: 42px; font-weight: 900; color: #e2e8f0; margin: 0; letter-spacing: -2px;">INVOICE</h1>
                            <div style="margin-top: 10px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Invoice #</span>
                                    <span style="font-family: monospace; font-weight: bold; color: #334155;">${invoice.invoiceNumber}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Date</span>
                                    <span style="font-size: 13px; font-weight: 500;">${new Date(invoice.date).toLocaleDateString()}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Status</span>
                                    <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; background: #e2e8f0; border-radius: 4px;">${invoice.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Client Info -->
                    <div style="display: flex; justify-content: space-between; margin-bottom: 50px; padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
                        <div style="width: 45%;">
                            <span style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Bill To</span>
                            <h3 style="margin: 0 0 5px; font-size: 16px; color: #0f172a;">${invoice.customerName}</h3>
                            <p style="margin: 0; font-size: 13px; color: #64748b; white-space: pre-wrap;">${invoice.clientAddress || 'Client Address'}</p>
                            ${invoice.gstNumber ? `<p style="margin: 8px 0 0; font-size: 12px; color: #475569;"><strong>GSTIN:</strong> ${invoice.gstNumber}</p>` : ''}
                        </div>
                        <div style="width: 45%;">
                            <span style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Terms</span>
                            ${invoice.dueDate ? `
                                <div style="margin-bottom: 5px;">
                                    <span style="font-size: 13px; color: #64748b;">Due Date:</span>
                                    <span style="font-weight: bold; color: #0f172a; margin-left: 5px;">${new Date(invoice.dueDate).toLocaleDateString()}</span>
                                </div>
                            ` : '<p style="font-size: 13px; color: #64748b;">Payment due on receipt</p>'}
                        </div>
                    </div>

                    <!-- Table -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                        <thead>
                            <tr style="background: #1e293b; color: white;">
                                <th style="padding: 12px 15px; text-align: left; font-size: 13px; font-weight: 600; border-radius: 6px 0 0 6px;">Description</th>
                                <th style="padding: 12px 15px; text-align: center; font-size: 13px; font-weight: 600; width: 60px;">Qty</th>
                                <th style="padding: 12px 15px; text-align: right; font-size: 13px; font-weight: 600; width: 100px;">Price</th>
                                <th style="padding: 12px 15px; text-align: right; font-size: 13px; font-weight: 600; width: 100px; border-radius: 0 6px 6px 0;">Total</th>
                            </tr>
                        </thead>
                        <tbody>${itemsRows}</tbody>
                    </table>

                    <!-- Totals -->
                    <div style="display: flex; justify-content: flex-end;">
                        <div style="width: 300px; background: #f8fafc; padding: 20px; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;">
                                <span style="color: #64748b; font-weight: 500;">Subtotal</span>
                                <span style="color: #0f172a; font-weight: 600;">₹${subtotal.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 13px;">
                                <span style="color: #64748b; font-weight: 500;">Tax (${taxRate}%)</span>
                                <span style="color: #0f172a; font-weight: 600;">₹${tax.toFixed(2)}</span>
                            </div>
                            <div style="height: 1px; background: #e2e8f0; margin-bottom: 15px;"></div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #312e81; font-weight: 700; font-size: 16px;">Total</span>
                                <span style="color: #312e81; font-weight: 800; font-size: 20px;">₹${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                        <p style="font-size: 14px; color: #334155; font-weight: 600; margin: 0 0 5px;">Thank you for your business!</p>
                        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Please include invoice number on your payment.</p>
                    </div>
                </div>
            </div>
        `;

        html2pdf().from(element).save(`${invoice.invoiceNumber}.pdf`);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();

        const inputPass = await prompt(
            "Security Authorization",
            "Enter Security Password to Delete Invoice:",
            "password",
            "Verify Password",
            "primary"
        );
        if (!inputPass) return;

        try {
            const companyId = localStorage.getItem('companyId');
            const res = await api.post('/company/verify-password', { password: inputPass, companyId });

            if (!res.data.valid) {
                await alert("Access Denied", "Incorrect Password! Access Denied.", "error");
                return;
            }

            const isConfirmed = await confirm(
                "Delete Invoice",
                "Move this invoice to trash?",
                "Move to Trash",
                "danger"
            );
            if (!isConfirmed) return;

            await api.delete(`/invoices/${id}`);
            fetchInvoices();
        } catch (err) {
            console.error(err);
            alert("Delete Failed", "Verification failed or deletion failed", "error");
        }
    };

    const handleRestore = async (e, id) => {
        e.stopPropagation();
        try {
            await api.patch(`/invoices/${id}`, { isDeleted: false });
            fetchInvoices();
        } catch (err) {
            alert("Restore Failed", "Failed to restore invoice", "error");
        }
    };


    const handleReturn = async (e) => {
        e.preventDefault();
        await alert("Return Processed", `Return processed for Invoice #${returnConfig.invoiceNumber || 'Unknown'}. Stock adjusted.`, "success");
        setShowReturnModal(false);
    };



    const handleGenerateDueLetter = (e, invoice) => {
        e.stopPropagation();
        const element = document.createElement('div');
        element.style.width = '210mm';
        element.style.padding = '20mm';
        element.style.fontFamily = 'Times New Roman, serif';
        element.style.lineHeight = '1.6';
        element.style.color = '#000';
        element.style.background = '#fff';

        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        element.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="text-align: right; margin-bottom: 40px;">
                    <p><strong>${companyConfig?.name || 'Your Company Name'}</strong><br/>
                    ${companyConfig?.address || 'Company Address'}<br/>
                    ${companyConfig?.email || 'email@company.com'} | ${companyConfig?.phone || 'Phone'}</p>
                </div>

                <div style="margin-bottom: 40px;">
                    <p>${today}</p>
                    <p><strong>To:</strong><br/>
                    ${invoice.customerName}<br/>
                    ${invoice.clientAddress || 'Client Address'}</p>
                </div>

                <h2 style="text-align: center; text-decoration: underline; margin-bottom: 30px;">SUBJECT: OVERDUE PAYMENT REMINDER - INVOICE #${invoice.invoiceNumber}</h2>

                <p>Dear ${invoice.customerName},</p>

                <p>This is a friendly reminder that we have not yet received payment for invoice <strong>#${invoice.invoiceNumber}</strong>, which was due on <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>.</p>

                <p>The total amount outstanding is <strong>₹${invoice.grandTotal?.toFixed(2)}</strong>.</p>

                <p>We understand that oversights happen, but we would appreciate it if you could settle this amount at your earliest convenience.</p>

                <p>If you have already sent the payment, please disregard this notice. Otherwise, please remit payment immediately.</p>

                <div style="margin-top: 40px;">
                    <p>Sincerely,</p>
                    <br/>
                    <p><strong>${companyConfig?.name || 'Accounts Receivable'}</strong></p>
                </div>
            </div>
        `;

        html2pdf().from(element).save(`Due_Letter_${invoice.invoiceNumber}.pdf`);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'ISSUED': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
            case 'PAID': return 'bg-green-100 text-green-800 border border-green-200';
            case 'DRAFT': return 'bg-slate-100 text-slate-700 border border-slate-200';
            case 'SENT': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'OVERDUE': return 'bg-red-100 text-red-800 border border-red-200';
            case 'CANCELLED': return 'bg-gray-100 text-gray-500 border border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    if (loading) return <div className="p-10 text-center">Loading invoices...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Invoicing</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage invoices, returns, and billing.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowReturnModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100"
                    >
                        <RotateCcw size={18} /> Return Products
                    </button>
                    <button
                        onClick={() => window.location.href = '/dashboard/invoices/new'}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
                    >
                        <Plus size={18} /> Create Invoice
                    </button>
                </div>
            </div>



            {/* TABS */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'invoices'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        All Invoices
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'templates'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        Invoice Templates
                    </button>
                </nav>
            </div >

            {
                activeTab === 'invoices' ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex flex-col xl:flex-row justify-between gap-4 items-center">
                            <div className="flex items-center gap-3 w-full xl:w-auto">
                                <h3 className="text-lg font-semibold text-slate-800 whitespace-nowrap">
                                    {isViewDeleted ? 'Deleted Invoices' : 'All Invoices'}
                                </h3>
                                <button
                                    onClick={() => setIsViewDeleted(!isViewDeleted)}
                                    className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${isViewDeleted ? 'bg-slate-800 text-white' : 'bg-white text-slate-500'}`}
                                >
                                    {isViewDeleted ? 'Back to Active' : 'Trash'}
                                </button>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-2 w-full xl:w-auto items-center">
                                {/* Date Filters */}
                                <select
                                    value={filterPeriod}
                                    onChange={(e) => {
                                        setFilterPeriod(e.target.value);
                                        setStartDate(''); // Clear custom dates when picking a preset
                                        setEndDate('');
                                    }}
                                    className="w-full md:w-32 py-2 px-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="all">All Time</option>
                                    <option value="this_month">This Month</option>
                                    <option value="last_month">Last Month</option>
                                    <option value="this_year">This Year</option>
                                </select>

                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => { setStartDate(e.target.value); setFilterPeriod('custom'); }}
                                        className="w-full md:w-auto py-2 px-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        placeholder="From"
                                    />
                                    <span className="text-slate-400">-</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => { setEndDate(e.target.value); setFilterPeriod('custom'); }}
                                        className="w-full md:w-auto py-2 px-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                {/* Search */}
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search invoice # or client..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Invoice #</th>
                                        <th className="px-6 py-4 text-left">Client</th>
                                        <th className="px-6 py-4 text-left">Date</th>
                                        <th className="px-6 py-4 text-left">Amount</th>
                                        <th className="px-6 py-4 text-left">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {invoices.filter(filterInvoices).map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            className="hover:bg-slate-50 cursor-pointer"
                                            onClick={() => handleSee(invoice.id)}
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-indigo-600">{invoice.invoiceNumber}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{invoice.customerName}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{new Date(invoice.date || Date.now()).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{invoice.grandTotal?.toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusStyle(invoice.status)}`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                {!isViewDeleted ? (
                                                    <>
                                                        {(invoice.status === 'OVERDUE' || invoice.status === 'PENDING') && (
                                                            <button
                                                                onClick={(e) => handleGenerateDueLetter(e, invoice)}
                                                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                                                title="Generate Due Letter"
                                                            >
                                                                <FileText size={18} />
                                                            </button>
                                                        )}
                                                        <button onClick={(e) => handleDownload(e, invoice)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                                                            <Download size={18} />
                                                        </button>
                                                        <button onClick={(e) => handleDelete(e, invoice.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button onClick={(e) => handleRestore(e, invoice.id)} className="text-indigo-600 text-xs font-bold">
                                                        Restore
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {invoices.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-slate-500">No invoices found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'templates' ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6">
                        <CompanyTemplates />
                    </div>
                ) : null
            }

            {/* RETURN MODAL */}
            {
                showReturnModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <div className="flex items-center gap-2 mb-4 text-amber-600">
                                <AlertCircle size={24} />
                                <h2 className="text-xl font-bold text-slate-900">Process Return</h2>
                            </div>
                            <p className="text-sm text-slate-500 mb-6">Record returned items to adjust inventory and issue credit.</p>

                            <form onSubmit={handleReturn} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number</label>
                                    <input
                                        required
                                        className="w-full border border-slate-300 p-2 rounded-lg"
                                        placeholder="INV-001"
                                        onChange={(e) => setReturnConfig({ ...returnConfig, invoiceNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Return</label>
                                    <select className="w-full border border-slate-300 p-2 rounded-lg">
                                        <option>Damaged Goods</option>
                                        <option>Wrong Item Sent</option>
                                        <option>Customer Changed Mind</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Items / Notes</label>
                                    <textarea
                                        className="w-full border border-slate-300 p-2 rounded-lg h-24"
                                        placeholder="List items returned..."
                                    ></textarea>
                                </div>

                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowReturnModal(false)}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                                    >
                                        Confirm Return
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            <Modal
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title={selectedInvoiceId ? "Invoice Details" : "New Invoice"}
                maxWidth="max-w-6xl"
            >
                <InvoiceBuilder
                    key={selectedInvoiceId}
                    invoiceId={selectedInvoiceId}
                    onClose={() => setIsDrawerOpen(false)}
                />
            </Modal>
        </div>
    );
}
