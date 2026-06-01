import React, { useState, useRef, useEffect } from "react";

type Friend = { id: string; name: string; avatar?: string };

export default function FriendItem({ friend }: { friend: Friend }) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		function onDoc(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("click", onDoc);
		return () => document.removeEventListener("click", onDoc);
	}, []);

	return (
        <div className="flex items-center px-3 py-3 hover:shadow-(--shadow-md) cursor-pointer hover:bg-(--color-secondary)">
            <div className="flex items-center gap-3 flex-1">
                <img
                    src={friend.avatar || 'https://via.placeholder.com/40'}
                    alt={friend.name}
                    className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                    <div className="font-medium">{friend.name}</div>
                </div>
            </div>

            <div className="relative" ref={ref}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen((s) => !s);
                    }}
                    className="px-2 py-1 rounded"
                    aria-label="menu"
                >
                    {/* three dots */}
                    <svg
                        className="w-5 h-5 text-gray-700"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <circle cx="5" cy="12" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="19" cy="12" r="2" />
                    </svg>
                </button>

                {open && (
                    <div className="absolute right-0 mt-2 w-40 bg-(--color-background) shadow-(--shadow-lg) rounded-md border border-(--color-border)">
                        <button className="w-full text-left px-3 py-2 hover:bg-(--color-success) hover:text-white rounded-t-md">
                            View profile
                        </button>
                        <button className="w-full text-left px-3 py-2 hover:bg-(--color-success) hover:text-white">
                            Categorize
                        </button>
                        <button className="w-full text-left px-3 py-2 hover:bg-(--color-success) hover:text-white">
                            Set alias
                        </button>
                        <button className="w-full text-left px-3 py-2 hover:bg-(--color-success) hover:text-white">
                            Block this user
                        </button>
                        <button className="w-full text-left px-3 py-2 text-red-500 hover:bg-(--color-danger) hover:text-white rounded-b-md">
                            Unfriend
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
