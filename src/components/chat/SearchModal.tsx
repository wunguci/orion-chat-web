import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, File } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { type SocketMessage } from './MessageList';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    messages: SocketMessage[];
    currentUserId?: string;
    onSelectMessage?: (messageId: string) => void;
}

type FilterType = 'all' | 'today' | 'week' | 'month';
type ContentType = 'all' | 'messages' | 'files';

/**
 * SearchModal Component (Panel mode)
 * Search messages and files within a conversation - displayed as a panel on the right
 */
export const SearchModal: React.FC<SearchModalProps> = ({
    isOpen,
    onClose,
    messages = [],
    currentUserId = '',
    onSelectMessage,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [contentType, setContentType] = useState<ContentType>('all');

    // Filter messages based on query and filters
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) {
            return { messages: [], files: [] };
        }

        const query = searchQuery.toLowerCase();
        const now = new Date();

        // Filter by date
        const isWithinDateRange = (timestamp: string): boolean => {
            const msgDate = new Date(timestamp);
            const daysDiff = Math.floor(
                (now.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24),
            );

            switch (filterType) {
                case 'today':
                    return daysDiff === 0;
                case 'week':
                    return daysDiff <= 7;
                case 'month':
                    return daysDiff <= 30;
                case 'all':
                default:
                    return true;
            }
        };

        // Separate messages and files
        const textMessages: SocketMessage[] = [];
        const fileMessages: SocketMessage[] = [];

        messages.forEach((msg) => {
            if (msg.isRecalled) return;
            if (!isWithinDateRange(msg.timestamp)) return;

            // Search in text content
            if (!msg.isFile && msg.content) {
                if (msg.content.toLowerCase().includes(query)) {
                    textMessages.push(msg);
                }
            }

            // Search in file name
            if (msg.isFile && msg.fileName) {
                if (msg.fileName.toLowerCase().includes(query)) {
                    fileMessages.push(msg);
                }
            }
        });

        return {
            messages: textMessages,
            files: fileMessages,
        };
    }, [searchQuery, messages, filterType]);

    // Filter by content type
    const displayResults = useMemo(() => {
        switch (contentType) {
            case 'messages':
                return searchResults.messages;
            case 'files':
                return searchResults.files;
            case 'all':
            default:
                return [...searchResults.messages, ...searchResults.files];
        }
    }, [searchResults, contentType]);

    const handleMessageClick = (messageId: string) => {
        onSelectMessage?.(messageId);
    };

    if (!isOpen) return null;

    return (
        <div className="w-90 border-l border-slate-200 bg-white flex flex-col overflow-y-auto rounded-2xl shadow-2xs">
            {/* Header with back button */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white">
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h2 className="text-lg font-semibold text-gray-primary">
                    Search
                </h2>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-200">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Enter keyword"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 pr-8 border border-blue-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                    />
                    <Search
                        size={16}
                        className="absolute right-2 top-2.5 text-gray-400"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2 mt-3 flex-wrap">
                    {/* Date Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-600">
                            Filter:
                        </label>
                        <select
                            value={filterType}
                            onChange={(e) =>
                                setFilterType(e.target.value as FilterType)
                            }
                            className="px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All</option>
                            <option value="today">Today</option>
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                        </select>
                    </div>

                    {/* Content Type Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-600">
                            Type:
                        </label>
                        <select
                            value={contentType}
                            onChange={(e) =>
                                setContentType(e.target.value as ContentType)
                            }
                            className="px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All</option>
                            <option value="messages">Messages</option>
                            <option value="files">Files</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
                {!searchQuery.trim() ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center p-6">
                            <Search
                                size={40}
                                className="mx-auto mb-2 opacity-50"
                            />
                            <p className="text-sm">Enter keyword to search</p>
                        </div>
                    </div>
                ) : displayResults.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center p-6">
                            <Search
                                size={40}
                                className="mx-auto mb-2 opacity-50"
                            />
                            <p className="text-sm">No result found</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 space-y-2">
                        {displayResults.map((msg) => {
                            const isFile = msg.isFile;
                            const isSelf = msg.senderId === currentUserId;

                            return (
                                <div
                                    key={msg.id}
                                    onClick={() => handleMessageClick(msg.id)}
                                    className="p-2 rounded border border-slate-200 hover:bg-blue-50 cursor-pointer transition-colors"
                                >
                                    {/* Sender info */}
                                    <div className="flex items-center gap-2 mb-1">
                                        {msg.senderAvatar && (
                                            <img
                                                src={msg.senderAvatar}
                                                alt={msg.senderName}
                                                className="w-5 h-5 rounded-full object-cover"
                                            />
                                        )}
                                        <span className="text-xs font-medium text-gray-900">
                                            {isSelf ? 'You' : msg.senderName}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {format(
                                                new Date(msg.timestamp),
                                                'HH:mm - dd/MM',
                                                { locale: vi },
                                            )}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="text-xs text-gray-700">
                                        {isFile ? (
                                            <div className="flex items-center gap-1">
                                                <File
                                                    size={14}
                                                    className="text-blue-500 shrink-0"
                                                />
                                                <span className="truncate font-medium">
                                                    {msg.fileName}
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="line-clamp-2">
                                                {msg.content}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer - Result count */}
            {searchQuery.trim() && displayResults.length > 0 && (
                <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-gray-600">
                    Found{' '}
                    <span className="font-semibold">
                        {displayResults.length}
                    </span>{' '}
                    results
                </div>
            )}
        </div>
    );
};

export default SearchModal;
