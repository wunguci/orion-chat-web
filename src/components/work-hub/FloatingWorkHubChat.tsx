import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { workHubApi } from "../../features/work-hub/work-hub.api";
import { mapWorkspace } from "../../features/work-hub/work-hub.mappers";
import { getUser } from "../../utils/token";
import type { User } from "../../types/work-hub.types";
import { useDraggable } from "../../hooks/useDraggable";
import FloatingChatWindow from "./FloatingChatWindow";
import presenceSocketService from "../../services/websocket/presenceSocket";
import ChatAvatar from "../common/ChatAvatar";
import { type SocketMessage } from "../chat/MessageList";

interface FloatingWorkHubChatProps {
  workspaceId: string;
}

export function mapConversationMessage(raw: any): SocketMessage {
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

const FloatingWorkHubChat = ({ workspaceId }: FloatingWorkHubChatProps) => {
  const [members, setMembers] = useState<User[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [activeChats, setActiveChats] = useState<User[]>([]);
  
  const currentUser = getUser();
  const currentUserId = currentUser?.userId ?? currentUser?.id ?? "";

  // Make the member list popup draggable
  const headerRef = useRef<HTMLDivElement>(null);
  const { position, setPosition } = useDraggable({
    initialPosition: { x: window.innerWidth - 380, y: window.innerHeight - 560 },
    handleRef: headerRef,
  });

  // Load workspace members
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

  // Handle Online Status
  useEffect(() => {
    const socket = presenceSocketService.getSocket();
    if (!socket) return;

    const handleOnlineList = (users: string[]) => {
      setOnlineUserIds(new Set(users));
    };

    const handleUserOnline = ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on("presence:online-list", handleOnlineList);
    socket.on("presence:user-online", handleUserOnline);
    socket.on("presence:user-offline", handleUserOffline);
    socket.emit("presence:get-online");

    return () => {
      socket.off("presence:online-list", handleOnlineList);
      socket.off("presence:user-online", handleUserOnline);
      socket.off("presence:user-offline", handleUserOffline);
    };
  }, []);

  // Update member status based on online socket info
  const sortedMembers = useMemo(() => {
    const mapped = members.map(m => ({
        ...m,
        status: onlineUserIds.has(m.id) ? 'online' as const : 'offline' as const
    }));
    
    // Sort online first
    return mapped.sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (b.status === 'online' && a.status !== 'online') return 1;
        return a.name.localeCompare(b.name);
    });
  }, [members, onlineUserIds]);

  // Handle opening a chat session via external events
  useEffect(() => {
    const handler = (event: Event) => {
      const userId = (event as CustomEvent<{ userId?: string }>).detail?.userId;
      const member = sortedMembers.find((item) => item.id === userId);
      if (member) openChat(member);
    };
    window.addEventListener("workhub:open-member-chat", handler);
    return () => window.removeEventListener("workhub:open-member-chat", handler);
  }, [sortedMembers]);

  const openChat = (user: User) => {
    setActiveChats((prev) => {
        if (prev.some(u => u.id === user.id)) return prev;
        return [...prev, user];
    });
  };

  const closeChat = (userId: string) => {
    setActiveChats((prev) => prev.filter(u => u.id !== userId));
  };

  return (
    <>
      {/* Draggable Member List Popup */}
      {isOpen && (
        <div 
            className="fixed z-40 mb-3 h-[520px] w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col"
            style={{ left: position.x, top: position.y }}
        >
          <div 
            ref={headerRef}
            className="flex items-center justify-between border-b border-slate-200 px-4 py-3 cursor-move hover:bg-slate-50 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">
                WorkHub chat
              </div>
              <div className="text-xs text-slate-500">
                Choose a member
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              title="Close"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {sortedMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => openChat(member)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-50 transition-colors group"
              >
                <div className="relative shrink-0">
                    <ChatAvatar name={member.name} avatarUrl={member.avatar} sizeClassName="w-10 h-10" />
                    {member.status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {member.name}
                    </span>
                    <span className={`block text-xs ${member.status === 'online' ? 'text-emerald-500' : 'text-slate-500'}`}>
                        {member.status === 'online' ? 'Đang hoạt động' : 'Ngoại tuyến'}
                    </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <div className="fixed bottom-5 right-5 z-40">
          <button
            onClick={() => {
                // If it was closed, bring it near the button, otherwise close it
                if (!isOpen) {
                    setPosition({ x: window.innerWidth - 380, y: window.innerHeight - 560 });
                }
                setIsOpen((prev) => !prev);
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-wh-green-primary text-white shadow-xl transition hover:bg-wh-green-primary-hover"
            title="WorkHub chat"
          >
            <i className={`fas ${isOpen ? 'fa-times text-2xl' : 'fa-comment-dots text-lg'}`}></i>
          </button>
      </div>

      {/* Render Active Chat Windows */}
      {activeChats.map((user, index) => (
        <FloatingChatWindow
            key={user.id}
            user={user}
            currentUserId={currentUserId}
            onClose={() => closeChat(user.id)}
            initialPosition={{ 
                x: Math.max(20, window.innerWidth - 450 - (index * 40)), 
                y: Math.max(20, window.innerHeight - 650 - (index * 40)) 
            }}
        />
      ))}
    </>
  );
};

export default FloatingWorkHubChat;
