import React, { useEffect, useState, useCallback } from 'react';

export type ViewerImage = {
    src: string;
    senderName?: string;
    senderAvatar?: string;
    time?: string;
    date?: string; // e.g. "17/02"
};

type Props = {
    images: ViewerImage[];
    initialIndex: number;
    onClose: () => void;
};

// Group images by date for the sidebar
function groupByDate(images: ViewerImage[]) {
    const map = new Map<string, { index: number; img: ViewerImage }[]>();
    images.forEach((img, index) => {
        const key = img.date ?? 'Unknown';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ index, img });
    });
    return map;
}

const ImageViewer: React.FC<Props> = ({ images, initialIndex, onClose }) => {
    const [current, setCurrent] = useState(initialIndex);
    const [scale, setScale] = useState(1);

    const active = images[current];
    const grouped = groupByDate(images);

    const goTo = useCallback(
        (idx: number) => {
            if (idx >= 0 && idx < images.length) {
                setCurrent(idx);
                setScale(1);
            }
        },
        [images.length],
    );

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(current - 1);
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown')
                goTo(current + 1);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [current, goTo, onClose]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3 text-white border-b border-white/10 shrink-0">
                <span className="text-sm font-semibold">
                    {active?.senderName ?? 'Photo Viewer'}
                </span>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white text-xl leading-none"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Main area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Image display */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black">
                    {/* Prev button */}
                    {current > 0 && (
                        <button
                            onClick={() => goTo(current - 1)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center z-10"
                        >
                            ‹
                        </button>
                    )}

                    <img
                        key={current}
                        src={active?.src}
                        alt="viewer"
                        style={{
                            transform: `scale(${scale})`,
                            transition: 'transform 0.2s',
                        }}
                        className="max-h-full max-w-full object-contain select-none"
                    />

                    {/* Next button */}
                    {current < images.length - 1 && (
                        <button
                            onClick={() => goTo(current + 1)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center z-10"
                        >
                            ›
                        </button>
                    )}
                </div>

                {/* Right thumbnail sidebar */}
                <div className="w-52 bg-[#111] flex flex-col overflow-y-auto border-l border-white/10 shrink-0">
                    {/* Up / Down navigation arrows */}
                    <div className="flex justify-center gap-2 py-2 border-b border-white/10">
                        <button
                            onClick={() => goTo(current - 1)}
                            disabled={current === 0}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white flex items-center justify-center"
                        >
                            ∧
                        </button>
                        <button
                            onClick={() => goTo(current + 1)}
                            disabled={current === images.length - 1}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white flex items-center justify-center"
                        >
                            ∨
                        </button>
                    </div>

                    {Array.from(grouped.entries()).map(([date, items]) => (
                        <div key={date} className="px-2 py-2">
                            <div className="text-xs text-white/50 mb-2 font-medium">
                                {date}
                            </div>
                            <div className="flex flex-col gap-1">
                                {items.map(({ index, img }) => (
                                    <button
                                        key={index}
                                        onClick={() => goTo(index)}
                                        className={`w-full aspect-video overflow-hidden rounded ${
                                            index === current
                                                ? 'ring-2 ring-teal-400'
                                                : 'opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img
                                            src={img.src}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 text-white shrink-0">
                {/* Sender info */}
                <div className="flex items-center gap-3">
                    {active?.senderAvatar && (
                        <img
                            src={active.senderAvatar}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    )}
                    <div className="text-sm">
                        <div className="font-semibold">
                            {active?.senderName ?? ''}
                        </div>
                        {active?.time && (
                            <div className="text-xs text-white/50">
                                {active.time}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 text-white/70">
                    {/* Download */}
                    <a
                        href={active?.src}
                        download
                        target="_blank"
                        rel="noreferrer"
                        title="Download"
                        className="hover:text-white"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                    </a>

                    <div className="w-px h-4 bg-white/20" />

                    {/* Zoom in */}
                    <button
                        onClick={() => setScale((s) => Math.min(s + 0.25, 3))}
                        title="Zoom in"
                        className="hover:text-white"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            <line x1="11" y1="8" x2="11" y2="14" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                    </button>

                    {/* Zoom out */}
                    <button
                        onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
                        title="Zoom out"
                        className="hover:text-white"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                    </button>

                    {/* Counter */}
                    <span className="text-xs text-white/50">
                        {current + 1} / {images.length}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ImageViewer;
