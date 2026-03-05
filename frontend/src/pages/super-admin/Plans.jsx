import React, { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import {
    Plus, Search, Edit2, X, IndianRupee,
    Trash2, Layout, Settings, Layers, ChevronRight,
    Globe, BarChart, Save, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const FEATURE_GROUPS = [
    {
        id: 'fin',
        title: "Financial Suite",
        icon: <IndianRupee size={18} />,
        color: "green",
        flags: [
            { key: "module_finance", label: "Finance & Accounting", desc: "Core dashboard, expenses, and ledger" },
            { key: "module_invoicing", label: "Invoicing & Estimates", desc: "Create, send, and track invoices" }
        ]
    },
    {
        id: 'ops',
        title: "Operations & HR",
        icon: <Globe size={18} />,
        color: "blue",
        flags: [
            { key: "module_inventory", label: "Inventory Management", desc: "Stock tracking and product catalog" },
            { key: "module_employees", label: "HR & Payroll Suite", desc: "Employees, Leaves, Payroll & Portal" },
            { key: "module_calendar", label: "Calendar & Scheduling", desc: "Events and team scheduling" }
        ]
    },
    {
        id: 'growth',
        title: "Growth & Analytics",
        icon: <BarChart size={18} />,
        color: "purple",
        flags: [
            { key: "module_broadcasts", label: "Broadcasts (SMS/Email)", desc: "Bulk messaging campaigns" },
            { key: "module_analytics", label: "Advanced Analytics", desc: "Deep insights and reporting" },
            { key: "module_backup", label: "Backup & Data Export", desc: "Full company data exports and history" },
            { key: "ai_enabled", label: "AI Assistant", desc: "Smart recommendations and help" }

        ]
    }
];

export default function Plans() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activePlanId, setActivePlanId] = useState(null);
    const [activeTab, setActiveTab] = useState('features'); // 'features', 'settings'

    // Form States
    const [editToggles, setEditToggles] = useState({});
    const [settingsForm, setSettingsForm] = useState({ name: '', priceMonthly: 0 });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', code: '', priceMonthly: 0, defaultFlags: {} });

    const activePlan = useMemo(() => plans.find(p => p._id === activePlanId), [plans, activePlanId]);

    const fetchPlans = React.useCallback(async (selectNewId = null) => {
        setLoading(true);
        try {
            const res = await api.get('/sa/plans');
            // Ensure we filter out archived plans if the backend doesn't already
            const fetchedPlans = (res.data || []).filter(p => !p.isArchived);
            setPlans(fetchedPlans);

            setActivePlanId(currentId => {
                if (selectNewId) return selectNewId;
                if (!currentId && fetchedPlans.length > 0) return fetchedPlans[0]._id;
                return currentId;
            });
        } catch {
            toast.error("Failed to fetch plans");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    useEffect(() => {
        if (activePlan) {
            setEditToggles(activePlan.defaultFlags || {});
            setSettingsForm({
                name: activePlan.name,
                priceMonthly: activePlan.priceMonthly
            });
        }
    }, [activePlan]);

    const handleUpdateFeatures = async () => {
        if (!activePlanId) return;
        try {
            await api.patch(`/sa/plans/${activePlanId}`, { defaultFlags: editToggles });
            toast.success("Plan features updated successfully!");
            // Update local state to reflect saved changes
            fetchPlans(activePlanId);
        } catch (err) {
            toast.error("Failed to save: " + (err.response?.data?.message || err.message));
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/sa/plans/${activePlanId}`, settingsForm);
            toast.success("Plan details updated!");
            fetchPlans(activePlanId);
        } catch (err) {
            toast.error("Update failed: " + (err.response?.data?.message || err.message));
        }
    };

    const handleCreatePlan = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/sa/plans', {
                ...createForm,
                code: createForm.code.toUpperCase().replace(/\s+/g, '_')
            });
            toast.success("New Plan Created!");
            setIsCreateModalOpen(false);
            setCreateForm({ name: '', code: '', priceMonthly: 0, defaultFlags: {} });
            fetchPlans(res.data._id);
        } catch (err) {
            toast.error("Creation failed: " + (err.response?.data?.message || err.message));
        }
    };

    const handleArchivePlan = async (id) => {
        const result = await Swal.fire({
            title: 'Archive Plan?',
            text: 'This plan will be hidden from new selections.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Archive',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;
        try {
            await api.patch(`/sa/plans/${id}/archive`);
            toast.success("Plan archived");
            if (activePlanId === id) setActivePlanId(null);
            fetchPlans();
        } catch (err) {
            toast.error("Archive failed: " + (err.response?.data?.message || err.message));
        }
    };

    const toggleFeature = (key) => {
        setEditToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleCreateFeature = (key) => {
        setCreateForm(prev => ({
            ...prev,
            defaultFlags: { ...prev.defaultFlags, [key]: !prev.defaultFlags[key] }
        }));
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Subscription Plans</h1>
                    <p className="text-sm text-slate-500">Configure global tiers and feature access</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-sm"
                >
                    <Plus size={18} /> Create Plan
                </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                {/* SIDEBAR: Plan List */}
                <div className="w-80 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search plans..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loading ? (
                            <div className="text-center py-10 text-slate-400 text-sm">Loading...</div>
                        ) : plans.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">No active plans found.</div>
                        ) : (
                            plans.map(p => (
                                <button
                                    key={p._id}
                                    onClick={() => setActivePlanId(p._id)}
                                    className={`w-full text-left p-4 rounded-xl transition-all group relative border ${activePlanId === p._id
                                        ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-200'
                                        : 'bg-white border-transparent hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-slate-900">{p.name}</div>
                                        <div className="text-indigo-600 font-bold text-sm">₹{p.priceMonthly}/mo</div>
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">{p.code}</div>
                                    {activePlanId === p._id && (
                                        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400" size={16} />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* MAIN CONTENT: Editor */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    {!activePlan ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Layout size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-600">No Plan Selected</h3>
                            <p className="max-w-xs mt-2">Select a plan from the left to manage its features and pricing.</p>
                        </div>
                    ) : (
                        <>
                            {/* Tab Header */}
                            <div className="px-6 border-b border-slate-100 flex items-center justify-between h-14 bg-slate-50/50">
                                <div className="flex h-full">
                                    <button
                                        onClick={() => setActiveTab('features')}
                                        className={`px-4 h-full text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'features' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <Layers size={16} /> Features
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('settings')}
                                        className={`px-4 h-full text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <Settings size={16} /> Settings
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleArchivePlan(activePlanId)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Archive Plan"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    {activeTab === 'features' && (
                                        <button
                                            onClick={handleUpdateFeatures}
                                            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 flex items-center gap-2 shadow-md transition-all active:scale-95"
                                        >
                                            <Save size={16} /> Save Changes
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Panel Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {activeTab === 'features' ? (
                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                        {FEATURE_GROUPS.map(group => (
                                            <div key={group.id} className="flex flex-col border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-slate-50/30">
                                                <div className={`p-4 flex items-center gap-3 bg-${group.color}-50 text-${group.color}-700 border-b border-${group.color}-100`}>
                                                    <div className={`p-1.5 bg-${group.color}-100 rounded-lg`}>{group.icon}</div>
                                                    <h4 className="font-bold text-sm uppercase tracking-wide">{group.title}</h4>
                                                </div>
                                                <div className="p-4 space-y-4">
                                                    {group.flags.map(flag => (
                                                        <div key={flag.key} className="flex items-center justify-between gap-4 group/item">
                                                            <div className="min-w-0 pr-2">
                                                                <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                                                    {flag.label}
                                                                </div>
                                                                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{flag.desc}</div>
                                                            </div>
                                                            <button
                                                                onClick={() => toggleFeature(flag.key)}
                                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${editToggles[flag.key] ? 'bg-indigo-600' : 'bg-slate-200'
                                                                    }`}
                                                            >
                                                                <span
                                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editToggles[flag.key] ? 'translate-x-5' : 'translate-x-0'
                                                                        }`}
                                                                />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="max-w-lg mx-auto py-8">
                                        <form onSubmit={handleUpdateSettings} className="space-y-6">
                                            <div className="grid grid-cols-1 gap-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Plan Display Name</label>
                                                    <input
                                                        type="text"
                                                        value={settingsForm.name}
                                                        onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium"
                                                        placeholder="e.g. Pro Plan"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Price Monthly (₹)</label>
                                                    <div className="relative">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
                                                        <input
                                                            type="number"
                                                            value={settingsForm.priceMonthly}
                                                            onChange={e => setSettingsForm({ ...settingsForm, priceMonthly: e.target.value })}
                                                            className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                                    <button
                                                        type="submit"
                                                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 text-sm"
                                                    >
                                                        Update Settings
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* CREATE MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">New Subscription Tier</h3>
                                <p className="text-xs text-slate-500">Define a new global plan</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreatePlan} className="p-6 overflow-y-auto space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.name}
                                        onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="e.g. Enterprise"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unique Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.code}
                                        onChange={e => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-mono text-sm"
                                        placeholder="ENT_TIER"
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={createForm.priceMonthly}
                                        onChange={e => setCreateForm({ ...createForm, priceMonthly: e.target.value })}
                                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Feature Inclusion</label>
                                <div className="grid grid-cols-1 gap-2 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                                    {FEATURE_GROUPS.flatMap(g => g.flags).map(f => (
                                        <button
                                            key={f.key}
                                            type="button"
                                            onClick={() => toggleCreateFeature(f.key)}
                                            className={`flex items-center justify-between p-3 rounded-xl transition-all ${createForm.defaultFlags[f.key] ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            <div className="text-left">
                                                <div className={`text-sm font-bold ${createForm.defaultFlags[f.key] ? 'text-white' : 'text-slate-800'}`}>{f.label}</div>
                                                <div className={`text-[10px] ${createForm.defaultFlags[f.key] ? 'text-indigo-100' : 'text-slate-400'}`}>{f.desc}</div>
                                            </div>
                                            {createForm.defaultFlags[f.key] ? <Check size={16} /> : <Plus size={16} className="text-slate-300" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 px-4 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                >
                                    Create Plan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
