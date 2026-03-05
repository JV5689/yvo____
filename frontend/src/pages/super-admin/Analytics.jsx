import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, AlertTriangle, FileText, Download, Calendar } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function SuperAdminAnalytics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [generatingReport, setGeneratingReport] = useState(false);

    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/sa/analytics/dashboard', { params: { year } });
            setStats(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch analytics", err);
            toast.error("Failed to load analytics data");
            setLoading(false);
        }
    };

    const downloadReport = async (type) => {
        setGeneratingReport(true);
        try {
            const endpoint = type === 'expiry' ? '/sa/analytics/reports/expiry' : '/sa/analytics/reports/companies';
            const response = await api.get(endpoint);

            // Convert JSON to CSV
            const data = response.data;
            if (!data || data.length === 0) {
                toast("No data available for report");
                return;
            }

            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n');
            const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`${type === 'expiry' ? 'Expiry' : 'Company'} report downloaded!`);
        } catch (err) {
            console.error("Report generation failed", err);
            toast.error("Failed to generate report");
        } finally {
            setGeneratingReport(false);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-slate-500">Loading platform analytics...</div>;
    if (!stats) return <div className="p-10 text-center text-red-500">Failed to load analytics data. Please try again later.</div>;

    const growthData = stats?.growth.map((val, idx) => ({
        name: new Date(0, idx).toLocaleString('default', { month: 'short' }),
        companies: val
    }));

    const expiryData = stats?.expiry.map((val, idx) => ({
        name: new Date(0, idx).toLocaleString('default', { month: 'short' }),
        expiring: val
    }));

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Platform Analytics ({year})</h1>
                    <p className="text-sm text-slate-500 mt-1">Year-wise growth, subscription expiry, and system health.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {[0, 1, 2, 3].map(i => (
                            <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => downloadReport('company')}
                        disabled={generatingReport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Download size={16} />
                        Full Data Export
                    </button>
                    <button
                        onClick={() => downloadReport('expiry')}
                        disabled={generatingReport}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <FileText size={16} />
                        Expiry Report
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Total Companies</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.totalCompanies}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Active Subscriptions</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.activeCompanies}</h3>
                    </div>
                </div>
                {/* Add more KPIs (Revenue, etc.) if available */}
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Growth Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-500" />
                        Company Growth ({year})
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={growthData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="companies" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expiry Forecast */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500" />
                        Subscription Expiry Forecast
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={expiryData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="expiring" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Subscription Status Distribution</h3>
                    <div className="flex flex-col md:flex-row items-center justify-around h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
