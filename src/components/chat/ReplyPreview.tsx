import React from 'react';

type ReplyPreviewProps = {
    senderName?: string;
    content?: string;
    onCancel?: () => void;
};

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
    senderName,
    content,
    onCancel,
}) => {
    return (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <div className="min-w-0">
                <p className="font-semibold text-slate-700 truncate">
                    Reply to {senderName || 'message'}
                </p>
                <p className="text-slate-500 truncate">{content || '...'}</p>
            </div>
            {onCancel && (
                <button
                    className="text-slate-400 hover:text-slate-600"
                    onClick={onCancel}
                    type="button"
                >
                    ✕
                </button>
            )}
        </div>
    );
};

export default ReplyPreview;
