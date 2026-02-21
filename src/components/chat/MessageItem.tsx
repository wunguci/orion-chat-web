import React from 'react';

type Props = {
    side?: 'left' | 'right';
    text?: string;
    time?: string;
    image?: string;
    onImageClick?: () => void;
};

export const MessageItem: React.FC<Props> = ({
    side = 'left',
    text,
    time,
    image,
    onImageClick,
}) => {
    const isRight = side === 'right';
    return (
        <div
            className={`flex items-end gap-3 ${isRight ? 'justify-end' : ''} px-4`}
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
                <div
                    className={
                        image
                            ? ''
                            : `inline-block p-3 rounded-xl ${isRight ? 'bg-teal-400 text-black shadow-2xs' : 'bg-white shadow-2xs border border-slate-200 text-slate-800'}`
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
