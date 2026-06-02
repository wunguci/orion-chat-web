import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';

interface ClearHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    messageCount?: number;
}

export const ClearHistoryModal: React.FC<ClearHistoryModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState(false);

    const handleConfirm = async () => {
        if (!confirmed) {
            setError('Please check the box to confirm');
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
                err instanceof Error ? err.message : 'Error clearing chat history',
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Clear chat history"
            size="sm"
        >
            <div className="p-6 space-y-4">
                {/* Warning icon and message */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="p-2 bg-amber-100 rounded-lg mt-1 shrink-0">
                        <Trash2 size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-amber-900">
                            This action cannot be undone
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                            All messages in this chat will be deleted.
                        </p>
                    </div>
                </div>

                {/* Confirmation checkbox */}
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
                        I understand and want to clear history
                    </span>
                </label>

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
                        disabled={loading || !confirmed}
                        className="flex-1 px-4 py-2 rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Clearing...
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Clear
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
