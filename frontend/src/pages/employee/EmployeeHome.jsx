import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { DollarSign, Clock, Calendar, MessageSquare, X } from 'lucide-react';

const StatCard = ({ icon, label, value, subtext }) => (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] flex items-center gap-4 hover:translate-y-[-2px] transition-all duration-300">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100/80">
            {icon}
        </div>
        <div>
            <p className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs font-medium text-slate-400 mt-0.5">{subtext}</p>
        </div>
    </div>
);

export default function EmployeeHome() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { alert, toast } = useUI();
    const [stats, setStats] = useState({
        pendingLeaves: 0,
        upcomingEvents: 0,
        unreadBroadcasts: 0,
        lastSalary: null
    });
    const [loading, setLoading] = useState(true);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaveForm, setLeaveForm] = useState({
        type: 'Sick Leave',
        startDate: '',
        endDate: '',
        reason: ''
    });

    const [showReportModal, setShowReportModal] = useState(false);
    const [reportForm, setReportForm] = useState({
        tasksCompleted: '',
        issues: '',
        nextDayPlan: ''
    });

    const fetchStats = async () => {
        try {
            const [leavesRes, calendarRes, broadcastsRes, salaryRes] = await Promise.all([
                api.get('/employee/dashboard/leaves'),
                api.get('/employee/dashboard/calendar'),
                api.get('/employee/dashboard/broadcasts'),
                api.get('/employee/dashboard/salary')
            ]);

            const leavesData = Array.isArray(leavesRes.data) ? leavesRes.data : [];
            const calendarData = Array.isArray(calendarRes.data) ? calendarRes.data : [];
            const broadcastsData = Array.isArray(broadcastsRes.data) ? broadcastsRes.data : [];
            const salaryData = Array.isArray(salaryRes.data) ? salaryRes.data : [];

            setStats({
                pendingLeaves: leavesData.filter(l => l && l.status === 'Pending').length,
                upcomingEvents: calendarData.length,
                unreadBroadcasts: broadcastsData.length,
                lastSalary: salaryData.length > 0 ? salaryData[0] : null
            });
        } catch (error) {
            console.error("Error loading stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        try {
            await api.post('/employee/dashboard/leaves', leaveForm);
            toast.success('Leave application submitted successfully!');
            setShowLeaveModal(false);
            setLeaveForm({ type: 'Sick Leave', startDate: '', endDate: '', reason: '' });
            fetchStats(); // Refresh stats
        } catch (err) {
            console.error(err);
            alert('Error', 'Failed to apply for leave', 'error');
        }
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        try {
            await api.post('/employee/dashboard/reports', reportForm);
            toast.success('Daily report submitted successfully!');
            setShowReportModal(false);
            setReportForm({ tasksCompleted: '', issues: '', nextDayPlan: '' });
        } catch (err) {
            console.error(err);
            if (err.response?.status === 400) {
                alert('Warning', err.response.data.message, 'warning');
            } else {
                alert('Error', 'Failed to submit report', 'error');
            }
        }
    };

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back to {user.company?.name || user.companyId?.name || "the Portal"}!</h1>
                <p className="text-slate-500 font-medium">You are logged into <span className="text-blue-600 font-bold">{user.company?.name || user.companyId?.name || "your company portal"}</span></p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<DollarSign className="text-blue-600" />}
                    label="Last Salary"
                    value={stats.lastSalary ? `₹${stats.lastSalary.amount}` : 'N/A'}
                    subtext={stats.lastSalary ? stats.lastSalary.payPeriod : '-'}
                />
                <StatCard
                    icon={<Clock className="text-orange-600" />}
                    label="Pending Leaves"
                    value={stats.pendingLeaves}
                    subtext="Awaiting approval"
                />
                <StatCard
                    icon={<Calendar className="text-blue-600" />}
                    label="Upcoming Events"
                    value={stats.upcomingEvents}
                    subtext="Scheduled"
                />
                <StatCard
                    icon={<MessageSquare className="text-purple-600" />}
                    label="Broadcasts"
                    value={stats.unreadBroadcasts}
                    subtext="Recent messages"
                />
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/30 p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 mb-1">Quick Actions</h3>
                        <p className="text-slate-500 text-sm font-medium">Manage your requests and schedule in one click</p>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => setShowLeaveModal(true)}
                            className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-bold"
                        >
                            Apply for Leave
                        </button>
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200 font-bold"
                        >
                            Fill Daily Report
                        </button>
                        <button
                            onClick={() => navigate('/employee-dashboard/calendar')}
                            className="flex-1 sm:flex-none px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition font-bold"
                        >
                            View Calendar
                        </button>
                    </div>
                </div>
            </div>

            {/* LEAVE APPLICATION MODAL */}
            {showLeaveModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800">Apply for Leave</h2>
                            <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Leave Type</label>
                                <select
                                    className="w-full border border-slate-200 p-2 rounded-lg bg-white"
                                    value={leaveForm.type}
                                    onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}
                                >
                                    <option>Sick Leave</option>
                                    <option>Casual Leave</option>
                                    <option>Paid Leave</option>
                                    <option>Unpaid Leave</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-slate-200 p-2 rounded-lg"
                                        value={leaveForm.startDate}
                                        onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-slate-200 p-2 rounded-lg"
                                        value={leaveForm.endDate}
                                        onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Reason</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full border border-slate-200 p-2 rounded-lg"
                                    value={leaveForm.reason}
                                    onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                    placeholder="Brief reason for leave..."
                                />
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Report MODAL */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800">Daily Work Report</h2>
                            <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Tasks Completed Today</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full border border-slate-200 p-2 rounded-lg"
                                    value={reportForm.tasksCompleted}
                                    onChange={e => setReportForm({ ...reportForm, tasksCompleted: e.target.value })}
                                    placeholder="List tasks you finished..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Issues / Blockers</label>
                                <textarea
                                    rows="2"
                                    className="w-full border border-slate-200 p-2 rounded-lg"
                                    value={reportForm.issues}
                                    onChange={e => setReportForm({ ...reportForm, issues: e.target.value })}
                                    placeholder="Any problems encountered?"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Plan for Tomorrow</label>
                                <textarea
                                    rows="2"
                                    className="w-full border border-slate-200 p-2 rounded-lg"
                                    value={reportForm.nextDayPlan}
                                    onChange={e => setReportForm({ ...reportForm, nextDayPlan: e.target.value })}
                                    placeholder="What will you work on next?"
                                />
                            </div>

                            <div className="pt-2">
                                <button type="submit" className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg shadow-green-200 transition">
                                    Submit Daily Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
