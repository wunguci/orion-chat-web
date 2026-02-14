import React, { useMemo } from "react";
import ContactItem from "./ContactItem";

type Friend = { id: string; name: string; avatar?: string };

export default function FriendList({ friends }: { friends: Friend[] }) {
	const grouped = useMemo(() => {
		const map = new Map<string, Friend[]>();
		friends.forEach((f) => {
			const key = f.name.charAt(0).toUpperCase();
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(f);
		});
		return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
	}, [friends]);

	return (
        <div className="bg-(--color-surface) rounded p-2">
            {grouped.length === 0 && (
                <div className="p-6 text-center text-gray-400">
                    Không có kết quả
                </div>
            )}
            <div className="contact-list-scroll">
              {grouped.map(([letter, items]) => (
                  <div key={letter} className="mb-4">
                      <div className="px-3 py-1 text-sm text-gray-400">
                          {letter}
                      </div>
                      <div className="divide-y divide-gray-200 rounded overflow-hidden">
                          {items.map((f) => (
                              <ContactItem key={f.id} friend={f} />
                          ))}
                      </div>
                  </div>
              ))}
            </div>
        </div>
    );
}
