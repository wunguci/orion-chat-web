import React from "react";
import { type Message } from "../../types/aichat";
import { MessageAIItem } from "./MessageAIItem";
import { MdSync } from "react-icons/md";

interface MessageAIListProps {
  messages: Message[];
  isTyping: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export const MessageAIList: React.FC<MessageAIListProps> = ({
  messages,
  isTyping,
  scrollRef,
}) => {
  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-8"
    >
      <div className="max-w-3xl mx-auto space-y-8 pb-48">
        {messages.map((msg) => (
          <MessageAIItem key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <div className="flex gap-4 animate-fade-in">
            <div className="size-8 rounded-lg bg-teal-500 text-white flex items-center justify-center shrink-0">
              <MdSync className="text-xl animate-spin"/>
            </div>
            <div className="flex-1">
              <div className="bg-white p-6 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm w-fit">
                <div className="flex gap-1">
                  <div className="size-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="size-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="size-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
