import React from 'react';
import { CiCircleList , CiPhone, CiSearch , CiVideoOn } from 'react-icons/ci';

export const ChatHeader: React.FC<{ name?: string }> = ({
    name = 'Olivia Isabella',
}) => {
    return (
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-var(--color-secondary) text-var(--color-text-primary)">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-indigo-500 flex items-center justify-center">
                    <img
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRqHljHwC3uFTM4IyU1hLVqc5KJgrzOFpMvA&s"
                        alt="avatar"
                        className="w-full h-full object-cover rounded-full"
                    />
                </div>
                <div>
                    <div className="font-semibold">{name}</div>
                    <div className="text-xs text-slate-400">Online</div>
                </div>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
                <button className="p-1 hover:bg-slate-200 rounded text-slate-700">
                    <CiPhone className="w-5 h-5" />
                </button>
                <button className="p-1 hover:bg-slate-200 rounded text-slate-700">
                    <CiSearch className="w-5 h-5" />
                </button>
                <button className="p-1 hover:bg-slate-200 rounded text-slate-700">
                    <CiVideoOn className="w-5 h-5" />
                </button>
                <button className="p-1 hover:bg-slate-200 rounded text-slate-700">
                    <CiCircleList className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
