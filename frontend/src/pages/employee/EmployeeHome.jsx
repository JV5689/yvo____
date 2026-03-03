import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import api from '../../services/api';
import { DollarSign, Clock, Calendar, MessageSquare, X, FileText } from 'lucide-react';

const StatCard = ({ icon, label, value, subtext }) => (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 md:p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] flex items-center gap-4 hover:translate-y-[-2px] transition-all duration-300">
        <div className="p-3 md:p-3.5 rounded-xl bg-slate-50 border border-slate-100/80">
            {React.cloneElement(icon, { size: 20, className: icon.props.className + " md:w-6 md:h-6" })}
        </div>
        <div className="min-w-0">
            <p className="text-[11px] md:text-[13px] font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900 truncate">{value}</p>
            <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-0.5 truncate">{subtext}</p>
        </div>
    </div>
);

export default function EmployeeHome() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { alert, toast } = useUI();
    // ... rest of state stays the same ...
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



    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">Loading dashboard...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                    Welcome Back, <span className="text-blue-600">{user.firstName}!</span>
                </h1>
                <p className="text-sm md:text-base text-slate-500 font-medium opacity-80">
                    Your daily overview for <span className="text-slate-900 border-b-2 border-blue-100">{user.company?.name || user.companyId?.name || "your portal"}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    icon={<DollarSign className="text-blue-600" />}
                    label="Last Salary"
                    value={stats.lastSalary ? `₹${stats.lastSalary.amount.toLocaleString()}` : 'N/A'}
                    subtext={stats.lastSalary ? stats.lastSalary.payPeriod : 'No records'}
                />
                <StatCard
                    icon={<Clock className="text-orange-600" />}
                    label="Pending Leaves"
                    value={stats.pendingLeaves}
                    subtext="Awaiting approval"
                />
                <StatCard
                    icon={<Calendar className="text-emerald-600" />}
                    label="Events"
                    value={stats.upcomingEvents}
                    subtext="Next 7 days"
                />
                <StatCard
                    icon={<MessageSquare className="text-purple-600" />}
                    label="Broadcasts"
                    value={stats.unreadBroadcasts}
                    subtext="Unread messages"
                />
            </div>

            {/* Quick Actions */}
            <section>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                    Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => setShowLeaveModal(true)}
                        className="group flex flex-col items-center md:items-start p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 active:scale-[0.98]"
                    >
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors mb-4">
                            <Clock size={24} />
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-1">Apply for Leave</h4>
                        <p className="text-xs font-medium text-slate-400 text-center md:text-left">Submit a new leave request for approval</p>
                    </button>

                    <button
                        onClick={() => navigate('/employee-dashboard/calendar')}
                        className="group flex flex-col items-center md:items-start p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-purple-100 transition-all duration-300 active:scale-[0.98]"
                    >
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors mb-4">
                            <Calendar size={24} />
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-1">Calendar</h4>
                        <p className="text-xs font-medium text-slate-400 text-center md:text-left">View upcoming events and holidays</p>
                    </button>
                </div>
            </section>

            {/* LEAVE APPLICATION MODAL */}
            {showLeaveModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center z-50 p-0 md:p-4">
                    <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-full md:slide-in-from-bottom-4 duration-300">
                        <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-50 bg-slate-50/50">
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-slate-900">Apply for Leave</h2>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">New Application</p>
                            </div>
                            <button onClick={() => setShowLeaveModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleApplyLeave} className="p-6 md:p-8 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-1">Leave Type</label>
                                <select
                                    className="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold text-slate-700 appearance-none"
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
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold text-slate-700"
                                        value={leaveForm.startDate}
                                        onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold text-slate-700"
                                        value={leaveForm.endDate}
                                        onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Reason</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full border-2 border-slate-100 p-4 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300"
                                    value={leaveForm.reason}
                                    onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                    placeholder="Why are you applying for leave?"
                                />
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm uppercase tracking-widest shadow-lg shadow-blue-200 transition-all duration-200 active:scale-[0.98]">
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
