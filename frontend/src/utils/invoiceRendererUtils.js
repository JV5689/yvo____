import React from 'react';

export const mmToPx = 3.7795275591;
export const A4_WIDTH_PX = 210 * mmToPx;
export const A4_HEIGHT_PX = 297 * mmToPx;

export const generateBlockId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const renderBlock = (block, data, options = {}) => {
    const {
        invoiceData,
        companyConfig,
        taxRate,
        calculateSubtotal,
        tax,
        total,
    } = data;

    const { isDesigner = false, editable = false, onUpdateData = () => { }, onUpdateConfig = () => { } } = options;

    const { fontSize = 14, fontWeight = 'normal', textAlign = 'left', color = '#1e293b', backgroundColor = 'transparent', text = '' } = block.config || {};

    const customStyle = {
        fontSize: `${fontSize}px`,
        fontWeight: fontWeight,
        textAlign: textAlign,
        color: color,
        backgroundColor: backgroundColor,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        outline: (editable || isDesigner) ? '1px dashed rgba(99, 102, 241, 0.2)' : 'none',
    };

    const EditableText = ({ value, onSave, multiline = false, className = '' }) => {
        const [draft, setDraft] = React.useState(value ?? '');
        React.useEffect(() => { setDraft(value ?? ''); }, [value]);

        if (!editable) return <div className={className} style={{ whiteSpace: 'pre-wrap' }}>{value}</div>;

        if (multiline) {
            return (
                <textarea
                    className={`w-full bg-transparent outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1 resize-none transition-all ${className}`}
                    style={{ minHeight: '2em' }}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onBlur={() => onSave(draft)}
                />
            );
        }
        return (
            <input
                type="text"
                className={`w-full bg-transparent outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1 transition-all ${className}`}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={() => onSave(draft)}
            />
        );
    };

    switch (block.type) {
        case 'STATIC_TEXT':
        case 'INVOICE_TITLE_LABEL':
        case 'BILL_TO_LABEL':
        case 'NOTES_LABEL':
            return (
                <div style={customStyle}>
                    <EditableText
                        value={text}
                        onSave={(val) => onUpdateConfig(block.id, 'text', val)}
                    />
                </div>
            );
        case 'COMPANY_NAME':
            return <div style={customStyle}>{companyConfig?.name || 'YVO'}</div>;
        case 'COMPANY_DETAILS':
            return (
                <div style={customStyle}>
                    {companyConfig?.address || 'Your Business Address'}<br />
                    {companyConfig?.email && <>{companyConfig.email}<br /></>}
                    {companyConfig?.phone && <>{companyConfig.phone}<br /></>}
                    {companyConfig?.website && <>{companyConfig.website}</>}
                </div>
            );
        case 'CUSTOMER_DETAILS':
            return (
                <div style={customStyle}>
                    <div style={{ fontWeight: 'bold' }}>
                        <EditableText
                            value={invoiceData.customerName || 'Customer Name'}
                            onSave={(val) => onUpdateData('customerName', val)}
                        />
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                        <EditableText
                            value={invoiceData.clientAddress || 'Client Address...'}
                            onSave={(val) => onUpdateData('clientAddress', val)}
                        />
                    </div>
                    {invoiceData.gstNumber && (
                        <div style={{ marginTop: '8px' }}>
                            <span style={{ fontWeight: '600' }}>GSTIN: </span>
                            <EditableText
                                value={invoiceData.gstNumber}
                                onSave={(val) => onUpdateData('gstNumber', val)}
                                className="inline-block"
                            />
                        </div>
                    )}
                </div>
            );
        case 'INVOICE_DETAILS':
            return (
                <div style={customStyle}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold uppercase opacity-80 text-[0.8em] mr-2">Invoice #</span>
                        <EditableText
                            value={invoiceData.invoiceNumber}
                            onSave={(val) => onUpdateData('invoiceNumber', val)}
                        />
                    </div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold uppercase opacity-80 text-[0.8em] mr-2">Date</span>
                        <input
                            type="date"
                            className={`bg-transparent outline-none border-b border-transparent focus:border-indigo-300 text-right ${editable ? '' : 'pointer-events-none'}`}
                            value={invoiceData.date || ''}
                            onChange={(e) => onUpdateData('date', e.target.value)}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold uppercase opacity-80 text-[0.8em]">Status</span>
                        <span className={`px-2 py-0.5 rounded text-[0.85em] font-bold ${invoiceData.status === 'ISSUED' ? 'bg-indigo-100 text-indigo-700' : invoiceData.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'}`}>
                            {invoiceData.status}
                        </span>
                    </div>
                </div>
            );
        case 'INVOICE_NUMBER_VAL':
            return (
                <div style={customStyle}>
                    <EditableText
                        value={invoiceData.invoiceNumber}
                        onSave={(val) => onUpdateData('invoiceNumber', val)}
                    />
                </div>
            );
        case 'INVOICE_DATE_VAL':
            return (
                <div style={customStyle}>
                    <input
                        type="date"
                        className={`bg-transparent outline-none border-none focus:ring-1 focus:ring-indigo-300 rounded ${editable ? '' : 'pointer-events-none'}`}
                        style={{ textAlign: textAlign, width: '100%', color: 'inherit', fontWeight: 'inherit', fontSize: 'inherit' }}
                        value={invoiceData.date || ''}
                        onChange={(e) => onUpdateData('date', e.target.value)}
                    />
                </div>
            );
        case 'INVOICE_STATUS_VAL':
            return (
                <div style={customStyle}>
                    <span className={`px-2 py-0.5 rounded text-[0.85em] font-bold inline-block mx-auto ${invoiceData.status === 'ISSUED' ? 'bg-indigo-100 text-indigo-700' : invoiceData.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'}`}>
                        {invoiceData.status}
                    </span>
                </div>
            );
        case 'CLIENT_NAME_VAL':
            return (
                <div style={customStyle}>
                    <EditableText
                        value={invoiceData.customerName || 'Customer Name'}
                        onSave={(val) => onUpdateData('customerName', val)}
                    />
                </div>
            );
        case 'CLIENT_ADDRESS_VAL':
            return (
                <div style={{ ...customStyle, whiteSpace: 'pre-wrap' }}>
                    <EditableText
                        value={invoiceData.clientAddress || 'Client Address...'}
                        onSave={(val) => onUpdateData('clientAddress', val)}
                    />
                </div>
            );
        case 'CLIENT_GST_VAL':
            return (
                <div style={customStyle}>
                    <EditableText
                        value={invoiceData.gstNumber || 'GSTIN...'}
                        onSave={(val) => onUpdateData('gstNumber', val)}
                    />
                </div>
            );
        case 'LOGO':
            return (
                <div style={{ ...customStyle, display: 'flex', alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start', justifyContent: 'center' }}>
                    {companyConfig?.logo ? (
                        <img src={companyConfig.logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs rounded border border-slate-200">
                            No Logo
                        </div>
                    )}
                </div>
            );
        case 'ITEMS_TABLE': {
            const columns = block.config?.columns || [
                { id: 'col_desc', key: 'description', label: 'Item Description', align: 'left', width: 'auto' },
                { id: 'col_qty', key: 'quantity', label: 'Qty', align: 'center', width: '80px' },
                { id: 'col_price', key: 'price', label: 'Price', align: 'right', isCurrency: true, width: '120px' },
                { id: 'col_total', key: 'total', label: 'Total', align: 'right', isCurrency: true, width: '120px' }
            ];

            return (
                <div style={{ ...customStyle, overflow: 'visible' }}>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-800 text-white">
                                {columns.map(col => (
                                    <th key={col.id} className={`py-2 px-3 text-${col.align} font-semibold text-sm`} style={{ width: col.width || 'auto' }}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100" style={{ backgroundColor: 'inherit' }}>
                            {(invoiceData.items || []).map((item, i) => (
                                <tr key={i} className="border-b group" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                    {columns.map(col => (
                                        <td key={col.id} className={`py-3 px-3 text-sm text-${col.align} ${col.key === 'description' ? 'font-medium' : ''} ${col.key === 'total' ? 'font-bold' : ''}`}>
                                            {col.key === 'total' ? (
                                                <span className="font-bold">₹{(item.total || 0).toFixed(2)}</span>
                                            ) : editable ? (
                                                <div className="relative">
                                                    <input
                                                        type={typeof item[col.key] === 'number' ? 'number' : 'text'}
                                                        className="w-full bg-transparent border-b border-transparent focus:border-indigo-300 outline-none p-1"
                                                        value={item[col.key] || ''}
                                                        onChange={(e) => {
                                                            const newVal = typeof item[col.key] === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                                                            const newItems = [...invoiceData.items];
                                                            newItems[i] = { ...item, [col.key]: newVal };

                                                            if (col.key === 'price' || col.key === 'quantity') {
                                                                newItems[i].total = (newItems[i].price || 0) * (newItems[i].quantity || 0);
                                                            }
                                                            onUpdateData('items', newItems);
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    {col.isCurrency ? '₹' : ''}
                                                    {typeof item[col.key] === 'number' && col.isCurrency ? item[col.key].toFixed(2) : (item[col.key] || '')}
                                                </>
                                            )}
                                        </td>
                                    ))}
                                    {editable && (
                                        <td className="w-8 opacity-0 group-hover:opacity-100 text-right pr-2">
                                            <button
                                                onClick={() => {
                                                    const newItems = (invoiceData.items || []).filter((_, idx) => idx !== i);
                                                    onUpdateData('items', newItems);
                                                }}
                                                className="text-red-400 hover:text-red-600"
                                            >✕</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {editable && (
                                <tr>
                                    <td colSpan={columns.length} className="py-2 px-3">
                                        <button
                                            onClick={() => {
                                                const newItem = { description: 'New Item', quantity: 1, price: 0, total: 0 };
                                                onUpdateData('items', [...invoiceData.items, newItem]);
                                            }}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase tracking-wider"
                                        >
                                            <span className="text-lg">+</span> Add Item Line
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            );
        }
        case 'TOTALS':
            return (
                <div style={{ ...customStyle, justifyContent: 'flex-start' }}>
                    <div className="bg-slate-50 p-4 rounded border border-slate-100 flex flex-col gap-2">
                        <div className="flex justify-between text-sm">
                            <span className="opacity-80">Subtotal</span>
                            <span className="font-semibold">₹{calculateSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                            <span className="opacity-80">Tax (%)</span>
                            {editable ? (
                                <input
                                    type="number"
                                    className="w-16 bg-white border border-slate-200 rounded px-1 text-right text-xs"
                                    value={taxRate}
                                    onChange={(e) => onUpdateData('taxRate', parseFloat(e.target.value) || 0)}
                                />
                            ) : (
                                <span className="font-semibold">{taxRate}%</span>
                            )}
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="opacity-80">Tax (Calculated)</span>
                            <span className="font-semibold">₹{tax.toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-slate-200 my-1"></div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold">Grand Total</span>
                            <span className="text-lg font-bold">₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            );
        case 'NOTES_CONTENT':
            return (
                <div style={customStyle}>
                    <EditableText
                        value={typeof invoiceData.notes === 'string' ? invoiceData.notes : 'Thank you for your business!'}
                        onSave={(val) => onUpdateData('notes', val)}
                        className="whitespace-pre-wrap"
                    />
                </div>
            );
        case 'CUSTOM_ATTRIBUTES':
            return (
                <div style={{ ...customStyle }} className="grid grid-cols-2 gap-3 relative">
                    {invoiceData.customAttributes && invoiceData.customAttributes.length > 0 ? (
                        invoiceData.customAttributes.map((attr, idx) => (
                            <div key={idx} className="flex flex-col bg-slate-50 p-2 rounded border border-slate-100 group relative">
                                {editable && (
                                    <button
                                        onClick={() => {
                                            const newAttrs = invoiceData.customAttributes.filter((_, i) => i !== idx);
                                            onUpdateData('customAttributes', newAttrs);
                                        }}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] items-center justify-center hidden group-hover:flex"
                                    >✕</button>
                                )}
                                <span className="text-[0.7rem] font-bold uppercase opacity-70 tracking-wider">
                                    {isDesigner ? (
                                        <EditableText
                                            value={attr.key}
                                            onSave={(val) => {
                                                const newAttrs = [...invoiceData.customAttributes];
                                                newAttrs[idx].key = val;
                                                onUpdateData('customAttributes', newAttrs);
                                            }}
                                        />
                                    ) : (
                                        <span>{attr.key}</span>
                                    )}
                                </span>
                                <span className="text-sm font-medium break-all">
                                    <EditableText
                                        value={attr.value}
                                        onSave={(val) => {
                                            const newAttrs = [...invoiceData.customAttributes];
                                            newAttrs[idx].value = val;
                                            onUpdateData('customAttributes', newAttrs);
                                        }}
                                    />
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 text-sm opacity-50 border border-dashed border-slate-200 p-2 rounded text-center">
                            No Custom Attributes Configured in Template
                        </div>
                    )}
                </div>
            );
        default:
            return <div style={{ ...customStyle, border: '1px solid red', color: 'red' }}>Unknown: {block.type}</div>;
    }
};
