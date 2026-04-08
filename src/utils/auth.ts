/**
 * Get current user ID from localStorage auth_user
 * Tries multiple field names: id, userId, phone, phoneNumber, sub
 */
export const getCurrentUserId = (): string => {
    try {
        const authUser = localStorage.getItem('auth_user');
      
        if (authUser) {
            const parsed = JSON.parse(authUser);

            // Try multiple field names (backend may use different names)
            const userId =
                parsed?.id ||
                parsed?.userId ||
                parsed?.phone ||
                parsed?.phoneNumber ||
                parsed?.sub ||
                '';

            return userId;
        }
    } catch (err) {
        console.error('Failed to parse auth_user from localStorage:', err);
    }
    // Fallback
    console.warn(
        '⚠️ getCurrentUserId() returning empty string - auth_user not set!',
    );
    return '';
};

/**
 * Get current user full name from localStorage auth_user
 * Tries multiple field names: fullName, name, userName
 */
export const getCurrentUserName = (): string => {
    try {
        const authUser = localStorage.getItem('auth_user');
        if (authUser) {
            const parsed = JSON.parse(authUser);
            return (
                parsed?.fullName || parsed?.name || parsed?.userName || 'User'
            );
        }
    } catch (err) {
        console.error('Failed to parse auth_user from localStorage:', err);
    }
    // Fallback
    return 'User';
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
