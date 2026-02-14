import React, { useMemo, useState } from 'react';
import Sidebar from '../../components/contacts/Sidebar';
import TopControls from '../../components/contacts/TopControls';
import FriendList from '../../components/contacts/ContactList';

export default function FriendPage() {
    // mock data (replace with real API data)
    const [friends] = useState([
        { id: '1', name: 'Ái Nhi', avatar: '/avatars/1.jpg' },
        { id: '2', name: 'Anh Lý', avatar: '/avatars/2.jpg' },
        { id: '3', name: 'Ba Lý', avatar: '/avatars/3.jpg' },
        { id: '4', name: 'Bảo Uyên', avatar: '/avatars/4.jpg' },
        { id: '5', name: 'Bích Trâm', avatar: '/avatars/5.jpg' },
        { id: '6', name: 'Bùi Ngọc Sang', avatar: '/avatars/6.jpg' },
        { id: '7', name: 'Bui Viet Sang', avatar: '/avatars/7.jpg' },
        { id: '8', name: 'Buicongdanh', avatar: '/avatars/8.jpg' },
        // ...add more mock items as needed...
    ]);

    const [query, setQuery] = useState('');
    const [sort, setSort] = useState<'name-asc' | 'name-desc' | 'recent'>(
        'name-asc',
    );
    const [filter, setFilter] = useState<'all' | 'online'>('all');

    const filtered = useMemo(() => {
        let list = friends.filter((f) =>
            f.name.toLowerCase().includes(query.trim().toLowerCase()),
        );
        if (filter === 'online') {
            // mock: keep even ids as online
            list = list.filter((f) => parseInt(f.id) % 2 === 0);
        }
        if (sort === 'name-asc') {
            list = list.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === 'name-desc') {
            list = list.sort((a, b) => b.name.localeCompare(a.name));
        }
        return list;
    }, [friends, query, sort, filter]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main content */}
            <div className="flex-1 p-6">
                <h1 className="text-xl font-semibold mb-4">Danh sách bạn bè</h1>
                <TopControls
                    query={query}
                    onQueryChange={setQuery}
                    sort={sort}
                    onSortChange={setSort}
                    filter={filter}
                    onFilterChange={setFilter}
                />
                <FriendList friends={filtered} />
            </div>
        </div>
    );
}
