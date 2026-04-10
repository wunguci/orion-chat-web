import type { User } from "../types/auth.types";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
<<<<<<< Updated upstream

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
=======

function normalizeUser(user: User): User {
  const resolvedId = user.id || user.userId;
  return {
    ...user,
    id: resolvedId,
    userId: user.userId || resolvedId,
  };
}

/**
 * Save any object to localStorage as user data
 * This is flexible - saves everything from server response
 */
export function saveUserData(data: Record<string, unknown>): void {
  try {
    const jsonStr = JSON.stringify(data);

    localStorage.setItem(USER_KEY, jsonStr);
  } catch (error) {
    console.error("[saveUserData] Error:", error);
  }
}

export function setToken(token: string): void {
  try {
    const oldToken = localStorage.getItem(TOKEN_KEY);
    localStorage.setItem(TOKEN_KEY, token);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: TOKEN_KEY,
        oldValue: oldToken,
        newValue: token,
        storageArea: localStorage,
      }),
    );
>>>>>>> Stashed changes
  } catch (error) {
    console.error("Error storing token:", error);
  }
}

/**
 * Retrieve JWT token from localStorage
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error("Error retrieving token:", error);
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
    console.error("Error removing token:", error);
  }
}

/**
 * Store user data in localStorage
 */
export function setUser(user: User): void {
  try {
<<<<<<< Updated upstream
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Error storing user data:", error);
=======
    const normalizedUser = normalizeUser(user);
    const jsonStr = JSON.stringify(normalizedUser);
    localStorage.setItem(USER_KEY, jsonStr);
  } catch (error) {
    console.error("❌ Error storing user data:", error);
>>>>>>> Stashed changes
  }
}

/**
 * Retrieve user data from localStorage
 */
export function getUser(): User | null {
  try {
    const userStr = localStorage.getItem(USER_KEY);
<<<<<<< Updated upstream
    return userStr ? (JSON.parse(userStr) as User) : null;
=======
    if (!userStr) {
      console.log("No user data in localStorage");
      return null;
    }
    const user = JSON.parse(userStr) as User;
    return normalizeUser(user);
>>>>>>> Stashed changes
  } catch (error) {
    console.error("Error retrieving user data:", error);
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
    console.error("Error removing user data:", error);
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
    const parts = token.split(".");
    if (parts.length !== 3) return false;

<<<<<<< Updated upstream
    // Decode payload (supports both base64 and base64url)
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
=======
    // Decode payload
    const payload = JSON.parse(atob(parts[1]));
>>>>>>> Stashed changes

    // Check expiry
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    }

    return true;
  } catch (error) {
    console.error("Error validating token:", error);
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
<<<<<<< Updated upstream
  if (!token || !isTokenValid()) {
    if (token) {
      logout();
    }
=======
  if (!token) {
>>>>>>> Stashed changes
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}
