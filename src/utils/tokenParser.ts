/**
 * Extract user info from JWT token
 * Used to get currentUserId for message alignment
 */

export const extractUserIdFromToken = (): string | null => {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;

        // JWT format: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        // Decode payload
        const payload = JSON.parse(atob(parts[1]));

        // Try different userId field names (sub, userId, phoneNumber, id)
        return (
            payload.sub ||
            payload.userId ||
            payload.phoneNumber ||
            payload.id ||
            null
        );
    } catch (error) {
        console.error('Error extracting userId from token:', error);
        return null;
    }
};

export const extractPhoneFromToken = (): string | null => {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;

        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = JSON.parse(atob(parts[1]));
        return payload.phoneNumber || null;
    } catch (error) {
        console.error('Error extracting phone from token:', error);
        return null;
    }
};

export const extractUserInfoFromToken = () => {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;

        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = JSON.parse(atob(parts[1]));
        return {
            userId: payload.sub || payload.userId || payload.id || null,
            phoneNumber: payload.phoneNumber || null,
            email: payload.email || null,
            exp: payload.exp || null,
        };
    } catch (error) {
        console.error('Error extracting user info from token:', error);
        return null;
    }
};
