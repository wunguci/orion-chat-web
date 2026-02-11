import type React from "react";
import type { ChatSession } from "../../types/aichat";
import AIChatSearchBox from "./AIChatSearchBox";
import { FaPlus } from "react-icons/fa6";
import { useState } from "react";
import AISkillList from "../ai-chat/AISkillList";
import AIChatList from "./AIChatList";

interface ContextAIChatPanelProps {
  chats: ChatSession[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onSkillClick: (prompt: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
}

const ContextAIChatPanel: React.FC<ContextAIChatPanelProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onSkillClick,
  onRenameChat,
  onDeleteChat,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chats.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.preview.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <section className="w-80 flex flex-col border-r border-slate-200 bg-white z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-5 border-b border-slate-200 ">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            AI Assistant
          </h1>
          <button
            onClick={onNewChat}
            className="w-8 h-8 flex items-center justify-center bg-teal-500 text-white rounded-lg hover:bg-teal-700 transition-all active:scale-90 shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            <FaPlus className="w-4 h-4" />
          </button>
        </div>
        <AIChatSearchBox value={searchQuery} onChange={setSearchQuery} />
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          {filteredChats.length > 0 ? (
            <AIChatList
              chats={filteredChats}
              activeChatId={activeChatId}
              onSelectChat={onSelectChat}
              onRenameChat={onRenameChat}
              onDeleteChat={onDeleteChat}
            />
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm italic">
              No chats found
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <AISkillList onSkillClick={onSkillClick} />
        </div>
      </div>
    </section>
  );
};

export default ContextAIChatPanel;
