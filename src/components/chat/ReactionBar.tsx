import React from 'react';

type ReactionItem = {
    emoji: string;
    count: number;
    reactedByMe?: boolean;
};

type ReactionBarProps = {
    reactions: ReactionItem[];
    align?: 'left' | 'right';
    onReact?: (emoji: string) => void;
};

export const ReactionBar: React.FC<ReactionBarProps> = ({
    reactions,
    align = 'left',
    onReact,
}) => {
    if (!reactions.length) return null;

    return (
        <div
            className={`flex flex-wrap gap-1 ${
                align === 'right' ? 'justify-end' : 'justify-start'
            }`}
        >
            {reactions.map((reaction) => (
                <button
                    key={reaction.emoji}
                    onClick={() => onReact?.(reaction.emoji)}
                    className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                        reaction.reactedByMe
                            ? 'border-emerald-400 bg-emerald-100 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-600'
                    }`}
                    type="button"
                >
                    <span>{reaction.emoji}</span>
                    {reaction.count > 1 && <span>{reaction.count}</span>}
                </button>
            ))}
        </div>
    );
};

export default ReactionBar;
