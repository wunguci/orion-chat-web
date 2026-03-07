import React, { useState } from 'react';

const EMOJI_LIST = ['❤️', '😆', '😮', '😢', '😡', '👍'];

export type Reaction = {
    emoji: string;
    count: number;
    reactedByMe: boolean;
};

type Props = {
    side?: 'left' | 'right';
    text?: string;
    time?: string;
    image?: string;
    onImageClick?: () => void;
    reactions?: Reaction[];
    onReact?: (emoji: string) => void;
};

export const MessageItem: React.FC<Props> = ({
    side = 'left',
    text,
    time,
    image,
    onImageClick,
    reactions = [],
    onReact,
}) => {
    const isRight = side === 'right';
    const [hovered, setHovered] = useState(false);
    const [showPicker, setShowPicker] = useState(false);

    return (
        <div
            className={`flex items-end gap-3 ${isRight ? 'justify-end' : ''} px-4`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false);
                setShowPicker(false);
            }}
        >
            {!isRight && (
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs">
                    <img
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRqHljHwC3uFTM4IyU1hLVqc5KJgrzOFpMvA&s"
                        alt="avatar"
                        className="w-full h-full object-cover rounded-full"
                    />
                </div>
            )}
            <div
                className={`max-w-[60%] ${isRight ? 'text-right' : 'text-left'}`}
            >
                {/* Bubble row + emoji trigger */}
                <div
                    className={`flex items-end gap-1 ${
                        isRight ? 'flex-row-reverse' : 'flex-row'
                    }`}
                >
                    <div
                        className={
                            image
                                ? ''
                                : `inline-block p-3 rounded-xl ${isRight ? 'bg-green-primary text-white shadow-2xs' : 'bg-white shadow-2xs border border-slate-200 text-gray-primary'}`
                        }
                    >
                        {image ? (
                            <img
                                src={image}
                                alt="img"
                                className="w-48 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={onImageClick}
                            />
                        ) : (
                            <div>{text}</div>
                        )}
                    </div>

                    {/* Emoji reaction trigger – always rendered to prevent layout shift */}
                    <div
                        className={`relative shrink-0 self-end pb-0.5 transition-opacity duration-150 ${
                            hovered || showPicker
                                ? 'opacity-100'
                                : 'opacity-0 pointer-events-none'
                        }`}
                    >
                        <button
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow text-sm hover:bg-slate-50 transition-colors"
                            onClick={() => setShowPicker((v) => !v)}
                            title="Bày tỏ cảm xúc"
                        >
                            😊
                        </button>
                        {showPicker && (
                            <div
                                className={`absolute ${
                                    isRight ? 'right-0' : 'left-0'
                                } bottom-8 bg-white border border-slate-200 rounded-full shadow-lg px-2 py-1.5 flex gap-1 z-50 whitespace-nowrap`}
                            >
                                {EMOJI_LIST.map((e) => (
                                    <button
                                        key={e}
                                        className="text-lg hover:scale-125 transition-transform leading-none"
                                        onClick={() => {
                                            onReact?.(e);
                                            setShowPicker(false);
                                        }}
                                        title={e}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Reactions display */}
                {reactions.length > 0 && (
                    <div
                        className={`flex flex-wrap gap-1 mt-1 ${
                            isRight ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        {reactions.map((r) => (
                            <button
                                key={r.emoji}
                                onClick={() => onReact?.(r.emoji)}
                                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                                    r.reactedByMe
                                        ? 'bg-green-100 border-green-400 text-green-700'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <span>{r.emoji}</span>
                                {r.count > 1 && <span>{r.count}</span>}
                            </button>
                        ))}
                    </div>
                )}

                {time && (
                    <div className="text-[11px] text-slate-400 mt-1">
                        {time}
                    </div>
                )}
            </div>
            {isRight && (
                <div className="w-8 h-8 rounded-full bg-teal-400 flex items-center justify-center text-xs">
                    <img
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzKrfajYmPihSbKzKqPGaYkLY5xim-QYmbKw&s"
                        alt="avatar"
                        className="w-full h-full object-cover rounded-full"
                    />
                </div>
            )}
        </div>
    );
};

export default MessageItem;
