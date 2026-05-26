import { useEffect, useState } from "react";
import { conversationApi } from "../../services/conversationApi";
import { workHubApi } from "../../features/work-hub/work-hub.api";
import { mapWorkspace } from "../../features/work-hub/work-hub.mappers";
import { getUser } from "../../utils/token";
import type { User } from "../../types/work-hub.types";
import ChatInput from "../chat/ChatInput";
import MessageList, { type SocketMessage } from "../chat/MessageList";

interface FloatingWorkHubChatProps {
  workspaceId: string;
}

const FloatingWorkHubChat = ({ workspaceId }: FloatingWorkHubChatProps) => {
  const [members, setMembers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SocketMessage[]>([]);
  const currentUser = getUser();
  const currentUserId = currentUser?.userId ?? currentUser?.id ?? "";

  useEffect(() => {
    let cancelled = false;
    workHubApi
      .getWorkspace(workspaceId)
      .then((workspace) => {
        if (cancelled) return;
        setMembers(
          mapWorkspace(workspace)
            .members.map((member) => member.user)
            .filter((member) => member.id !== currentUserId),
        );
      })
      .catch(() => setMembers([]));
    return () => {
      cancelled = true;
    };
  }, [workspaceId, currentUserId]);

  useEffect(() => {
    const handler = (event: Event) => {
      const userId = (event as CustomEvent<{ userId?: string }>).detail?.userId;
      const member = members.find((item) => item.id === userId);
      if (member) void openConversation(member);
    };
    window.addEventListener("workhub:open-member-chat", handler);
    return () => window.removeEventListener("workhub:open-member-chat", handler);
  }, [members]);

  const openConversation = async (member: User) => {
    setIsOpen(true);
    setActiveUser(member);
    const conversation = await conversationApi.getOrCreatePrivateConversation(
      member.id,
    );
    const nextConversationId = conversation.conversationId as string;
    setConversationId(nextConversationId);
    const result = await conversationApi.getMessagesByConversation({
      conversationId: nextConversationId,
      limit: 30,
    });
    const items = Array.isArray(result.items) ? result.items : [];
    setMessages(items.map(mapConversationMessage));
  };

  const handleSend = async (text: string) => {
    if (!conversationId || !text.trim()) return;
    const sent = await conversationApi.sendMessage(conversationId, text.trim());
    setMessages((prev) => [...prev, mapConversationMessage(sent)]);
  };

  const handleSendFiles = async (files: File[]) => {
    if (!conversationId) return;
    const response = await conversationApi.sendBatchFiles({
      files,
      conversationId,
      clientMessageIdPrefix: `workhub-${Date.now()}`,
    });
    setMessages((prev) => [
      ...prev,
      ...(response.items || []).map((item) =>
        mapConversationMessage({ ...item, conversationId }),
      ),
    ]);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {isOpen && (
        <div className="mb-3 h-[520px] w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">
                {activeUser ? activeUser.name : "WorkHub chat"}
              </div>
              <div className="text-xs text-slate-500">
                {activeUser ? "Direct conversation" : "Choose a member"}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100"
              title="Minimize"
            >
              <i className="fas fa-minus"></i>
            </button>
          </div>

          {!activeUser ? (
            <div className="max-h-[460px] overflow-y-auto p-3">
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => void openConversation(member)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-50"
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                    {member.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-[468px] flex-col">
              <MessageList
                socketMessages={messages}
                currentUserId={currentUserId}
                conversationId={conversationId}
              />
              <ChatInput
                onSend={(text) => void handleSend(text)}
                onSendFiles={handleSendFiles}
              />
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (isOpen) return;
          setActiveUser(null);
          setConversationId(null);
          setMessages([]);
        }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-wh-green-primary text-white shadow-xl transition hover:bg-wh-green-primary-hover"
        title="WorkHub chat"
      >
        <i className="fas fa-comment-dots text-lg"></i>
      </button>
    </div>
  );
};

function mapConversationMessage(raw: any): SocketMessage {
  return {
    id: String(raw.messageId || raw._id || raw.id || raw.clientMessageId || Date.now()),
    clientMessageId: raw.clientMessageId,
    senderId: String(raw.senderBy || raw.senderId || raw.sender?.userId || ""),
    senderName: String(raw.senderName || raw.sender?.fullName || "User"),
    senderAvatar: raw.senderAvatar || raw.sender?.avatarUrl,
    content: String(raw.content || ""),
    timestamp: String(raw.createdAt || raw.timestamp || new Date().toISOString()),
    conversationId: raw.conversationId,
    type: raw.messageType?.toLowerCase?.() || raw.type || "text",
    isFile: Boolean(raw.mediaUrl || raw.fileName || raw.isFile),
    fileUrl: raw.mediaUrl || raw.fileUrl,
    fileName: raw.fileName,
    fileType: raw.mimeType || raw.fileType,
    fileCategory: raw.fileCategory,
    fileIcon: raw.fileIcon,
  };
}

export default FloatingWorkHubChat;
