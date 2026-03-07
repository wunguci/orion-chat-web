import { useEffect, useRef, useState } from "react";
import ContextAIChatPanel from "../../components/ai-chat/ContextAIChatPanel";
import { Role, type ChatSession, type Message } from "../../types/aichat";
import { Dialog } from "../../components/common/Dialog";
import { ToastUndo } from "../../components/common/ToastUndo";
import { gemini } from "../../services/geminiService";
import AIChatHeader from "../../components/ai-chat/AIChatHeader";
import AIChatInput from "../../components/ai-chat/AIChatInput";
import { MessageAIList } from "../../components/ai-chat/MessageAIList";
import { MdOutlineChatBubbleOutline } from "react-icons/md";

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
  const [chats, setChats] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem("ai_chats");
    return saved ? JSON.parse(saved) : INITIAL_CHATS;
  });
  const [activeChatId, setActiveChatId] = useState<string>(chats[0]?.id || "");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(
    null,
  );
  const [undoItem, setUndoItem] = useState<{
    chat: ChatSession;
    index: number;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const undoTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem("ai_chats", JSON.stringify(chats));
  }, [chats]);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat?.messages, isTyping]);

  // send message
  const handleSendMessage = async (
    text?: string,
    attachment?: { mimeType: string; data: string },
  ) => {
    const messageText = text || input;
    if ((!messageText.trim() && !attachment) || isTyping || !activeChat) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content:
        messageText + (attachment ? ` [Attached ${attachment.mimeType}]` : ""),
      timestamp: Date.now(),
    };

    const newMessages = [...activeChat.messages, userMsg];

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              messages: newMessages,
              updateAt: Date.now(),
              preview: messageText.slice(0, 30) || "Attachment Sent",
            }
          : c,
      ),
    );
    setInput("");
    setIsTyping(true);

    try {
      const modelMsgId = (Date.now() + 1).toString();
      let fullResponse = "";
      const stream = gemini.streamChat(
        activeChat.messages,
        messageText,
        attachment,
      );
      for await (const chunk of stream) {
        fullResponse += chunk;
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChatId) {
              const lastMsg = c.messages[c.messages.length - 1];
              if (
                lastMsg &&
                lastMsg.role === Role.MODEL &&
                lastMsg.id === modelMsgId
              ) {
                return {
                  ...c,
                  messages: [
                    ...c.messages.slice(0, -1),
                    { ...lastMsg, content: fullResponse },
                  ],
                };
              } else {
                return {
                  ...c,
                  messages: [
                    ...c.messages,
                    {
                      id: modelMsgId,
                      role: Role.MODEL,
                      content: fullResponse,
                      timestamp: Date.now(),
                    },
                  ],
                };
              }
            }
            return c;
          }),
        );
      }
    } catch (error) {
      console.error("Failed to fetch response:", error);
    } finally {
      setIsTyping(false);
    }
  };

  // rename
  const handleRenameChat = (id: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
    );
  };

  // confirm delete
  const confirmDeleteChat = (id: string) => {
    setShowConfirmDelete(id);
  };

  // execute delete
  const executeDelete = () => {
    if (!showConfirmDelete) return;
    const idToDelete = showConfirmDelete;
    const chatIndex = chats.findIndex((c) => c.id === idToDelete);
    const chatToDelete = chats[chatIndex];

    if (chatToDelete) {
      setUndoItem({ chat: chatToDelete, index: chatIndex });
      const updatedChats = chats.filter((c) => c.id !== idToDelete);
      setChats(updatedChats);

      if (activeChatId === idToDelete) {
        if (updatedChats.length > 0) setActiveChatId(updatedChats[0].id);
        else setActiveChatId("");
      }

      if (undoTimeRef.current) clearTimeout(undoTimeRef.current);
      undoTimeRef.current = setTimeout(() => {
        setUndoItem(null);
      }, 4000);
    }
    setShowConfirmDelete(null);
  };

  // undo delete
  const handleUndo = () => {
    if (undoItem) {
      const newChats = [...chats];
      newChats.splice(undoItem.index, 0, undoItem.chat);
      setChats(newChats);
      setActiveChatId(undoItem.chat.id);
      setUndoItem(null);
      if (undoTimeRef.current) clearTimeout(undoTimeRef.current);
    }
  };

  // create new chat
  const createNewChat = (currentChats = chats) => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: "New Conversation",
      preview: "Start chatting...",
      updatedAt: Date.now(),
      messages: [
        {
          id: Date.now().toString(),
          role: Role.MODEL,
          content: "Hello! How can I assist you with your project today?",
          timestamp: Date.now(),
        },
      ],
    };
    setChats([newChat, ...currentChats]);
    setActiveChatId(newChat.id);
  };

  return (
    <div className="flex h-screen bg-white transition-colors">
      <ContextAIChatPanel
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={() => createNewChat()}
        onSkillClick={handleSendMessage}
        onRenameChat={handleRenameChat}
        onDeleteChat={confirmDeleteChat}
      />

      <main className="flex-1 flex flex-col bg-white overflow-hidden hide-scrollbar relative">
        {activeChat ? (
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
              onClick={() => createNewChat()}
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
          message="This will remove the chat history. You can undo this for a few seconds after deletion."
          confirmText="Delete"
          onClose={() => setShowConfirmDelete(null)}
          onConfirm={executeDelete}
        />

        <ToastUndo
          isVisible={!!undoItem}
          message="Conversation deleted"
          onUndo={handleUndo}
          duration={4000}
        />
      </main>
    </div>
  );
};

export default AIChatPage;
