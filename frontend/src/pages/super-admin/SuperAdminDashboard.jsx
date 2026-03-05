import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Users, Building2, TrendingUp, Activity, PieChart as PieChartIcon, CheckCircle
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState({
        totalCompanies: 0,
        activeCompanies: 0,
        totalUsers: 0,
        planDistribution: [],
        recentCompanies: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSAData();
    }, []);

    const fetchSAData = async () => {
        try {
            const res = await api.get('/sa/dashboard-stats');
            setStats(res.data);
        } catch (err) {
            console.error("Failed to load SA dashboard stats", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-slate-500">Loading System Analytics...</div>;

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Company Analysis</h1>
                    <p className="text-slate-500 mt-1">Real-time platform metrics and user growth.</p>
                </div>
                <div className="bg-white px-4 py-1.5 rounded-full border border-slate-200 text-sm font-medium text-slate-600 shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    Live Data
                </div>
            </div>

            {/* KPI CARDS - FOCUSED ON USERS & COMPANIES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <SAKPICard
                    title="Total Employees"
                    value={stats.totalUsers}
                    icon={<Users size={28} className="text-white" />}
                    color="bg-gradient-to-br from-indigo-500 to-indigo-700"
                    subtext="Across all companies"
                />

                <SAKPICard
                    title="Total Companies"
                    value={stats.totalCompanies}
                    icon={<Building2 size={28} className="text-white" />}
                    color="bg-gradient-to-br from-blue-500 to-blue-700"
                    subtext={`${stats.activeCompanies} Active Subscriptions`}
                />

                <SAKPICard
                    title="Avg. Users / Company"
                    value={stats.totalCompanies > 0 ? Math.round(stats.totalUsers / stats.totalCompanies) : 0}
                    icon={<Activity size={28} className="text-white" />}
                    color="bg-gradient-to-br from-purple-500 to-purple-700"
                    subtext="Engagement Metric"
                />
            </div>

            {/* DETAILED ANALYSIS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* PLAN DISTRIBUTION */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <PieChartIcon size={20} className="text-slate-400" />
                        Plan Distribution
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">Breakdown of companies by subscription plan.</p>

                    <div className="flex-grow min-h-[250px]">
                        {stats.planDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.planDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.planDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">No plan data available</div>
                        )}
                    </div>
                </div>

                {/* RECENT COMPANIES LIST */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-900">Recent Companies</h3>
                        <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                            View All
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats.recentCompanies.length > 0 ? stats.recentCompanies.map((company, idx) => (
                                    <tr key={company._id || idx} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100 group-hover:border-indigo-200 group-hover:bg-indigo-100 transition-colors">
                                                    {company.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">{company.name}</p>
                                                    <p className="text-xs text-slate-400">{company.email || 'No Email'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                {company.planId?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {company.subscriptionStatus === 'active' ? (
                                                new Date(company.subscriptionEndsAt) < new Date() ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Overdue
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Active
                                                    </span>
                                                )
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> {company.subscriptionStatus || 'Inactive'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right text-xs text-slate-500 font-medium font-mono">
                                            {new Date(company.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-slate-400 text-sm">No companies found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

const SAKPICard = ({ title, value, icon, subtext, color }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 mb-1 tracking-wide uppercase">{title}</p>
            <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{value}</h3>
            <p className="text-sm font-medium text-slate-400 mt-2 flex items-center gap-1">
                {subtext}
            </p>
        </div>
        <div className={`p-4 rounded-2xl shadow-lg ${color} relative z-10`}>
            {icon}
        </div>
        {/* Decorator */}
        <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-[0.08] ${color.replace('bg-gradient-to-br', 'bg')}`}></div>
    </div>
);
