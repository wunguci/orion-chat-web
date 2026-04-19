import React from 'react';

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
    textClassName = 'text-base',
    className = '',
}) => {
    const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_SOCKET_URL ||
        'http://localhost:3000';

    const toAbsoluteMediaUrl = (url?: string): string | undefined => {
        if (!url) return undefined;
        if (
            url.startsWith('http://') ||
            url.startsWith('https://') ||
            url.startsWith('blob:') ||
            url.startsWith('data:')
        ) {
            return url;
        }

        const normalizedBase = API_BASE_URL.replace(/\/$/, '');
        const normalizedPath = url.startsWith('/') ? url : `/${url}`;
        return `${normalizedBase}${normalizedPath}`;
    };

    const [hasError, setHasError] = React.useState(false);

    React.useEffect(() => {
        setHasError(false);
    }, [avatarUrl]);

    const firstChar = (name || '?').trim().charAt(0).toUpperCase() || '?';
    const normalizedAvatarUrl = toAbsoluteMediaUrl(avatarUrl);
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
        <div
            aria-label={name || 'avatar'}
            className={`${sizeClassName} ${textClassName} rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-white font-semibold flex items-center justify-center ${className}`.trim()}
        >
            {firstChar}
        </div>
    );
};

export default ChatAvatar;
