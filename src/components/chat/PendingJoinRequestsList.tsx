import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
import ChatAvatar from '../common/ChatAvatar';
import {
    groupManagementService,
    type JoinRequest,
} from '../../services/groupManagementService';
import { mapGroupManagementError } from '../../utils/groupManagementErrors';

interface PendingJoinRequestsListProps {
    isOpen: boolean;
    groupId: string;
    groupName: string;
    refreshSignal?: number;
    onClose: () => void;
    onCountChange?: (count: number) => void;
    onRequestApproved?: () => void;
    onRequestRejected?: () => void;
}

export const PendingJoinRequestsList: React.FC<
    PendingJoinRequestsListProps
> = ({
    isOpen,
    groupId,
    groupName,
    onClose,
    refreshSignal,
    onCountChange,
    onRequestApproved,
    onRequestRejected,
}) => {
    const [requests, setRequests] = useState<JoinRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const getRequestId = (request: JoinRequest) =>
        String((request as { id?: string }).id || request.requestId);

    useEffect(() => {
        if (!isOpen || !groupId) return;

        const loadRequests = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response =
                    await groupManagementService.getJoinRequests(groupId);
                setRequests(response);
                onCountChange?.(response.length);
            } catch (err) {
                setError(mapGroupManagementError(err, 'approve'));
            } finally {
                setIsLoading(false);
            }
        };

        void loadRequests();
    }, [isOpen, groupId, refreshSignal, onCountChange]);

    const handleApprove = async (requestId: string) => {
        try {
            setProcessingId(requestId);
            await groupManagementService.approveJoinRequest(groupId, requestId);
            setRequests((prev) => {
                const next = prev.filter(
                    (req) => getRequestId(req) !== requestId,
                );
                onCountChange?.(next.length);
                return next;
            });
            onRequestApproved?.();
        } catch (err) {
            setError(mapGroupManagementError(err, 'approve'));
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            setProcessingId(requestId);
            await groupManagementService.rejectJoinRequest(groupId, requestId);
            setRequests((prev) => {
                const next = prev.filter(
                    (req) => getRequestId(req) !== requestId,
                );
                onCountChange?.(next.length);
                return next;
            });
            onRequestRejected?.();
        } catch (err) {
            setError(mapGroupManagementError(err, 'reject'));
        } finally {
            setProcessingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-lg shadow-xl w-96 max-h-96 border border-slate-200 flex flex-col animate-slideUp">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white rounded-t-lg">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-primary">
                            Yêu cầu tham gia
                        </h2>
                        <p className="text-xs text-gray-400">{groupName}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block w-6 h-6 border-2 border-green-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-gray-500 mt-2">
                                Đang tải...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p className="text-sm">
                                Không có yêu cầu chờ xử lý
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200">
                            {requests.map((request) => (
                                <div
                                    key={getRequestId(request)}
                                    className="p-4 hover:bg-slate-50 transition-colors"
                                >
                                    {/* Requester Info */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <ChatAvatar
                                            name={
                                                request.requester.fullName ||
                                                request.requester.userId
                                            }
                                            avatarUrl={undefined}
                                            sizeClassName="w-10 h-10"
                                            textClassName="text-sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-primary truncate">
                                                {request.requester.fullName ||
                                                    request.requester.userId}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(
                                                    request.createdAt,
                                                ).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Request Message */}
                                    {request.message && (
                                        <div className="mb-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                                            <p className="text-xs text-gray-600 italic">
                                                "{request.message}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                handleReject(
                                                    getRequestId(request),
                                                )
                                            }
                                            disabled={
                                                processingId ===
                                                getRequestId(request)
                                            }
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 text-sm"
                                        >
                                            {processingId ===
                                            getRequestId(request) ? (
                                                <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <X size={16} />
                                            )}
                                            Từ chối
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleApprove(
                                                    getRequestId(request),
                                                )
                                            }
                                            disabled={
                                                processingId ===
                                                getRequestId(request)
                                            }
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-primary text-white hover:bg-green-600 transition-colors disabled:opacity-50 text-sm"
                                        >
                                            {processingId ===
                                            getRequestId(request) ? (
                                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Check size={16} />
                                            )}
                                            Chấp nhận
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
