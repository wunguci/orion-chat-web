import React, { useState } from 'react';
import { Unlock, Eye, EyeOff } from 'lucide-react';
import { Modal } from '../common/Modal';

interface RevealConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => Promise<void>;
    conversationName?: string;
}

export const RevealConversationModal: React.FC<
    RevealConversationModalProps
> = ({ isOpen, onClose, onConfirm, conversationName = 'Trò chuyện' }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        try {
            // Validation
            if (!password.trim()) {
                setError('Vui lòng nhập mật khẩu');
                return;
            }

            setLoading(true);
            setError(null);
            await onConfirm(password);
            onClose();
            resetForm();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Mật khẩu không chính xác',
            );
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setPassword('');
        setShowPassword(false);
    };

    const handleClose = () => {
        resetForm();
        setError(null);
        onClose();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleConfirm();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Tiết lộ trò chuyện"
            size="sm"
        >
            <div className="p-6 space-y-4">
                {/* Header description */}
                <div className="flex items-start gap-3">
                    <Unlock
                        size={20}
                        className="text-green-primary mt-1 shrink-0"
                    />
                    <p className="text-sm text-gray-600">
                        Trò chuyện <strong>"{conversationName}"</strong> đã bị
                        ẩn. Nhập mật khẩu để xem lại.
                    </p>
                </div>

                {/* Password input */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-primary">
                        Mật khẩu
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Nhập mật khẩu để tiết lộ"
                            disabled={loading}
                            autoFocus
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-green-primary bg-slate-50 disabled:opacity-50"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
                        >
                            {showPassword ? (
                                <EyeOff size={18} />
                            ) : (
                                <Eye size={18} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                        <p className="text-sm text-rose-600">{error}</p>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-gray-primary font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2 rounded-lg bg-green-primary text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Đang kiểm tra...
                            </>
                        ) : (
                            'Xác nhận'
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
