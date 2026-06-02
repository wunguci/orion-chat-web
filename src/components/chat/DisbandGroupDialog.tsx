import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { groupManagementService } from '../../services/groupManagementService';

interface DisbandGroupDialogProps {
    isOpen: boolean;
    groupName: string;
    groupId: string;
    memberCount: number;
    onClose: () => void;
    onSuccess?: () => void;
}

export const DisbandGroupDialog: React.FC<DisbandGroupDialogProps> = ({
    isOpen,
    groupName,
    groupId,
    memberCount,
    onClose,
    onSuccess,
}) => {
    const [confirmText, setConfirmText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isConfirmed = confirmText === groupName;

    const handleConfirm = async () => {
        if (!isConfirmed) {
            setError('Please enter the exact group name to confirm');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            await groupManagementService.disbandGroup(groupId);
            onSuccess?.();
            handleClose();
        } catch (err) {
            const errorMsg =
                err instanceof Error ? err.message : 'Failed to disband group';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setConfirmText('');
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 border border-slate-200 animate-slideUp">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle size={24} className="text-red-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-red-600">
                        Disband group
                    </h2>
                </div>

                {/* Warning Content */}
                <div className="mb-4 space-y-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700">
                            <strong>Warning:</strong> This action cannot be undone. All data in the group will be permanently deleted.
                        </p>
                    </div>

                    <div className="text-sm text-gray-secondary">
                        <p className="mb-2">When you disband the group:</p>
                        <ul className="space-y-1 text-xs text-gray-500">
                            <li>All {memberCount} members will be removed</li>
                            <li>All messages will be deleted</li>
                            <li>All images/files will be deleted</li>
                            <li>All members will receive a notification</li>
                        </ul>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-primary mb-2">
                            Enter the group name to confirm:{' '}
                            <strong>{groupName}</strong>
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type group name here"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-gray-primary hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || !isConfirmed}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Disbanding group...
                            </>
                        ) : (
                            'Disband group'
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }

                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};
