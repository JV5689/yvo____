import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    Search, Filter, MoreHorizontal, Download,
    ChevronDown, HardDrive, Settings, X, Save,
    Calendar, CreditCard, Building, User, Eye, Layers, Plus, Trash2, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useUI } from '../../context/UIContext';

export default function Companies() {
    const { confirm } = useUI();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [plans, setPlans] = useState([]);

    // Modal State
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [modalMode, setModalMode] = useState(null); // 'details', 'plan', 'features', null

    // Form States
    const [tempFlags, setTempFlags] = useState({});
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [subscriptionEndsAt, setSubscriptionEndsAt] = useState('');
    const [status, setStatus] = useState('active');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchCompanies();
        fetchPlans();
    }, []);

    const fetchCompanies = () => {
        setLoading(true);
        api.get('/sa/companies')
            .then(res => setCompanies(res.data.companies || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const fetchPlans = () => {
        api.get('/sa/plans')
            .then(res => setPlans(res.data || []))
            .catch(err => console.error(err));
    };

    const openModal = (company, mode) => {
        setSelectedCompany(company);
        setModalMode(mode);

        if (mode === 'features') {
            // Merge Plan Defaults + Company Overrides
            const planId = company.planId?._id || company.planId;
            const plan = plans.find(p => p._id === planId);
            const defaults = plan?.defaultFlags || {};
            const overrides = company.featureFlags || {};

            // Combined view: defaults overwritten by specific company settings if present
            // Note: If company has NO override for a key, use default.
            setTempFlags({ ...defaults, ...overrides });
        }

        if (mode === 'plan') {
            setSelectedPlanId(company.planId?._id || company.planId);
            if (company.subscriptionEndsAt) {
                setSubscriptionEndsAt(new Date(company.subscriptionEndsAt).toISOString().split('T')[0]);
            } else if (company.trialEndsAt) {
                setSubscriptionEndsAt(new Date(company.trialEndsAt).toISOString().split('T')[0]);
            } else {
                setSubscriptionEndsAt('');
            }
            setStatus(company.subscriptionStatus || 'active');
        }

        if (mode === 'password') {
            setNewPassword('');
        }
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedCompany(null);
    };

    const handleSavePlan = async () => {
        try {
            await api.patch(`/sa/companies/${selectedCompany._id}/plan`, { planId: selectedPlanId });
            toast.success("Plan updated successfully!");
            fetchCompanies();
            closeModal();
        } catch (err) {
            toast.error("Failed to update plan: " + err.message);
        }
    };

    const handleSaveStatus = async () => {
        try {
            await api.patch(`/sa/companies/${selectedCompany._id}/status`, {
                status: status,
                subscriptionEndsAt: subscriptionEndsAt
            });
            toast.success("Subscription updated!");
            fetchCompanies();
            closeModal();
        } catch (err) {
            toast.error("Failed to update status: " + err.message);
        }
    };

    const handleSaveFlags = async () => {
        try {
            // Smart Save: Only send flags that DIFFER from Plan Defaults
            const planId = selectedCompany.planId?._id || selectedCompany.planId;
            const plan = plans.find(p => p._id === planId);
            const planDefaults = plan?.defaultFlags || {};

            const overrides = {};

            // Calculate Diff
            Object.keys(tempFlags).forEach(key => {
                const globalValue = planDefaults[key];
                const formValue = tempFlags[key];

                // If form value differs from default, it's an override
                // Note: We need careful boolean comparison
                if (formValue !== globalValue) {
                    overrides[key] = formValue;
                }
            });

            // If an override existed but now matches default, we just don't include it in 'overrides'
            // The backend needs to know we are REPLACING the map
            await api.patch(`/sa/companies/${selectedCompany._id}/flags`, {
                flags: overrides,
                replace: true
            });

            toast.success("Features updated! Inheritance preserved for unchanged flags.");
            fetchCompanies();
            closeModal();
        } catch (err) {
            toast.error("Failed to update features: " + err.message);
        }
    };

    const handleSavePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }

        try {
            await api.patch(`/sa/companies/${selectedCompany._id}/password`, { password: newPassword });
            toast.success("Company password updated successfully!");
            closeModal();
        } catch (err) {
            toast.error("Failed to update password: " + (err.response?.data?.message || err.message));
        }
    };

    const handleResetDefaults = async () => {
        const ok = await confirm(
            'Reset to Defaults',
            "Are you sure? This will remove all custom overrides and revert the company to the Plan's default features.",
            'Reset',
            'danger'
        );
        if (!ok) return;
        try {
            // Send empty map with replace=true to clear all overrides
            await api.patch(`/sa/companies/${selectedCompany._id}/flags`, {
                flags: {},
                replace: true
            });
            toast.success("Reset to Plan Defaults successfully!");
            fetchCompanies();
            closeModal();
        } catch (err) {
            toast.error("Failed to reset: " + err.message);
        }

    };

    const handleDeleteCompany = async (companyId) => {
        const ok = await confirm(
            'Delete Company',
            "⚠️ DANGER: Are you sure you want to permanently DELETE this company? This action cannot be undone.",
            'Delete Permanently',
            'danger'
        );
        if (!ok) return;

        try {
            await api.delete(`/sa/companies/${companyId}`);
            toast.success("Company deleted successfully");
            fetchCompanies();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete company: " + (err.response?.data?.message || err.message));
        }
    };

    const toggleFlag = (key) => {
        setTempFlags(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Filter logic
    const filteredCompanies = (companies || []).filter(c =>
        c?.name && c.name.toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    const FEATURE_LIST = [
        { key: 'module_finance', label: 'Finance', desc: 'Financial management core' },
        { key: 'module_invoicing', label: 'Invoicing', desc: 'Create and send invoices' },
        { key: 'module_inventory', label: 'Inventory', desc: 'Stock & product management' },
        { key: 'module_employees', label: 'HR & Payroll', desc: 'Employees, Leaves & Payroll' },
        { key: 'module_calendar', label: 'Calendar', desc: 'Scheduling & events' },
        { key: 'module_broadcasts', label: 'Broadcasts', desc: 'Mass messaging tools' },
        { key: 'module_analytics', label: 'Analytics', desc: 'Reports & insights' },
        { key: 'module_backup', label: 'Backup & Data Export', desc: 'Full company data exports and history' },
        { key: 'ai_enabled', label: 'AI Assistant', desc: 'Smart recommendations and help' },
    ];


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Companies Management</h1>
                <p className="text-sm text-slate-500 mt-1">Manage client workspaces, plans, and subscription status.</p>
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search companies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <button
                    onClick={() => window.location.href = '/dashboard/companies/new'}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> New Company
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                                <th className="px-6 py-4 text-left">Company Name</th>
                                <th className="px-6 py-4 text-left">Plan Type</th>
                                <th className="px-6 py-4 text-left">Subscription Ends</th>
                                <th className="px-6 py-4 text-left">Status (Click to Edit)</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-500">Loading companies...</td></tr>
                            ) : (filteredCompanies || []).map((c) => (
                                <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100" onClick={() => openModal(c, 'details')}>
                                        <div className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">{c.name}</div>
                                        <div className="text-xs text-slate-400">ID: {c._id.slice(-6).toUpperCase()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                            {c.plan?.name || 'Unknown Plan'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {c.subscriptionEndsAt ? (
                                            <div>
                                                <div className={`font-medium ${new Date(c.subscriptionEndsAt) < new Date() ? 'text-red-600' : 'text-slate-600'}`}>
                                                    {new Date(c.subscriptionEndsAt).toLocaleDateString()}
                                                </div>
                                                {new Date(c.subscriptionEndsAt) < new Date() && (
                                                    <span className="text-[10px] uppercase font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 ml-1">
                                                        Overdue
                                                    </span>
                                                )}
                                            </div>
                                        ) : c.trialEndsAt ? (
                                            <span className="text-orange-600">Trial: {new Date(c.trialEndsAt).toLocaleDateString()}</span>
                                        ) : (
                                            'N/A'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100" onClick={() => openModal(c, 'plan')}>
                                        {/* Status Logic: Active + Overdue = Warning Color */}
                                        {c.subscriptionStatus === 'active' && c.subscriptionEndsAt && new Date(c.subscriptionEndsAt) < new Date() ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-orange-100 text-orange-800 border border-orange-200">
                                                Active (Overdue)
                                            </span>
                                        ) : (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${c.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {c.subscriptionStatus}
                                            </span>
                                        )}
                                        <span className="ml-2 text-xs text-slate-400 opacity-0 hover:opacity-100 underline">Change</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => window.location.href = `/dashboard/backup-reports?companyId=${c._id}`}
                                                className="text-amber-600 hover:text-amber-800 flex items-center gap-1"
                                                title="View Backups"
                                            >
                                                <HardDrive size={16} />
                                            </button>
                                            <button
                                                onClick={() => openModal(c, 'password')}
                                                className="text-slate-600 hover:text-blue-600 flex items-center gap-1"
                                                title="Change Password"
                                            >
                                                <Lock size={16} />
                                            </button>
                                            <button
                                                onClick={() => openModal(c, 'details')}
                                                className="text-slate-600 hover:text-blue-600 flex items-center gap-1"
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>

                                            <button
                                                onClick={() => openModal(c, 'features')}
                                                className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
                                                title="Manage Features"
                                            >
                                                <Layers size={16} /> Features
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCompany(c._id)}
                                                className="text-red-500 hover:text-red-700 flex items-center gap-1 ml-2"
                                                title="Delete Company"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALS */}
            {modalMode && selectedCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">
                                    {modalMode === 'details' && 'Company Details'}
                                    {modalMode === 'plan' && 'Manage Plan & Subscription'}
                                    {modalMode === 'features' && 'Manage Module Features'}
                                    {modalMode === 'password' && 'Change Company Password'}
                                </h3>
                                <p className="text-xs text-slate-500 uppercase tracking-widest">{selectedCompany.name}</p>
                            </div>
                            <button onClick={closeModal} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {modalMode === 'details' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                                            <div className="text-slate-800 font-medium flex items-center gap-2">
                                                <User size={14} /> {selectedCompany.email || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Phone</label>
                                            <div className="text-slate-800 font-medium">{selectedCompany.phone || 'N/A'}</div>
                                        </div>
                                        <div className="col-span-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Address</label>
                                            <div className="text-slate-800 font-medium flex items-center gap-2">
                                                <Building size={14} /> {selectedCompany.address || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <h4 className="font-semibold text-slate-700 mb-2">Technical Details</h4>
                                        <pre className="bg-slate-900 text-slate-50 p-3 rounded text-xs overflow-x-auto">
                                            {JSON.stringify({
                                                createdAt: selectedCompany.createdAt,
                                                apiKey: selectedCompany.apiKey ? '***' + selectedCompany.apiKey.slice(-4) : 'None',
                                                devices: selectedCompany.devices?.length || 0,
                                                trialEndsAt: selectedCompany.trialEndsAt,
                                                subscriptionEndsAt: selectedCompany.subscriptionEndsAt
                                            }, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {modalMode === 'plan' && (
                                <div className="space-y-6">
                                    {/* Change Plan */}
                                    <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
                                        <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-3">
                                            <CreditCard size={18} /> Change Plan
                                        </h4>
                                        <div className="flex gap-2">
                                            <select
                                                value={selectedPlanId}
                                                onChange={(e) => setSelectedPlanId(e.target.value)}
                                                className="flex-1 rounded-lg border-slate-300 text-slate-700 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                {plans.map(p => (
                                                    <option key={p._id} value={p._id}>
                                                        {p.name} - ${p.priceMonthly}/mo
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={handleSavePlan}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                            >
                                                Update Plan
                                            </button>
                                        </div>
                                    </div>

                                    {/* Extend Subscription */}
                                    <div className="p-4 border border-orange-100 bg-orange-50/50 rounded-xl">
                                        <h4 className="font-semibold text-orange-900 flex items-center gap-2 mb-3">
                                            <Calendar size={18} /> Subscription Validity
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                                <select
                                                    value={status}
                                                    onChange={(e) => setStatus(e.target.value)}
                                                    className="w-full rounded-lg border-slate-300 focus:ring-orange-500 focus:border-orange-500 mb-3"
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="trial">Trial</option>
                                                    <option value="past_due">Past Due</option>
                                                    <option value="suspended">Suspended</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>

                                                <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Ends At</label>
                                                <input
                                                    type="date"
                                                    value={subscriptionEndsAt}
                                                    onChange={(e) => setSubscriptionEndsAt(e.target.value)}
                                                    className="w-full rounded-lg border-slate-300 focus:ring-orange-500 focus:border-orange-500"
                                                />
                                            </div>
                                            <button
                                                onClick={handleSaveStatus}
                                                className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                                            >
                                                Update Status & Date
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {modalMode === 'features' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        {FEATURE_LIST.map((feature) => (
                                            <div key={feature.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors">
                                                <div>
                                                    <div className="font-medium text-slate-900">{feature.label}</div>
                                                    <div className="text-xs text-slate-500">{feature.desc}</div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={!!tempFlags[feature.key]}
                                                    onChange={() => toggleFlag(feature.key)}
                                                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between pt-4 border-t border-slate-100 mt-4">
                                        <button
                                            onClick={handleResetDefaults}
                                            className="text-slate-500 hover:text-red-600 text-sm font-medium flex items-center gap-1"
                                        >
                                            <Layers size={14} /> Reset to Plan Defaults
                                        </button>
                                        <button
                                            onClick={handleSaveFlags}
                                            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                                        >
                                            <Save size={16} /> Save Changes
                                        </button>
                                    </div>
                                </div>
                            )}

                            {modalMode === 'password' && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                                        <p className="text-sm text-slate-600 mb-4">
                                            Enter a new password for the primary admin (OWNER) of this company. They will need to use this new password to log in.
                                        </p>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                        <input
                                            type="text"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Min. 6 characters"
                                            className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 mb-4"
                                            autoComplete="off"
                                        />

                                        <div className="flex justify-end pt-4 border-t border-slate-100">
                                            <button
                                                onClick={handleSavePassword}
                                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                            >
                                                <Save size={16} /> Update Password
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
