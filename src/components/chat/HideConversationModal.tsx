import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Modal } from '../common/Modal';

interface HideConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => Promise<void>;
}

export const HideConversationModal: React.FC<HideConversationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
}) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        try {
            // Validation
            if (!password.trim()) {
                setError('Please enter password');
                return;
            }

            if (password.length < 4) {
                setError('Password must be at least 4 characters');
                return;
            }

            if (password !== confirmPassword) {
                setError('Confirm password not match');
                return;
            }

            setLoading(true);
            setError(null);
            await onConfirm(password);
            onClose();
            resetForm();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Error when hiding chat',
            );
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleClose = () => {
        resetForm();
        setError(null);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Hide chat"
            size="sm"
        >
            <div className="p-6 space-y-4">
                {/* Header description */}
                <div className="flex items-start gap-3">
                    <Lock
                        size={20}
                        className="text-green-primary mt-1 shrink-0"
                    />
                    <p className="text-sm text-gray-600">
                        This chat will be hidden. You need to enter the correct password to view it.
                    </p>
                </div>

                {/* Password input */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-primary">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password (at least 4 characters)"
                            disabled={loading}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-green-primary bg-slate-50 disabled:opacity-50"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 cursor-pointer"
                        >
                            {showPassword ? (
                                <EyeOff size={18} />
                            ) : (
                                <Eye size={18} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Confirm password input */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-primary">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            disabled={loading}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-green-primary bg-slate-50 disabled:opacity-50"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
                        >
                            {showConfirmPassword ? (
                                <EyeOff size={18} />
                            ) : (
                                <Eye size={18} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Password strength hint */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-600">
                        <strong>Tip:</strong> Use a strong password to protect your privacy.
                    </p>
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
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2 rounded-lg bg-green-primary text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Hiding...
                            </>
                        ) : (
                            'Confirm'
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
