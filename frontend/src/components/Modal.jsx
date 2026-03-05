import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-4xl' }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95`}>
                <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                        <div id="modal-header-actions"></div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden bg-slate-50 flex flex-col">
                    {children}
                </div>
            </div>
        </div>
    );
}
