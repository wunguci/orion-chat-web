import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
    ConversationView,
    ConversationMessagesResult,
    PaginatedMessagesParams,
} from '../types/conversation';

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_SOCKET_URL ||
    'http://localhost:3000';

class ConversationApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: `${API_BASE_URL}/conversations`,
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
            },
        });

        // Add auth token to requests if available
        this.api.interceptors.request.use((config) => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Handle errors
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error('API Error:', error);
                return Promise.reject(error);
            },
        );
    }

    private getAuthHeader(): Record<string, string> {
        const token = localStorage.getItem('auth_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    private async postToMessageEndpoint<T = unknown>(
        path: string,
        payload: Record<string, unknown>,
    ): Promise<T> {
        const headers = {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...this.getAuthHeader(),
        };

        const baseUrl = API_BASE_URL.replace(/\/$/, '');
        const endpointCandidates = [
            `${baseUrl}/messages/${path}`,
            `${baseUrl}/api/messages/${path}`,
            `${baseUrl}/v1/messages/${path}`,
            `${baseUrl}/conversations/messages/${path}`,
        ];

        let lastError: unknown;

        for (const endpoint of endpointCandidates) {
            try {
                const response = await axios.post<T>(endpoint, payload, {
                    headers,
                });
                return response.data;
            } catch (error) {
                if (
                    axios.isAxiosError(error) &&
                    error.response?.status !== 404
                ) {
                    throw error;
                }
                lastError = error;
            }
        }

        throw lastError;
    }

    /**
     * Get all conversations for the current user
     */
    async findAllByUserId(userId: string): Promise<ConversationView[]> {
        const response = await this.api.get<ConversationView[]>('/', {
            params: { userId },
        });
        return response.data;
    }

    /**
     * Get conversation details by ID
     */
    async findDetailById(
        conversationId: string,
        userId: string,
    ): Promise<ConversationView> {
        const response = await this.api.get<ConversationView>(
            `/${conversationId}/messages`,
            {
                params: { userId },
            },
        );
        return response.data;
    }

    /**
     * Get paginated messages for a conversation
     */
    async getMessagesByConversation(
        params: PaginatedMessagesParams,
    ): Promise<ConversationMessagesResult> {
        const { conversationId, userId, cursor, limit = 30 } = params;

        const response = await this.api.get<ConversationMessagesResult>(
            `/${conversationId}/messages`,
            {
                params: {
                    userId,
                    cursor,
                    limit,
                },
            },
        );
        return response.data;
    }
    /**
     * Send a message to a conversation
     */
    async sendMessage(
        conversationId: string,
        userId: string,
        content: string,
        options?: {
            messageType?: string;
            replyToMessageId?: string;
            mediaUrl?: string;
            fileName?: string;
            fileSize?: number;
        },
    ) {
        const response = await this.api.post(`/${conversationId}/messages`, {
            content,
            senderBy: userId,
            ...options,
        });
        return response.data;
    }

    /**
     * Update message read status
     */
    async markMessagesAsRead(
        conversationId: string,
        userId: string,
        messageId: string,
    ) {
        const response = await this.api.patch(
            `/${conversationId}/messages/${messageId}/read`,
            {
                userId,
            },
        );
        return response.data;
    }

    /**
     * Delete a message
     */
    async deleteMessage(conversationId: string, messageId: string) {
        const response = await this.api.delete(
            `/${conversationId}/messages/${messageId}`,
        );
        return response.data;
    }

    /**
     * Recall message for everyone
     */
    async recallMessage(
        conversationId: string,
        messageId: string,
        userId: string,
    ) {
        return this.postToMessageEndpoint('revoke-for-everyone', {
            messageId,
            userId,
            conversationId,
        });
    }

    async reactToMessage(
        conversationId: string,
        messageId: string,
        userId: string,
        emoji: string,
    ) {
        return this.postToMessageEndpoint('emoji', {
            messageId,
            userId,
            emoji,
            conversationId,
        });
    }

    async removeReaction(
        conversationId: string,
        messageId: string,
        userId: string,
    ) {
        return this.postToMessageEndpoint('emoji/remove', {
            messageId,
            userId,
            conversationId,
        });
    }

    async deleteMessageForMe(
        conversationId: string,
        messageId: string,
        userId: string,
    ) {
        return this.postToMessageEndpoint('delete-for-me', {
            messageId,
            userId,
            conversationId,
        });
    }

    async forwardMessage(
        sourceMessageId: string,
        targetConversationId: string,
        forwardedBy: string,
        clientMessageId?: string,
        content?: string,
    ) {
        return this.postToMessageEndpoint('forward', {
            sourceMessageId,
            targetConversationId,
            forwardedBy,
            clientMessageId,
            content,
        });
    }

    /**
     * Pin/Unpin a message
     */
    async toggleMessagePin(conversationId: string, messageId: string) {
        const response = await this.api.patch(
            `/${conversationId}/messages/${messageId}/pin`,
        );
        return response.data;
    }

    /**
     * Create a new conversation
     */
    async createConversation(
        userId: string,
        data: {
            type: 'GROUP' | 'PRIVATE';
            participantIds?: string[];
            groupName?: string;
            groupAvatar?: string;
        },
    ) {
        const response = await this.api.post('/', {
            createdBy: userId,
            ...data,
        });
        return response.data;
    }

    /**
     * Leave conversation
     */
    async leaveConversation(conversationId: string, userId: string) {
        const response = await this.api.post(`/${conversationId}/leave`, {
            userId,
        });
        return response.data;
    }

    /**
     * Upload file and return URL
     */
    async uploadFile(
        file: File,
        conversationId: string,
        senderBy?: string,
    ): Promise<{
        mediaUrl: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        messageType: string;
    }> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversationId', conversationId);
        if (senderBy) {
            formData.append('senderBy', senderBy);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/messages/upload`, {
                method: 'POST',
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                    ...this.getAuthHeader(),
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const data = (await response.json()) as {
                mediaUrl?: string;
                fileName?: string;
                fileSize?: number;
                mimeType?: string;
                messageType?: string;
            };

            if (!data.mediaUrl) {
                throw new Error('Upload response missing mediaUrl');
            }

            return {
                mediaUrl: data.mediaUrl,
                fileName: data.fileName || file.name,
                fileSize: data.fileSize || file.size,
                mimeType: data.mimeType || file.type,
                messageType: data.messageType || 'FILE',
            };
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        }
    }
}

export const conversationApi = new ConversationApiService();
