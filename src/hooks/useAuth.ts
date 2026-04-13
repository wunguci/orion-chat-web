import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../types/auth.types";
import { getToken, getUser, logout, isTokenValid } from "../utils/token";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface UseAuthReturn extends AuthState {
  logout: () => void;
}

/**
 * Initialize auth state from localStorage
 */
function initAuthState(): AuthState {
  const storedToken = getToken();
  const storedUser = getUser();

  console.log("[useAuth] initAuthState:");
  console.log("   Token exists:", !!storedToken);
  console.log("   User data:", storedUser);

  if (storedToken && isTokenValid()) {
    console.log("[useAuth] Authentication valid");

    // Log token expiry info for debugging
    try {
      const parts = storedToken.split(".");
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp) {
        const expiresAt = new Date(payload.exp * 1000);
        const timeUntilExpiry = Math.floor(
          (expiresAt.getTime() - Date.now()) / 1000 / 60,
        );
        console.log(
          `   Token expires in ~${timeUntilExpiry} minutes at ${expiresAt.toLocaleTimeString()}`,
        );
      }
    } catch (error) {
      console.error("[useAuth] Error parsing token expiry:", error);
    }

    return {
      token: storedToken,
      user: storedUser,
      isAuthenticated: true,
      loading: false,
    };
  }

  // Token is invalid or missing, clear auth
  console.log("[useAuth] Authentication invalid, clearing auth");
  if (storedToken && !isTokenValid()) {
    try {
      const parts = storedToken.split(".");
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp) {
        const expiresAt = new Date(payload.exp * 1000);
        console.log(`   Token expired at ${expiresAt.toLocaleTimeString()}`);
      }
    } catch (error) {
      console.error("[useAuth] Error parsing expired token:", error);
    }
  }
  logout();
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
  };
}

/**
 * useAuth Hook
 * Provides authentication state and user information
 * Automatically checks token validity on mount
 */
export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>(initAuthState);

  useEffect(() => {
    // Optional: You can add additional setup or listeners here
  }, []);

  const handleLogout = () => {
    logout();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
    });
    navigate("/auth/login");
  };

  return {
    ...authState,
    logout: handleLogout,
  };
}
