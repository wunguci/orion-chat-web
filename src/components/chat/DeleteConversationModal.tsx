import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';

interface DeleteConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    conversationName?: string;
}

export const DeleteConversationModal: React.FC<DeleteConversationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    conversationName,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState(false);

    const handleConfirm = async () => {
        if (!confirmed) {
            setError('Please confirm by checking the checkbox');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await onConfirm();
            onClose();
            setConfirmed(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Error deleting conversation',
            );
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setConfirmed(false);
        setError(null);
        onClose();
    };

    const nameLabel = conversationName ? `with ${conversationName}` : '';

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Delete conversation"
            size="sm"
        >
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                    <div className="p-2 bg-rose-100 rounded-lg mt-1 shrink-0">
                        <Trash2 size={20} className="text-rose-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-rose-900">
                            Delete conversation {nameLabel}
                        </p>
                        <p className="text-xs text-rose-700 mt-1">
                            You will no longer see this conversation in the list. If you want to chat again, you need to create a new conversation.
                        </p>
                    </div>
                </div>

                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                    <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => {
                            setConfirmed(e.target.checked);
                            if (e.target.checked) {
                                setError(null);
                            }
                        }}
                        disabled={loading}
                        className="w-5 h-5 rounded accent-rose-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-primary font-medium">
                        I understand and want to delete this conversation
                    </span>
                </label>

                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                        <p className="text-sm text-rose-600">{error}</p>
                    </div>
                )}

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
                        disabled={loading || !confirmed}
                        className="flex-1 px-4 py-2 rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Delete
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
