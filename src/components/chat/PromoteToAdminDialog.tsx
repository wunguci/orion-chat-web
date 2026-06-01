import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { groupManagementService } from '../../services/groupManagementService';

interface PromoteToAdminDialogProps {
    isOpen: boolean;
    memberName: string;
    memberId: string;
    groupId: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export const PromoteToAdminDialog: React.FC<PromoteToAdminDialogProps> = ({
    isOpen,
    memberName,
    memberId,
    groupId,
    onClose,
    onSuccess,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await groupManagementService.promoteToCoAdmin(groupId, memberId);
            onSuccess?.();
            handleClose();
        } catch (err) {
            const errorMsg =
                err instanceof Error ? err.message : 'Failed to promote member';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 border border-slate-200 animate-slideUp">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <AlertCircle size={24} className="text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-primary">
                        Promote to co-admin
                    </h2>
                </div>

                {/* Content */}
                <div className="mb-4">
                    <p className="text-sm text-gray-secondary mb-4">
                        Are you sure you want to promote{' '}
                        <strong>{memberName}</strong> to co-admin?
                    </p>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                        <p className="text-xs text-blue-700">
                            Co-admin can:
                        </p>
                        <ul className="text-xs text-blue-700 mt-2 space-y-1">
                            <li>✓ Accept/reject join requests</li>
                            <li>✓ Remove members from group</li>
                            <li>✓ Change group settings</li>
                        </ul>
                        <p className="mt-2 text-[11px] text-blue-700">
                            Note: Admin permission can only be transferred when the admin leaves the group.
                        </p>
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
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Loading...
                            </>
                        ) : (
                            'Confirm'
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
