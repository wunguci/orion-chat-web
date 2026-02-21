import React from 'react'
import { IoMdAdd, IoMdSend } from 'react-icons/io';

export const ChatInput: React.FC = ()=>{
    return (
        <div className="px-4 py-3 border-t border-slate-200">
            <div className="flex items-center">
                <button className="p-1 border border-slate-200 rounded-full hover:bg-slate-200">
                    <IoMdAdd />
                </button>
                <input
                    className="flex-1 bg-var(--color-secondary) text-var(--color-text-primary) rounded-full px-4 py-2 outline-none"
                    placeholder="Type your message"
                />
                <button className="ml-2 bg-teal-500 text-white px-4 py-2 rounded-full online-none hover:bg-teal-600">
                    <IoMdSend />
                </button>
            </div>
        </div>
    );
}

export default ChatInput
