import React, { useState } from 'react';
import { Ban, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';

interface BlockUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    userName?: string;
}

export const BlockUserModal: React.FC<BlockUserModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    userName = 'user',
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        try {
            setLoading(true);
            setError(null);
            await onConfirm();
            onClose();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Error blocking user',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Block user"
            size="sm"
        >
            <div className="p-6 space-y-4">
                {/* Warning icon and message */}
                <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                    <div className="p-2 bg-rose-100 rounded-lg mt-1 shrink-0">
                        <Ban size={20} className="text-rose-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-rose-900">
                            Block <strong>{userName}</strong>?
                        </p>
                        <p className="text-xs text-rose-700 mt-1">
                            After blocking, you will not be able to message or view activities of this user.
                        </p>
                    </div>
                </div>

                {/* What happens when you block */}
                <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-900 flex items-center gap-2">
                        <AlertCircle size={14} />
                        When you block a user:
                    </p>
                    <ul className="text-xs text-blue-800 space-y-1 ml-6">
                        <li>• This person cannot message you</li>
                        <li>• You cannot send messages to them</li>
                        <li>• ChatInput will be disabled</li>
                        <li>• You can unblock at any time</li>
                    </ul>
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
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-gray-primary font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2 rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Blocking...
                            </>
                        ) : (
                            <>
                                <Ban size={16} />
                                Block user
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
