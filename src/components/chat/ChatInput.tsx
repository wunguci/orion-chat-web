import React, { useRef, useState, useEffect, useMemo } from 'react';
import { IoMdAdd, IoMdSend } from 'react-icons/io';
import { FiImage, FiVideo, FiFile, FiX } from 'react-icons/fi';
import { Ban, LoaderCircle, RotateCcw, Smile, WandSparkles } from 'lucide-react';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import {
    validateOutgoingFiles,
    MAX_FILES_PER_BATCH,
} from '../../utils/chatMedia';
import { orionAiService } from '../../services/orionAiService';
import type { RewriteTone } from '../../types/orion-ai';
import type { ParticipantInfo } from '../../types/conversation';
import { getCurrentUserId } from '../../utils/auth';

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
        options?: {
            replyToMessageId?: string | null;
            mentions?: string[];
            mentionAll?: boolean;
        },
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
    participants?: ParticipantInfo[];
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
    participants,
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

    // ================= MENTION STATES & HELPERS =================
    const [mentionSearch, setMentionSearch] = useState<{ query: string; index: number } | null>(null);
    const [activeMentionIdx, setActiveMentionIdx] = useState(0);
    const [taggedMembers, setTaggedMembers] = useState<{ userId: string; fullName: string }[]>([]);
    const [mentionAll, setMentionAll] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const getMentionSearch = (val: string, selectionStart: number | null) => {
        if (selectionStart === null) return null;
        const textBeforeCursor = val.substring(0, selectionStart);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');
        if (lastAtIndex === -1) return null;

        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        if (/\s/.test(textAfterAt)) return null;

        if (lastAtIndex > 0 && !/\s/.test(textBeforeCursor[lastAtIndex - 1])) {
            return null;
        }

        return {
            query: textAfterAt,
            index: lastAtIndex,
        };
    };

    const filteredParticipants = useMemo(() => {
        if (!mentionSearch || !participants) return [];
        const query = mentionSearch.query.toLowerCase();
        
        const allOption = {
            userId: 'all',
            fullName: 'tất cả',
            avatarUrl: null,
            role: null,
        };
        
        const currentUserId = getCurrentUserId();

        const membersList = participants
            .filter(p => p.userId !== currentUserId)
            .map(p => ({
                userId: p.userId,
                fullName: p.fullName || 'Thành viên',
                avatarUrl: p.avatarUrl,
                role: p.role,
            }));

        let result = [allOption, ...membersList];

        if (query) {
            result = result.filter(p => {
                if (p.userId === 'all') {
                    return 'tất cả'.includes(query) || 'all'.includes(query);
                }
                return p.fullName.toLowerCase().includes(query);
            });
        }
        
        return result;
    }, [mentionSearch, participants]);

    const selectMention = (p: { userId: string; fullName: string }) => {
        if (!mentionSearch) return;

        const val = text;
        const selectionStart = inputRef.current?.selectionStart || val.length;

        const beforeAt = val.substring(0, mentionSearch.index);
        const afterCursor = val.substring(selectionStart);
        
        const insertText = `@${p.fullName} `;
        const newText = `${beforeAt}${insertText}${afterCursor}`;
        
        setText(newText);
        setMentionSearch(null);

        if (p.userId === 'all') {
            setMentionAll(true);
        } else {
            setTaggedMembers(prev => {
                if (prev.some(m => m.userId === p.userId)) return prev;
                return [...prev, { userId: p.userId, fullName: p.fullName }];
            });
        }

        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newCursorPos = beforeAt.length + insertText.length;
                inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 10);
    };
    // ============================================================

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
            setValidationError(validation.error || 'Cannot add file.');
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
                setValidationError(validation.error || 'Cannot send file.');
                return;
            }
        }

        const messageText = text.trim();

        if (messageText) {
            const finalMentions = taggedMembers
                .filter((m) => text.includes(`@${m.fullName}`))
                .map((m) => m.userId);
            const finalMentionAll =
                mentionAll &&
                (text.includes('@tất cả') || text.includes('@all'));

            onSend?.(messageText, {
                replyToMessageId: replyDraft?.replyToMessageId || null,
                mentions: finalMentions.length > 0 ? finalMentions : undefined,
                mentionAll: finalMentionAll ? true : undefined,
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
                console.error('Upload file error:', err);
                setValidationError(
                    err instanceof Error ? err.message : 'Failed to send file.',
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
        setTaggedMembers([]);
        setMentionAll(false);
        setMentionSearch(null);
    };

    const triggerPicker = (type: MediaType) => {
        inputRefs.current[type]?.click();
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setText((prev) => `${prev}${emojiData.emoji}`);
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
                        <Ban size={28} className="text-rose-700" />
                    </div>

                    {/* Text content */}
                    <div className="space-y-2">
                        <p className="text-base font-bold text-rose-900">
                            {canUnblock
                                ? 'You blocked this conversation.'
                                : 'You are blocked.'}
                        </p>
                        <p className="text-sm text-rose-800 ">
                            {canUnblock
                                ? 'You will not be able to message or call each other in this chat, nor will you receive messages from their account.'
                                : 'You cannot message or call this person in this chat.'}
                        </p>
                    </div>

                    {/* Unblock button - Only show if current user is the blocker */}
                    {canUnblock && (
                        <button
                            onClick={onUnblock}
                            className="w-full max-w-xs mt-4 px-2 py-2 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all active:scale-95 shadow-md hover:shadow-lg border-2 border-rose-600"
                        >
                            Unblock
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
                                    Selected {attachments.length}/
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
                                        Reply to{' '}
                                        {replyDraft.senderName || 'message'}
                                    </p>
                                    <p className="truncate text-xs text-slate-700">
                                        {replyDraft.snippet ||
                                            'Original message is not available'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onCancelReply}
                                    className="shrink-0 text-sky-500 hover:text-sky-700"
                                    title="Cancel reply"
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

                        {/* Input with Gemini animation when rewriting */}
                        <div className={`flex-1 relative ${isRewriting ? 'rewriting-glow-wrapper' : ''}`}>
                            {mentionSearch && filteredParticipants.length > 0 && (
                                <div className="absolute bottom-full left-0 mb-3 w-72 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto py-2 transition-all duration-200">
                                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Nhắc đến thành viên
                                    </div>
                                    {filteredParticipants.map((p: any, idx: number) => (
                                        <button
                                            key={p.userId || 'all'}
                                            type="button"
                                            onClick={() => selectMention(p)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                                                idx === activeMentionIdx
                                                    ? 'bg-sky-50 text-sky-900 font-semibold border-l-4 border-sky-500'
                                                    : 'hover:bg-slate-50 text-slate-700'
                                            }`}
                                        >
                                            {p.userId === 'all' ? (
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white font-bold text-xs shrink-0 shadow-sm">
                                                    @
                                                </div>
                                            ) : (
                                                <img
                                                    src={p.avatarUrl || '/default-avatar.png'}
                                                    alt={p.fullName}
                                                    className="w-8 h-8 rounded-full object-cover shrink-0 bg-slate-100 border border-slate-200"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${p.fullName}`;
                                                    }}
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate font-semibold text-slate-900">
                                                    {p.userId === 'all' ? 'Tất cả cả nhóm' : p.fullName}
                                                </p>
                                                {p.userId !== 'all' && p.role && (
                                                    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-0.5 ${
                                                        p.role === 'admin'
                                                            ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                                            : p.role === 'co-admin'
                                                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                            : 'bg-slate-50 text-slate-500'
                                                    }`}>
                                                        {p.role}
                                                    </span>
                                                )}
                                                {p.userId === 'all' && (
                                                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-0.5 bg-amber-50 text-amber-600 border border-amber-100">
                                                        @all
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <input
                                ref={inputRef}
                                value={text}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setText(val);
                                    const search = getMentionSearch(val, e.target.selectionStart);
                                    setMentionSearch(search);
                                    if (search) {
                                        setActiveMentionIdx(0);
                                    }
                                }}
                                onClick={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    const search = getMentionSearch(target.value, target.selectionStart);
                                    setMentionSearch(search);
                                    if (search) {
                                        setActiveMentionIdx(0);
                                    }
                                }}
                                onKeyUp={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    const search = getMentionSearch(target.value, target.selectionStart);
                                    setMentionSearch(search);
                                }}
                                onBlur={() => {
                                    // Delay hiding dropdown so click triggers first
                                    setTimeout(() => setMentionSearch(null), 200);
                                    onTypingChange?.(false);
                                }}
                                onKeyDown={(e) => {
                                    if (mentionSearch && filteredParticipants.length > 0) {
                                        if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            setActiveMentionIdx((prev) => (prev + 1) % filteredParticipants.length);
                                            return;
                                        }
                                        if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            setActiveMentionIdx((prev) => (prev - 1 + filteredParticipants.length) % filteredParticipants.length);
                                            return;
                                        }
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            selectMention(filteredParticipants[activeMentionIdx]);
                                            return;
                                        }
                                        if (e.key === 'Escape') {
                                            e.preventDefault();
                                            setMentionSearch(null);
                                            return;
                                        }
                                    }

                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        void handleSend();
                                    }
                                }}
                                className={`w-full bg-gray-border text-gray-primary rounded-full px-4 py-2 outline-none text-sm placeholder:text-slate-400 transition-all ${
                                    isRewriting ? 'pointer-events-none' : ''
                                }`}
                                placeholder={isRewriting ? 'Rewriting...' : 'Type a message...'}
                                readOnly={isRewriting}
                            />
                        </div>

                        {/* Emoji picker button */}
                        <div ref={emojiRef} className="relative shrink-0">
                            <button
                                onClick={() => setEmojiOpen((o) => !o)}
                                className="p-1.5 border border-slate-200 rounded-full hover:bg-[var(--chat-message-sent)] hover:text-white hover:border-[var(--chat-message-sent)] transition-colors text-slate-700"
                                title="Emoji"
                            >
                                <Smile className="h-4 w-4" />
                            </button>

                            {emojiOpen && (
                                <div className="absolute bottom-full right-0 mb-2 z-30 shadow-2xl rounded-xl overflow-hidden">
                                    <EmojiPicker
                                        onEmojiClick={handleEmojiClick}
                                        theme={Theme.LIGHT}
                                        emojiStyle={EmojiStyle.NATIVE}
                                        width={320}
                                        height={380}
                                        searchPlaceHolder="Search emoji..."
                                        previewConfig={{ showPreview: false }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* AI Rewrite button */}
                        <div ref={rewriteRef} className="relative shrink-0">
                            <button
                                onClick={() => setRewriteOpen((open) => !open)}
                                disabled={!text.trim() || isRewriting}
                                className={`p-1.5 border rounded-full transition-colors text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed ${
                                    isRewriting
                                        ? 'border-purple-300 bg-purple-50 text-purple-600 animate-pulse'
                                        : 'border-slate-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200'
                                }`}
                                title={isRewriting ? 'Rewriting...' : 'Smart rewrite'}
                            >
                                {isRewriting ? (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                    <WandSparkles className="h-4 w-4" />
                                )}
                            </button>

                            {rewriteOpen && (
                                <div className="absolute bottom-full right-0 z-20 mb-2 min-w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                    {/* Header */}
                                    <div className="px-3 pt-2.5 pb-1.5 border-b border-slate-100">
                                        <div className="flex items-center gap-1.5">
                                            <WandSparkles className="h-3 w-3 text-green-500" />
                                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">AI Rewrite</span>
                                        </div>
                                    </div>
                                    {(
                                        [
                                            ['professional', 'More professional', ''],
                                            ['polite', 'More polite', ''],
                                            ['concise', 'More concise', ''],
                                        ] as Array<[RewriteTone, string, string]>
                                    ).map(([tone, label, icon]) => (
                                        <button
                                            key={tone}
                                            type="button"
                                            onClick={() => void handleRewrite(tone)}
                                            disabled={isRewriting}
                                            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <span className="text-sm">{icon}</span>
                                            {isRewriting ? (
                                                <span className="animate-shimmer text-green-600">Rewriting...</span>
                                            ) : (
                                                <span>{label}</span>
                                            )}
                                        </button>
                                    ))}
                                    {lastTextBeforeRewrite && !isRewriting && (
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
                                            Undo Rewrite
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSend}
                            className="bg-[var(--chat-primary)] text-white px-3 py-2 rounded-full hover:bg-[var(--chat-primary-hover)] transition-colors shrink-0"
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
