import api from '../../services/api';
import { Plus, X } from 'lucide-react';
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

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const res = await api.get('/employee/dashboard/leaves');
            setLeaves(res.data);
        } catch (error) {
            console.error("Error fetching leaves", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/employee/dashboard/leaves', formData);
            toast.success('Leave application submitted successfully!');
            setShowForm(false);
            setFormData({ type: 'Sick Leave', startDate: '', endDate: '', reason: '' });
            fetchLeaves(); // Refresh list
        } catch (error) {
            alert('Error', 'Failed to apply for leave', 'error');
        }
    };

    if (loading && !leaves.length) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Leave Management</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus size={18} /> Apply for New Leave
                </button>
            </div>

            {/* Apply Form Modal/Inline */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Apply for Leave</h3>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
                                <select
                                    className="w-full rounded-lg border border-slate-300 p-2.5"
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
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full rounded-lg border border-slate-300 p-2.5"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full rounded-lg border border-slate-300 p-2.5"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                                <textarea
                                    required
                                    className="w-full rounded-lg border border-slate-300 p-2.5 h-24"
                                    placeholder="Briefly describe the reason..."
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {leaves.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                        No active or past leave requests.
                    </div>
                ) : (
                    leaves.map(leave => (
                        <div key={leave._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-semibold text-slate-900">{leave.type}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium
                                        ${leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                            leave.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'}`}>
                                        {leave.status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600">
                                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">{leave.reason}</p>
                            </div>
                            <div className="text-right text-xs text-slate-400">
                                Applied on {new Date(leave.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
