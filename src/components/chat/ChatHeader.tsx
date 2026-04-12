import React from 'react';
import { CiCircleList, CiPhone, CiSearch, CiVideoOn } from 'react-icons/ci';

export const ChatHeader: React.FC<{
    name?: string;
    isBlocked?: boolean;
    onPanelToggle?: () => void;
    onSearchClick?: () => void;
}> = ({
    name = 'Olivia Isabella',
    isBlocked = false,
    onPanelToggle,
    onSearchClick,
}) => {
    return (
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between text-gray-primary">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-gray-border flex items-center justify-center">
                    <img
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRqHljHwC3uFTM4IyU1hLVqc5KJgrzOFpMvA&s"
                        alt="avatar"
                        className="w-full h-full object-cover rounded-full"
                    />
                </div>
                <div>
                    <div className="font-semibold">{name}</div>
                    <div className="text-xs text-gray-secondary">Online</div>
                </div>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
                {/* Audio call button - disabled if blocked */}
                <button
                    className={`p-1 rounded transition-colors ${
                        isBlocked
                            ? 'opacity-50 cursor-not-allowed bg-slate-100'
                            : 'hover:bg-slate-200 text-gray-primary'
                    }`}
                    disabled={isBlocked}
                    title={
                        isBlocked
                            ? 'Không thể gọi vì bạn bị chặn'
                            : 'Gọi điện'
                    }
                >
                    <CiPhone className="w-5 h-5" />
                </button>
                <button
                    onClick={onSearchClick}
                    className="p-1 hover:bg-slate-200 rounded text-gray-primary transition-colors"
                    title="Tìm kiếm tin nhắn"
                >
                    <CiSearch className="w-5 h-5" />
                </button>
                {/* Video call button - disabled if blocked */}
                <button
                    className={`p-1 rounded transition-colors ${
                        isBlocked
                            ? 'opacity-50 cursor-not-allowed bg-slate-100'
                            : 'hover:bg-slate-200 text-gray-primary'
                    }`}
                    disabled={isBlocked}
                    title={
                        isBlocked
                            ? 'Không thể gọi video vì bạn bị chặn'
                            : 'Gọi video'
                    }
                >
                    <CiVideoOn className="w-5 h-5" />
                </button>
                <button
                    onClick={onPanelToggle}
                    className="p-1 hover:bg-slate-200 rounded text-gray-primary"
                    title="Thông tin hội thoại"
                >
                    <CiCircleList className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
