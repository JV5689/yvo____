import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, FileText, Check, Copy } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import TemplateDesigner from '../../components/invoice-builder/TemplateDesigner';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';


export default function CompanyTemplates() {
    const { user } = useAuth();
    const { confirm } = useUI();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [templateName, setTemplateName] = useState('');

    const [formData, setFormData] = useState({
        type: 'COMPANY',
        themeIdentifier: 'classic',
        taxRate: 10,
        notes: '',
        layout: [],
        items: []
    });

    useEffect(() => {
        const companyId = user?.companyId || localStorage.getItem('companyId');
        if (companyId) {
            fetchTemplates(companyId);
        }
    }, [user]);

    const fetchTemplates = async (companyId) => {
        try {
            setLoading(true);
            const res = await api.get('/invoice-templates', {
                params: { companyId }
            });
            setTemplates(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load invoice templates");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (template = null, isDuplicating = false) => {
        if (template) {
            setCurrentTemplate(isDuplicating ? null : template);
            setTemplateName(isDuplicating ? `${template.name} (Copy)` : template.name || '');
            setFormData({
                type: 'COMPANY',
                themeIdentifier: template.themeIdentifier || 'classic',
                taxRate: template.taxRate !== undefined ? template.taxRate : 10,
                notes: template.notes || '',
                layout: JSON.parse(JSON.stringify(template.layout || [])),
                items: JSON.parse(JSON.stringify(template.items || []))
            });
        } else {
            setCurrentTemplate(null);
            setTemplateName('');
            setFormData({
                type: 'COMPANY',
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
                ],
                items: []
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const companyId = user?.companyId || localStorage.getItem('companyId');
            if (!companyId) {
                toast.error("Error: Company ID missing.");
                return;
            }
            const payload = { ...formData, name: templateName, companyId };

            if (currentTemplate && currentTemplate.type === 'COMPANY') {
                const templateId = currentTemplate.id || currentTemplate._id;
                await api.patch(`/invoice-templates/${templateId}`, payload);
                toast.success("Template updated");
            } else {
                await api.post('/invoice-templates', payload);
                toast.success("Template created");
            }
            setShowModal(false);
            fetchTemplates(companyId);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to save template");
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm(
            "Delete Template",
            "Are you sure you want to permanently delete this custom layout? This action cannot be undone.",
            "Delete Permanently",
            "danger"
        );
        if (!confirmed) return;
        try {
            const companyId = user?.companyId || localStorage.getItem('companyId');
            await api.delete(`/invoice-templates/${id}`);
            toast.success("Template deleted");
            if (companyId) fetchTemplates(companyId);
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete template");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Invoice Templates</h3>
                    <p className="text-sm text-slate-500 mt-1">Save frequently used invoices to create new ones quickly.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
                >
                    <Plus size={18} /> Create Custom Template
                </button>
            </div>

            {loading ? (
                <div className="p-10 text-center text-slate-500 animate-pulse">Loading templates...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <div key={template.id || template._id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-lg ${template.type === 'GLOBAL' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 leading-tight">{template.name || <span className="italic text-slate-400">Unnamed Template</span>}</h4>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                                            {template.type === 'GLOBAL' ? 'System Default' : 'Custom Template'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Theme</span>
                                    <span className="font-medium text-slate-700 capitalize">{template.themeIdentifier || 'Classic'}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Items Configuration</span>
                                    <span className="font-medium text-slate-700">{template.items?.length || 0} Default Items</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Tax Rate</span>
                                    <span className="font-medium text-slate-700">{template.taxRate !== undefined ? template.taxRate : 10}%</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.location.href = `/dashboard/invoices/new?templateId=${template.id || template._id}`}
                                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    Use Template
                                </button>

                                {template.type === 'GLOBAL' ? (
                                    <button
                                        onClick={() => handleOpenModal(template, true)}
                                        className="p-2 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Duplicate & Customize"
                                    >
                                        <Copy size={20} />
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleOpenModal(template)}
                                            className="p-2 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Edit Design"
                                        >
                                            <Edit2 size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.id || template._id)}
                                            className="p-2 border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Template"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {templates.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <FileText size={40} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-500 font-medium">No templates available. Create your first one!</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 transition-all duration-300">
                    {/* Backdrop with Blur */}
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300"
                        onClick={() => setShowModal(false)}
                    ></div>

                    {/* Modal Container */}
                    <div className="relative w-full h-full bg-slate-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-white/20">
                        {/* Premium Header */}
                        <div className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex justify-between items-center z-10 shadow-sm shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner">
                                    <FileText size={22} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                                        {currentTemplate ? 'Refine Template' : 'Design Custom Template'}
                                    </h2>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mt-1">
                                        {currentTemplate ? 'Modifying existing layout' : 'Creating new visual identity'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 hover:shadow-indigo-200 hover:shadow-lg transition-all active:scale-95 shadow-md group"
                                >
                                    <Check size={18} className="group-hover:scale-110 transition-transform" />
                                    Save Template
                                </button>
                            </div>
                        </div>

                        {/* Designer Workspace */}
                        <div className="flex-1 flex flex-col overflow-hidden bg-slate-100/50">
                            {/* Toolbar/Name Area */}
                            <div className="bg-white/50 backdrop-blur-sm px-6 py-4 border-b border-slate-200 flex items-center gap-6 shrink-0 z-10">
                                <div className="w-full max-w-sm">
                                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Template Name</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            required
                                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                                            placeholder="e.g., Creative Layout V1"
                                            value={templateName}
                                            onChange={(e) => setTemplateName(e.target.value)}
                                        />
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-400 transition-colors">
                                            <Edit2 size={14} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1"></div>
                            </div>

                            {/* Canvas Background and Main Designer */}
                            <div className="flex-1 overflow-hidden flex flex-col relative">
                                <TemplateDesigner
                                    value={formData.layout}
                                    onChange={(newLayout) => setFormData({ ...formData, layout: newLayout })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
