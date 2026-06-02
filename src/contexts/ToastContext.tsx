import React, { createContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

export interface ToastContextType {
    showToast: (
        message: string,
        type?: 'success' | 'error' | 'warning' | 'info',
        duration?: number,
    ) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastItemProps {
    toast: ToastMessage;
    onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
    const { id, message, type, duration = 4000 } = toast;
    const [progress, setProgress] = useState(100);
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(id);
        }, 300); // Wait for slide-out animation
    }, [id, onClose]);

    // Progress bar and auto-close timer
    useEffect(() => {
        const intervalTime = 20;
        const totalSteps = duration / intervalTime;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep += 1;
            const newProgress = Math.max(0, 100 - (currentStep / totalSteps) * 100);
            setProgress(newProgress);

            if (currentStep >= totalSteps) {
                clearInterval(timer);
                handleClose();
            }
        }, intervalTime);

        return () => {
            clearInterval(timer);
        };
    }, [duration, handleClose]);

    // Icon SVGs
    const renderIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-5 h-5 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            case 'info':
            default:
                return (
                    <svg className="w-5 h-5 text-sky-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    // Styling configurations based on Toast type
    const styles = {
        success: {
            border: 'border-emerald-500/30 dark:border-emerald-500/20',
            glow: 'shadow-emerald-500/5 ring-1 ring-emerald-500/10',
            progressBg: 'bg-emerald-500',
            badgeBg: 'bg-emerald-50 dark:bg-emerald-950/30'
        },
        error: {
            border: 'border-rose-500/30 dark:border-rose-500/20',
            glow: 'shadow-rose-500/5 ring-1 ring-rose-500/10',
            progressBg: 'bg-rose-500',
            badgeBg: 'bg-rose-50 dark:bg-rose-950/30'
        },
        warning: {
            border: 'border-amber-500/30 dark:border-amber-500/20',
            glow: 'shadow-amber-500/5 ring-1 ring-amber-500/10',
            progressBg: 'bg-amber-500',
            badgeBg: 'bg-amber-50 dark:bg-amber-950/30'
        },
        info: {
            border: 'border-sky-500/30 dark:border-sky-500/20',
            glow: 'shadow-sky-500/5 ring-1 ring-sky-500/10',
            progressBg: 'bg-sky-500',
            badgeBg: 'bg-sky-50 dark:bg-sky-950/30'
        }
    }[type];

    return (
        <div
            className={`
                relative overflow-hidden pointer-events-auto w-full max-w-sm
                backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 
                border ${styles.border} ${styles.glow} rounded-xl shadow-xl
                flex flex-col transform transition-all duration-300 ease-out
                ${isExiting ? 'opacity-0 translate-x-12 scale-95' : 'opacity-100 translate-x-0 scale-100 animate-slide-in'}
            `}
            style={{
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            }}
        >
            <div className="flex items-start p-4 gap-3">
                {/* Icon Container */}
                <div className={`p-1.5 rounded-lg ${styles.badgeBg}`}>
                    {renderIcon()}
                </div>

                {/* Message text */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 break-words leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Countdown Progress Bar */}
            <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800/40">
                <div 
                    className={`h-full ${styles.progressBg} transition-all duration-200 ease-out`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((
        message: string,
        type: 'success' | 'error' | 'warning' | 'info' = 'info',
        duration: number = 4000
    ) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes toast-slide-in {
                    from {
                        transform: translateX(120%) scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0) scale(1);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: toast-slide-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            ` }} />
            {/* Toast Floating Container */}
            <div 
                className="fixed top-4 right-4 z-[99999] flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none"
                style={{
                    maxHeight: '100vh',
                    overflowY: 'auto',
                }}
            >
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
