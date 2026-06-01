import React from 'react';
import {
    MdPeople,
    MdGroups,
    MdPersonAdd,
    MdNotificationsActive,
} from 'react-icons/md';

export default function Sidebar() {
    return (
        <aside className="w-64 bg-(--color-background) p-4 h-screen border-r border-gray-200">
            <div className="mb-6">
                <div className="text-lg font-semibold text-(--color-text-primary)">
                    Orion Chat
                </div>
            </div>

            <nav className="space-y-2">
                {/* Danh sách bạn bè */}
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded transition-all hover:bg-(--color-success) hover:text-white group text-(--color-text-secondary)">
                    <MdPeople className="text-xl group-hover:text-white" />
                    <span className="font-medium">Friend list</span>
                </button>

                {/* Danh sách nhóm */}
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded transition-all hover:bg-(--color-success) hover:text-white group text-(--color-text-secondary)">
                    <MdGroups className="text-xl group-hover:text-white" />
                    <span className="font-medium">Groups and communities</span>
                </button>

                {/* Lời mời kết bạn */}
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded transition-all hover:bg-(--color-success) hover:text-white group text-(--color-text-secondary)">
                    <MdPersonAdd className="text-xl group-hover:text-white" />
                    <span className="font-medium">Friend requests</span>
                </button>

                {/* Thông báo nhóm */}
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded transition-all hover:bg-(--color-success) hover:text-white group text-(--color-text-secondary)">
                    <MdNotificationsActive className="text-xl group-hover:text-white" />
                    <span className="font-medium">Group invites</span>
                </button>
            </nav>
        </aside>
    );
}
