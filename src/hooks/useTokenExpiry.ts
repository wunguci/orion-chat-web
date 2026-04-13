import { useEffect } from "react";
import { getToken, isTokenValid } from "../utils/token";
import { handleSessionExpired } from "../utils/sessionValidator";

/**
 * Hook to monitor token expiry locally
 * Checks JWT exp claim every minute (not calling backend)
 * Only redirects to login when token actually expires
 */
export function useTokenExpiry() {
  useEffect(() => {
    // Function to check if token is still valid (local check only)
    const checkTokenExpiry = () => {
      const token = getToken();

      if (!token) {
        console.log("[useTokenExpiry] No token found");
        return;
      }

      // Check if token is still valid by examining JWT exp claim
      if (!isTokenValid()) {
        console.warn("[useTokenExpiry] Token expired, logging out...");
        // Token has expired - redirect to login
        handleSessionExpired();
      } else {
        // Token still valid, extract exp time for logging
        try {
          const parts = token.split(".");
          const payload = JSON.parse(atob(parts[1]));
          const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
          const timeUntilExpiry = expiresAt
            ? Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60)
            : null;

          if (timeUntilExpiry) {
            console.log(
              `[useTokenExpiry] Token valid, expires in ~${timeUntilExpiry} minutes`,
            );
          }
        } catch (error) {
          console.error("[useTokenExpiry] Error parsing token:", error);
        }
      }
    };

    // Check immediately on mount
    checkTokenExpiry();

    // Set up interval to check every 60 seconds (not 30)
    // This is lighter than calling backend every 30 seconds
    const interval = setInterval(checkTokenExpiry, 60 * 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, []);
}
