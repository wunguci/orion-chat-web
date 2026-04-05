import { useEffect } from "react";
import { handleSessionExpired } from "../utils/sessionValidator";

/**
 * Hook to detect when user logs in from another tab/window
 * Uses storage events to detect changes across tabs
 */
export function useSessionCheck() {
  useEffect(() => {
    // Listen for storage changes (triggered by another tab)
    const handleStorageChange = (e: StorageEvent) => {
      console.log(
        "[useSessionCheck] Storage event detected:",
        e.key,
        e.newValue ? "Changed" : "Cleared",
      );

      // If auth_token was cleared or changed from another tab
      if (e.key === "auth_token") {
        if (!e.newValue) {
          // Token was cleared (user logged out from another tab)
          console.warn("[useSessionCheck] Token cleared from another tab");
          handleSessionExpired();
        } else if (e.oldValue && e.newValue !== e.oldValue) {
          // Token was changed (user logged in from another tab)
          console.warn("[useSessionCheck] Token changed from another tab");
          handleSessionExpired();
        }
      }
    };

    // Listen for storage events
    window.addEventListener("storage", handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
}

/**
 * Hook to periodically check if session is still valid
 * Calls backend to verify token is still current
 */
export function usePeriodicSessionCheck(intervalMs: number = 30000) {
  useEffect(() => {
    // Function to check session
    const checkSession = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        const response = await fetch(
          "https://aracelis-provable-grammatically.ngrok-free.dev/auth/verify-token",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 401) {
          const data = await response.json();
          if (
            data.message &&
            data.message.includes("Phiên làm việc đã hết hạn")
          ) {
            console.warn("[usePeriodicSessionCheck] Session expired detected");
            handleSessionExpired();
          }
        }
      } catch (error) {
        console.error(
          "[usePeriodicSessionCheck] Error checking session:",
          error,
        );
      }
    };

    // Set up interval
    const interval = setInterval(checkSession, intervalMs);

    // Check immediately on mount
    checkSession();

    // Cleanup
    return () => clearInterval(interval);
  }, [intervalMs]);
}
