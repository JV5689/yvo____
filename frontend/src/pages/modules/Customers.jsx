import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, User, Phone, FileText, IndianRupee, Eye, X } from 'lucide-react';

export default function Customers() {
    const { config } = useOutletContext();
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        method: 'CASH'
    });

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        email: '',
        taxId: ''
    });

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const companyId = localStorage.getItem('companyId');
            if (!companyId) return;
            const res = await api.get(`/customers?companyId=${companyId}`);
            setCustomers(res.data);
        } catch (error) {
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        try {
            await api.post('/customers', {
                companyId: localStorage.getItem('companyId'),
                ...formData
            });
            toast.success('Customer created successfully');
            setIsAddModalOpen(false);
            setFormData({ name: '', phone: '', address: '', email: '', taxId: '' });
            fetchCustomers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create customer');
        }
    };

    const handleReceivePayment = async (e) => {
        e.preventDefault();
        try {
            const companyId = localStorage.getItem('companyId');
            if (!companyId) throw new Error('Company ID not found');

            await api.post('/client-payments', {
                companyId: companyId,
                customerId: selectedCustomerForPayment.id || selectedCustomerForPayment._id,
                amount: parseFloat(paymentData.amount),
                date: paymentData.date,
                method: paymentData.method
            });
            toast.success('Payment recorded successfully');
            setIsPaymentModalOpen(false);
            setPaymentData({ amount: '', date: new Date().toISOString().slice(0, 10), method: 'CASH' });
            fetchCustomers(); // Refresh the customer list to show new due balances
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to record payment');
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    if (loading) return <div className="p-8"><div className="animate-pulse flex space-x-4">Loading customers...</div></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your clients and their financial ledgers</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Add Customer</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Customer Details</th>
                                <th className="px-6 py-4 text-right hidden md:table-cell">Total Invoiced</th>
                                <th className="px-6 py-4 text-right hidden sm:table-cell">Total Received</th>
                                <th className="px-6 py-4 text-right">Total Due</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                        <User size={48} className="mx-auto text-slate-300 mb-2" />
                                        <p>No customers found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id || customer._id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => navigate(`/dashboard/customers/${customer.id || customer._id}`)}>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{customer.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center mt-1">
                                                <Phone size={12} className="mr-1" /> {customer.phone || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium hidden md:table-cell">
                                            ₹{(customer.totalInvoiced || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-green-600 hidden sm:table-cell">
                                            ₹{(customer.totalReceived || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-2 py-1 rounded inline-flex font-bold ${(customer.totalDue || 0) > 0 ? 'bg-red-50 text-red-700' : 'text-slate-700'
                                                }`}>
                                                ₹{(customer.totalDue || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCustomerForPayment(customer);
                                                        setIsPaymentModalOpen(true);
                                                    }}
                                                    className="px-3 py-1 text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 rounded transition whitespace-nowrap"
                                                    title="Receive Payment"
                                                >
                                                    Receive Payment
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/customers/${customer.id || customer._id}`); }}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                    title="View Ledger"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Customer Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800">Add New Customer</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateCustomer} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name *</label>
                                <input type="text" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                                <input type="tel" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-slate-400 font-normal">(optional)</span></label>
                                <input type="email" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address <span className="text-slate-400 font-normal">(optional)</span></label>
                                <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="2" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID / GST <span className="text-slate-400 font-normal">(optional)</span></label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} />
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">Save Customer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Receive Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)}></div>
                    <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800">Receive Payment: {selectedCustomerForPayment?.name}</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleReceivePayment} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) *</label>
                                <input type="number" required min="1" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                                <input type="date" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" value={paymentData.date} onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" value={paymentData.method} onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}>
                                    <option value="CASH">Cash</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="UPI">UPI / Online</option>
                                    <option value="CHEQUE">Cheque</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t">
                                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">Save Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
