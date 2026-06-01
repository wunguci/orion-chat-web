import { useEffect, useRef, useState } from "react";
import ContextAIChatPanel from "../../components/ai-chat/ContextAIChatPanel";
import { Role, type ChatSession, type Message } from "../../types/aichat";
import { Dialog } from "../../components/common/Dialog";
import AIChatHeader from "../../components/ai-chat/AIChatHeader";
import AIChatInput from "../../components/ai-chat/AIChatInput";
import { MessageAIList } from "../../components/ai-chat/MessageAIList";
import { MdOutlineChatBubbleOutline } from "react-icons/md";
import { aiChatService } from "../../services/aiChatService";

const INITIAL_CHATS: ChatSession[] = [
  {
    id: "1",
    title: "Q4 Project Strategy",
    preview: "Discussed revenue targets...",
    updatedAt: Date.now(),
    messages: [
      {
        id: "m1",
        role: Role.MODEL,
        content:
          "Hello! I'm your premium AI assistant. How can I help you today?",
        timestamp: Date.now() - 10000,
      },
    ],
  },
];

const AIChatPage: React.FC = () => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(
    null,
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const loadedMessagesRef = useRef<Set<string>>(new Set());

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const sessions = await aiChatService.listSessions();
        if (sessions.length === 0) {
          const created = await aiChatService.createSession();
          setChats([created]);
          setActiveChatId(created.id);
          return;
        }

        setChats(sessions);
        setActiveChatId((prev) => prev || sessions[0].id);
      } catch (error) {
        console.error("Failed to initialize AI sessions:", error);
        setChats(INITIAL_CHATS);
        setActiveChatId(INITIAL_CHATS[0].id);
      } finally {
        setIsInitializing(false);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChatId || loadedMessagesRef.current.has(activeChatId)) {
        return;
      }

      try {
        const messages = await aiChatService.getMessages(activeChatId);
        loadedMessagesRef.current.add(activeChatId);

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  messages,
                  preview:
                    messages[messages.length - 1]?.content.slice(0, 30) ||
                    "Start chatting...",
                }
              : chat,
          ),
        );
      } catch (error) {
        console.error("Failed to load chat messages:", error);
      }
    };

    void loadMessages();
  }, [activeChatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat?.messages, isTyping]);

  const createNewChat = async (): Promise<ChatSession | null> => {
    try {
      const newChat = await aiChatService.createSession();
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      return newChat;
    } catch (error) {
      console.error("Failed to create chat session:", error);
      return null;
    }
  };

  const handleSendMessage = async (
    text?: string,
    attachment?: { mimeType: string; data: string },
  ) => {
    if (isTyping) return;

    let currentChat: ChatSession | null = activeChat ?? null;
    if (!currentChat) {
      currentChat = await createNewChat();
      if (!currentChat) return;
    }

    const messageText = text || input;
    if (!messageText.trim() && !attachment) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content:
        messageText + (attachment ? ` [Attached ${attachment.mimeType}]` : ""),
      timestamp: Date.now(),
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === currentChat.id
          ? {
              ...c,
              messages: [...c.messages, userMsg],
              updatedAt: Date.now(),
              preview: messageText.slice(0, 30) || "Attachment Sent",
            }
          : c,
      ),
    );

    setInput("");
    setIsTyping(true);

    try {
      const response = await aiChatService.sendMessage(currentChat.id, {
        message: messageText,
        attachment,
      });

      loadedMessagesRef.current.add(currentChat.id);

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        content: response.assistantMessage,
        timestamp: Date.now(),
      };

      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChat.id
            ? {
                ...c,
                messages: [...c.messages, modelMsg],
                updatedAt: Date.now(),
              }
            : c,
        ),
      );
    } catch (error) {
      console.error("Failed to fetch AI response:", error);

      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        content:
          "Sorry, the AI system is temporarily down. Please try again in a few minutes.",
        timestamp: Date.now(),
      };

      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChat.id
            ? {
                ...c,
                messages: [...c.messages, fallbackMsg],
                updatedAt: Date.now(),
              }
            : c,
        ),
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
    );

    void aiChatService.renameSession(id, newTitle).catch((error) => {
      console.error("Failed to rename session:", error);
    });
  };

  const confirmDeleteChat = (id: string) => {
    setShowConfirmDelete(id);
  };

  const executeDelete = () => {
    if (!showConfirmDelete) return;

    const idToDelete = showConfirmDelete;
    const updatedChats = chats.filter((c) => c.id !== idToDelete);
    setChats(updatedChats);

    if (activeChatId === idToDelete) {
      if (updatedChats.length > 0) setActiveChatId(updatedChats[0].id);
      else setActiveChatId("");
    }

    void aiChatService.deleteSession(idToDelete).catch((error) => {
      console.error("Failed to delete session:", error);
    });

    setShowConfirmDelete(null);
  };

  return (
    <div className="flex h-screen bg-white transition-colors">
      <ContextAIChatPanel
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={() => {
          void createNewChat();
        }}
        onSkillClick={handleSendMessage}
        onRenameChat={handleRenameChat}
        onDeleteChat={confirmDeleteChat}
      />

      <main className="flex-1 flex flex-col bg-white overflow-hidden hide-scrollbar relative">
        {isInitializing ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Loading conversations...
          </div>
        ) : activeChat ? (
          <>
            <AIChatHeader
              title={activeChat.title}
              onRename={(newTitle) => handleRenameChat(activeChat.id, newTitle)}
              onDelete={() => confirmDeleteChat(activeChat.id)}
            />

            <MessageAIList
              messages={activeChat.messages}
              isTyping={isTyping}
              scrollRef={scrollRef}
            />

            <AIChatInput
              input={input}
              setInput={setInput}
              onSend={handleSendMessage}
              isTyping={isTyping}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center text-slate-400 gap-4 justify-center">
            <MdOutlineChatBubbleOutline className="text-6xl opacity-20" />
            <p className="font-medium">Select or create a new chat to begin.</p>
            <button
              onClick={() => {
                void createNewChat();
              }}
              className="px-6 py-2 bg-green-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform cursor-pointer"
            >
              New Chat
            </button>
          </div>
        )}

        <Dialog
          isOpen={!!showConfirmDelete}
          type="danger"
          title="Delete Conversation?"
          message="This will remove the chat history permanently."
          confirmText="Delete"
          onClose={() => setShowConfirmDelete(null)}
          onConfirm={executeDelete}
        />
      </main>
    </div>
  );
};

export default AIChatPage;
