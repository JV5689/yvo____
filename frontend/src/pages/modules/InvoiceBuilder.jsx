import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Save, Download, Trash2, Printer, Search, Lock, Unlock, ChevronUp, ChevronDown, Users, Layout, Settings, Type, Image, FileText, ZoomIn, ZoomOut, MousePointer2 } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import api from '../../services/api';
import InvoiceRenderer from '../../components/invoice-builder/InvoiceRenderer';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import { injectPdfColorFix } from '../../utils/pdfColorFix';

export default function InvoiceBuilder({ invoiceId: propId, onClose, startEditing = false }) {
    const navigate = useNavigate();
    const { id: paramId } = useParams();
    const { alert, confirm, prompt } = useUI();
    const [searchParams] = useSearchParams();
    const templateIdFromUrl = searchParams.get('templateId');
    const id = propId || paramId;

    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(startEditing || !id);
    const [companyConfig, setCompanyConfig] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [inventory, setInventory] = useState([]);

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', taxId: '' });

    const [activeLayout, setActiveLayout] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [zoom, setZoom] = useState(0.8);
    const [sidebarTab, setSidebarTab] = useState('elements'); // 'elements', 'settings', 'data'

    const [invoiceData, setInvoiceData] = useState({
        invoiceNumber: 'INV-LOADING',
        customerId: '',
        customerName: '',
        clientAddress: '',
        gstNumber: '',
        date: new Date().toISOString().slice(0, 10),
        items: [],
        status: 'DRAFT',
        taxRate: 10,
        customAttributes: []
    });

    const canvasRef = useRef(null);

    const handleDownloadPDF = useCallback(async () => {
        const el = canvasRef.current;
        if (!el) return toast.error('Canvas not ready');
        try {
            toast.loading('Generating PDF...', { id: 'pdf-gen' });
            await html2pdf().set({
                margin: 0,
                filename: `Invoice-${invoiceData.invoiceNumber || 'draft'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    onclone: (clonedDoc) => injectPdfColorFix(clonedDoc),
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(el).save();
            toast.success('PDF downloaded!', { id: 'pdf-gen' });
        } catch (e) {
            toast.error('Failed to generate PDF', { id: 'pdf-gen' });
        }
    }, [invoiceData.invoiceNumber]);

    const DEFAULT_LAYOUT = [
        { id: 'b0', type: 'COMPANY_NAME', config: { x: 40, y: 60, width: 300, height: 40, fontSize: 24, fontWeight: 'bold' } },
        { id: 'b1', type: 'COMPANY_DETAILS', config: { x: 40, y: 100, width: 300, height: 80, fontSize: 12 } },
        { id: 'b2', type: 'CUSTOMER_DETAILS', config: { x: 40, y: 300, width: 300, height: 120, fontSize: 13 } },
        { id: 'b3', type: 'INVOICE_DETAILS', config: { x: 500, y: 60, width: 250, height: 100, fontSize: 12, textAlign: 'right' } },
        { id: 'b4', type: 'ITEMS_TABLE', config: { x: 40, y: 450, width: 710, height: 300 } },
        { id: 'b5', type: 'TOTALS', config: { x: 500, y: 760, width: 250, height: 150 } },
        { id: 'b6', type: 'CUSTOM_ATTRIBUTES', config: { x: 40, y: 760, width: 440, height: 150 } }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const companyId = localStorage.getItem('companyId');
                const [configRes, templatesRes, customersRes, inventoryRes] = await Promise.all([
                    api.get('/company/config'),
                    api.get('/invoice-templates', { params: { companyId } }),
                    api.get('/customers', { params: { companyId } }),
                    api.get('/inventory', { params: { companyId } })
                ]);

                setCompanyConfig(configRes.data.company);
                setTemplates(templatesRes.data);
                const fetchedCustomers = customersRes.data;
                setCustomers(fetchedCustomers);
                setInventory(inventoryRes.data);

                if (id) {
                    // --- Loading existing invoice ---
                    const invRes = await api.get(`/invoices/${id}`);
                    const data = invRes.data;
                    const cleansedItems = (data.items || []).map(({ id: _id, invoiceId: _inv, customFields: _cf, invoice: _i, inventory: _inv2, ...rest }) => rest);
                    setInvoiceData({
                        invoiceNumber: data.invoiceNumber || '',
                        customerId: data.customerId || '',
                        customerName: data.customerName || '',
                        clientAddress: data.clientAddress || '',
                        gstNumber: data.gstNumber || '',
                        date: data.date ? new Date(data.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                        notes: typeof data.notes === 'string' ? data.notes : '',
                        items: cleanedItems,
                        status: data.status || 'DRAFT',
                        taxRate: data.taxRate !== undefined ? data.taxRate : 10,
                        customAttributes: Array.isArray(data.customAttributes) ? data.customAttributes : [],
                        templateId: data.templateId || '',
                    });
                    const rawLayout = data.layout;
                    const safeLayout = Array.isArray(rawLayout)
                        ? rawLayout
                        : typeof rawLayout === 'string'
                            ? (() => { try { return JSON.parse(rawLayout); } catch { return []; } })()
                            : [];
                    if (safeLayout.length > 0) setActiveLayout(safeLayout);
                    if (data.templateId) setSelectedTemplateId(data.templateId);
                } else {
                    // --- New invoice ---
                    // Fetch sequential invoice number from backend
                    let nextNum = '';
                    try {
                        const numRes = await api.get('/invoices/next-number', { params: { companyId } });
                        nextNum = numRes.data.invoiceNumber;
                    } catch {
                        nextNum = `INV-${Date.now().toString().slice(-6)}`;
                    }

                    // Check for customerId in URL
                    const urlCustomerId = searchParams.get('customerId');
                    let preselectedCustomer = null;
                    if (urlCustomerId) {
                        preselectedCustomer = fetchedCustomers.find(c => (c.id === urlCustomerId || c._id === urlCustomerId));
                    }

                    setInvoiceData(prev => ({
                        ...prev,
                        invoiceNumber: nextNum,
                        customerId: preselectedCustomer ? (preselectedCustomer.id || preselectedCustomer._id) : prev.customerId,
                        customerName: preselectedCustomer ? preselectedCustomer.name : prev.customerName,
                        clientAddress: preselectedCustomer ? preselectedCustomer.address : prev.clientAddress
                    }));

                    // Apply template layout
                    if (templateIdFromUrl) {
                        const temp = templatesRes.data.find(t => (t.id || t._id) === templateIdFromUrl);
                        if (temp) {
                            setActiveLayout(temp.layout);
                            setSelectedTemplateId(temp.id || temp._id);
                        } else {
                            setActiveLayout(DEFAULT_LAYOUT);
                        }
                    } else if (templatesRes.data.length > 0) {
                        setActiveLayout(templatesRes.data[0].layout);
                        setSelectedTemplateId(templatesRes.data[0].id || templatesRes.data[0]._id);
                    } else {
                        setActiveLayout(DEFAULT_LAYOUT);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchData();
    }, [id, templateIdFromUrl, searchParams]);

    const handleUpdateData = useCallback((field, value) => {
        setInvoiceData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleUpdateConfig = useCallback((blockId, key, value) => {
        setActiveLayout(prev => prev.map(b => b.id === blockId ? { ...b, config: { ...b.config, [key]: value } } : b));
    }, []);

    const calculateSubtotal = () => (invoiceData.items || []).reduce((sum, item) => sum + (item.total || 0), 0);
    const tax = calculateSubtotal() * (invoiceData.taxRate / 100);
    const total = calculateSubtotal() + tax;

    const handleSave = async (status = 'DRAFT') => {
        try {
            if (!invoiceData.customerId) {
                return toast.error("Please select a customer first");
            }

            const companyId = localStorage.getItem('companyId');

            // If no blocks on canvas, snapshot from the selected template
            const layoutToSave = activeLayout.length > 0
                ? activeLayout
                : templates.find(t => (t.id || t._id) === selectedTemplateId)?.layout || [];

            const payload = {
                ...invoiceData,
                companyId,
                status,
                grandTotal: total,
                layout: layoutToSave,
                templateId: selectedTemplateId || invoiceData.templateId
            };

            // Ensure attributes are always an array
            if (!Array.isArray(payload.customAttributes)) payload.customAttributes = [];

            if (id) {
                await api.patch(`/invoices/${id}`, payload);
            } else {
                await api.post('/invoices', payload);
            }

            toast.success(`Invoice ${status === 'DRAFT' ? 'saved' : 'issued'} successfully!`);
            if (onClose) onClose();
            else navigate('/dashboard/invoicing');
        } catch (err) {
            console.error("Save Error:", err);
            alert("Save Failed", err.response?.data?.message || err.message, "error");
        }
    };

    if (loading) return <div className="flex h-full items-center justify-center">Loading Invoice Builder...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-100 overflow-hidden rounded-b-2xl">
            {/* Top Toolbar */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                        <button onClick={() => setZoom(prev => Math.max(0.3, prev - 0.1))} className="p-1.5 hover:bg-slate-200 rounded transition-colors"><ZoomOut size={16} className="text-slate-600" /></button>
                        <span className="text-xs font-bold text-slate-700 w-12 text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))} className="p-1.5 hover:bg-slate-200 rounded transition-colors"><ZoomIn size={16} className="text-slate-600" /></button>
                    </div>

                    <div className="h-6 w-px bg-slate-200"></div>

                    <div className="flex items-center gap-3">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Active Template</label>
                        <select
                            className="bg-slate-50 text-slate-900 text-xs font-bold px-3 py-1.5 rounded border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={selectedTemplateId}
                            onChange={(e) => {
                                const t = templates.find(temp => (temp.id || temp._id) === e.target.value);
                                if (t) {
                                    setActiveLayout(t.layout || []);
                                    setSelectedTemplateId(t.id || t._id);
                                    handleUpdateData('templateId', t.id || t._id);

                                    if (!id) {
                                        setInvoiceData(prev => ({
                                            ...prev,
                                            taxRate: t.taxRate !== undefined ? t.taxRate : 10,
                                            notes: t.notes || prev.notes,
                                            items: t.items?.length > 0 ? t.items.map(item => ({ ...item })) : [],
                                            customAttributes: t.layout?.find(b => b.type === 'CUSTOM_ATTRIBUTES')?.config?.attributes || []
                                        }));
                                    }
                                }
                            }}
                        >
                            <option value="">Select Template...</option>
                            {templates.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name || '(Unnamed Template)'}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <Download size={16} /> Download PDF
                    </button>
                    {!isEditing && id ? (
                        <button
                            onClick={async () => {
                                const inputPass = await prompt(
                                    'Security Authorization',
                                    'Enter Security Password to Edit Invoice:',
                                    'password',
                                    'Verify Password',
                                    'primary'
                                );
                                if (!inputPass) return;
                                try {
                                    const companyId = localStorage.getItem('companyId');
                                    const res = await api.post('/company/verify-password', { password: inputPass, companyId });
                                    if (!res.data.valid) {
                                        await alert('Access Denied', 'Incorrect Password! You cannot edit this invoice.', 'error');
                                        return;
                                    }
                                    setIsEditing(true);
                                } catch (err) {
                                    await alert('Error', 'Password verification failed.', 'error');
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                        >
                            <Unlock size={16} /> Edit Mode
                        </button>
                    ) : (
                        <>
                            <button onClick={() => handleSave('DRAFT')} className="px-4 py-2 text-slate-500 text-sm font-bold hover:text-indigo-600 transition-colors">Save Draft</button>
                            <button onClick={() => handleSave('ISSUED')} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-black uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">
                                <Save size={18} /> Issue Invoice
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Controls */}
                <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20">
                    <div className="flex border-b border-slate-200 bg-slate-50/50">
                        <button onClick={() => setSidebarTab('elements')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'elements' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>Layout Elements</button>
                        <button onClick={() => setSidebarTab('data')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'data' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>Invoice Data</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {sidebarTab === 'elements' && (
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Structure</h4>
                                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[11px] text-indigo-700 leading-relaxed">
                                        <strong>Real-time Designer:</strong> Most elements can be edited directly on the canvas. Drag blocks to reposition, or use the designer to modify the template.
                                    </div>
                                </div>
                            </div>
                        )}

                        {sidebarTab === 'data' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Client Selection</h4>
                                        <div className="flex flex-col gap-2">
                                            <select
                                                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={invoiceData.customerId || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const c = customers.find(cust => (cust.id === val || cust._id === val));
                                                    if (c) {
                                                        setInvoiceData(prev => ({
                                                            ...prev,
                                                            customerId: c.id || c._id,
                                                            customerName: c.name,
                                                            clientAddress: c.address
                                                        }));
                                                    }
                                                }}
                                            >
                                                <option value="">Select Existing Client...</option>
                                                {customers.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                                            </select>
                                            <button onClick={() => setShowCustomerModal(true)} className="w-full py-2.5 border border-dashed border-slate-300 text-slate-500 text-[10px] font-bold uppercase rounded-lg hover:border-indigo-500 hover:text-indigo-600 hover:bg-slate-50 transition-all">+ Quick Add Client</button>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Add Products</h4>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            onChange={(e) => {
                                                const p = inventory.find(inv => inv.id === e.target.value);
                                                if (p) {
                                                    const newItem = { description: p.name, quantity: 1, price: p.sellingPrice, total: p.sellingPrice, inventoryId: p.id };
                                                    handleUpdateData('items', [...(invoiceData.items || []), newItem]);
                                                }
                                            }}
                                        >
                                            <option value="">Choose Inventory Item...</option>
                                            {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name} (₹{inv.sellingPrice})</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Invoice Configuration</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Invoice Number</label>
                                                <input type="text" className="w-full bg-slate-50 border border-slate-200 p-2.5 text-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" value={invoiceData.invoiceNumber} onChange={e => handleUpdateData('invoiceNumber', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Invoice Date</label>
                                                <input type="date" className="w-full bg-slate-50 border border-slate-200 p-2.5 text-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" value={invoiceData.date} onChange={e => handleUpdateData('date', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Predefined Fields</h4>
                                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                            <p className="text-[10px] text-slate-500 italic leading-relaxed">
                                                Custom fields (like Tax ID, Status, etc.) are defined in the <strong>Template Designer</strong>.
                                                Fill their values directly on the invoice canvas.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                        }
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-200">
                        <div className="flex flex-col gap-1.5 mb-4">
                            <div className="flex justify-between text-xs text-slate-500 font-medium"><span>Subtotal</span><span>₹{calculateSubtotal().toFixed(2)}</span></div>
                            <div className="flex justify-between text-xs text-slate-500 font-medium"><span>Tax ({invoiceData.taxRate}%)</span><span>₹{tax.toFixed(2)}</span></div>
                        </div>
                        <div className="h-px bg-slate-200 mb-4 opacity-50"></div>
                        <div className="flex justify-between items-center text-slate-900 font-black text-xl">
                            <span>TOTAL</span>
                            <span className="text-indigo-600">₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Canvas Workspace */}
                <div className="flex-1 overflow-auto bg-slate-100/50 p-12 flex justify-center items-start relative custom-scrollbar">
                    {/* Visual Backdrop Effects */}
                    <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0,transparent_70%)]"></div>

                    <div className="relative group/canvas" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>

                        <div ref={canvasRef} className="shadow-[0_40px_120px_rgba(0,0,0,0.08)] transition-all duration-500 rounded-sm">
                            <InvoiceRenderer
                                editable={isEditing}
                                layout={activeLayout}
                                invoiceData={invoiceData}
                                companyConfig={companyConfig}
                                taxRate={invoiceData.taxRate}
                                calculateSubtotal={calculateSubtotal}
                                tax={tax}
                                total={total}
                                onUpdateData={handleUpdateData}
                                onUpdateConfig={handleUpdateConfig}
                                options={{ inventory }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Create Customer Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl shadow-slate-900/20 overflow-hidden animate-in zoom-in duration-300 border border-slate-100">

                        {/* Header */}
                        <div className="relative px-7 pt-7 pb-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 overflow-hidden">
                            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
                            <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full" />
                            <div className="relative flex items-center gap-4">
                                <div className="p-3 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20 shadow-inner">
                                    <Users size={22} className="text-white" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight">New Client</h2>
                                    <p className="text-indigo-200 text-xs font-medium mt-0.5">Fill in the client details below</p>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-7 py-6 space-y-5">
                            {/* Business Name */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    Business Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Acme Corp"
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-900 rounded-xl placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                    value={newCustomer.name}
                                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                />
                            </div>

                            {/* Phone + GSTIN side by side */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        Phone <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+91 98765 43210"
                                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-900 rounded-xl placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                        value={newCustomer.phone}
                                        onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        GSTIN
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="22AAAAA0000A1Z5"
                                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-900 rounded-xl placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium uppercase"
                                        value={newCustomer.taxId || ''}
                                        onChange={e => setNewCustomer({ ...newCustomer, taxId: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Business Address
                                </label>
                                <textarea
                                    placeholder="Street, City, State, ZIP"
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-900 rounded-xl placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none font-medium"
                                    rows={2}
                                    value={newCustomer.address}
                                    onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-7 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                            <button
                                onClick={() => setShowCustomerModal(false)}
                                className="px-5 py-2.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-slate-700 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const cid = localStorage.getItem('companyId');
                                        const res = await api.post('/customers', { companyId: cid, ...newCustomer });
                                        setCustomers([...customers, res.data]);
                                        handleUpdateData('customerId', res.data.id || res.data._id);
                                        handleUpdateData('customerName', res.data.name);
                                        handleUpdateData('clientAddress', res.data.address);
                                        setShowCustomerModal(false);
                                        toast.success("Client added!");
                                    } catch (e) { toast.error("Failed to add client"); }
                                }}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-black rounded-xl hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                            >
                                <Users size={15} />
                                Add &amp; Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
