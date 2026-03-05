import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export default function EmployeeLeave() {
    const { alert, toast } = useUI();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        type: 'Sick Leave',
        startDate: '',
        endDate: '',
        reason: ''
    });

    const fetchLeaves = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/employee/dashboard/leaves');
            setLeaves(res.data);
        } catch {
            console.error("Error fetching leaves");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/employee/dashboard/leaves', formData);
            toast.success('Leave application submitted successfully!');
            setShowForm(false);
            setFormData({ type: 'Sick Leave', startDate: '', endDate: '', reason: '' });
            fetchLeaves(); // Refresh list
        } catch {
            alert('Error', 'Failed to apply for leave', 'error');
        }
    };

    if (loading && !leaves.length) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">Loading leave records...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex flex-col gap-1.5">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">History & Applications</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center justify-center gap-2.5 bg-blue-600 text-white px-6 py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-bold text-sm uppercase tracking-widest w-full md:w-auto active:scale-[0.98]"
                >
                    <Plus size={20} /> Apply for New Leave
                </button>
            </div>

            {/* Apply Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 md:p-4">
                    <div className="w-full max-w-lg rounded-t-3xl md:rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-full md:slide-in-from-bottom-4 duration-300">
                        <div className="flex justify-between items-center p-6 border-b border-slate-50 bg-slate-50/50">
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-slate-900">Apply for Leave</h3>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Submit New Request</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Leave Type</label>
                                <select
                                    className="w-full rounded-xl border-2 border-slate-100 p-3.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold text-slate-700 appearance-none"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
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
                                        className="w-full rounded-xl border-2 border-slate-100 p-3.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold text-slate-700"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full rounded-xl border-2 border-slate-100 p-3.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold text-slate-700"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Reason</label>
                                <textarea
                                    required
                                    className="w-full rounded-xl border-2 border-slate-100 p-4 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 min-h-[120px]"
                                    placeholder="Briefly describe the reason for your leave..."
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-4 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Past & Pending Requests</h3>
                {leaves.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <CalendarIcon className="mx-auto text-slate-300 mb-2" size={40} />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No leave requests found</p>
                    </div>
                ) : (
                    leaves.map(leave => (
                        <div key={leave._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-100/50 flex flex-col gap-5 transition-all active:scale-[0.99] hover:border-blue-100">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-900 text-lg">{leave.type}</h4>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <CalendarIcon size={14} />
                                        <span className="text-xs font-semibold whitespace-nowrap">
                                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <span className={`text-[10px] px-3 py-1 rounded-xl font-bold uppercase tracking-widest
                                    ${leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                        leave.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'}`}>
                                    {leave.status}
                                </span>
                            </div>

                            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reason</p>
                                <p className="text-sm font-semibold text-slate-600 leading-relaxed italic">"{leave.reason}"</p>
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                <span>Applied On</span>
                                <span>{new Date(leave.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
