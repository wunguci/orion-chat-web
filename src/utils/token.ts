import type { User } from '../types/auth.types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function setToken(token: string): void {
    try {
        localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
        console.error('Error storing token:', error);
    }
}

/**
 * Retrieve JWT token from localStorage
 */
export function getToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
        console.error('Error retrieving token:', error);
        return null;
    }
}

/**
 * Remove JWT token from localStorage
 */
export function removeToken(): void {
    try {
        localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
        console.error('Error removing token:', error);
    }
}

/**
 * Store user data in localStorage
 */
export function setUser(user: User): void {
    try {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
        console.error('Error storing user data:', error);
    }
}

/**
 * Retrieve user data from localStorage
 */
export function getUser(): User | null {
    try {
        const userStr = localStorage.getItem(USER_KEY);
        return userStr ? (JSON.parse(userStr) as User) : null;
    } catch (error) {
        console.error('Error retrieving user data:', error);
        return null;
    }
}

/**
 * Remove user data from localStorage
 */
export function removeUser(): void {
    try {
        localStorage.removeItem(USER_KEY);
    } catch (error) {
        console.error('Error removing user data:', error);
    }
}

/**
 * Check if token exists and is not expired
 * JWT format: header.payload.signature
 */
export function isTokenValid(): boolean {
    const token = getToken();
    if (!token) return false;

    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;

        // Decode payload
        const payload = JSON.parse(atob(parts[1]));

        // Check expiry
        if (payload.exp) {
            const now = Math.floor(Date.now() / 1000);
            return payload.exp > now;
        }

        return true;
    } catch (error) {
        console.error('Error validating token:', error);
        return false;
    }
}

/**
 * Logout - clear all auth data
 */
export function logout(): void {
    removeToken();
    removeUser();
}

/**
 * Get authorization header with JWT token
 * Used for API requests that require authentication
 */
export function getAuthHeader(): Record<string, string> {
    const token = getToken();
    if (!token) {
        return {};
    }
    return {
        Authorization: `Bearer ${token}`,
    };
}
