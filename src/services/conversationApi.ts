import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
    ConversationView,
    ConversationMessagesResult,
    PaginatedMessagesParams,
    PinnedMessageItem,
} from '../types/conversation';
import {
    buildClientMediaMetadata,
    type ClientMediaType,
} from '../utils/chatMedia';

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_SOCKET_URL ||
    'http://localhost:3000';

const MONGO_OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;

const isPersistedMessageId = (messageId: string) =>
    MONGO_OBJECT_ID_REGEX.test(messageId);

const assertPersistedMessageId = (messageId: string, action: string) => {
    if (!isPersistedMessageId(messageId)) {
        throw new Error(
            `Cannot ${action} message before it has a valid server id.`,
        );
    }
};

export type ConversationMediaItem = {
    _id?: string;
    messageId?: string;
    clientMessageId?: string;
    conversationId?: string;
    senderBy?: string;
    senderName?: string;
    senderAvatar?: string;
    content?: string;
    messageType?: string;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    fileExtension?: string;
    fileCategory?: 'image' | 'video' | 'audio' | 'file';
    fileIcon?:
        | 'image'
        | 'video'
        | 'audio'
        | 'file'
        | 'file-pdf'
        | 'file-word'
        | 'file-excel'
        | 'file-powerpoint'
        | 'file-archive'
        | 'file-text';
    createdAt?: string;
    updatedAt?: string;
    isRevoked?: boolean;
    deletedForUsers?: string[];
};

type UploadBatchResponseItem = {
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    messageType?: string;
    fileExtension?: string;
    fileCategory?: 'image' | 'video' | 'audio' | 'file';
    fileIcon?:
        | 'image'
        | 'video'
        | 'audio'
        | 'file'
        | 'file-pdf'
        | 'file-word'
        | 'file-excel'
        | 'file-powerpoint'
        | 'file-archive'
        | 'file-text';
};

type SendFileResponse = {
    messageId?: string;
    clientMessageId?: string;
    conversationId?: string;
    createdAt?: string;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    messageType?: string;
    fileExtension?: string;
    fileCategory?: 'image' | 'video' | 'audio' | 'file';
    fileIcon?:
        | 'image'
        | 'video'
        | 'audio'
        | 'file'
        | 'file-pdf'
        | 'file-word'
        | 'file-excel'
        | 'file-powerpoint'
        | 'file-archive'
        | 'file-text';
};

class ConversationApiService {
    private api: AxiosInstance;
    private readonly messagesBaseUrl = `${API_BASE_URL}/messages`;

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

    async createConversation(
        data:
            | {
                  type: 'PRIVATE';
                  recipientId: string;
              }
            | {
                  type: 'GROUP';
                  groupName: string;
                  memberIds: string[];
                  memberNicknames?: Array<{
                      userId: string;
                      nickname: string;
                  }>;
                  groupAvatar?: string;
              },
    ) {
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

    async leaveGroup(groupId: string, newAdminUserId?: string) {
        const response = await this.api.post(
            `${API_BASE_URL}/groups/${groupId}/leave`,
            {
                newAdminUserId,
            },
        );
        return response.data;
    }

    async getGroupMembers(groupId: string): Promise<{
        items: Array<{
            userId: string;
            fullName: string | null;
            avatarUrl: string | null;
            role: 'admin' | 'co-admin' | 'member';
            joinedAt: string;
            isMe: boolean;
        }>;
    }> {
        const response = await this.api.get(
            `${API_BASE_URL}/groups/${groupId}/members`,
        );
        return response.data;
    }

    async addGroupMembers(
        groupId: string,
        userIds: string[],
        memberNicknames?: Array<{ userId: string; nickname: string }>,
    ) {
        const response = await this.api.post(
            `${API_BASE_URL}/groups/${groupId}/members`,
            {
                userIds,
                memberNicknames,
            },
        );
        return response.data;
    }

    async updateGroupAutoDelete(groupId: string, autoDeleteDuration: number) {
        const response = await this.api.patch(
            `${API_BASE_URL}/groups/${groupId}/settings/auto-delete`,
            {
                autoDeleteDuration,
            },
        );
        return response.data;
    }

    async dissolveGroup(groupId: string) {
        const response = await this.api.post(
            `${API_BASE_URL}/groups/${groupId}/dissolve`,
        );
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

    async getConversationMedia(
        conversationId: string,
        cursor?: string,
        limit = 30,
    ) {
        const response = await this.api.get<{
            items: ConversationMediaItem[];
            nextCursor: string | null;
        }>(`/${conversationId}/media`, {
            params: {
                cursor,
                limit,
            },
        });

        return response.data;
    }

    async sendMessage(
        conversationId: string,
        content: string,
        options?: {
            messageType?: string;
            clientMessageId?: string;
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
        assertPersistedMessageId(messageId, 'delete');
        const response = await this.api.delete(
            `/${conversationId}/messages/${messageId}`,
        );

        return response.data;
    }

    async toggleMessagePin(conversationId: string, messageId: string) {
        assertPersistedMessageId(messageId, 'pin');
        const response = await this.api.patch(
            `/${conversationId}/messages/${messageId}/pin`,
        );

        return response.data;
    }

    async pinMessage(conversationId: string, messageId: string) {
        assertPersistedMessageId(messageId, 'pin');
        const response = await this.api.post(
            `/${conversationId}/messages/${messageId}/pin`,
        );

        return response.data;
    }

    async unpinMessage(conversationId: string, messageId: string) {
        assertPersistedMessageId(messageId, 'unpin');
        const response = await this.api.delete(
            `/${conversationId}/messages/${messageId}/pin`,
        );

        return response.data;
    }

    async getPinnedMessages(conversationId: string): Promise<{
        items: PinnedMessageItem[];
    }> {
        const response = await this.api.get<{
            items?: PinnedMessageItem[];
            data?: PinnedMessageItem[];
        }>(`/${conversationId}/pinned-messages`);

        return {
            items: response.data.items || response.data.data || [],
        };
    }

    // =========================
    // Advanced message actions
    // =========================

    async recallMessage(conversationId: string, messageId: string) {
        assertPersistedMessageId(messageId, 'recall');
        const response = await this.api.post(
            `/${conversationId}/messages/${messageId}/recall`,
        );
        return response.data;
    }

    async recallMessageById(messageId: string) {
        assertPersistedMessageId(messageId, 'recall');
        const response = await this.api.post(
            `${API_BASE_URL}/messages/${messageId}/recall`,
        );
        return response.data;
    }

    async adminDeleteMessage(messageId: string) {
        assertPersistedMessageId(messageId, 'admin delete');
        const response = await this.api.post(
            `${API_BASE_URL}/messages/${messageId}/admin-delete`,
        );
        return response.data;
    }

    async reactToMessage(
        conversationId: string,
        messageId: string,
        emoji: string,
    ) {
        assertPersistedMessageId(messageId, 'react to');
        const response = await this.api.post(
            `/${conversationId}/messages/${messageId}/reactions`,
            { emoji },
        );
        return response.data;
    }

    async removeReaction(conversationId: string, messageId: string) {
        assertPersistedMessageId(messageId, 'remove reaction from');
        const response = await this.api.delete(
            `/${conversationId}/messages/${messageId}/reactions`,
        );
        return response.data;
    }

    async deleteMessageForMe(conversationId: string, messageId: string) {
        assertPersistedMessageId(messageId, 'delete for self');
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
    // Pin Conversation
    // =========================

    /**
     * Ghim cuộc hội thoại lên đầu danh sách
     * @param conversationId ID của conversation
     */
    async pinConversation(conversationId: string) {
        const response = await this.api.post(`/${conversationId}/pin`);
        return response.data;
    }

    /**
     * Bỏ ghim cuộc hội thoại
     * @param conversationId ID của conversation
     */
    async unpinConversation(conversationId: string) {
        const response = await this.api.post(`/${conversationId}/unpin`);
        return response.data;
    }

    // =========================
    // Upload
    // =========================

    private getAuthHeader() {
        return {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        };
    }

    private async postMessageFormData(
        endpoint: string,
        formData: FormData,
    ): Promise<Response> {
        return fetch(`${this.messagesBaseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getAuthHeader(),
            body: formData,
        });
    }

    async uploadSingle(
        file: File,
        conversationId: string,
        options?: { messageType?: ClientMediaType | string },
    ): Promise<{
        mediaUrl: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        messageType: string;
        fileExtension: string;
        fileCategory: 'image' | 'video' | 'audio' | 'file';
        fileIcon:
            | 'image'
            | 'video'
            | 'audio'
            | 'file'
            | 'file-pdf'
            | 'file-word'
            | 'file-excel'
            | 'file-powerpoint'
            | 'file-archive'
            | 'file-text';
    }> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversationId', conversationId);
        if (options?.messageType) {
            formData.append(
                'messageType',
                String(options.messageType).toUpperCase(),
            );
        }

        const response = await this.postMessageFormData('/upload', formData);

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        const fallbackMeta = buildClientMediaMetadata({
            fileName: file.name,
            mimeType: file.type,
            preferredMessageType: options?.messageType
                ? String(options.messageType)
                : undefined,
        });

        return {
            mediaUrl: data.mediaUrl,
            fileName: data.fileName || file.name,
            fileSize: data.fileSize || file.size,
            mimeType: data.mimeType || file.type,
            messageType: String(data.messageType || fallbackMeta.messageType),
            fileExtension: String(
                data.fileExtension || fallbackMeta.fileExtension,
            ),
            fileCategory: data.fileCategory || fallbackMeta.fileCategory,
            fileIcon: data.fileIcon || fallbackMeta.fileIcon,
        };
    }

    async uploadBatch(
        files: File[],
        conversationId: string,
        options?: { messageType?: ClientMediaType | string },
    ): Promise<{
        conversationId: string;
        items: Array<{
            mediaUrl: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            messageType: string;
            fileExtension: string;
            fileCategory: 'image' | 'video' | 'audio' | 'file';
            fileIcon:
                | 'image'
                | 'video'
                | 'audio'
                | 'file'
                | 'file-pdf'
                | 'file-word'
                | 'file-excel'
                | 'file-powerpoint'
                | 'file-archive'
                | 'file-text';
        }>;
    }> {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        formData.append('conversationId', conversationId);
        if (options?.messageType) {
            formData.append(
                'messageType',
                String(options.messageType).toUpperCase(),
            );
        }

        const response = await this.postMessageFormData(
            '/upload-batch',
            formData,
        );
        if (!response.ok) {
            throw new Error(`Upload batch failed: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            conversationId: String(data.conversationId || conversationId),
            items: Array.isArray(data.items)
                ? (data.items as UploadBatchResponseItem[]).map(
                      (item, index: number) => {
                          const file = files[index];
                          const fallback = buildClientMediaMetadata({
                              fileName: file?.name,
                              mimeType: file?.type,
                              preferredMessageType: options?.messageType
                                  ? String(options.messageType)
                                  : undefined,
                          });

                          return {
                              mediaUrl: String(item?.mediaUrl || ''),
                              fileName: String(
                                  item?.fileName || file?.name || '',
                              ),
                              fileSize: Number(
                                  item?.fileSize || file?.size || 0,
                              ),
                              mimeType: String(
                                  item?.mimeType ||
                                      file?.type ||
                                      fallback.mimeType,
                              ),
                              messageType: String(
                                  item?.messageType || fallback.messageType,
                              ),
                              fileExtension: String(
                                  item?.fileExtension || fallback.fileExtension,
                              ),
                              fileCategory:
                                  item?.fileCategory || fallback.fileCategory,
                              fileIcon: item?.fileIcon || fallback.fileIcon,
                          };
                      },
                  )
                : [],
        };
    }

    async sendSingleFile(payload: {
        file: File;
        conversationId: string;
        clientMessageId: string;
        replyToMessageId?: string;
        content?: string;
        messageType?: ClientMediaType | string;
    }) {
        const formData = new FormData();
        formData.append('file', payload.file);
        formData.append('conversationId', payload.conversationId);
        formData.append('clientMessageId', payload.clientMessageId);
        if (payload.replyToMessageId) {
            formData.append('replyToMessageId', payload.replyToMessageId);
        }
        if (payload.content) {
            formData.append('content', payload.content);
        }
        if (payload.messageType) {
            formData.append(
                'messageType',
                String(payload.messageType).toUpperCase(),
            );
        }

        let response = await this.postMessageFormData('/send-file', formData);
        if (!response.ok && response.status === 404) {
            // Legacy fallback keeps compatibility with older BE routes.
            response = await this.postMessageFormData('/send-file', formData);
        }

        if (!response.ok) {
            throw new Error(`Send file failed: ${response.statusText}`);
        }

        return response.json();
    }

    async sendBatchFiles(payload: {
        files: File[];
        conversationId: string;
        clientMessageIdPrefix: string;
        replyToMessageId?: string;
        content?: string;
        messageType?: ClientMediaType | string;
    }): Promise<{
        conversationId: string;
        count: number;
        items: SendFileResponse[];
        failedItems?: Array<{ index: number; error: string }>;
    }> {
        const formData = new FormData();
        payload.files.forEach((file) => formData.append('files', file));
        formData.append('conversationId', payload.conversationId);
        formData.append('clientMessageIdPrefix', payload.clientMessageIdPrefix);
        if (payload.replyToMessageId) {
            formData.append('replyToMessageId', payload.replyToMessageId);
        }
        if (payload.content) {
            formData.append('content', payload.content);
        }
        if (payload.messageType) {
            formData.append(
                'messageType',
                String(payload.messageType).toUpperCase(),
            );
        }

        const response = await this.postMessageFormData(
            '/send-files',
            formData,
        );
        if (!response.ok && response.status === 404) {
            // Legacy fallback pipeline if new endpoint is unavailable.
            const settled = await Promise.allSettled(
                payload.files.map((file, index) =>
                    this.sendSingleFile({
                        file,
                        conversationId: payload.conversationId,
                        clientMessageId: `${payload.clientMessageIdPrefix}-${index}`,
                        replyToMessageId: payload.replyToMessageId,
                        content: payload.content,
                        messageType: payload.messageType,
                    }),
                ),
            );

            const items: SendFileResponse[] = [];
            const failedItems: Array<{ index: number; error: string }> = [];
            settled.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    items.push(result.value);
                } else {
                    failedItems.push({
                        index,
                        error:
                            result.reason instanceof Error
                                ? result.reason.message
                                : 'Send file failed',
                    });
                }
            });

            return {
                conversationId: payload.conversationId,
                count: items.length,
                items,
                failedItems: failedItems.length ? failedItems : undefined,
            };
        }

        if (!response.ok) {
            throw new Error(`Send files failed: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            conversationId: String(
                data.conversationId || payload.conversationId,
            ),
            count: Number(data.count || 0),
            items: Array.isArray(data.items) ? data.items : [],
            failedItems: Array.isArray(data.failedItems)
                ? data.failedItems
                : undefined,
        };
    }

    async uploadFile(
        file: File,
        conversationId: string,
    ): Promise<{
        mediaUrl: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        messageType: string;
        fileExtension: string;
        fileCategory: 'image' | 'video' | 'audio' | 'file';
        fileIcon:
            | 'image'
            | 'video'
            | 'audio'
            | 'file'
            | 'file-pdf'
            | 'file-word'
            | 'file-excel'
            | 'file-powerpoint'
            | 'file-archive'
            | 'file-text';
    }> {
        return this.uploadSingle(file, conversationId);
    }
}

export const conversationApi = new ConversationApiService();
