/**
 * Debug utility for message and sender identification
 * Helps diagnose "Unknown" sender issues
 */

import { extractUserIdFromToken } from './tokenParser';
import { getCurrentUserId } from './auth';

export interface MessageDebugInfo {
    currentUserId: string;
    currentUserIdFromToken: string;
    messageId: string;
    senderBy: string;
    isCurrentUserMessage: boolean;
    shouldBeOnRight: boolean;
}

/**
 * Debug a message to see if it's properly identified
 */
export function debugMessage(message: {
    _id?: string;
    id?: string;
    senderBy?: string;
    senderId?: string;
    senderName?: string;
    content?: string;
}): MessageDebugInfo {
    const currentUserId = getCurrentUserId();
    const currentUserIdFromToken = extractUserIdFromToken();
    const senderBy = message.senderBy || message.senderId || 'unknown';
    const messageId = message._id || message.id || 'unknown';

    const isCurrentUserMessage =
        senderBy === currentUserId || senderBy === currentUserIdFromToken;

    return {
        currentUserId,
        currentUserIdFromToken,
        messageId,
        senderBy,
        isCurrentUserMessage,
        shouldBeOnRight: isCurrentUserMessage,
    };
}

/**
 * Log message debug info to console
 */
export function logMessageDebug(
    message: {
        _id?: string;
        id?: string;
        senderBy?: string;
        senderId?: string;
        senderName?: string;
        content?: string;
    },
    prefix = '[Message Debug]',
): void {
    const debug = debugMessage(message);

    console.group(`${prefix} ${debug.messageId}`);
    console.log('Content:', message.content || '(no content)');
    console.log('Sender:', debug.senderBy);
    console.log('Sender Name:', message.senderName || '(no name)');
    console.log('---');
    console.log('Current User ID:', debug.currentUserId);
    console.log('Current User ID (from token):', debug.currentUserIdFromToken);
    console.log('Is Current User Message:', debug.isCurrentUserMessage);
    console.log('Should be on RIGHT:', debug.shouldBeOnRight);
    console.groupEnd();
}

/**
 * Validate message sender identification
 */
export function validateMessageAlignment(senderBy: string): {
    isValid: boolean;
    suggestion: string;
} {
    const currentUserId = getCurrentUserId();
    const currentUserIdFromToken = extractUserIdFromToken();

    // Check if senderBy matches either current user ID
    const isCurrentUser =
        senderBy === currentUserId || senderBy === currentUserIdFromToken;

    if (isCurrentUser) {
        return {
            isValid: true,
            suggestion: '✅ Message alignment: should be on RIGHT',
        };
    }

    if (!senderBy || senderBy === 'unknown') {
        return {
            isValid: false,
            suggestion:
                '❌ Unable to identify sender. Check if senderBy is populated in socket payload.',
        };
    }

    return {
        isValid: true,
        suggestion: '✅ Message alignment: should be on LEFT',
    };
}

/**
 * Comprehensive diagnosis of message identification issues
 */
export function diagnoseMessageIssues(): void {
    console.group('[Message Diagnosis]');

    const currentUserId = getCurrentUserId();
    const tokenUserId = extractUserIdFromToken();

    console.log('=== CURRENT USER IDENTIFICATION ===');
    console.log('From localStorage (auth_user):', currentUserId);
    console.log('From JWT token:', tokenUserId);
    console.log(
        'Match:',
        currentUserId === tokenUserId ? '✅ YES' : '❌ MISMATCH',
    );

    console.log('\n=== COMMON ISSUES ===');
    if (!currentUserId) {
        console.warn('⚠️ currentUserId is empty - user not logged in properly');
    }
    if (!tokenUserId) {
        console.warn('⚠️ tokenUserId is empty - JWT token missing or invalid');
    }
    if (currentUserId && tokenUserId && currentUserId !== tokenUserId) {
        console.warn(
            '⚠️ User IDs mismatch - may cause incorrect message alignment',
        );
    }

    console.log('\n=== SOCKET PAYLOAD CHECKLIST ===');
    console.log('✅ Check if socket message includes:');
    console.log('  - senderBy: should contain phone number or userId');
    console.log('  - senderName: optional, but helpful for display');
    console.log('  - createdAt/timestamp: for sorting and display');
    console.log('  - content: message text');

    console.groupEnd();
}
