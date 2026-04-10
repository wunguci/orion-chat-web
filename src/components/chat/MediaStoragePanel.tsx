import React, { useState, useMemo, useCallback } from 'react';
import {
    ArrowLeft,
    MoreVertical,
    ChevronDown,
    X,
    Calendar,
} from 'lucide-react';
import { MediaContextMenu } from './MediaContextMenu';
import { conversationApi } from '../../services/conversationApi';
import type { SocketMessage } from './MessageList';

interface MediaStoragePanelProps {
    displayMessages: SocketMessage[];
    onBack: () => void;
    onMediaAction?: (
        action: 'open' | 'forward' | 'jump' | 'deleteForMe' | 'recall',
        message: SocketMessage,
    ) => void;
    conversationId?: string;
}

type MediaTab = 'photos' | 'files' | 'links';
type TimeFilter = '7days' | '30days' | '90days' | 'custom';

interface FilterOptions {
    sender: string; // userId or 'all'
    timeFilter: TimeFilter;
    customStartDate?: Date;
    customEndDate?: Date;
}

interface LinkMessage extends SocketMessage {
    url: string;
}

export const MediaStoragePanel: React.FC<MediaStoragePanelProps> = ({
    displayMessages,
    onBack,
    onMediaAction,
    conversationId,
}) => {
    const [activeTab, setActiveTab] = useState<MediaTab>('photos');
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [senderDropdownOpen, setSenderDropdownOpen] = useState(false);
    const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
    const [contextMenuState, setContextMenuState] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        messageId?: string;
    }>({ isOpen: false, position: { x: 0, y: 0 } });
    const [mediaActionError, setMediaActionError] = useState<string | null>(
        null,
    );

    const [filters, setFilters] = useState<FilterOptions>({
        sender: 'all',
        timeFilter: '7days',
    });

    // Get unique senders
    const uniqueSenders = useMemo(() => {
        const senders = new Map<string, { id: string; name: string }>();
        displayMessages.forEach((msg) => {
            if (!senders.has(msg.senderId)) {
                senders.set(msg.senderId, {
                    id: msg.senderId,
                    name: msg.senderName,
                });
            }
        });
        return Array.from(senders.values());
    }, [displayMessages]);

    // Filter messages by time
    const filterByTime = useCallback(
        (messages: SocketMessage[] | LinkMessage[]) => {
            const now = new Date();
            return messages.filter((msg) => {
                const msgDate = new Date(msg.timestamp);

                if (filters.timeFilter === '7days') {
                    const sevenDaysAgo = new Date(now);
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return msgDate >= sevenDaysAgo;
                } else if (filters.timeFilter === '30days') {
                    const thirtyDaysAgo = new Date(now);
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return msgDate >= thirtyDaysAgo;
                } else if (filters.timeFilter === '90days') {
                    const ninetyDaysAgo = new Date(now);
                    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                    return msgDate >= ninetyDaysAgo;
                } else if (
                    filters.timeFilter === 'custom' &&
                    filters.customStartDate &&
                    filters.customEndDate
                ) {
                    return (
                        msgDate >= filters.customStartDate &&
                        msgDate <=
                            new Date(filters.customEndDate.getTime() + 86400000)
                    ); // Include full end date
                }
                return true;
            });
        },
        [filters],
    );

    // Get filtered and grouped images
    const filteredImages = useMemo(() => {
        let images = displayMessages.filter(
            (msg) =>
                msg.isFile &&
                msg.fileUrl &&
                msg.fileType?.startsWith('image/') === true &&
                !msg.isRecalled,
        );

        if (filters.sender !== 'all') {
            images = images.filter((msg) => msg.senderId === filters.sender);
        }

        return filterByTime(images).sort(
            (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
        );
    }, [displayMessages, filters, filterByTime]);

    // Get filtered files
    const filteredFiles = useMemo(() => {
        let files = displayMessages.filter(
            (msg) =>
                msg.isFile &&
                msg.fileUrl &&
                !msg.fileType?.startsWith('image/') &&
                !msg.isRecalled,
        );

        if (filters.sender !== 'all') {
            files = files.filter((msg) => msg.senderId === filters.sender);
        }

        return filterByTime(files).sort(
            (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
        );
    }, [displayMessages, filters, filterByTime]);

    // Get filtered links
    const filteredLinks = useMemo(() => {
        let links: LinkMessage[] = displayMessages
            .filter(
                (msg) =>
                    !msg.isFile &&
                    msg.content &&
                    /https?:\/\/|www\./i.test(msg.content) &&
                    !msg.isRecalled,
            )
            .map((msg) => ({
                ...msg,
                url:
                    msg.content.match(/https?:\/\/\S+|www\.\S+/i)?.[0] ||
                    msg.content,
            }));

        if (filters.sender !== 'all') {
            links = links.filter((msg) => msg.senderId === filters.sender);
        }

        return filterByTime(links).sort(
            (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
        );
    }, [displayMessages, filters, filterByTime]);

    // Group images by date
    const groupedImages = useMemo(() => {
        const groups = new Map<string, typeof filteredImages>();
        filteredImages.forEach((img) => {
            const date = new Date(img.timestamp);
            const dateKey = date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            if (!groups.has(dateKey)) {
                groups.set(dateKey, []);
            }
            groups.get(dateKey)!.push(img);
        });
        return Array.from(groups.entries()).reverse(); // Most recent first
    }, [filteredImages]);

    const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setContextMenuState({
            isOpen: true,
            position: {
                x: rect.right - 200,
                y: rect.bottom + 8,
            },
            messageId,
        });
    };

    const handleMediaAction = useCallback(
        async (
            action: 'open' | 'forward' | 'jump' | 'deleteForMe' | 'recall',
        ) => {
            const message =
                activeTab === 'photos'
                    ? filteredImages.find(
                          (m) => m.id === contextMenuState.messageId,
                      )
                    : activeTab === 'files'
                      ? filteredFiles.find(
                            (m) => m.id === contextMenuState.messageId,
                        )
                      : filteredLinks.find(
                            (m) => m.id === contextMenuState.messageId,
                        );

            if (!message) {
                setMediaActionError('Message not found');
                return;
            }

            try {
                setMediaActionError(null);

                switch (action) {
                    case 'open': {
                        if (!message.fileUrl) {
                            setMediaActionError('Cannot open file');
                            return;
                        }
                        // Open file in new tab
                        window.open(message.fileUrl, '_blank');
                        break;
                    }

                    case 'forward': {
                        // Delegate to parent handler if available
                        if (onMediaAction) {
                            onMediaAction('forward', message);
                        } else {
                            setMediaActionError('Forward action not available');
                        }
                        break;
                    }

                    case 'jump': {
                        // Delegate to parent handler if available
                        if (onMediaAction) {
                            onMediaAction('jump', message);
                        } else {
                            setMediaActionError('Jump action not available');
                        }
                        break;
                    }

                    case 'deleteForMe': {
                        if (!conversationId) {
                            setMediaActionError('Conversation ID not found');
                            return;
                        }
                        await conversationApi.deleteMessageForMe(
                            conversationId,
                            message.id,
                        );
                        break;
                    }

                    case 'recall': {
                        if (!conversationId) {
                            setMediaActionError('Conversation ID not found');
                            return;
                        }
                        await conversationApi.recallMessage(
                            conversationId,
                            message.id,
                        );
                        break;
                    }
                }

                setContextMenuState({ ...contextMenuState, isOpen: false });
            } catch (error) {
                const errorMsg =
                    error instanceof Error
                        ? error.message
                        : `Failed to perform ${action}`;
                setMediaActionError(errorMsg);
                console.error(errorMsg, error);
            }
        },
        [
            activeTab,
            contextMenuState,
            filteredImages,
            filteredFiles,
            filteredLinks,
            onMediaAction,
            conversationId,
        ],
    );

    return (
        <div className="w-90 border-l border-slate-200 bg-white flex flex-col overflow-y-auto rounded-2xl shadow-2xs">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h2 className="text-lg font-semibold text-gray-primary">
                    Media storage
                </h2>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                {(['photos', 'files', 'links'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
                            activeTab === tab
                                ? 'text-green-primary border-b-2 border-green-primary'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        {tab === 'photos'
                            ? 'Photos/Videos'
                            : tab === 'files'
                              ? 'Files'
                              : 'Links'}
                    </button>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-200 flex gap-3 bg-white">
                {/* Sender Filter */}
                <div className="relative flex-1">
                    <button
                        onClick={() =>
                            setSenderDropdownOpen(!senderDropdownOpen)
                        }
                        className="w-full px-3 py-2 bg-slate-50 text-gray-700 rounded-lg flex items-center justify-between hover:bg-slate-100 transition-colors text-sm border border-slate-200"
                    >
                        <span>
                            {filters.sender === 'all'
                                ? 'All senders'
                                : uniqueSenders.find(
                                      (s) => s.id === filters.sender,
                                  )?.name || 'All senders'}
                        </span>
                        <ChevronDown
                            size={16}
                            className={`transition-transform ${
                                senderDropdownOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </button>

                    {senderDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg z-40 border border-slate-200">
                            <button
                                onClick={() => {
                                    setFilters({ ...filters, sender: 'all' });
                                    setSenderDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                                    filters.sender === 'all'
                                        ? 'text-green-primary font-medium'
                                        : 'text-gray-700'
                                }`}
                            >
                                All senders
                            </button>
                            {uniqueSenders.map((sender) => (
                                <button
                                    key={sender.id}
                                    onClick={() => {
                                        setFilters({
                                            ...filters,
                                            sender: sender.id,
                                        });
                                        setSenderDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                                        filters.sender === sender.id
                                            ? 'text-green-primary font-medium'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    {sender.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Time Filter */}
                <div className="relative flex-1">
                    <button
                        onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
                        className="w-full px-3 py-2 bg-slate-50 text-gray-700 rounded-lg flex items-center justify-between hover:bg-slate-100 transition-colors text-sm border border-slate-200"
                    >
                        <span>
                            {filters.timeFilter === '7days'
                                ? 'Last 7 days'
                                : filters.timeFilter === '30days'
                                  ? 'Last 30 days'
                                  : filters.timeFilter === '90days'
                                    ? 'Last 3 months'
                                    : 'Custom range'}
                        </span>
                        <ChevronDown
                            size={16}
                            className={`transition-transform ${
                                timeDropdownOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </button>

                    {timeDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg z-40 border border-slate-200">
                            {[
                                {
                                    value: '7days' as const,
                                    label: 'Last 7 days',
                                },
                                {
                                    value: '30days' as const,
                                    label: 'Last 30 days',
                                },
                                {
                                    value: '90days' as const,
                                    label: 'Last 3 months',
                                },
                                {
                                    value: 'custom' as const,
                                    label: 'Custom range',
                                },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setFilters({
                                            ...filters,
                                            timeFilter: option.value,
                                        });
                                        if (option.value === 'custom') {
                                            setShowCustomDatePicker(true);
                                        } else {
                                            setTimeDropdownOpen(false);
                                        }
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                                        filters.timeFilter === option.value
                                            ? 'text-green-primary font-medium'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Date Picker Modal */}
            {showCustomDatePicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-96 border border-slate-200 animate-slideUp">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-primary">
                                Custom date range
                            </h3>
                            <button
                                onClick={() => setShowCustomDatePicker(false)}
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                            >
                                <X size={20} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {/* Start Date */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">
                                    Start date
                                </label>
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                                    <Calendar
                                        size={16}
                                        className="text-gray-400"
                                    />
                                    <input
                                        type="date"
                                        value={
                                            filters.customStartDate
                                                ? filters.customStartDate
                                                      .toISOString()
                                                      .split('T')[0]
                                                : ''
                                        }
                                        onChange={(e) => {
                                            setFilters({
                                                ...filters,
                                                customStartDate: e.target.value
                                                    ? new Date(e.target.value)
                                                    : undefined,
                                            });
                                        }}
                                        className="flex-1 bg-transparent text-gray-700 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">
                                    End date
                                </label>
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                                    <Calendar
                                        size={16}
                                        className="text-gray-400"
                                    />
                                    <input
                                        type="date"
                                        value={
                                            filters.customEndDate
                                                ? filters.customEndDate
                                                      .toISOString()
                                                      .split('T')[0]
                                                : ''
                                        }
                                        onChange={(e) => {
                                            setFilters({
                                                ...filters,
                                                customEndDate: e.target.value
                                                    ? new Date(e.target.value)
                                                    : undefined,
                                            });
                                        }}
                                        className="flex-1 bg-transparent text-gray-700 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() =>
                                        setShowCustomDatePicker(false)
                                    }
                                    className="flex-1 px-4 py-2 bg-slate-100 text-gray-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setTimeDropdownOpen(false);
                                        setShowCustomDatePicker(false);
                                    }}
                                    className="flex-1 px-4 py-2 bg-green-primary text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'photos' && (
                    <div className="p-4 space-y-6">
                        {groupedImages.length > 0 ? (
                            groupedImages.map(([dateKey, images]) => (
                                <div key={dateKey}>
                                    <h3 className="text-sm font-medium text-gray-600 mb-3">
                                        {dateKey}
                                    </h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {images.map((img) => (
                                            <div
                                                key={img.id}
                                                className="relative group overflow-hidden rounded-lg aspect-square cursor-pointer"
                                            >
                                                <img
                                                    src={img.fileUrl}
                                                    alt={img.fileName}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                                {/* Overlay on hover */}
                                                <div className="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                                                    <button
                                                        onClick={(e) =>
                                                            handleContextMenu(
                                                                e,
                                                                img.id,
                                                            )
                                                        }
                                                        className="opacity-0 group-hover:opacity-100 p-2 bg-white hover:bg-slate-100 rounded-lg transition-all duration-300 border border-slate-200"
                                                        title="More options"
                                                    >
                                                        <MoreVertical
                                                            size={18}
                                                            className="text-gray-600"
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                <div className="text-center">
                                    <p className="text-sm">No images found</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="p-4">
                        {filteredFiles.length > 0 ? (
                            <div className="space-y-2">
                                {filteredFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group border border-slate-200"
                                    >
                                        {/* File Icon */}
                                        <div className="shrink-0">
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="text-gray-600"
                                            >
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                            </svg>
                                        </div>

                                        {/* File Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-700 truncate">
                                                {file.fileName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(
                                                    file.timestamp,
                                                ).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={(e) =>
                                                handleContextMenu(e, file.id)
                                            }
                                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-200 rounded transition-all"
                                        >
                                            <MoreVertical
                                                size={18}
                                                className="text-gray-600"
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                <div className="text-center">
                                    <p className="text-sm">No files found</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'links' && (
                    <div className="p-4">
                        {filteredLinks.length > 0 ? (
                            <div className="space-y-2">
                                {filteredLinks.map((link) => (
                                    <div
                                        key={link.id}
                                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group border border-slate-200"
                                    >
                                        {/* Link Icon */}
                                        <div className="shrink-0">
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="text-blue-600"
                                            >
                                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                            </svg>
                                        </div>

                                        {/* Link Info */}
                                        <div className="flex-1 min-w-0">
                                            <a
                                                href={(link as LinkMessage).url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:text-blue-700 truncate block"
                                            >
                                                {(link as LinkMessage).url}
                                            </a>
                                            <p className="text-xs text-gray-500">
                                                {new Date(
                                                    link.timestamp,
                                                ).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={(e) =>
                                                handleContextMenu(e, link.id)
                                            }
                                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-200 rounded transition-all"
                                        >
                                            <MoreVertical
                                                size={18}
                                                className="text-gray-600"
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                <div className="text-center">
                                    <p className="text-sm">No links found</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ✅ Error Notification */}
            {mediaActionError && (
                <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50 animate-slideUp">
                    <p className="text-sm font-medium">{mediaActionError}</p>
                    <button
                        onClick={() => setMediaActionError(null)}
                        className="mt-2 text-xs text-red-100 hover:text-white"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Context Menu */}
            <MediaContextMenu
                isOpen={contextMenuState.isOpen}
                position={contextMenuState.position}
                onOpen={() => handleMediaAction('open')}
                onForward={() => handleMediaAction('forward')}
                onJumpToMessage={() => handleMediaAction('jump')}
                onDeleteForMe={() => handleMediaAction('deleteForMe')}
                onRecall={() => handleMediaAction('recall')}
                onClose={() =>
                    setContextMenuState({ ...contextMenuState, isOpen: false })
                }
            />

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
