import React, { useEffect, useRef } from 'react';
import { FileText, Share2, ArrowRight, Trash2 } from 'lucide-react';

interface MediaContextMenuProps {
    isOpen: boolean;
    position?: { x: number; y: number };
    onOpen?: () => void;
    onForward?: () => void;
    onJumpToMessage?: () => void;
    onDeleteForMe?: () => void;
    onRecall?: () => void;
    onClose: () => void;
}

export const MediaContextMenu: React.FC<MediaContextMenuProps> = ({
    isOpen,
    position = { x: 0, y: 0 },
    onOpen,
    onForward,
    onJumpToMessage,
    onDeleteForMe,
    onRecall,
    onClose,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const menuItems = [
        {
            label: 'Open file',
            icon: FileText,
            onClick: onOpen,
            color: 'text-gray-700',
        },
        {
            label: 'Forward',
            icon: Share2,
            onClick: onForward,
            color: 'text-gray-700',
        },
        {
            label: 'Go to message',
            icon: ArrowRight,
            onClick: onJumpToMessage,
            color: 'text-gray-700',
        },
        {
            label: 'Delete for me',
            icon: Trash2,
            onClick: onDeleteForMe,
            color: 'text-red-500',
        },
        {
            label: 'Delete for all',
            icon: Trash2,
            onClick: onRecall,
            color: 'text-red-500',
        },
    ];

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden w-56"
            style={{
                top: `${position.y}px`,
                left: `${position.x}px`,
                animation: 'fadeInScale 0.2s ease-out',
            }}
        >
            <style>{`
                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>

            {menuItems.map((item, index) => (
                <button
                    key={index}
                    onClick={() => {
                        item.onClick?.();
                        onClose();
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors text-sm ${
                        item.color
                    } ${index !== 0 ? 'border-t border-slate-200' : ''}`}
                >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
};
