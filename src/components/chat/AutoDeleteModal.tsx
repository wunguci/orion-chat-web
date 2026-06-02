import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Modal } from '../common/Modal';

interface AutoDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDuration?: number;
    onConfirm: (duration: number) => Promise<void>;
}

const DELETE_OPTIONS = [
    { label: 'Never', value: 0 },
    { label: 'After 1 day', value: 1 },
    { label: 'After 7 days', value: 7 },
    { label: 'After 30 days', value: 30 },
];

export const AutoDeleteModal: React.FC<AutoDeleteModalProps> = ({
    isOpen,
    onClose,
    currentDuration = 0,
    onConfirm,
}) => {
    const [selectedDuration, setSelectedDuration] = useState(currentDuration);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        try {
            setLoading(true);
            setError(null);
            await onConfirm(selectedDuration);
            onClose();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Error updating auto-delete duration',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Auto-delete messages"
            size="sm"
        >
            <div className="p-6 space-y-4">
                {/* Header description */}
                <div className="flex items-start gap-3">
                    <Clock
                        size={20}
                        className="text-green-primary mt-1 shrink-0"
                    />
                    <p className="text-sm text-gray-600">
                        Choose a duration for messages to be automatically deleted after being sent.
                    </p>
                </div>

                {/* Options */}
                <div className="space-y-2">
                    {DELETE_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setSelectedDuration(option.value)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                selectedDuration === option.value
                                    ? 'border-green-primary bg-green-50'
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {/* Radio button */}
                            <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    selectedDuration === option.value
                                        ? 'border-green-primary bg-green-primary'
                                        : 'border-slate-300'
                                }`}
                            >
                                {selectedDuration === option.value && (
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                            </div>
                            <span
                                className={`font-medium ${
                                    selectedDuration === option.value
                                        ? 'text-green-primary'
                                        : 'text-gray-primary'
                                }`}
                            >
                                {option.label}
                            </span>
                        </button>
                    ))}
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
                        className="flex-1 px-4 py-2 rounded-lg bg-green-primary text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Updating...
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
