import React, { createContext, useContext, useCallback } from 'react';
import Swal from 'sweetalert2';

const UIContext = createContext();

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within a UIProvider');
    return context;
};

const typeToIcon = { success: 'success', error: 'error', warning: 'warning', info: 'info', danger: 'warning' };

const PREMIUM_CLASSES = {
    popup: 'swal-premium-popup',
    title: 'swal-premium-title',
    htmlContainer: 'swal-premium-content',
    confirmButton: 'swal-premium-confirm',
    cancelButton: 'swal-premium-cancel',
};

export const UIProvider = ({ children }) => {

    const alert = useCallback((title, message, type = 'info') => {
        return Swal.fire({
            title,
            html: message,
            icon: typeToIcon[type] || 'info',
            confirmButtonText: 'OK',
            customClass: PREMIUM_CLASSES,
            buttonsStyling: false,
        }).then(() => undefined);
    }, []);

    const confirm = useCallback((title, message, confirmText = 'Confirm', variant = 'danger') => {
        const isDestructive = variant === 'danger';
        return Swal.fire({
            title,
            html: message,
            icon: isDestructive ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: 'Cancel',
            customClass: PREMIUM_CLASSES,
            buttonsStyling: false,
            reverseButtons: true,
        }).then(result => result.isConfirmed);
    }, []);

    const prompt = useCallback((title, message, inputType = 'text', confirmText = 'Submit') => {
        return Swal.fire({
            title,
            html: message,
            input: inputType === 'password' ? 'password' : 'text',
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: 'Cancel',
            customClass: PREMIUM_CLASSES,
            buttonsStyling: false,
            reverseButtons: true,
        }).then(result => result.isConfirmed ? result.value : null);
    }, []);

    const toast = useCallback((title, type = 'success') => {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            customClass: {
                popup: 'swal-premium-toast',
            },
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
        return Toast.fire({
            icon: type,
            title: title
        });
    }, []);

    return (
        <UIContext.Provider value={{
            alert,
            confirm,
            prompt,
            toast: {
                success: (msg) => toast(msg, 'success'),
                error: (msg) => toast(msg, 'error'),
                info: (msg) => toast(msg, 'info'),
                warning: (msg) => toast(msg, 'warning'),
            },
            modalConfig: null
        }}>
            {children}
        </UIContext.Provider>
    );
};
