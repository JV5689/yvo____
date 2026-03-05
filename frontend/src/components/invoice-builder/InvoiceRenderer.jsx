import React from 'react';
import { A4_WIDTH_PX, A4_HEIGHT_PX, renderBlock } from '../../utils/invoiceRendererUtils';

export default function InvoiceRenderer({ layout, invoiceData, companyConfig, taxRate, calculateSubtotal, tax, total, editable = false, onUpdateData, onUpdateConfig, options }) {
    const activeLayout = layout && layout.length > 0 ? layout : [];
    const dataPayload = { invoiceData, companyConfig, taxRate, calculateSubtotal, tax, total, inventory: options?.inventory || [] };

    return (
        <div
            className="bg-white shadow-2xl relative text-slate-900 print:shadow-none print:w-[210mm] print:h-[297mm] overflow-hidden"
            style={{ width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px` }}
        >
            {/* Top Accent Bar */}
            <div className="h-4 w-full bg-indigo-900 absolute top-0 left-0"></div>

            {/* Render Canvas Elements via absolute positioning */}
            {activeLayout.map(block => (
                <div
                    key={block.id}
                    className="canvas-block-wrapper"
                    style={{
                        position: 'absolute',
                        left: `${block.config.x}px`,
                        top: `${block.config.y}px`,
                        width: `${block.config.width}px`,
                        height: `${block.config.height}px`,
                        zIndex: block.type === 'ITEMS_TABLE' ? 5 : 10
                    }}
                >
                    {renderBlock(block, dataPayload, {
                        isDesigner: false,
                        editable,
                        onUpdateData,
                        onUpdateConfig,
                        inventory: dataPayload.inventory
                    })}
                </div>
            ))}
        </div>
    );
}
