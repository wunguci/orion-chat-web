import { describe, expect, it } from 'vitest';
import {
    buildClientMediaMetadata,
    inferMessageTypeFromMime,
    validateOutgoingFiles,
} from './chatMedia';

function makeFile(name: string, size: number, type: string): File {
    return new File([new Uint8Array(size)], name, { type });
}

describe('chatMedia helpers', () => {
    it('validates file count limit', () => {
        const files = [
            makeFile('a.txt', 1024, 'text/plain'),
            makeFile('b.txt', 1024, 'text/plain'),
            makeFile('c.txt', 1024, 'text/plain'),
            makeFile('d.txt', 1024, 'text/plain'),
            makeFile('e.txt', 1024, 'text/plain'),
            makeFile('f.txt', 1024, 'text/plain'),
        ];

        const result = validateOutgoingFiles(files);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('toi da 5 file');
    });

    it('maps metadata from mime and extension', () => {
        const metadata = buildClientMediaMetadata({
            fileName: 'document.pdf',
            mimeType: 'application/pdf',
        });

        expect(metadata.messageType).toBe('FILE');
        expect(metadata.fileExtension).toBe('pdf');
        expect(metadata.fileIcon).toBe('file-pdf');
        expect(metadata.fileCategory).toBe('file');
    });

    it('infers optimistic media type before server response', () => {
        expect(inferMessageTypeFromMime('image/png')).toBe('IMAGE');
        expect(inferMessageTypeFromMime('video/mp4')).toBe('VIDEO');
        expect(inferMessageTypeFromMime('audio/mpeg')).toBe('AUDIO');
        expect(inferMessageTypeFromMime('application/zip')).toBe('FILE');
    });

    it('prefers client messageType when reconciling metadata', () => {
        const metadata = buildClientMediaMetadata({
            fileName: 'clip.mp4',
            mimeType: 'image/jpeg',
            preferredMessageType: 'VIDEO',
        });

        expect(metadata.messageType).toBe('VIDEO');
        expect(metadata.fileCategory).toBe('video');
        expect(metadata.fileIcon).toBe('video');
    });
});
