import React from 'react';
import SearchBox from '../common/SearchBox';

export const ChatSidebar: React.FC = () => {
    const [searchChatQuery, setSearchChatQuery] = React.useState('');
    const chats = [
        {
            name: 'Olivia Isabella',
            avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRqHljHwC3uFTM4IyU1hLVqc5KJgrzOFpMvA&s',
            last: 'The weather will be perfect',
            time: '9:41 AM',
        },
        {
            avatar: 'https://demoda.vn/wp-content/uploads/2023/06/avatar-anime-anh-dai-dien-anime-nam-ngau.jpg',
            name: 'Photographers',
            last: "Here's my latest drone ...",
            time: '9:16 AM',
        },
        {
            avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBMGZwpiEiGve4tJJS4yEnFZcvLPBgPUsM3g&s',
            name: 'SpaceX Crew-16 Launch',
            last: "I've been there!",
            time: 'Thursday',
        },
        {
            avatar: 'https://m.yodycdn.com/blog/avatar-dep-cho-nam-yody-vn47.jpg',
            name: 'Helen Flatley',
            last: 'You: Ok',
            time: '12/13/21',
        },
    ];

    return (
        <aside className="w-80 bg-var(--color-background) h-screen flex flex-col">
            <div className="p-4 gap-3 border-b border-slate-200 relative z-20">
                <SearchBox
                    value={searchChatQuery}
                    onChange={setSearchChatQuery}
                    placeholder="Search chat ..."
                />
            </div>
            <div className="px-3 py-2 text-sm text-slate-400">Tất cả</div>
            <div className="flex-1 overflow-y-auto">
                {chats.map((c, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 px-3 py-3 hover:bg-green-bg-heavy cursor-pointer rounded"
                    >
                        {c.avatar && (
                            <img
                                src={c.avatar}
                                alt="avatar"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        )}
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <div className="font-medium">{c.name}</div>
                                <div className="text-xs text-slate-400">
                                    {c.time}
                                </div>
                            </div>
                            <div className="text-sm text-slate-500 truncate">
                                {c.last}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default ChatSidebar;
