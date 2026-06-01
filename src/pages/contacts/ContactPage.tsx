import React, { useMemo, useState } from 'react';
import Sidebar from '../../components/contacts/Sidebar';
import TopControls from '../../components/contacts/TopControls';
import FriendList from '../../components/contacts/ContactList';

export default function FriendPage() {
    // mock data (replace with real API data)
    const [friends] = useState([
        {
            id: '1',
            name: 'Alice Johnson',
            avatar: '/avatars/1.jpg',
            tags: ['ban-be'],
        },
        {
            id: '2',
            name: 'Bob Smith',
            avatar: '/avatars/2.jpg',
            tags: ['khach-hang'],
        },
        {
            id: '3',
            name: 'Charlie Brown',
            avatar: '/avatars/3.jpg',
            tags: ['dong-nghiep'],
        },
        {
            id: '4',
            name: 'David Miller',
            avatar: '/avatars/4.jpg',
            tags: ['gia-dinh'],
        },
        {
            id: '5',
            name: 'Eva Davis',
            avatar: '/avatars/5.jpg',
            tags: ['cong-viec'],
        },
        {
            id: '6',
            name: 'Frank Wilson',
            avatar: '/avatars/6.jpg',
            tags: ['tra-loi-sau'],
        },
        {
            id: '7',
            name: 'Grace Taylor',
            avatar: '/avatars/7.jpg',
            tags: ['ban-be'],
        },
        {
            id: '8',
            name: 'Hannah Anderson',
            avatar: '/avatars/8.jpg',
            tags: [],
        },
        {
            id: '9',
            name: 'Ian Thomas',
            avatar: '/avatars/9.jpg',
            tags: ['ban-be'],
        },
        {
            id: '10',
            name: 'Jack Jackson',
            avatar: '/avatars/10.jpg',
            tags: ['ban-be'],
        },
        {
            id: '11',
            name: 'Kate White',
            avatar: '/avatars/11.jpg',
            tags: ['ban-be'],
        },
    ]);

    const [query, setQuery] = useState('');
    const [sort, setSort] = useState<'name-asc' | 'name-desc' | 'recent'>(
        'name-asc',
    );
    const [filter, setFilter] = useState<string>('all');

    const filtered = useMemo(() => {
        let list = friends.filter((f) =>
            f.name.toLowerCase().includes(query.trim().toLowerCase()),
        );

        // filter by tag if needed
        if (filter && filter.startsWith('tag:')) {
            const tagId = filter.slice(4);
            list = list.filter((f) => f.tags && f.tags.includes(tagId));
        }

        if (sort === 'name-asc') {
            list = list.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === 'name-desc') {
            list = list.sort((a, b) => b.name.localeCompare(a.name));
        }
        return list;
    }, [friends, query, sort, filter]);

    return (
        <div
            className="min-h-screen flex"
            style={{
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-family-base)',
            }}
        >
            {/* Sidebar */}
            <Sidebar />

            {/* Main content */}
            <div className="flex-1 p-6">
                <h1
                    className="text-xl font-semibold mb-4"
                    style={{
                        color: 'var(--color-text-primary)',
                    }}
                >
                    Friend List
                </h1>
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
