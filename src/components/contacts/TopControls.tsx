import React, { useEffect, useRef, useState } from 'react';
import InputTextWithLabel from '../common/InputTextWithLabel';
import DropdownButton from '../common/DropdownButton';
import { Check } from 'lucide-react';
import { MdSortByAlpha, MdSearch } from 'react-icons/md';

type Props = {
    query: string;
    onQueryChange: (v: string) => void;
    sort: 'name-asc' | 'name-desc' | 'recent';
    onSortChange: (v: 'name-asc' | 'name-desc' | 'recent') => void;
    filter: string;
    onFilterChange: (v: string) => void;
};

const TAGS = [
    { id: 'khach-hang', label: 'Customer', color: 'bg-red-500' },
    { id: 'gia-dinh', label: 'Family', color: 'bg-pink-500' },
    { id: 'cong-viec', label: 'Work', color: 'bg-orange-400' },
    { id: 'ban-be', label: 'Friends', color: 'bg-yellow-400' },
    { id: 'tra-loi-sau', label: 'Reply later', color: 'bg-emerald-400' },
    { id: 'dong-nghiep', label: 'Colleague', color: 'bg-sky-500' },
];

export default function TopControls({
    query,
    onQueryChange,
    sort,
    onSortChange,
    filter,
    onFilterChange,
}: Props) {
    const [filterOpen, setFilterOpen] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement | null>(null);
    const sortRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (
                filterRef.current &&
                !filterRef.current.contains(e.target as Node)
            )
                setFilterOpen(false);
            if (sortRef.current && !sortRef.current.contains(e.target as Node))
                setSortOpen(false);
        }
        document.addEventListener('click', onDoc);
        return () => document.removeEventListener('click', onDoc);
    }, []);

    const selectedTag =
        filter === 'all'
            ? null
            : filter.startsWith('tag:')
            ? filter.slice(4)
            : null;

    return (
        <div
            className="p-4 rounded-xl mb-4 flex flex-wrap gap-6 items-end"
            style={{
                backgroundColor: 'var(--color-surface)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
        >
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
                <InputTextWithLabel
                    label=""
                    placeholder="Search friends..."
                    value={query}
                    fieldName="query"
                    handleInputChange={(_, v) => onQueryChange(v)}
                    icon={MdSearch} // Truyền icon vào đây
                />
            </div>

            {/* Sort - use DropdownButton */}
            <div className="relative" ref={sortRef}>
                <DropdownButton
                    label={
                        sort === 'name-asc'
                            ? 'Name (A-Z)'
                            : sort === 'name-desc'
                            ? 'Name (Z-A)'
                            : 'Recent'
                    }
                    isOpen={sortOpen}
                    onClick={() => setSortOpen((s) => !s)}
                    icon={MdSortByAlpha}
                />
                {sortOpen && (
                    <div
                        className="absolute right-0 mt-2 w-44 rounded-lg shadow-lg z-50"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        <div className="py-2">
                            <button
                                onClick={() => {
                                    onSortChange('name-asc');
                                    setSortOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-(--color-message-hover)"
                            >
                                {sort === 'name-asc' ? (
                                    <Check size={16} />
                                ) : (
                                    <span className="w-4" />
                                )}
                                <span>Name (A-Z)</span>
                            </button>

                            <button
                                onClick={() => {
                                    onSortChange('name-desc');
                                    setSortOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-(--color-message-hover)"
                            >
                                {sort === 'name-desc' ? (
                                    <Check size={16} />
                                ) : (
                                    <span className="w-4" />
                                )}
                                <span>Name (Z-A)</span>
                            </button>

                            <div className="border-t border-(--color-border) my-1" />

                            <button
                                onClick={() => {
                                    onSortChange('recent');
                                    setSortOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-(--color-message-hover)"
                            >
                                {sort === 'recent' ? (
                                    <Check size={16} />
                                ) : (
                                    <span className="w-4" />
                                )}
                                <span>Recent</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Filter - use DropdownButton */}
            <div className="relative" ref={filterRef}>
                <DropdownButton
                    label={
                        filter === 'all'
                            ? 'All'
                            : selectedTag
                            ? TAGS.find((t) => t.id === selectedTag)?.label ||
                              'Category'
                            : 'Category'
                    }
                    isOpen={filterOpen}
                    onClick={() => setFilterOpen((s) => !s)}
                />
                {filterOpen && (
                    <div
                        className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-50"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        <div className="py-2">
                            <button
                                onClick={() => {
                                    onFilterChange('all');
                                    setFilterOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-message-hover)]"
                            >
                                {filter === 'all' ? (
                                    <Check size={16} />
                                ) : (
                                    <span className="w-4" />
                                )}
                                <span>All</span>
                            </button>

                            <div className="border-t border-[var(--color-border)] my-1" />

                            <div className="px-4 py-1 text-xs text-[var(--color-text-secondary)]">
                                Category
                            </div>

                            {TAGS.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        onFilterChange(`tag:${t.id}`);
                                        setFilterOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-[var(--color-message-hover)]"
                                >
                                    <span
                                        className={`w-3 h-3 rounded-full ${t.color}`}
                                    />
                                    <span className="flex-1 text-left">
                                        {t.label}
                                    </span>
                                    {selectedTag === t.id && (
                                        <Check size={16} />
                                    )}
                                </button>
                            ))}

                            <div className="border-t border-[var(--color-border)] my-1" />

                            <button
                                onClick={() => {
                                    setFilterOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-[var(--color-primary)] hover:bg-[var(--color-message-hover)]"
                            >
                                Manage categories
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
