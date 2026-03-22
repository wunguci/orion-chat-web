/**
 * Get current user ID from localStorage auth_user
 */
export const getCurrentUserId = (): string => {
    try {
        const authUser = localStorage.getItem('auth_user');
        if (authUser) {
            const parsed = JSON.parse(authUser);
            if (parsed?.id) {
                return parsed.id;
            }
        }
    } catch (err) {
        console.error('Failed to parse auth_user from localStorage:', err);
    }
    // Fallback
    return '';
};

/**
 * Get current user full name from localStorage auth_user
 */
export const getCurrentUserName = (): string => {
    try {
        const authUser = localStorage.getItem('auth_user');
        if (authUser) {
            const parsed = JSON.parse(authUser);
            if (parsed?.fullName) {
                return parsed.fullName;
            }
        }
    } catch (err) {
        console.error('Failed to parse auth_user from localStorage:', err);
    }
    // Fallback
    return 'Guest';
};

/**
 * Parse auth_user from localStorage
 */
export const getAuthUser = (): { id?: string; fullName?: string } | null => {
    try {
        const authUser = localStorage.getItem('auth_user');
        if (authUser) {
            return JSON.parse(authUser);
        }
    } catch (err) {
        console.error('Failed to parse auth_user from localStorage:', err);
    }
    return null;
};
