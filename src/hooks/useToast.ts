import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext';
import type { ToastContextType } from '../contexts/ToastContext';

export function useToast(): ToastContextType {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast phải được sử dụng trong ToastProvider');
    }
    return context;
}
