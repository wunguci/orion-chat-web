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
        label: 'Thích',
        className: 'text-sky-600',
    },
    {
        emoji: '❤️',
        label: 'Yêu thích',
        className: 'text-rose-500',
    },
    {
        emoji: '😂',
        label: 'Vui',
        className: 'text-amber-500',
    },
    {
        emoji: '😮',
        label: 'Ngạc nhiên',
        className: 'text-violet-500',
    },
    {
        emoji: '😢',
        label: 'Buồn',
        className: 'text-blue-500',
    },
    {
        emoji: '😡',
        label: 'Giận',
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
