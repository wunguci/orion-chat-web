import { useEffect, useRef, useState } from "react";
import ContextAIChatPanel from "../../components/ai-chat/ContextAIChatPanel";
import { Role, type ChatSession } from "../../types/aichat";

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

const AIChatPage = () => {
    const [chats, setChats] = useState<ChatSession[]>(() => {
        const saved = localStorage.getItem("ai_chats");
        return saved ? JSON.parse(saved) : INITIAL_CHATS;
    })
    const [activeChatId, setActiveChatId] = useState<string>(chats[0]?.id || "");
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
    const [undoItem, setUndoItem] = useState<{ chat: ChatSession; index: number } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const undoTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        localStorage.setItem("ai_chats", JSON.stringify(chats));
    }, [chats]);

    const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeChat?.messages, isTyping]);



    return (
        <div className="flex h-screen bg-white transition-colors">
            <ContextAIChatPanel 
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={setActiveChatId}
                onNewChat={() => {}}
                onSkillClick={() => {}}
                onRenameChat={() => {}}
                onDeleteChat={() => {}}
            />
        </div>
    )
}

export default AIChatPage;