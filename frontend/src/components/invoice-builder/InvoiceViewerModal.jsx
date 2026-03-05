import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import InvoiceRenderer from './InvoiceRenderer';
import Modal from '../Modal';
import InvoiceBuilder from '../../pages/modules/InvoiceBuilder';
import { useUI } from '../../context/UIContext';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import { Download, Edit, Loader2, AlertCircle } from 'lucide-react';
import { injectPdfColorFix } from '../../utils/pdfColorFix';

export default function InvoiceViewerModal({ invoiceId, isOpen, onClose, onEdited }) {
    const { alert: uiAlert, prompt } = useUI();
    const { config } = useOutletContext() || {};
    const [invoice, setInvoice] = useState(null);
    const [layout, setLayout] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditor, setShowEditor] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const pdfRef = useRef(null);

    useEffect(() => {
        if (!invoiceId || !isOpen) return;
        setLoading(true);
        setShowEditor(false);
        setInvoice(null);
        setLayout([]);
        setError(null);

        const loadInvoice = async () => {
            try {
                const invRes = await api.get(`/invoices/${invoiceId}`);
                const data = invRes.data;
                setInvoice(data);

                // Use invoice's stored layout if it has one
                if (data.layout && Array.isArray(data.layout) && data.layout.length > 0) {
                    setLayout(data.layout);
                } else if (data.templateId) {
                    // Fallback: fetch the template's layout
                    try {
                        const companyId = localStorage.getItem('companyId');
                        const templatesRes = await api.get('/invoice-templates', { params: { companyId } });
                        const template = templatesRes.data.find(t => (t.id || t._id) === data.templateId);
                        if (template?.layout?.length > 0) {
                            setLayout(template.layout);
                        }
                    } catch {
                        // Template fetch failed, layout stays empty
                    }
                }
            } catch {
                setError('Failed to load invoice');
                toast.error('Failed to load invoice');
            } finally {
                setLoading(false);
            }
        };

        loadInvoice();
    }, [invoiceId, isOpen]);

    const calculateSubtotal = () => (invoice?.items || []).reduce((s, i) => s + (i.total || 0), 0);
    const subtotal = invoice ? calculateSubtotal() : 0;
    const tax = invoice ? subtotal * ((invoice.taxRate || 0) / 100) : 0;
    const total = subtotal + tax;

    const rendererProps = {
        editable: false,
        layout,
        invoiceData: invoice || {},
        companyConfig: config?.company,
        taxRate: invoice?.taxRate || 10,
        calculateSubtotal,
        tax,
        total,
        onUpdateData: () => { },
        onUpdateConfig: () => { },
    };

    const handleDownload = async () => {
        if (!invoice) return toast.error('Invoice not loaded yet');
        setDownloading(true);
        try {
            toast.loading('Generating PDF…', { id: 'pdf-dl' });

            const el = pdfRef.current;
            if (!el) throw new Error('PDF element not found');

            // Use injectPdfColorFix to replace Tailwind oklch colors with hex in the cloned doc
            await html2pdf().set({
                margin: 0,
                filename: `Invoice-${invoice.invoiceNumber || 'draft'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    width: 794,
                    windowWidth: 794,
                    onclone: (clonedDoc) => injectPdfColorFix(clonedDoc),
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(el).save();

            toast.success('Downloaded!', { id: 'pdf-dl' });
        } catch (e) {
            console.error('PDF error:', e);
            toast.error(`PDF failed: ${e.message || 'unknown error'}`, { id: 'pdf-dl' });
        } finally {
            setDownloading(false);
        }
    };

    const handleEditClick = async () => {
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
                await uiAlert('Access Denied', 'Incorrect Password! You cannot edit this invoice.', 'error');
                return;
            }
            setShowEditor(true);
        } catch {
            await uiAlert('Error', 'Password verification failed.', 'error');
        }
    };

    // --- Full editor after password verified ---
    if (showEditor) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Edit Invoice" maxWidth="max-w-7xl">
                <InvoiceBuilder
                    invoiceId={invoiceId}
                    startEditing={true}
                    onClose={() => {
                        setShowEditor(false);
                        onClose();
                        if (onEdited) onEdited();
                    }}
                />
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white rounded-t-xl">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">
                        {invoice ? `Invoice #${invoice.invoiceNumber}` : loading ? 'Loading…' : 'Invoice'}
                    </h2>
                    {invoice && (
                        <p className="text-xs text-slate-400 mt-0.5">
                            {invoice.customerName} &bull; {new Date(invoice.date).toLocaleDateString('en-IN')}
                            {invoice.grandTotal != null && ` • ₹${invoice.grandTotal.toFixed(2)}`}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        disabled={!invoice || loading || downloading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-40"
                    >
                        <Download size={15} />
                        {downloading ? 'Generating…' : 'Download PDF'}
                    </button>
                    <button
                        onClick={handleEditClick}
                        disabled={!invoice || loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all active:scale-95 disabled:opacity-40"
                    >
                        <Edit size={15} /> Edit Invoice
                    </button>
                </div>
            </div>

            {/* Hidden full-scale element used ONLY for PDF — not visible but in DOM */}
            {invoice && (
                <div
                    style={{
                        position: 'fixed',
                        top: '-9999px',
                        left: '-9999px',
                        width: '794px',
                        zIndex: -9999,
                        pointerEvents: 'none',
                        visibility: 'hidden',
                    }}
                    aria-hidden="true"
                >
                    <div ref={pdfRef}>
                        <InvoiceRenderer {...rendererProps} />
                    </div>
                </div>
            )}

            {/* Scaled visual preview */}
            <div className="overflow-auto bg-slate-100 p-6 flex justify-center" style={{ minHeight: '60vh' }}>
                {loading ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-20">
                        <Loader2 size={32} className="animate-spin" />
                        <span className="text-sm font-medium">Loading invoice…</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center text-red-400 gap-3 py-20">
                        <AlertCircle size={32} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                ) : invoice ? (
                    <>
                        {layout.length === 0 && (
                            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-lg z-10 whitespace-nowrap">
                                ⚠️ No template layout — open Edit to assign one
                            </div>
                        )}
                        <div style={{ transform: 'scale(0.75)', transformOrigin: 'top center', marginBottom: '-25%' }}>
                            <div className="shadow-xl rounded-sm bg-white">
                                <InvoiceRenderer {...rendererProps} />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-slate-400 text-sm py-20">Could not load invoice data.</div>
                )}
            </div>

            {/* Summary strip when no template blocks */}
            {invoice && layout.length === 0 && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Invoice Summary</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-slate-400">Customer:</span> <span className="font-semibold text-slate-700">{invoice.customerName}</span></div>
                        <div><span className="text-slate-400">Invoice #:</span> <span className="font-semibold text-slate-700">{invoice.invoiceNumber}</span></div>
                        <div><span className="text-slate-400">Date:</span> <span className="font-semibold text-slate-700">{new Date(invoice.date).toLocaleDateString('en-IN')}</span></div>
                        <div><span className="text-slate-400">Total:</span> <span className="font-semibold text-indigo-600">₹{(invoice.grandTotal || total).toFixed(2)}</span></div>
                    </div>
                    {(invoice.items || []).length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Items</p>
                            <div className="space-y-1">
                                {invoice.items.map((item, i) => (
                                    <div key={i} className="flex justify-between text-xs text-slate-600">
                                        <span>{item.description} × {item.quantity}</span>
                                        <span className="font-semibold">₹{(item.total || 0).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
