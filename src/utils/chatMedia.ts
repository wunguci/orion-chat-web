export type ClientMediaType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';

export type FileCategory = 'image' | 'video' | 'audio' | 'file';

export type FileIcon =
    | 'image'
    | 'video'
    | 'audio'
    | 'file'
    | 'file-pdf'
    | 'file-word'
    | 'file-excel'
    | 'file-powerpoint'
    | 'file-archive'
    | 'file-text';

export type MediaMetadata = {
    messageType: ClientMediaType;
    mimeType: string;
    fileExtension: string;
    fileCategory: FileCategory;
    fileIcon: FileIcon;
};

export const MAX_FILES_PER_BATCH = 5;
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_TOTAL_BATCH_SIZE_BYTES = 50 * 1024 * 1024;

export function inferMessageTypeFromMime(mimeType?: string): ClientMediaType {
    const normalizedMime = String(mimeType || '').toLowerCase();

    if (normalizedMime.startsWith('image/')) return 'IMAGE';
    if (normalizedMime.startsWith('video/')) return 'VIDEO';
    if (normalizedMime.startsWith('audio/')) return 'AUDIO';

    return 'FILE';
}

export function getFileExtension(fileName?: string, mimeType?: string): string {
    const safeName = String(fileName || '').trim();
    if (safeName.includes('.')) {
        const ext = safeName.split('.').pop();
        if (ext) {
            return ext.toLowerCase();
        }
    }

    const fromMime = String(mimeType || '').split('/')[1] || 'bin';
    return fromMime.split('+')[0].toLowerCase();
}

export function getFileCategory(messageType: ClientMediaType): FileCategory {
    if (messageType === 'IMAGE') return 'image';
    if (messageType === 'VIDEO') return 'video';
    if (messageType === 'AUDIO') return 'audio';
    return 'file';
}

export function getFileIcon(
    extension: string,
    messageType: ClientMediaType,
): FileIcon {
    if (messageType === 'IMAGE') return 'image';
    if (messageType === 'VIDEO') return 'video';
    if (messageType === 'AUDIO') return 'audio';

    const ext = String(extension || '').toLowerCase();
    if (ext === 'pdf') return 'file-pdf';
    if (['doc', 'docx'].includes(ext)) return 'file-word';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'file-excel';
    if (['ppt', 'pptx'].includes(ext)) return 'file-powerpoint';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return 'file-archive';
    }
    if (['txt', 'md', 'rtf', 'log'].includes(ext)) return 'file-text';
    return 'file';
}

export function buildClientMediaMetadata(input: {
    fileName?: string;
    mimeType?: string;
    preferredMessageType?: string;
}): MediaMetadata {
    const preferred = String(input.preferredMessageType || '').toUpperCase();
    const preferredType: ClientMediaType | null =
        preferred === 'IMAGE' ||
        preferred === 'VIDEO' ||
        preferred === 'AUDIO' ||
        preferred === 'FILE'
            ? (preferred as ClientMediaType)
            : null;

    const inferred = inferMessageTypeFromMime(input.mimeType);
    const messageType = preferredType || inferred;
    const mimeType = String(input.mimeType || 'application/octet-stream');
    const fileExtension = getFileExtension(input.fileName, mimeType);
    const fileCategory = getFileCategory(messageType);
    const fileIcon = getFileIcon(fileExtension, messageType);

    return {
        messageType,
        mimeType,
        fileExtension,
        fileCategory,
        fileIcon,
    };
}

export function validateOutgoingFiles(files: File[]): {
    isValid: boolean;
    error?: string;
} {
    if (!files.length) {
        return { isValid: false, error: 'Vui long chon it nhat 1 file.' };
    }

    if (files.length > MAX_FILES_PER_BATCH) {
        return {
            isValid: false,
            error: `Chi duoc gui toi da ${MAX_FILES_PER_BATCH} file moi lan.`,
        };
    }

    let total = 0;
    for (const file of files) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return {
                isValid: false,
                error: `File \"${file.name}\" vuot qua gioi han 20MB.`,
            };
        }
        total += file.size;
    }

    if (total > MAX_TOTAL_BATCH_SIZE_BYTES) {
        return {
            isValid: false,
            error: 'Tong dung luong file vuot qua gioi han 50MB.',
        };
    }

    return { isValid: true };
}

export function toSocketType(
    messageType?: string,
): 'text' | 'image' | 'video' | 'audio' | 'file' | 'call' {
    const normalized = String(messageType || '').toUpperCase();
    if (normalized === 'IMAGE') return 'image';
    if (normalized === 'VIDEO') return 'video';
    if (normalized === 'AUDIO') return 'audio';
    if (normalized === 'FILE') return 'file';
    if (normalized === 'CALL') return 'call';
    return 'text';
}
