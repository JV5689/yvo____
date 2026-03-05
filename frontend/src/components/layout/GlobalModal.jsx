import React, { useState } from 'react';
import { useUI } from '../../context/UIContext';
import { AlertCircle, CheckCircle2, Info, X, HelpCircle, Lock } from 'lucide-react';

const GlobalModal = () => {
    const { modalConfig } = useUI();
    const [inputValue, setInputValue] = useState('');

    const [prevModal, setPrevModal] = useState(modalConfig);
    if (modalConfig !== prevModal) {
        setPrevModal(modalConfig);
        if (modalConfig?.type === 'prompt') {
            setInputValue('');
        }
    }

    if (!modalConfig) return null;

    const { type, inputType, title, message, alertType, confirmText, variant, onConfirm, onCancel, onClose } = modalConfig;

    const getIcon = () => {
        if (type === 'prompt') return <Lock className="text-indigo-500" size={32} />;
        if (type === 'confirm') return <HelpCircle className="text-amber-500" size={32} />;
        switch (alertType) {
            case 'success': return <CheckCircle2 className="text-emerald-500" size={32} />;
            case 'error': return <AlertCircle className="text-rose-500" size={32} />;
            default: return <Info className="text-indigo-500" size={32} />;
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={type === 'alert' ? onClose : onCancel}
            ></div>

            {/* Modal Card */}
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className="p-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 p-4 bg-slate-50 rounded-2xl">
                            {getIcon()}
                        </div>

                        <h3 className="text-xl font-extrabold text-slate-800 mb-2 tracking-tight">
                            {title}
                        </h3>

                        <p className="text-slate-500 leading-relaxed">
                            {message}
                        </p>
                    </div>

                    <div className="mt-8 flex flex-col gap-3">
                        {type === 'prompt' ? (
                            <>
                                <input
                                    type={inputType || 'text'}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    // Submit on enter
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') onConfirm(inputValue);
                                    }}
                                    className="w-full p-4 mb-2 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all text-sm font-medium"
                                    placeholder={inputType === 'password' ? '••••••••' : 'Enter value...'}
                                    autoFocus
                                />
                                <button
                                    onClick={() => onConfirm(inputValue)}
                                    className={`w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${variant === 'danger'
                                        ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                                        }`}
                                >
                                    {confirmText || 'Submit'}
                                </button>
                                <button
                                    onClick={onCancel}
                                    className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : type === 'confirm' ? (
                            <>
                                <button
                                    onClick={onConfirm}
                                    className={`w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${variant === 'danger'
                                        ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                                        }`}
                                >
                                    {confirmText || 'Confirm'}
                                </button>
                                <button
                                    onClick={onCancel}
                                    className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95"
                            >
                                Got it
                            </button>
                        )}
                    </div>
                </div>

                {/* Decorative border at top */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${type === 'confirm' ? 'bg-amber-400' :
                    type === 'prompt' ? 'bg-indigo-400' :
                        alertType === 'success' ? 'bg-emerald-400' :
                            alertType === 'error' ? 'bg-rose-400' : 'bg-indigo-400'
                    }`}></div>
            </div>
        </div>
    );
};

export default GlobalModal;
