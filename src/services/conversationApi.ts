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

        // ✅ Attach JWT token
        this.api.interceptors.request.use((config) => {
            const token = localStorage.getItem('auth_token');

            if (token) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${token}`;
                console.log(
                    `[ConversationApiService] Request to: ${config.baseURL}${config.url}, Authorization: Bearer ${token.substring(0, 20)}...`,
                );
            } else {
                console.warn(
                    '[ConversationApiService] No auth_token found in localStorage!',
                );
            }

            return config;
        });

        // ✅ Handle errors
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                }

                console.error('API Error:', error);
                return Promise.reject(error);
            },
        );
    }

    // =========================
    // Conversations
    // =========================

    async findAll(): Promise<ConversationView[]> {
        const response = await this.api.get<ConversationView[]>('/');
        return response.data;
    }

    async findDetailById(conversationId: string): Promise<ConversationView> {
        const response = await this.api.get<ConversationView>(
            `/${conversationId}`,
        );
        return response.data;
    }

    async createConversation(data: {
        type: 'GROUP' | 'PRIVATE';
        participantIds?: string[];
        groupName?: string;
        groupAvatar?: string;
    }) {
        const response = await this.api.post('/', data);
        return response.data;
    }

    async leaveConversation(conversationId: string) {
        const response = await this.api.post(`/${conversationId}/leave`);
        return response.data;
    }

    // =========================
    // Messages
    // =========================

    async getMessagesByConversation(
        params: PaginatedMessagesParams,
    ): Promise<ConversationMessagesResult> {
        const { conversationId, cursor, limit = 30 } = params;

        const response = await this.api.get<ConversationMessagesResult>(
            `/${conversationId}/messages`,
            {
                params: {
                    cursor,
                    limit,
                },
            },
        );

        return response.data;
    }

    async sendMessage(
        conversationId: string,
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
            ...options,
        });

        return response.data;
    }

    async markMessagesAsRead(conversationId: string, messageId: string) {
        const response = await this.api.patch(
            `/${conversationId}/messages/${messageId}/read`,
        );

        return response.data;
    }

    async deleteMessage(conversationId: string, messageId: string) {
        const response = await this.api.delete(
            `/${conversationId}/messages/${messageId}`,
        );

        return response.data;
    }

    async toggleMessagePin(conversationId: string, messageId: string) {
        const response = await this.api.patch(
            `/${conversationId}/messages/${messageId}/pin`,
        );

        return response.data;
    }

    // =========================
    // Advanced message actions
    // =========================

    private async postToMessageEndpoint<T = unknown>(
        path: string,
        payload: Record<string, unknown>,
    ): Promise<T> {
        const baseUrl = API_BASE_URL.replace(/\/$/, '');

        const response = await axios.post<T>(
            `${baseUrl}/messages/${path}`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
            },
        );

        return response.data;
    }

    async recallMessage(conversationId: string, messageId: string) {
        return this.postToMessageEndpoint('revoke-for-everyone', {
            messageId,
            conversationId,
        });
    }

    async reactToMessage(
        conversationId: string,
        messageId: string,
        emoji: string,
    ) {
        return this.postToMessageEndpoint('emoji', {
            messageId,
            emoji,
            conversationId,
        });
    }

    async removeReaction(conversationId: string, messageId: string) {
        return this.postToMessageEndpoint('emoji/remove', {
            messageId,
            conversationId,
        });
    }

    async deleteMessageForMe(conversationId: string, messageId: string) {
        return this.postToMessageEndpoint('delete-for-me', {
            messageId,
            conversationId,
        });
    }

    async forwardMessage(
        sourceMessageId: string,
        targetConversationId: string,
        clientMessageId?: string,
        content?: string,
    ) {
        return this.postToMessageEndpoint('forward', {
            sourceMessageId,
            targetConversationId,
            clientMessageId,
            content,
        });
    }

    // =========================
    // Upload
    // =========================

    async uploadFile(
        file: File,
        conversationId: string,
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

        const response = await fetch(`${API_BASE_URL}/messages/upload`, {
            method: 'POST',
            headers: {
                'ngrok-skip-browser-warning': 'true',
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();

        return {
            mediaUrl: data.mediaUrl,
            fileName: data.fileName || file.name,
            fileSize: data.fileSize || file.size,
            mimeType: data.mimeType || file.type,
            messageType: data.messageType || 'FILE',
        };
    }
}

export const conversationApi = new ConversationApiService();
