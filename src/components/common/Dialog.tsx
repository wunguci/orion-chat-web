import React from 'react';
import {
    MdDeleteForever,
    MdOutlineWarning,
    MdInfo,
    MdCheckCircle,
} from 'react-icons/md';

export type DialogType = 'danger' | 'warning' | 'info' | 'success';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: DialogType;
}

const typeConfigs = {
    danger: {
        icon: <MdDeleteForever />,
        bg: 'bg-rose-50',
        text: 'text-rose-500',
        btn: 'bg-rose-500 hover:bg-rose-600 shadow-rose-200',
    },
    warning: {
        icon: <MdOutlineWarning />,
        bg: 'bg-amber-50',
        text: 'text-amber-500',
        btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
    },
    info: {
        icon: <MdInfo />,
        bg: 'bg-sky-50',
        text: 'text-sky-500',
        btn: 'bg-sky-500 hover:bg-sky-600 shadow-sky-200',
    },
    success: {
        icon: <MdCheckCircle />,
        bg: 'bg-emerald-50',
        text: 'text-emerald-500',
        btn: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200',
    },
};

export const Dialog: React.FC<DialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    type = 'info',
    cancelText,
}) => {
    if (!isOpen) return null;

    const config = typeConfigs[type];
    const showCancelButton = cancelText !== undefined;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-up border border-slate-100">
                <div
                    className={`size-16 ${config.bg} ${config.text} rounded-2xl flex items-center justify-center mb-6 mx-auto`}
                >
                    <span className="material-symbols-outlined text-3xl">
                        {config.icon}
                    </span>
                </div>
                <h3 className="text-xl font-bold text-center text-slate-800 mb-2">
                    {title}
                </h3>
                <p className="text-slate-500 text-center text-sm leading-relaxed mb-8">
                    {message}
                </p>
                <div className={showCancelButton ? 'flex gap-3' : 'flex'}>
                    {showCancelButton && (
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={`${
                            showCancelButton ? 'flex-1' : 'w-full'
                        } py-3 px-4 rounded-xl font-bold text-white transition-all shadow-lg ${config.btn} active:scale-95 cursor-pointer`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
            <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
        </div>
    );
};
