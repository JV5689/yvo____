import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import {
    Users, IndianRupee, ShoppingBag, TrendingUp, TrendingDown,
    Activity, Package, CreditCard, AlertCircle, Headphones
} from 'lucide-react';

import SuperAdminDashboard from './super-admin/SuperAdminDashboard';
import ReportsWidget from '../components/dashboard/ReportsWidget';

export default function DashboardHome() {
    const { user } = useAuth();
    const { config } = useOutletContext();
    const navigate = useNavigate();

    // State
    const [stats, setStats] = useState({
        employees: 0,
        revenue: 0,
        expenses: 0,
        profit: 0,
        productsSold: 0
    });
    const [chartData, setChartData] = useState({
        revenueVsExpenses: [],
        salesTrend: [],
        topProducts: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const companyId = localStorage.getItem('companyId');

            // Parallel Fetch
            const [empRes, invRes, expRes, salaryRes] = await Promise.all([
                api.get('/employees', { params: { companyId } }),
                api.get('/invoices', { params: { companyId } }),
                api.get('/expenses', { params: { companyId } }),
                api.get('/employees/salary-records', { params: { companyId } })
            ]);

            const employees = empRes.data;
            const invoices = invRes.data;
            const expenses = expRes.data;
            const salaryRecords = salaryRes.data;

            // --- KPI CALCULATIONS ---
            const totalEmployees = employees.length;

            // Revenue (Only PAID invoices)
            const paidInvoices = invoices.filter(i => i.status === 'PAID');
            const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);

            // Expenses (exclude mirrored Payroll category if redundant)
            const sumGeneralExpenses = expenses.filter(e => e.category !== 'Payroll').reduce((sum, e) => sum + (e.amount || 0), 0);
            const sumPayroll = salaryRecords.reduce((sum, s) => sum + (s.amount || 0), 0);
            const totalExpenses = sumGeneralExpenses + sumPayroll;

            // Profit
            const netProfit = totalRevenue - totalExpenses;

            // Products Sold (Sum quantity of items in PAID invoices)
            const totalProductsSold = paidInvoices.reduce((sum, inv) => {
                const itemsCount = inv.items?.reduce((isum, item) => isum + (parseInt(item.quantity) || 0), 0) || 0;
                return sum + itemsCount;
            }, 0);

            setStats({
                employees: totalEmployees,
                revenue: totalRevenue,
                expenses: totalExpenses,
                profit: netProfit,
                productsSold: totalProductsSold
            });

            // --- CHART DATA PREPARATION ---
            // 1. Revenue vs Expenses (Last 6 Months)
            const months = {};
            const today = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const key = d.toLocaleString('default', { month: 'short' });
                months[key] = { name: key, revenue: 0, expenses: 0 };
            }

            paidInvoices.forEach(inv => {
                const d = new Date(inv.date || inv.createdAt);
                const key = d.toLocaleString('default', { month: 'short' });
                if (months[key]) months[key].revenue += (inv.grandTotal || 0);
            });

            expenses.filter(e => e.category !== 'Payroll').forEach(exp => {
                const d = new Date(exp.date || exp.createdAt);
                const key = d.toLocaleString('default', { month: 'short' });
                if (months[key]) months[key].expenses += (exp.amount || 0);
            });

            salaryRecords.forEach(s => {
                const d = new Date(s.paymentDate || s.createdAt);
                const key = d.toLocaleString('default', { month: 'short' });
                if (months[key]) months[key].expenses += (s.amount || 0);
            });

            const revenueData = Object.values(months);

            // 2. Top Products
            const productMap = {};
            paidInvoices.forEach(inv => {
                inv.items?.forEach(item => {
                    const name = item.description || 'Unknown Item';
                    if (!productMap[name]) productMap[name] = 0;
                    productMap[name] += parseInt(item.quantity) || 0;
                });
            });
            const topProducts = Object.entries(productMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5); // Top 5

            setChartData({
                revenueVsExpenses: revenueData,
                topProducts: topProducts,
                salesTrend: []
            });

        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    if (loading) return <div className="p-10 text-center animate-pulse">Loading Dashboard...</div>;

    // Super Admin View Redirect
    if (user.isSuperAdmin) {
        return <SuperAdminDashboard />;
    }

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Company Overview</h1>
                    <p className="text-slate-500 mt-1">Real-time performance metrics and insights.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 shadow-sm">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Revenue"
                    value={formatCurrency(stats.revenue)}
                    icon={<IndianRupee size={24} className="text-white" />}
                    color="bg-gradient-to-r from-blue-500 to-blue-600"
                    subtext="Lifetime earnings"
                />
                <KPICard
                    title="Net Profit"
                    value={formatCurrency(stats.profit)}
                    icon={<TrendingUp size={24} className="text-white" />}
                    color={stats.profit >= 0 ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : "bg-gradient-to-r from-red-500 to-red-600"}
                    subtext="Revenue - Expenses"
                />
                <KPICard
                    title="Products Sold"
                    value={stats.productsSold}
                    icon={<ShoppingBag size={24} className="text-white" />}
                    color="bg-gradient-to-r from-purple-500 to-purple-600"
                    subtext="Total items shipped"
                />
                <KPICard
                    title="Total Employees"
                    value={stats.employees}
                    icon={<Users size={24} className="text-white" />}
                    color="bg-gradient-to-r from-amber-500 to-amber-600"
                    subtext="Active team members"
                />
            </div>

            {/* MAIN CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* REVENUE VS EXPENSES */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Financial Performance (6 Months)</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.revenueVsExpenses}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Legend />
                                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* TOP PRODUCTS */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Top Selling Products</h3>
                    <p className="text-sm text-slate-500 mb-6">Based on quantity sold.</p>
                    <div className="flex-grow">
                        {chartData.topProducts.length > 0 ? (
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.topProducts}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.topProducts.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No sales data yet</div>
                        )}
                    </div>
                    <div className="mt-4 space-y-3">
                        {chartData.topProducts.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5] }}></div>
                                    <span className="text-slate-600 truncate max-w-[150px]">{item.name}</span>
                                </div>
                                <span className="font-bold text-slate-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* BOTTOM ACTIVITY / REPORTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-xl p-6 text-white relative overflow-hidden shadow-lg border border-indigo-600/20">
                    <div className="relative z-10 flex flex-col h-full justify-center">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                <Headphones size={24} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold">Customer Care</h3>
                        </div>
                        <p className="text-indigo-100 text-sm mb-6 max-w-sm leading-relaxed">
                            Need help with your account or having technical issues? Contact our dedicated support team directly. We're here to assist you with any work or queries.
                        </p>
                        <a
                            href="mailto:yvo.company@gmail.com?subject=Support%20Request%20-%20"
                            className="inline-flex items-center justify-center w-fit bg-white text-indigo-900 px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-100 transition shadow-md"
                        >
                            Email Support
                        </a>
                    </div>
                    <Headphones className="absolute right-[-10px] bottom-[-10px] text-white opacity-5 w-44 h-44 -rotate-12" />
                </div>

                <div className="lg:col-span-1">
                    <ReportsWidget />
                </div>
            </div>
        </div>
    );
}

const KPICard = ({ title, value, icon, subtext, color }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            <p className="text-xs text-slate-400 mt-1">{subtext}</p>
        </div>
        <div className={`p-3 rounded-xl shadow-lg ${color}`}>
            {icon}
        </div>
    </div>
);
