import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, FileText, Check, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import TemplateDesigner from '../../components/invoice-builder/TemplateDesigner';
import { useUI } from '../../context/UIContext';


export default function InvoiceThemes() {
    const { confirm } = useUI();
    const [templates, setTemplates] = useState([]);
    const [companyTemplates, setCompanyTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [activeTab, setActiveTab] = useState('global');
    const [templateName, setTemplateName] = useState('');

    const [formData, setFormData] = useState({
        type: 'GLOBAL',
        themeIdentifier: 'classic',
        taxRate: 10,
        notes: '',
        layout: []
    });

    useEffect(() => {
        if (activeTab === 'global') {
            fetchTemplates();
        } else {
            fetchCompanyTemplates();
        }
    }, [activeTab]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await api.get('/invoice-templates');
            setTemplates(res.data.filter(t => t.type === 'GLOBAL'));
        } catch (error) {
            console.error(error);
            toast.error("Failed to load global templates");
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanyTemplates = async () => {
        try {
            setLoading(true);
            const res = await api.get('/invoice-templates/admin/all');
            // Filter to only show COMPANY templates
            setCompanyTemplates(res.data.filter(t => t.type === 'COMPANY'));
        } catch (error) {
            console.error(error);
            toast.error("Failed to load company templates");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (template = null) => {
        if (template) {
            setCurrentTemplate(template);
            setTemplateName(template.name || '');
            setFormData({
                type: 'GLOBAL',
                themeIdentifier: template.themeIdentifier || 'classic',
                taxRate: template.taxRate !== undefined ? template.taxRate : 10,
                notes: template.notes || '',
                layout: template.layout || []
            });
        } else {
            setCurrentTemplate(null);
            setTemplateName('');
            setFormData({
                type: 'GLOBAL',
                layout: [
                    { id: `block_${Date.now()}_1`, type: 'LOGO', config: { x: 40, y: 40, width: 150, height: 80 } },
                    { id: `block_${Date.now()}_2`, type: 'COMPANY_NAME', config: { x: 40, y: 130, width: 250, height: 30, fontSize: 24, fontWeight: 'bold' } },
                    { id: `block_${Date.now()}_3`, type: 'COMPANY_DETAILS', config: { x: 40, y: 165, width: 250, height: 100, fontSize: 14 } },

                    { id: `block_${Date.now()}_4`, type: 'INVOICE_TITLE_LABEL', config: { x: 500, y: 40, width: 250, height: 60, fontSize: 48, fontWeight: '900', textAlign: 'right', color: '#e2e8f0', text: 'INVOICE' } },
                    { id: `block_${Date.now()}_5`, type: 'INVOICE_DETAILS', config: { x: 500, y: 105, width: 250, height: 100, fontSize: 14, textAlign: 'right' } },

                    { id: `block_${Date.now()}_6`, type: 'BILL_TO_LABEL', config: { x: 40, y: 300, width: 200, height: 20, fontSize: 12, fontWeight: 'bold', color: '#94a3b8', text: 'BILL TO' } },
                    { id: `block_${Date.now()}_7`, type: 'CUSTOMER_DETAILS', config: { x: 40, y: 325, width: 300, height: 100, fontSize: 14 } },

                    { id: `block_${Date.now()}_8`, type: 'ITEMS_TABLE', config: { x: 40, y: 450, width: 710, height: 200, fontSize: 14 } },
                    { id: `block_${Date.now()}_9`, type: 'TOTALS', config: { x: 450, y: 680, width: 300, height: 150, fontSize: 14 } },

                    { id: `block_${Date.now()}_10`, type: 'NOTES_LABEL', config: { x: 40, y: 850, width: 200, height: 25, fontSize: 14, fontWeight: 'bold', text: 'Terms & Notes' } },
                    { id: `block_${Date.now()}_11`, type: 'NOTES_CONTENT', config: { x: 40, y: 880, width: 400, height: 80, fontSize: 14, color: '#64748b' } },
                ]
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, name: templateName };
            if (payload.type === 'GLOBAL') {
                delete payload.companyId;
            }

            if (currentTemplate) {
                await api.patch(`/invoice-templates/${currentTemplate.id}`, payload);
                toast.success("Global template updated");
            } else {
                await api.post('/invoice-templates', payload);
                toast.success("Global template created");
            }
            setShowModal(false);
            fetchTemplates();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to save global template");
        }
    };

    const handleDelete = async (id) => {
        if (!id) {
            toast.error('Template ID missing — cannot delete');
            return;
        }
        const ok = await confirm(
            'Delete Template',
            'Are you sure you want to delete this global template? It will be removed for all companies.',
            'Delete',
            'danger'
        );
        if (!ok) return;
        try {
            await api.delete(`/invoice-templates/${id}`);
            toast.success('Global template deleted');
            fetchTemplates();
        } catch (error) {
            console.error('Delete error:', error?.response?.data || error);
            toast.error(error?.response?.data?.message || 'Failed to delete global template');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Invoice Templates</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage global layouts and view company-specific templates.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                    <Plus size={18} /> New Global Template
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'global' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    onClick={() => setActiveTab('global')}
                >
                    Global Templates
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'company' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    onClick={() => setActiveTab('company')}
                >
                    Company Custom Templates
                </button>
            </div>

            {loading ? (
                <div className="p-10 text-center text-slate-500 animate-pulse">Loading templates...</div>
            ) : activeTab === 'global' ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                                <th className="px-6 py-4 text-left">Template Name</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {templates.map(template => (
                                <tr key={template.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-800">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-indigo-500" />
                                            {template.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(template)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded bg-white border border-slate-200"
                                                title="Edit Template"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded bg-white border border-slate-200"
                                                title="Delete Template"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {templates.length === 0 && (
                                <tr>
                                    <td colSpan="2" className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                                        No global templates found. Create one to provide defaults to companies.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                                <th className="px-6 py-4 text-left">Template Name</th>
                                <th className="px-6 py-4 text-left">Company</th>
                                <th className="px-6 py-4 text-left">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {companyTemplates.map(template => (
                                <tr key={template.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-800">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-blue-500" />
                                            {template.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {template.company?.name || 'No Company'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {new Date(template.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleOpenModal(template)}
                                            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 hover:text-indigo-600"
                                            title="View Template"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {companyTemplates.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                                        No custom templates have been created by companies yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )
            }

            {/* Full Screen Editor */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm shrink-0">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <FileText size={24} className="text-indigo-600" />
                                {currentTemplate?.type === 'COMPANY'
                                    ? `Viewing Template: ${currentTemplate.name}`
                                    : currentTemplate ? 'Edit Global Template' : 'New Global Template'
                                }
                            </h2>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    {currentTemplate?.type === 'COMPANY' ? 'Close' : 'Cancel'}
                                </button>
                                {/* Hide Save button for Company Templates for Super Admin */}
                                {(!currentTemplate || currentTemplate.type !== 'COMPANY') && (
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
                                    >
                                        <Check size={18} /> Save Template
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
                            <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center gap-6 shrink-0 z-10 shadow-sm">
                                <div className="w-full max-w-md">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Template Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                                        placeholder="e.g., Standard Service Invoice"
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1"></div>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col">
                                <TemplateDesigner
                                    value={formData.layout}
                                    onChange={(newLayout) => setFormData({ ...formData, layout: newLayout })}
                                />
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
