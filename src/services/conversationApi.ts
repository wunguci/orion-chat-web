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

    /**
     * Get or create a PRIVATE conversation with a friend
     * @param recipientId ID của friend
     */
    async getOrCreatePrivateConversation(recipientId: string) {
        const response = await this.api.post('/private', {
            recipientId,
        });
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

    async recallMessage(conversationId: string, messageId: string) {
        const response = await this.api.post(
            `/${conversationId}/messages/${messageId}/recall`,
        );
        return response.data;
    }

    async reactToMessage(
        conversationId: string,
        messageId: string,
        emoji: string,
    ) {
        const response = await this.api.post(
            `/${conversationId}/messages/${messageId}/reactions`,
            { emoji },
        );
        return response.data;
    }

    async removeReaction(conversationId: string, messageId: string) {
        const response = await this.api.delete(
            `/${conversationId}/messages/${messageId}/reactions`,
        );
        return response.data;
    }

    async deleteMessageForMe(conversationId: string, messageId: string) {
        const response = await this.api.delete(
            `/${conversationId}/messages/${messageId}`,
        );
        return response.data;
    }

    async forwardMessage(
        sourceMessageId: string,
        targetConversationId: string,
        clientMessageId?: string,
        content?: string,
    ) {
        const response = await this.api.post(
            `/${targetConversationId}/messages/forward`,
            {
                sourceMessageId,
                clientMessageId,
                content,
            },
        );
        return response.data;
    }

    // =========================
    // Conversation Settings
    // =========================

    /**
     * Cập nhật thời gian tự xóa tin nhắn
     * @param conversationId ID của conversation
     * @param autoDeleteDuration Số ngày (0 = không tự xóa, 1, 7, 30)
     */
    async updateAutoDeleteDuration(
        conversationId: string,
        autoDeleteDuration: number,
    ) {
        const response = await this.api.patch(
            `/${conversationId}/auto-delete-duration`,
            { autoDeleteDuration },
        );
        return response.data;
    }

    /**
     * Ẩn conversation bằng mật khẩu
     * @param conversationId ID của conversation
     * @param password Mật khẩu để ẩn conversation
     */
    async hideConversation(conversationId: string, password: string) {
        const response = await this.api.post(`/${conversationId}/hide`, {
            password,
        });
        return response.data;
    }

    /**
     * Bỏ ẩn conversation
     * @param conversationId ID của conversation
     * @param password Mật khẩu để tiết lộ conversation
     */
    async unhideConversation(conversationId: string, password: string) {
        const response = await this.api.post(`/${conversationId}/reveal`, {
            password,
        });
        return response.data;
    }

    /**
     * Xóa lịch sử trò chuyện (chỉ ẩn client-side)
     * @param conversationId ID của conversation
     */
    async clearConversationHistory(conversationId: string) {
        const response = await this.api.post(
            `/${conversationId}/clear-history`,
        );
        return response.data;
    }

    /**
     * Chặn người dùng trong conversation (backend auto-detects other participant)
     * @param conversationId ID của conversation
     */
    async blockUser(conversationId: string) {
        const response = await this.api.post(`/${conversationId}/block`);
        return response.data;
    }

    /**
     * Bỏ chặn người dùng (backend auto-detects other participant)
     * @param conversationId ID của conversation
     */
    async unblockUser(conversationId: string) {
        const response = await this.api.post(`/${conversationId}/unblock`);
        return response.data;
    }

    /**
     * Kiểm tra xem người dùng hiện tại có bị chặn hay không
     * Trả về: { isBlocked, blockedBy, blockedAt, canUnblock, conversationId, otherUserId }
     */
    async getBlockStatus(conversationId: string) {
        const response = await this.api.get(`/${conversationId}/block-status`);
        return response.data;
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
