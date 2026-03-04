import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, IndianRupee, Receipt, Clock, Users, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { useUI } from '../../context/UIContext';

export default function Finance() {
    const navigate = useNavigate();
    const { alert, toast } = useUI();

    const [stats, setStats] = useState({ totalSales: 0, totalReceived: 0, totalOutstanding: 0, totalExpenses: 0 });
    const [dueCustomers, setDueCustomers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [newExpense, setNewExpense] = useState({ category: '', amount: '', description: '', paymentMethod: 'Card' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const companyId = localStorage.getItem('companyId');

            const [dashboardRes, customersRes, expensesRes] = await Promise.all([
                api.get('/finance/dashboard', { params: { companyId } }),
                api.get('/customers', { params: { companyId } }),
                api.get('/expenses', { params: { companyId } })
            ]);

            const newStats = dashboardRes.data;
            setStats({
                totalSales: newStats.totalSales || 0,
                totalReceived: newStats.totalReceived || 0,
                totalOutstanding: newStats.totalOutstanding || 0,
                totalExpenses: newStats.totalExpenses || 0
            });

            const customersWithDues = (customersRes.data || []).filter(c => c.totalDue > 0).sort((a, b) => b.totalDue - a.totalDue);
            setDueCustomers(customersWithDues);

            setExpenses(expensesRes.data || []);
        } catch (err) {
            console.error("Failed to load finance dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExpense = async (e) => {
        e.preventDefault();
        try {
            const companyId = localStorage.getItem('companyId');
            const res = await api.post('/expenses', { ...newExpense, companyId });
            setExpenses(prev => [res.data, ...prev]);

            setStats(prev => ({ ...prev, totalExpenses: prev.totalExpenses + Number(newExpense.amount) }));
            toast.success('Expense recorded successfully');
            setShowExpenseModal(false);
            setNewExpense({ category: '', amount: '', description: '', paymentMethod: 'Card' });
        } catch (err) {
            console.error(err);
            alert('Error', 'Failed to create expense', 'error');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
    };

    if (loading) return <div className="p-10 text-center"><div className="animate-pulse flex space-x-4 justify-center">Loading finance dashboard...</div></div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Finance Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">Overview of sales, receipts, dues, and expenses.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowExpenseModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition"
                    >
                        <Plus size={18} /> Record Expense
                    </button>
                </div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Sales"
                    value={formatCurrency(stats.totalSales)}
                    icon={<TrendingUp size={24} className="text-indigo-600" />}
                    trend="Lifetime Invoiced"
                    bg="bg-indigo-50"
                />
                <StatCard
                    title="Total Received"
                    value={formatCurrency(stats.totalReceived)}
                    icon={<IndianRupee size={24} className="text-green-600" />}
                    trend="Lifetime Payments"
                    bg="bg-green-50"
                />
                <StatCard
                    title="Total Outstanding"
                    value={formatCurrency(stats.totalOutstanding)}
                    icon={<Clock size={24} className="text-amber-600" />}
                    trend="Unpaid Customer Dues"
                    bg="bg-amber-50"
                />
                <StatCard
                    title="Total Expenses"
                    value={formatCurrency(stats.totalExpenses)}
                    icon={<Receipt size={24} className="text-red-600" />}
                    trend="Lifetime Expenses"
                    bg="bg-red-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CUSTOMER DUES TABLE */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Users size={18} className="text-amber-600" />
                            Outstanding Customer Accounts
                        </h3>
                        <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                            {dueCustomers.length} Pending
                        </span>
                    </div>
                    <div className="flex-grow overflow-x-auto min-h-[300px]">
                        {dueCustomers.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3">Customer Name</th>
                                        <th className="px-6 py-3">Phone</th>
                                        <th className="px-6 py-3 text-right">Pending Amount</th>
                                        <th className="px-6 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {dueCustomers.map((customer) => (
                                        <tr key={customer._id || customer.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 font-bold text-slate-900">{customer.name}</td>
                                            <td className="px-6 py-4 text-slate-500">{customer.phone || '-'}</td>
                                            <td className="px-6 py-4 text-right font-black text-amber-600">
                                                {formatCurrency(customer.totalDue)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => navigate(`/dashboard/customers/${customer._id || customer.id}`)}
                                                    className="inline-flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                    title="View Customer Profile"
                                                >
                                                    <ArrowRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-12 flex flex-col items-center justify-center text-center text-slate-500">
                                <CheckCircle size={48} className="text-green-300 mb-4" />
                                <p className="font-medium text-slate-700">All accounts settled!</p>
                                <p className="text-sm">No customers currently have outstanding dues.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RECENT EXPENSES TABLE */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Receipt size={18} className="text-red-500" />
                            Recent Expenses
                        </h3>
                    </div>
                    <div className="flex-grow overflow-y-auto max-h-[400px]">
                        {expenses.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {expenses.slice(0, 10).map((exp) => (
                                        <tr key={exp._id || exp.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900">{exp.category}</div>
                                                <div className="text-xs text-slate-400">{new Date(exp.date).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-red-600">
                                                -{formatCurrency(exp.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-10 text-center text-slate-500">No expenses recorded yet.</div>
                        )}
                    </div>
                </div >
            </div >

            {/* EXPENSE MODAL */}
            {
                showExpenseModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                                <Receipt size={20} className="text-indigo-600" />
                                Record New Expense
                            </h2>
                            <form onSubmit={handleCreateExpense} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                                    <input required placeholder="e.g. Rent, Server, Marketing" className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) *</label>
                                    <input required type="number" placeholder="0.00" className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <textarea placeholder="Optional notes" rows={2} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                                    <select className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newExpense.paymentMethod} onChange={e => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}>
                                        <option value="Card">Card</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cash">Cash</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowExpenseModal(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition">Cancel</button>
                                    <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition">Record Expense</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

const StatCard = ({ title, value, icon, trend, bg }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[140px]">
        <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">{title}</span>
            <div className={`${bg} p - 2.5 rounded - xl`}>{icon}</div>
        </div>
        <div>
            <div className="text-3xl font-black text-slate-800 tracking-tight">{value}</div>
            <div className="text-xs font-semibold text-slate-400 mt-2 flex items-center gap-1">{trend}</div>
        </div>
    </div>
);
