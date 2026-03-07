import React, { useRef, useState, useEffect } from 'react';
import { IoMdAdd, IoMdSend } from 'react-icons/io';
import { FiImage, FiVideo, FiFile, FiX } from 'react-icons/fi';

type AttachFile = {
    file: File;
    url: string;
};

type MediaType = 'image' | 'video' | 'file';

const ACCEPT: Record<MediaType, string> = {
    image: 'image/*',
    video: 'video/*',
    file: '*/*',
};

const MENU_ITEMS: {
    type: MediaType;
    label: string;
    icon: React.ReactNode;
    color: string;
}[] = [
    {
        type: 'image',
        label: 'Image',
        icon: <FiImage className="w-4 h-4" />,
        color: 'text-emerald-500',
    },
    {
        type: 'video',
        label: 'Video',
        icon: <FiVideo className="w-4 h-4" />,
        color: 'text-blue-500',
    },
    {
        type: 'file',
        label: 'File',
        icon: <FiFile className="w-4 h-4" />,
        color: 'text-orange-400',
    },
];

export const ChatInput: React.FC = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [attachments, setAttachments] = useState<AttachFile[]>([]);
    const [text, setText] = useState('');

    const inputRefs = useRef<Record<MediaType, HTMLInputElement | null>>({
        image: null,
        video: null,
        file: null,
    });
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node)
            ) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const newItems: AttachFile[] = Array.from(files).map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }));
        setAttachments((prev) => [...prev, ...newItems]);
        setMenuOpen(false);
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => {
            URL.revokeObjectURL(prev[index].url);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSend = () => {
        if (!text.trim() && attachments.length === 0) return;
        // TODO: wire to actual send logic
        attachments.forEach((a) => URL.revokeObjectURL(a.url));
        setAttachments([]);
        setText('');
    };

    const triggerPicker = (type: MediaType) => {
        inputRefs.current[type]?.click();
    };

    return (
        <div className="px-4 py-3 border-t border-slate-200">
            {/* Hidden file inputs */}
            {MENU_ITEMS.map(({ type }) => (
                <input
                    key={type}
                    ref={(el) => {
                        inputRefs.current[type] = el;
                    }}
                    type="file"
                    accept={ACCEPT[type]}
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                    onClick={(e) => {
                        (e.target as HTMLInputElement).value = '';
                    }}
                />
            ))}

            {/* Attachment previews */}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {attachments.map((a, i) => {
                        const isImage = a.file.type.startsWith('image/');
                        const isVideo = a.file.type.startsWith('video/');
                        return (
                            <div
                                key={i}
                                className="relative group w-24 h-24 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0"
                            >
                                {isImage && (
                                    <img
                                        src={a.url}
                                        alt={a.file.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                {isVideo && (
                                    <video
                                        src={a.url}
                                        className="w-full h-full object-cover"
                                        muted
                                    />
                                )}
                                {!isImage && !isVideo && (
                                    <div className="flex flex-col items-center gap-1 p-2 text-center">
                                        <FiFile className="w-8 h-8 text-orange-400" />
                                        <span className="text-[10px] text-slate-500 break-all leading-tight line-clamp-2">
                                            {a.file.name}
                                        </span>
                                    </div>
                                )}
                                <button
                                    onClick={() => removeAttachment(i)}
                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <FiX className="w-3 h-3" />
                                </button>
                                {!isImage && !isVideo && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] truncate px-1 py-0.5">
                                        {a.file.name}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex items-center gap-2">
                {/* + button with popup menu */}
                <div ref={menuRef} className="relative shrink-0">
                    <button
                        onClick={() => setMenuOpen((o) => !o)}
                        className={`p-1.5 border rounded-full transition-colors ${menuOpen ? 'bg-teal-500 text-white border-teal-500' : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}
                    >
                        <IoMdAdd
                            className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-45' : ''}`}
                        />
                    </button>

                    {menuOpen && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20 min-w-32">
                            {MENU_ITEMS.map(({ type, label, icon, color }) => (
                                <button
                                    key={type}
                                    onClick={() => triggerPicker(type)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                                >
                                    <span className={color}>{icon}</span>
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    className="flex-1 bg-gray-border text-gray-primary rounded-full px-4 py-2 outline-none text-sm placeholder:text-slate-400"
                    placeholder="Type your message"
                />

                <button
                    onClick={handleSend}
                    className="bg-green-primary text-white px-3 py-2 rounded-full hover:bg-green-hover transition-colors shrink-0"
                >
                    <IoMdSend className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
