import React from 'react';
import { FiFile } from 'react-icons/fi';

type MediaMessageRendererProps = {
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
    fileIcon?: React.ReactNode;
    isMe?: boolean;
};

export const MediaMessageRenderer: React.FC<MediaMessageRendererProps> = ({
    messageType,
    fileUrl,
    fileName,
    fileIcon,
    isMe = false,
}) => {
    const normalizedType = String(messageType || '').toUpperCase();

    if (!fileUrl) return null;

    if (normalizedType === 'IMAGE') {
        return (
            <img
                src={fileUrl}
                alt={fileName || 'image'}
                className="max-w-sm rounded-2xl"
            />
        );
    }

    if (normalizedType === 'VIDEO') {
        return (
            <video src={fileUrl} controls className="max-w-sm rounded-2xl" />
        );
    }

    if (normalizedType === 'AUDIO') {
        return <audio src={fileUrl} controls className="max-w-xs" />;
    }

    return (
        <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-2 rounded-xl border p-2 ${
                isMe
                    ? 'border-white/30 text-white'
                    : 'border-slate-200 text-blue-600 hover:text-blue-700'
            }`}
        >
            <span className="shrink-0">
                {fileIcon || <FiFile className="h-5 w-5" />}
            </span>
            <span className="truncate text-sm">{fileName || 'File'}</span>
        </a>
    );
};

export default MediaMessageRenderer;
