import React, { useRef, useState, useEffect } from 'react';
import { IoMdAdd, IoMdSend } from 'react-icons/io';
import { FiImage, FiVideo, FiFile, FiX } from 'react-icons/fi';
import { RotateCcw, WandSparkles } from 'lucide-react';
import {
    validateOutgoingFiles,
    MAX_FILES_PER_BATCH,
} from '../../utils/chatMedia';
import { orionAiService } from '../../services/orionAiService';
import type { RewriteTone } from '../../types/orion-ai';

const INPUT_EMOJIS = [
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

export const ChatInput: React.FC<{
    onSend?: (
        text: string,
        options?: { replyToMessageId?: string | null },
    ) => void;
    onSendFile?: (file: File) => Promise<void>;
    onSendFiles?: (files: File[]) => Promise<void>;
    onTypingChange?: (isTyping: boolean) => void;
    isBlocked?: boolean;
    canUnblock?: boolean;
    onUnblock?: () => void;
    replyDraft?: {
        replyToMessageId: string;
        senderName?: string;
        snippet?: string;
    } | null;
    onCancelReply?: () => void;
    draftText?: string;
    onDraftTextApplied?: () => void;
}> = ({
    onSend,
    onSendFile,
    onSendFiles,
    onTypingChange,
    isBlocked,
    canUnblock,
    onUnblock,
    replyDraft,
    onCancelReply,
    draftText,
    onDraftTextApplied,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [attachments, setAttachments] = useState<AttachFile[]>([]);
    const [text, setText] = useState('');
    const [lastTextBeforeRewrite, setLastTextBeforeRewrite] = useState<
        string | null
    >(null);
    const [rewriteOpen, setRewriteOpen] = useState(false);
    const [isRewriting, setIsRewriting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const typingTimeoutRef = useRef<number | null>(null);

    const inputRefs = useRef<Record<MediaType, HTMLInputElement | null>>({
        image: null,
        video: null,
        file: null,
    });
    const menuRef = useRef<HTMLDivElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);
    const rewriteRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node)
            ) {
                setMenuOpen(false);
            }
            if (
                emojiRef.current &&
                !emojiRef.current.contains(e.target as Node)
            ) {
                setEmojiOpen(false);
            }
            if (
                rewriteRef.current &&
                !rewriteRef.current.contains(e.target as Node)
            ) {
                setRewriteOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (!draftText) return;
        setText(draftText);
        onDraftTextApplied?.();
    }, [draftText, onDraftTextApplied]);

    useEffect(() => {
        if (!onTypingChange) return;

        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }

        if (text.trim()) {
            onTypingChange(true);
            typingTimeoutRef.current = window.setTimeout(() => {
                onTypingChange(false);
            }, 1500);
        } else {
            onTypingChange(false);
        }

        return () => {
            if (typingTimeoutRef.current) {
                window.clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [onTypingChange, text]);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const newItems: AttachFile[] = Array.from(files).map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }));

        const incomingFiles = [
            ...attachments.map((item) => item.file),
            ...newItems.map((item) => item.file),
        ];
        const validation = validateOutgoingFiles(incomingFiles);
        if (!validation.isValid) {
            newItems.forEach((item) => URL.revokeObjectURL(item.url));
            setValidationError(validation.error || 'Khong the them tep.');
            setMenuOpen(false);
            return;
        }

        setAttachments((prev) => [...prev, ...newItems]);
        setValidationError(null);
        setMenuOpen(false);
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => {
            URL.revokeObjectURL(prev[index].url);
            return prev.filter((_, i) => i !== index);
        });
        setValidationError(null);
    };

    const handleSend = async () => {
        if (!text.trim() && attachments.length === 0) return;

        const files = attachments.map((item) => item.file);
        if (files.length > 0) {
            const validation = validateOutgoingFiles(files);
            if (!validation.isValid) {
                setValidationError(validation.error || 'Khong the gui tep.');
                return;
            }
        }

        const messageText = text.trim();

        if (messageText) {
            onSend?.(messageText, {
                replyToMessageId: replyDraft?.replyToMessageId || null,
            });
        }

        if (files.length > 0) {
            const uploadTask = onSendFiles
                ? onSendFiles(files)
                : Promise.all(
                      attachments.map((attachment) =>
                          onSendFile?.(attachment.file),
                      ),
                  ).then(() => undefined);

            void uploadTask.catch((err) => {
                console.error('Upload loi:', err);
                setValidationError(
                    err instanceof Error ? err.message : 'Gui file that bai.',
                );
            });
        }

        attachments.forEach((attachment) => {
            URL.revokeObjectURL(attachment.url);
        });

        setAttachments([]);
        setText('');
        setValidationError(null);
        onTypingChange?.(false);
    };

    const triggerPicker = (type: MediaType) => {
        inputRefs.current[type]?.click();
    };

    const insertEmoji = (emoji: string) => {
        setText((prev) => `${prev}${emoji}`);
        setEmojiOpen(false);
    };

    const handleRewrite = async (tone: RewriteTone) => {
        const current = text.trim();
        if (!current || isRewriting) return;

        try {
            setIsRewriting(true);
            setLastTextBeforeRewrite(text);
            const result = await orionAiService.rewriteMessage({
                message: current,
                tone,
                audience: 'chat recipient',
            });
            const rewritten =
                result.cards[0]?.body ||
                result.cards[0]?.title ||
                result.summary ||
                current;
            setText(rewritten);
            setRewriteOpen(false);
        } catch (error) {
            setValidationError(
                error instanceof Error
                    ? error.message
                    : 'AI rewrite failed.',
            );
        } finally {
            setIsRewriting(false);
        }
    };

    return (
        <div className="px-4 py-3 border-t border-slate-200">
            {/* Blocked user UI - Large prominent style */}
            {isBlocked && (
                <div className="p-2 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col items-center justify-center text-center">
                    {/* Icon */}
                    <div className="p-1 bg-rose-200 rounded-full">
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-rose-700"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="m4.93 4.93 14.14 14.14" />
                        </svg>
                    </div>

                    {/* Text content */}
                    <div className="space-y-2">
                        <p className="text-base font-bold text-rose-900">
                            {canUnblock
                                ? 'Bạn đã chặn tin nhắn'
                                : 'Bạn bị chặn'}
                        </p>
                        <p className="text-sm text-rose-800 ">
                            {canUnblock
                                ? 'Các bạn sẽ không thể nhắn tin hay gọi điện cho nhau trong đoạn chat này, cũng như không nhận được tin nhắn từ tài khoản của họ.'
                                : 'Bạn không thể nhắn tin hay gọi điện với người này trong đoạn chat này.'}
                        </p>
                    </div>

                    {/* Unblock button - Only show if current user is the blocker */}
                    {canUnblock && (
                        <button
                            onClick={onUnblock}
                            className="w-full max-w-xs mt-4 px-2 py-2 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all active:scale-95 shadow-md hover:shadow-lg border-2 border-rose-600"
                        >
                            Bỏ chặn
                        </button>
                    )}
                </div>
            )}

            {!isBlocked && (
                <>
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
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-slate-500">
                                    Da chon {attachments.length}/
                                    {MAX_FILES_PER_BATCH} file
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((a, i) => {
                                    const isImage =
                                        a.file.type.startsWith('image/');
                                    const isVideo =
                                        a.file.type.startsWith('video/');
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
                                                onClick={() =>
                                                    removeAttachment(i)
                                                }
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
                        </div>
                    )}

                    {validationError && (
                        <div className="mb-3 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                            {validationError}
                        </div>
                    )}

                    {replyDraft && (
                        <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 shadow-xs">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-sky-800">
                                        Trả lời{' '}
                                        {replyDraft.senderName || 'tin nhắn'}
                                    </p>
                                    <p className="truncate text-xs text-slate-700">
                                        {replyDraft.snippet ||
                                            'Tin nhắn gốc không còn khả dụng'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onCancelReply}
                                    className="shrink-0 text-sky-500 hover:text-sky-700"
                                    title="Hủy trả lời"
                                >
                                    <FiX className="h-4 w-4" />
                                </button>
                            </div>
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
                                    {MENU_ITEMS.map(
                                        ({ type, label, icon, color }) => (
                                            <button
                                                key={type}
                                                onClick={() =>
                                                    triggerPicker(type)
                                                }
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                                            >
                                                <span className={color}>
                                                    {icon}
                                                </span>
                                                {label}
                                            </button>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>

                        <input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onBlur={() => onTypingChange?.(false)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            className="flex-1 bg-gray-border text-gray-primary rounded-full px-4 py-2 outline-none text-sm placeholder:text-slate-400"
                            placeholder="Type your message"
                        />

                        <div ref={emojiRef} className="relative shrink-0">
                            <button
                                onClick={() => setEmojiOpen((o) => !o)}
                                className="p-1.5 border border-slate-200 rounded-full hover:bg-green-message hover:text-white hover:border-green-message transition-colors text-slate-700"
                                title="Emoji"
                            >
                                😊
                            </button>

                            {emojiOpen && (
                                <div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 z-20 w-36">
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {INPUT_EMOJIS.map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() =>
                                                    insertEmoji(emoji)
                                                }
                                                className="text-lg hover:scale-125 transition-transform leading-none p-1"
                                                title={emoji}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div ref={rewriteRef} className="relative shrink-0">
                            <button
                                onClick={() => setRewriteOpen((open) => !open)}
                                disabled={!text.trim() || isRewriting}
                                className="p-1.5 border border-slate-200 rounded-full hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Rewrite message"
                            >
                                <WandSparkles className="h-4 w-4" />
                            </button>

                            {rewriteOpen && (
                                <div className="absolute bottom-full right-0 z-20 mb-2 min-w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                    {(
                                        [
                                            ['professional', 'Chuyên nghiệp hơn'],
                                            ['polite', 'Lịch sự hơn'],
                                            ['concise', 'Ngắn gọn hơn'],
                                        ] as Array<[RewriteTone, string]>
                                    ).map(([tone, label]) => (
                                        <button
                                            key={tone}
                                            type="button"
                                            onClick={() => handleRewrite(tone)}
                                            className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                                        >
                                            {label}
                                        </button>
                                    ))}
                                    {lastTextBeforeRewrite && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setText(lastTextBeforeRewrite);
                                                setLastTextBeforeRewrite(null);
                                                setRewriteOpen(false);
                                            }}
                                            className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            Undo rewrite
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSend}
                            className="bg-green-primary text-white px-3 py-2 rounded-full hover:bg-green-hover transition-colors shrink-0"
                        >
                            <IoMdSend className="w-4 h-4" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatInput;
