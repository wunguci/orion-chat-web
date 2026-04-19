import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { groupManagementService } from '../../services/groupManagementService';

interface RemoveMemberDialogProps {
    isOpen: boolean;
    memberName: string;
    memberId: string;
    groupId: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export const RemoveMemberDialog: React.FC<RemoveMemberDialogProps> = ({
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
            await groupManagementService.removeMember(groupId, memberId);
            onSuccess?.();
            handleClose();
        } catch (err) {
            const errorMsg =
                err instanceof Error ? err.message : 'Failed to remove member';
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
                    <div className="p-2 bg-red-100 rounded-lg">
                        <Trash2 size={24} className="text-red-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-primary">
                        Xóa thành viên
                    </h2>
                </div>

                {/* Content */}
                <div className="mb-4">
                    <p className="text-sm text-gray-secondary mb-4">
                        Bạn có chắc muốn xóa <strong>{memberName}</strong> khỏi
                        nhóm?
                    </p>

                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                        <p className="text-xs text-red-700">
                            ⚠️ Hành động này không thể hoàn tác. Thành viên sẽ
                            bị xóa khỏi nhóm và sẽ nhận được thông báo.
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
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            'Xóa thành viên'
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
