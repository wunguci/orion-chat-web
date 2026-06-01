import React, { useEffect, useMemo, useState } from 'react';
import {
    conversationApi,
    type ConversationMediaItem,
} from '../../services/conversationApi';
import { MediaStoragePanel } from './MediaStoragePanel';
import type { SocketMessage } from './MessageList';
import type { ParticipantInfo } from '../../types/conversation';

type GroupMediaPanelProps = {
    conversationId: string;
    participants?: ParticipantInfo[];
    onBack: () => void;
    onMediaAction?: (
        action: 'open' | 'forward' | 'jump' | 'deleteForMe' | 'recall',
        message: SocketMessage,
    ) => void;
};

function mapMediaItemToSocketMessage(
    item: ConversationMediaItem,
): SocketMessage {
    return {
        id: String(item.messageId || item._id || item.clientMessageId || ''),
        clientMessageId: item.clientMessageId,
        senderId: String(item.senderBy || ''),
        senderName: item.senderName || String(item.senderBy || 'Unknown'),
        senderAvatar: item.senderAvatar,
        content: item.content || '',
        timestamp: item.createdAt || new Date().toISOString(),
        conversationId: item.conversationId,
        type:
            item.messageType === 'IMAGE'
                ? 'image'
                : item.messageType === 'VIDEO'
                  ? 'video'
                  : item.messageType === 'AUDIO'
                    ? 'audio'
                    : item.messageType === 'FILE'
                      ? 'file'
                      : 'text',
        isFile:
            item.messageType === 'IMAGE' ||
            item.messageType === 'VIDEO' ||
            item.messageType === 'AUDIO' ||
            item.messageType === 'FILE',
        fileUrl: item.mediaUrl,
        fileName: item.fileName,
        fileType: item.mimeType,
        fileExtension: item.fileExtension,
        fileCategory: item.fileCategory,
        fileIcon: item.fileIcon,
        isRecalled: item.isRevoked,
        deletedForUsers: item.deletedForUsers,
    };
}

export const GroupMediaPanel: React.FC<GroupMediaPanelProps> = ({
    conversationId,
    participants = [],
    onBack,
    onMediaAction,
}) => {
    const [items, setItems] = useState<ConversationMediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadMedia = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await conversationApi.getConversationMedia(
                    conversationId,
                    undefined,
                    100,
                );
                if (!isMounted) return;
                setItems(Array.isArray(response.items) ? response.items : []);
            } catch (err) {
                if (!isMounted) return;
                setError(
                    err instanceof Error ? err.message : 'Failed to load media',
                );
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void loadMedia();

        return () => {
            isMounted = false;
        };
    }, [conversationId]);

    const displayMessages = useMemo(
        () => items.map(mapMediaItemToSocketMessage),
        [items],
    );

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Loading media...
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-sm text-rose-600 px-4 text-center">
                <p>{error}</p>
                <button
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                    onClick={onBack}
                >
                    Back
                </button>
            </div>
        );
    }

    return (
        <MediaStoragePanel
            displayMessages={displayMessages}
            participants={participants}
            onBack={onBack}
            onMediaAction={onMediaAction}
            conversationId={conversationId}
        />
    );
};

export default GroupMediaPanel;
