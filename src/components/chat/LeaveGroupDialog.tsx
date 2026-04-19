import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { groupManagementService } from '../../services/groupManagementService';

interface LeaveGroupDialogProps {
    isOpen: boolean;
    groupName: string;
    groupId: string;
    isOwner?: boolean;
    hasOtherAdmin?: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const LeaveGroupDialog: React.FC<LeaveGroupDialogProps> = ({
    isOpen,
    groupName,
    groupId,
    isOwner = false,
    hasOtherAdmin = false,
    onClose,
    onSuccess,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canLeave = !isOwner || hasOtherAdmin;

    const handleConfirm = async () => {
        if (!canLeave) {
            setError(
                'Bạn là trưởng nhóm. Vui lòng nâng cấp một quản lý khác trước khi rời nhóm.',
            );
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            await groupManagementService.leaveGroup(groupId);
            onSuccess?.();
            handleClose();
        } catch (err) {
            const errorMsg =
                err instanceof Error ? err.message : 'Failed to leave group';
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
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <LogOut size={24} className="text-orange-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-primary">
                        Rời nhóm
                    </h2>
                </div>

                {/* Content */}
                <div className="mb-4">
                    <p className="text-sm text-gray-secondary mb-4">
                        Bạn có chắc muốn rời nhóm <strong>{groupName}</strong>?
                    </p>

                    {isOwner && !hasOtherAdmin && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                            <p className="text-xs text-red-700">
                                ⚠️ <strong>Cảnh báo:</strong> Bạn là trưởng nhóm
                                và là admin duy nhất. Vui lòng nâng cấp một quản
                                lý khác trước khi rời nhóm.
                            </p>
                        </div>
                    )}

                    {isOwner && hasOtherAdmin && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                            <p className="text-xs text-blue-700">
                                ℹ️ Vì có quản lý khác, bạn có thể rời nhóm.
                                Quyền trưởng nhóm sẽ được chuyển sang quản lý
                                khác.
                            </p>
                        </div>
                    )}

                    {!isOwner && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                            <p className="text-xs text-blue-700">
                                ℹ️ Bạn sẽ bị xóa khỏi nhóm và sẽ không nhìn thấy
                                các tin nhắn từ nhóm này nữa.
                            </p>
                        </div>
                    )}

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
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || !canLeave}
                        className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            'Rời nhóm'
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
