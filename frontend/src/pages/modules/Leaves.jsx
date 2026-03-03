import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Filter, Search } from 'lucide-react';
import api from '../../services/api';
import { useUI } from '../../context/UIContext';

export default function Leaves() {
    const { alert, prompt, toast } = useUI();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending'); // Pending, Approved, Rejected, All

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const companyId = localStorage.getItem('companyId');
            const res = await api.get('/employees/leaves', { params: { companyId } });
            if (Array.isArray(res.data)) {
                setLeaves(res.data);
            } else {
                console.error("Leaves API did not return an array:", res.data);
                setLeaves([]);
            }
        } catch (err) {
            console.error("Failed to fetch leaves:", err);
            setLeaves([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status, currentRemark) => {
        let remark = currentRemark || '';
        if (status === 'Rejected') {
            const r = await prompt(
                "Reject Leave",
                "Reason for rejection (optional):",
                "text",
                "Reject"
            );
            if (r === null) return;
            remark = r;
        }

        try {
            await api.patch(`/employees/leaves/${id}`, { status, remark });
            toast.success(`Leave processed: ${status}`);
            fetchLeaves();
        } catch (err) {
            await alert('Status Update Failed', 'Failed to update leave status.', 'error');
        }
    };

    const filteredLeaves = filter === 'All'
        ? leaves
        : leaves.filter(l => l.status === filter);

    if (loading) return <div className="p-10 text-center">Loading Leave Requests...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Leave Management</h1>
                    <p className="text-sm text-slate-500">Manage employee leave requests.</p>
                </div>
                <div className="flex gap-2">
                    {['Pending', 'Approved', 'Rejected', 'All'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${filter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Dates</th>
                            <th className="px-6 py-4">Reason</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredLeaves.length === 0 && (
                            <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No requests found.</td></tr>
                        )}
                        {filteredLeaves.map(leave => (
                            <tr key={leave._id || leave.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                            {leave.employeeId?.firstName?.[0]}{leave.employeeId?.lastName?.[0]}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{leave.employeeId?.firstName} {leave.employeeId?.lastName}</div>
                                            <div className="text-xs text-slate-500">{leave.employeeId?.position}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-700">{leave.type}</td>
                                <td className="px-6 py-4 text-slate-600">
                                    <div className="flex flex-col text-xs">
                                        <span>From: {new Date(leave.startDate).toLocaleDateString()}</span>
                                        <span>To: {new Date(leave.endDate).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={leave.status} />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {leave.status === 'Pending' && (
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(leave._id || leave.id, 'Approved')}
                                                className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approve"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(leave._id || leave.id, 'Rejected')}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded" title="Reject"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    )}
                                    {leave.status !== 'Pending' && <span className="text-xs text-slate-400">-</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const StatusBadge = ({ status }) => {
    const styles = {
        Pending: 'bg-amber-100 text-amber-800',
        Approved: 'bg-green-100 text-green-800',
        Rejected: 'bg-red-100 text-red-800'
    };
    return (
        <span className={`px - 2.5 py - 0.5 rounded - full text - xs font - medium ${styles[status] || styles.Pending} `}>
            {status}
        </span>
    );
};
