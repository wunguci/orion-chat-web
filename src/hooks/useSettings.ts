import { useState, useCallback, useEffect } from "react";
import {
  userSettingsApi,
  notificationSettingsApi,
  privacySettingsApi,
  userDevicesApi,
} from "../services/settingsApi";
import { getToken, getUser } from "../utils/token";

interface UserSettings {
  id: string;
  userId: string;
  theme: string;
  fontSize: number;
  wallpaper: string;
  fontFamily: string;
  accentColor: string;
  smartEmotionDetection: boolean;
  autoWorkflowSuggestions: boolean;
  aiMemoryEnabled: boolean;
  enabledAgents: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationSettings {
  id: string;
  userId: string;
  groupNotifications: boolean;
  tagNotifications: boolean;
  muteAll: boolean;
  messageNotifications: boolean;
  friendRequestNotifications: boolean;
  callNotifications: boolean;
  notificationSound: string;
  doNotDisturbStart: number;
  doNotDisturbEnd: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PrivacySettings {
  id: string;
  userId: string;
  profileVisibility: string;
  messagePermission: string;
  lastSeenVisibility: boolean;
  onlineStatusVisibility: boolean;
  allowAIToSeeProfile: boolean;
  allowAIToSeeMessages: boolean;
  allowAIToSeeMedia: boolean;
  callPermission: string;
  allowScreenSharing: boolean;
  allowDataCollection: boolean;
  allowAnalytics: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserDevice {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: string;
  deviceModel: string;
  osType: string;
  osVersion: string;
  appVersion: string;
  lastLogin: Date;
  isActive: boolean;
  fcmToken: string;
  ipAddress: string;
  createdAt: Date;
  isCurrent?: boolean;
}

const LOCAL_CURRENT_DEVICE_ID = "local-current-device";

type NavigatorUADataLike = {
  brands?: Array<{ brand: string; version: string }>;
};

const getUaBrands = (): string[] => {
  if (typeof navigator === "undefined") return [];
  const nav = navigator as Navigator & { userAgentData?: NavigatorUADataLike };
  const brands = nav.userAgentData?.brands || [];
  return brands.map((item) => item.brand.toLowerCase());
};

const detectBrowserName = (userAgent: string): string => {
  const brands = getUaBrands();
  if (brands.some((brand) => /(coc coc|coccoc|coc_coc)/i.test(brand))) {
    return "Coc Coc";
  }

  if (/coc\s*coc/i.test(navigator.vendor || "")) {
    return "Coc Coc";
  }

  if (/(coc_coc_browser|coccoc|cocbrowser)/i.test(userAgent)) {
    return "Coc Coc";
  }
  if (/edg\//i.test(userAgent)) return "Microsoft Edge";
  if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) {
    return "Google Chrome";
  }
  if (/firefox\//i.test(userAgent)) return "Mozilla Firefox";
  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) {
    return "Safari";
  }
  return "Web Browser";
};

const detectOsName = (userAgent: string): string => {
  if (/windows nt/i.test(userAgent)) return "Windows";
  if (/mac os x/i.test(userAgent)) return "macOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/(iphone|ipad|ipod)/i.test(userAgent)) return "iOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Unknown OS";
};

const detectOsVersion = (userAgent: string): string => {
  const windows = /windows nt\s*([\d.]+)/i.exec(userAgent);
  if (windows?.[1]) return windows[1];

  const mac = /mac os x\s*([\d_]+)/i.exec(userAgent);
  if (mac?.[1]) return mac[1].replace(/_/g, ".");

  const android = /android\s*([\d.]+)/i.exec(userAgent);
  if (android?.[1]) return android[1];

  const ios = /(?:iphone os|cpu (?:iphone )?os)\s*([\d_]+)/i.exec(userAgent);
  if (ios?.[1]) return ios[1].replace(/_/g, ".");

  return "unknown";
};

const markCurrentDevice = (items: UserDevice[]): UserDevice[] => {
  if (!items.length) return [];
  return items.map((device, index) => ({
    ...device,
    isCurrent: device.id === LOCAL_CURRENT_DEVICE_ID ? true : index === 0,
  }));
};

const buildLocalFallbackDevice = (): UserDevice | null => {
  const user = getUser();
  const userId = user?.userId;
  if (!userId) return null;

  const ua = navigator.userAgent || "";
  const browser = detectBrowserName(ua);
  const os = detectOsName(ua);
  const osVersion = detectOsVersion(ua);
  const now = new Date();

  return {
    id: LOCAL_CURRENT_DEVICE_ID,
    userId,
    deviceName: `${browser} on ${os}`,
    deviceType: "web",
    deviceModel: browser,
    osType: os,
    osVersion,
    appVersion: "web",
    lastLogin: now,
    isActive: true,
    fcmToken: "",
    ipAddress: "",
    createdAt: now,
    isCurrent: true,
  };
};

const buildCurrentDeviceCreatePayload = (): Record<string, string> | null => {
  const user = getUser();
  const token = getToken();
  const userId = user?.userId;
  if (!userId || !token) return null;

  const ua = navigator.userAgent || "";
  const browser = detectBrowserName(ua);
  const os = detectOsName(ua);
  const osVersion = detectOsVersion(ua);

  return {
    userId,
    deviceName: `${browser} on ${os}`,
    deviceType: "web",
    deviceModel: browser,
    osType: os,
    osVersion,
    appVersion: "web",
    refreshToken: token,
    ipAddress: "",
  };
};

// User Settings Hook
export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userSettingsApi.getMySettings();
      console.log("[useUserSettings] Fetched settings:", response.data);
      setSettings(response.data);
      setError(null);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || "Failed to fetch settings";
      console.error("[useUserSettings] Fetch error:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      console.log("[useUserSettings] Updating with:", updates);
      try {
        const response = await userSettingsApi.updateMySettings(updates);
        console.log("[useUserSettings] Update response:", response.data);
        setSettings(response.data);
        setError(null);

        // Wait a bit longer and refetch to verify the update persisted
        setTimeout(() => {
          console.log("[useUserSettings] Refetching after update...");
          fetchSettings().catch((err) => {
            console.error("[useUserSettings] Refetch failed, retrying:", err);
            // Retry once more if first attempt fails
            setTimeout(() => fetchSettings(), 500);
          });
        }, 1000); // Increased delay from 500ms to 1000ms

        return response.data;
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message || "Failed to update settings";
        console.error("[useUserSettings] Update error:", errorMsg, err);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [fetchSettings],
  );

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, updateSettings, refetch: fetchSettings };
};

// Notification Settings Hook
export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationSettingsApi.getMySettings();
      console.log("[useNotificationSettings] Fetched settings:", response.data);
      setSettings(response.data);
      setError(null);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || "Failed to fetch settings";
      console.error("[useNotificationSettings] Fetch error:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<NotificationSettings>) => {
      console.log("[useNotificationSettings] Updating with:", updates);
      try {
        const response =
          await notificationSettingsApi.updateMySettings(updates);
        console.log(
          "[useNotificationSettings] Update response:",
          response.data,
        );
        setSettings(response.data);
        setError(null);

        // Wait a bit longer and refetch to verify the update persisted
        setTimeout(() => {
          console.log("[useNotificationSettings] Refetching after update...");
          fetchSettings().catch((err) => {
            console.error(
              "[useNotificationSettings] Refetch failed, retrying:",
              err,
            );
            // Retry once more if first attempt fails
            setTimeout(() => fetchSettings(), 500);
          });
        }, 1000); // Increased delay from 500ms to 1000ms

        return response.data;
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message || "Failed to update settings";
        console.error("[useNotificationSettings] Update error:", errorMsg, err);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [fetchSettings],
  );

  const toggleMute = useCallback(async () => {
    try {
      const response = await notificationSettingsApi.toggleMuteMe();
      setSettings(response.data);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to toggle mute");
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    toggleMute,
    refetch: fetchSettings,
  };
};

// Privacy Settings Hook
export const usePrivacySettings = () => {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await privacySettingsApi.getMySettings();
      console.log("[usePrivacySettings] Fetched settings:", response.data);
      setSettings(response.data);
      setError(null);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || "Failed to fetch settings";
      console.error("[usePrivacySettings] Fetch error:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<PrivacySettings>) => {
      console.log("[usePrivacySettings] Updating with:", updates);
      try {
        const response = await privacySettingsApi.updateMySettings(updates);
        console.log("[usePrivacySettings] Update response:", response.data);
        setSettings(response.data);
        setError(null);

        // Wait a bit longer and refetch to verify the update persisted
        setTimeout(() => {
          console.log("[usePrivacySettings] Refetching after update...");
          fetchSettings().catch((err) => {
            console.error(
              "[usePrivacySettings] Refetch failed, retrying:",
              err,
            );
            // Retry once more if first attempt fails
            setTimeout(() => fetchSettings(), 500);
          });
        }, 1000); // Increased delay from 500ms to 1000ms

        return response.data;
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message || "Failed to update settings";
        console.error("[usePrivacySettings] Update error:", errorMsg, err);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [fetchSettings],
  );

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, updateSettings, refetch: fetchSettings };
};

// User Devices Hook
export const useUserDevices = () => {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    console.log("[useUserDevices] Fetching devices...");
    try {
      const response = await userDevicesApi.getMyDevices();
      const fetchedDevices = Array.isArray(response.data) ? response.data : [];
      console.log("[useUserDevices] Devices fetched:", fetchedDevices);
      console.log("[useUserDevices] Device count:", fetchedDevices.length);

      if (fetchedDevices.length > 0) {
        setDevices(markCurrentDevice(fetchedDevices));
        setError(null);
        return;
      }

      const createPayload = buildCurrentDeviceCreatePayload();
      if (createPayload) {
        try {
          console.log(
            "[useUserDevices] No devices found. Creating current web device...",
          );
          await userDevicesApi.createDevice(createPayload);
          const refreshed = await userDevicesApi.getMyDevices();
          const refreshedDevices = Array.isArray(refreshed.data)
            ? refreshed.data
            : [];
          if (refreshedDevices.length > 0) {
            setDevices(markCurrentDevice(refreshedDevices));
            setError(null);
            return;
          }
        } catch (createErr) {
          console.warn(
            "[useUserDevices] Failed to create current device. Using local fallback.",
            createErr,
          );
        }
      }

      const fallback = buildLocalFallbackDevice();
      setDevices(fallback ? [fallback] : []);
      setError(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to fetch devices";
      console.error("[useUserDevices] Fetch error:", errorMsg, err);
      setError(errorMsg);
      const fallback = buildLocalFallbackDevice();
      setDevices(fallback ? [fallback] : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeDevice = useCallback(async (id: string) => {
    try {
      await userDevicesApi.removeDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove device");
      throw err;
    }
  }, []);

  const deactivateDevice = useCallback(async (id: string) => {
    try {
      const response = await userDevicesApi.deactivateDevice(id);
      setDevices((prev) => prev.map((d) => (d.id === id ? response.data : d)));
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to deactivate device");
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return {
    devices,
    loading,
    error,
    removeDevice,
    deactivateDevice,
    refetch: fetchDevices,
  };
};
