import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Phone, MapPin, Mail, FileText, IndianRupee, History, Activity, Download, Edit, Search, Calendar as CalendarIcon, CreditCard, ChevronDown, CheckCircle2 } from 'lucide-react';

import Modal from '../Modal';
import InvoiceViewerModal from '../invoice-builder/InvoiceViewerModal';

export default function CustomerProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { config } = useOutletContext();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, invoices, payments, ledger
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPaymentId, setSelectedPaymentId] = useState(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        method: 'CASH'
    });
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isSavingPayment, setIsSavingPayment] = useState(false);

    const handleReceivePayment = async (e) => {
        e.preventDefault();
        if (isSavingPayment) return;

        try {
            setIsSavingPayment(true);
            const companyId = customer.companyId || config?.company?.id || localStorage.getItem('companyId');

            if (!companyId) {
                toast.error('Company ID not found. Please try refreshing the page.');
                return;
            }

            if (selectedPaymentId) {
                await api.patch(`/client-payments/${selectedPaymentId}`, {
                    companyId: companyId,
                    customerId: customer.id || customer._id,
                    amount: parseFloat(paymentData.amount),
                    date: paymentData.date,
                    method: paymentData.method
                });
                toast.success('Payment updated successfully');
            } else {
                await api.post('/client-payments', {
                    companyId: companyId,
                    customerId: customer.id || customer._id,
                    amount: parseFloat(paymentData.amount),
                    date: paymentData.date,
                    method: paymentData.method
                });
                toast.success('Payment recorded successfully');
            }

            setIsPaymentModalOpen(false);
            setPaymentData({ amount: '', date: new Date().toISOString().slice(0, 10), method: 'CASH' });
            setSelectedPaymentId(null);
            fetchCustomerLedger();
        } catch (error) {
            console.error('Payment Error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to save payment';
            toast.error(errorMsg);
        } finally {
            setIsSavingPayment(false);
        }
    };

    const openCreatePaymentModal = () => {
        setSelectedPaymentId(null);
        setPaymentData({ amount: '', date: new Date().toISOString().slice(0, 10), method: 'CASH' });
        setIsPaymentModalOpen(true);
    };

    const openEditPaymentModal = (payment) => {
        setSelectedPaymentId(payment.id || payment._id);
        setPaymentData({
            amount: payment.amount.toString(),
            date: new Date(payment.date).toISOString().slice(0, 10),
            method: payment.method || 'CASH'
        });
        setIsPaymentModalOpen(true);
    };

    const fetchCustomerLedger = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/customers/${id}/ledger`);
            setCustomer(res.data);
        } catch (error) {
            toast.error('Failed to load customer profile');
            navigate('/dashboard/customers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchCustomerLedger();
        }
    }, [id]);

    const handleDownload = (e, invoice) => {
        if (e) e.stopPropagation();
        setSelectedInvoiceId(invoice.id || invoice._id);
        setIsInvoiceModalOpen(true);
    };

    const handleEdit = (e, invoiceId) => {
        if (e) e.stopPropagation();
        setSelectedInvoiceId(invoiceId);
        setIsInvoiceModalOpen(true);
    };

    if (loading) return <div className="p-8"><div className="animate-pulse">Loading profile...</div></div>;
    if (!customer) return <div className="p-8">Customer not found.</div>;

    // Build ledger by combining invoices and payments
    const ledger = [];
    (customer.invoices || []).forEach(inv => {
        if (inv.status !== 'DRAFT' && inv.status !== 'CANCELLED') {
            ledger.push({
                type: 'INVOICE',
                date: new Date(inv.date),
                ref: inv.invoiceNumber,
                amount: inv.grandTotal,
                balanceImpact: inv.grandTotal
            });
        }
    });
    (customer.payments || []).forEach(pay => {
        ledger.push({
            type: 'PAYMENT',
            date: new Date(pay.date),
            ref: pay.method || 'CASH',
            amount: pay.amount,
            balanceImpact: -pay.amount
        });
    });

    // Sort by date ascending to calculate running balance
    ledger.sort((a, b) => a.date - b.date);
    let runningBalance = 0;
    const statement = ledger.map(entry => {
        runningBalance += entry.balanceImpact;
        return { ...entry, runningBalance };
    });
    // Reverse for displaying newest first
    statement.reverse();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/dashboard/customers')}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800">{customer.name}</h1>
                    <p className="text-sm text-slate-500 mt-1">Customer Profile & Financial Ledger</p>
                </div>
                <button
                    onClick={openCreatePaymentModal}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-green-700 transition"
                >
                    <IndianRupee size={16} />
                    <span className="hidden sm:inline">Receive Payment</span>
                </button>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Invoiced</p>
                        <p className="text-2xl font-bold text-slate-800">₹{(customer.totalInvoiced || 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <IndianRupee size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Received</p>
                        <p className="text-2xl font-bold text-slate-800">₹{(customer.totalReceived || 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Due</p>
                        <p className={`text-2xl font-bold ${(customer.totalDue || 0) > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                            ₹{(customer.totalDue || 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-2 gap-2 overflow-x-auto">
                    {[
                        { id: 'overview', icon: <User size={16} />, label: 'Overview' },
                        { id: 'invoices', icon: <FileText size={16} />, label: 'Invoices' },
                        { id: 'payments', icon: <IndianRupee size={16} />, label: 'Payments' },
                        { id: 'ledger', icon: <History size={16} />, label: 'Statement (Ledger)' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-t-lg'}`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-800">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-slate-500 flex items-center gap-2"><Phone size={14} /> Phone</span>
                                    <span className="font-medium text-slate-800">{customer.phone || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-slate-500 flex items-center gap-2"><Mail size={14} /> Email</span>
                                    <span className="font-medium text-slate-800">{customer.email || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-slate-500 flex items-center gap-2"><MapPin size={14} /> Address</span>
                                    <span className="font-medium text-slate-800">{customer.address || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-slate-500">Tax ID / GST</span>
                                    <span className="font-medium text-slate-800">{customer.taxId || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'invoices' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Invoice #</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(customer.invoices || []).length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-4 text-slate-500">No invoices found.</td></tr>
                                    ) : (
                                        (customer.invoices || []).map(inv => (
                                            <tr key={inv.id || inv._id} className="hover:bg-slate-50 transition">
                                                <td className="px-4 py-3">{new Date(inv.date).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 font-medium text-indigo-600 cursor-pointer" onClick={() => handleEdit(null, inv.id || inv._id)}>{inv.invoiceNumber}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : inv.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">₹{inv.grandTotal.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={(e) => handleDownload(e, inv)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" title="Download">
                                                            <Download size={16} />
                                                        </button>
                                                        <button onClick={(e) => handleEdit(e, inv.id || inv._id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Edit">
                                                            <Edit size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Method</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(customer.payments || []).length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-4 text-slate-500">No payments found.</td></tr>
                                    ) : (
                                        (customer.payments || []).map(pay => (
                                            <tr key={pay.id || pay._id} className="hover:bg-slate-50 transition">
                                                <td className="px-4 py-3">{new Date(pay.date).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-slate-700 font-medium">{pay.method || 'CASH'}</td>
                                                <td className="px-4 py-3 text-right font-medium text-green-600">₹{pay.amount.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => openEditPaymentModal(pay)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition inline-flex justify-center items-center" title="Edit Payment">
                                                        <Edit size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'ledger' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Details</th>
                                        <th className="px-4 py-3 text-right">Debit (Invoiced)</th>
                                        <th className="px-4 py-3 text-right">Credit (Received)</th>
                                        <th className="px-4 py-3 text-right font-bold text-slate-800">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {statement.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-4 text-slate-500">No transactions recorded.</td></tr>
                                    ) : (
                                        statement.map((entry, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition">
                                                <td className="px-4 py-3">{entry.date.toLocaleDateString()}</td>
                                                <td className="px-4 py-3">
                                                    {entry.type === 'INVOICE'
                                                        ? <span className="text-indigo-600 font-medium">Invoice #{entry.ref}</span>
                                                        : <span className="text-slate-700 font-medium">Payment via {entry.ref}</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    {entry.type === 'INVOICE' ? `₹${entry.amount.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-green-600">
                                                    {entry.type === 'PAYMENT' ? `₹${entry.amount.toLocaleString()}` : '-'}
                                                </td>
                                                <td className={`px-4 py-3 text-right font-bold ${entry.runningBalance > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                                                    ₹{entry.runningBalance.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Receive / Edit Payment Modal */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title={selectedPaymentId ? `Edit Payment: ${customer.name}` : `Receive Payment: ${customer.name}`}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleReceivePayment} className="space-y-5 p-2">
                    {/* Amount Input */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700">Payment Amount <span className="text-red-500">*</span></label>
                        <div className="relative relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                <IndianRupee size={18} strokeWidth={2.5} />
                            </div>
                            <input
                                type="number"
                                required
                                min="1"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                value={paymentData.amount}
                                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Date Input */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700">Payment Date <span className="text-red-500">*</span></label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                <CalendarIcon size={18} strokeWidth={2} />
                            </div>
                            <input
                                type="date"
                                required
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm [color-scheme:light]"
                                value={paymentData.date}
                                onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700">Payment Method</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10">
                                <CreditCard size={18} strokeWidth={2} />
                            </div>
                            <select
                                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm appearance-none cursor-pointer"
                                value={paymentData.method}
                                onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                            >
                                <option value="CASH">Cash Payment</option>
                                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                                <option value="UPI">UPI / Digital Wallet</option>
                                <option value="CHEQUE">Cheque</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                                <ChevronDown size={18} strokeWidth={2} />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 mt-2 flex justify-end gap-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSavingPayment}
                            className={`flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 ${isSavingPayment ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {isSavingPayment ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} strokeWidth={2.5} />
                                    Confirm Payment
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            <InvoiceViewerModal
                invoiceId={selectedInvoiceId}
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                onEdited={fetchCustomerLedger}
            />
        </div>
    );
}
