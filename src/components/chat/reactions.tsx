/* eslint-disable react-refresh/only-export-components */
import React from 'react';

export type ReactionOption = {
    emoji: string;
    label: string;
    className: string;
};

export const REACTION_OPTIONS: ReactionOption[] = [
    {
        emoji: '👍',
        label: 'Like',
        className: 'text-sky-600',
    },
    {
        emoji: '❤️',
        label: 'Love',
        className: 'text-rose-500',
    },
    {
        emoji: '😂',
        label: 'Haha',
        className: 'text-amber-500',
    },
    {
        emoji: '😮',
        label: 'Wow',
        className: 'text-violet-500',
    },
    {
        emoji: '😢',
        label: 'Sad',
        className: 'text-blue-500',
    },
    {
        emoji: '😡',
        label: 'Angry',
        className: 'text-red-500',
    },
];

export const MESSAGE_INPUT_EMOJIS = [
    '😀',
    '😂',
    '😍',
    '😎',
    '🤔',
    '😭',
    '👍',
    '🎉',
    '🔥',
    '❤️',
    '✨',
    '👏',
];

export const getReactionOption = (emoji: string) =>
    REACTION_OPTIONS.find((item) => item.emoji === emoji);

export const ReactionIcon: React.FC<{
    emoji: string;
    size?: number;
    className?: string;
}> = ({ emoji, size = 16, className = '' }) => {
    const option = getReactionOption(emoji);

    return (
        <span 
            style={{ fontSize: `${size}px`, lineHeight: 1 }}
            className={`inline-block ${option ? option.className : ''} ${className}`.trim()}
        >
            {emoji}
        </span>
    );
};
