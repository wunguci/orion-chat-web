import React from 'react';

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

export interface ToastContextType {
    showToast: (
        message: string,
        type?: 'success' | 'error' | 'warning' | 'info',
        duration?: number,
    ) => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(
    undefined,
);
