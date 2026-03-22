import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
    ConversationView,
    ConversationMessagesResult,
    PaginatedMessagesParams,
} from '../types/conversation';

const API_BASE_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ConversationApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: `${API_BASE_URL}/conversations`,
            headers: {
                'Content-Type': 'application/json',
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

    /**
     * Get all conversations for the current user
     */
    async findAllByUserId(userId: string): Promise<ConversationView[]> {
        const response = await this.api.get<ConversationView[]>(
            `/user/${userId}`,
        );
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
            `/${conversationId}/detail`,
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
}

export const conversationApi = new ConversationApiService();
