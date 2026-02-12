import type React from "react";
import type { ChatSession } from "../../types/aichat";
import { useState } from "react";
import { MdOutlineChatBubbleOutline, MdOutlineModeEdit } from "react-icons/md";
import { FaRegTrashAlt } from "react-icons/fa";

interface AIChatListProps {
  chats: ChatSession[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
}

const AIChatList: React.FC<AIChatListProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
}) => {
  const [editingID, setEditingID] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // start renaming
  const startEditing = (e: React.MouseEvent, chat: ChatSession) => {
    e.stopPropagation();
    setEditingID(chat.id);
    setEditValue(chat.title);
  };

  // save rename
  const handleSave = () => {
    if (editingID && editValue.trim()) {
      onRenameChat(editingID, editValue.trim());
    }
    setEditingID(null);
  };

  // key down for rename
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setEditingID(null);
  };

  // delete chat
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteChat(id);
  };

  return (
    <div className="p-4 pb-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">
        Recent Chats
      </p>
      <div className="space-y-1">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border relative ${
              activeChatId === chat.id
                ? "bg-teal-50 border-teal-500/50 shadow-md"
                : "hover:bg-slate-50 border-transparent hover:border-slate-100"
            }`}
          >
            <MdOutlineChatBubbleOutline
              className={`text-lg shrink-0 ${activeChatId === chat.id ? "text-teal-500" : "text-slate-400"}`}
            />
            <div className="flex-1 overflow-hidden">
              {editingID === chat.id ? (
                <input
                  autoFocus
                  className="w-full h-8 pl-10 pr-4 bg-slate-100 border-none outline-none appearance-none shadow-none ring-0
          focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 rounded-sm text-sm transition-all placeholder:text-slate-800"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <p
                    className={`text-sm truncate ${activeChatId === chat.id ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}
                  >
                    {chat.title}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {chat.preview}
                  </p>
                </>
              )}
            </div>

            {editingID !== chat.id && (
              <div className="flex gap-1 group-hover:opacity-100 transition-all shrink-0">
                <button
                  onClick={(e) => startEditing(e, chat)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-teal-500 transition-colors cursor-pointer"
                  title="Rename"
                >
                  <MdOutlineModeEdit className="text-[16px]" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, chat.id)}
                  className="p-1.5 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete"
                >
                  <FaRegTrashAlt className="text-[16px]" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIChatList;
