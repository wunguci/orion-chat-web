import React from 'react';
import { DEFAULT_CHAT_AVATAR_URL } from '../../constants/avatar';

type ChatAvatarProps = {
    name?: string;
    avatarUrl?: string;
    sizeClassName?: string;
    textClassName?: string;
    className?: string;
};

export const ChatAvatar: React.FC<ChatAvatarProps> = ({
    name,
    avatarUrl,
    sizeClassName = 'w-10 h-10',
    className = '',
}) => {
    const MEDIA_BASE_URL =
        import.meta.env.VITE_MEDIA_BASE_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_SOCKET_URL ||
        'http://localhost:3000';

    const toAbsoluteMediaUrl = (url?: string): string | undefined => {
        if (!url) return undefined;
        const mediaBase = MEDIA_BASE_URL.replace(/\/$/, '');

        if (url.startsWith('http://') || url.startsWith('https://')) {
            if (url.includes('/uploads/')) {
                const uploadsPath = url.split('/uploads/').pop();
                if (uploadsPath) {
                    return `${mediaBase}/${uploadsPath.replace(/^\/+/, '')}`;
                }
            }
            return url;
        }

        if (url.startsWith('blob:') || url.startsWith('data:')) {
            return url;
        }

        const normalizedPath = url.replace(/^\/?uploads\//, '/');
        return `${mediaBase}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
    };



    const [hasError, setHasError] = React.useState(false);

    React.useEffect(() => {
        setHasError(false);
    }, [avatarUrl]);

    const defaultAvatarUrl = name
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        : DEFAULT_CHAT_AVATAR_URL;

    const normalizedAvatarUrl = toAbsoluteMediaUrl(avatarUrl) || defaultAvatarUrl;
    const showImage = !!normalizedAvatarUrl && !hasError;

    if (showImage) {
        return (
            <img
                src={normalizedAvatarUrl}
                alt={name || 'avatar'}
                className={`${sizeClassName} rounded-full object-cover ${className}`.trim()}
                onError={() => setHasError(true)}
            />
        );
    }

    return (
        <img
            src={defaultAvatarUrl}
            alt={name || 'avatar'}
            className={`${sizeClassName} rounded-full object-cover ${className}`.trim()}
        />
    );
};
export default ChatAvatar;
