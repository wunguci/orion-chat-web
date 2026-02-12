
import React from 'react';
import  { type Message, Role } from '../../types/aichat';
import { Avatar } from '../common/Avatar';
import { MdOutlineSmartToy } from "react-icons/md";

interface MessageAIItemProps {
  message: Message;
}

export const MessageAIItem: React.FC<MessageAIItemProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
        isUser ? 'bg-slate-200' : 'bg-teal-500 text-white'
      }`}>
        {isUser ? (
          <Avatar alt="Trần Vũ"/>
        ) : (
          <MdOutlineSmartToy className="text-xl" />
        )}
      </div>
      <div className={`flex-1 flex flex-col ${isUser ? 'items-end' : ''}`}>
        <div className={`p-6 rounded-2xl shadow-sm border max-w-[85%] ${
          isUser 
            ? 'bg-teal-500 text-white rounded-tr-none border-transparent' 
            : 'bg-white rounded-tl-none border-slate-100 text-slate-800'
        }`}>
          <p className="leading-relaxed whitespace-pre-wrap text-sm md:text-base">{message.content}</p>
        </div>
        <span className="text-[10px] text-slate-400 mt-2 uppercase tracking-tighter font-medium">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
