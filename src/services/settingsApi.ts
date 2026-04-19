/*eslint-disable*/
import axios from 'axios';
import { getToken } from '../utils/token';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getToken(); // Use the correct getter function
  console.log(
    "[settingsApi] Token from storage:",
    token ? token.substring(0, 20) + "..." : "NO TOKEN",
  );

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("[settingsApi] Authorization header set");
  } else {
    console.warn(
      "[settingsApi] ⚠ No token available for request to",
      config.url,
    );
  }
  return config;
});

// Add error interceptor for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("[settingsApi] Response error:", {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url,
    });
    return Promise.reject(error);
  },
);

// User Settings API
export const userSettingsApi = {
  // Get my settings
  getMySettings: () => api.get("/user-settings/me"),

  // Get user settings by ID
  getSettings: (userId: string) => api.get(`/user-settings/${userId}`),

  // Create settings
  createSettings: (data: any) => api.post("/user-settings", data),

  // Update my settings
  updateMySettings: (data: any) => api.patch("/user-settings/me/update", data),

  // Update settings by ID
  updateSettings: (userId: string, data: any) =>
    api.patch(`/user-settings/${userId}`, data),

  // Delete settings
  deleteSettings: (userId: string) => api.delete(`/user-settings/${userId}`),
};

// Notification Settings API
export const notificationSettingsApi = {
  // Get my notification settings
  getMySettings: () => api.get("/notification-settings/me"),

  // Get settings by user ID
  getSettings: (userId: string) => api.get(`/notification-settings/${userId}`),

  // Create settings
  createSettings: (data: any) => api.post("/notification-settings", data),

  // Update my settings
  updateMySettings: (data: any) =>
    api.patch("/notification-settings/me/update", data),

  // Update settings by ID
  updateSettings: (userId: string, data: any) =>
    api.patch(`/notification-settings/${userId}`, data),

  // Toggle mute all
  toggleMuteMe: () => api.patch("/notification-settings/me/toggle-mute"),
  toggleMute: (userId: string) =>
    api.patch(`/notification-settings/${userId}/toggle-mute`),

  // Delete settings
  deleteSettings: (userId: string) =>
    api.delete(`/notification-settings/${userId}`),
};

// Privacy Settings API
export const privacySettingsApi = {
  // Get my privacy settings
  getMySettings: () => api.get("/privacy-settings/me"),

  // Get settings by user ID
  getSettings: (userId: string) => api.get(`/privacy-settings/${userId}`),

  // Create settings
  createSettings: (data: any) => api.post("/privacy-settings", data),

  // Update my settings
  updateMySettings: (data: any) =>
    api.patch("/privacy-settings/me/update", data),

  // Update settings by ID
  updateSettings: (userId: string, data: any) =>
    api.patch(`/privacy-settings/${userId}`, data),

  // Delete settings
  deleteSettings: (userId: string) => api.delete(`/privacy-settings/${userId}`),
};

// User Devices API
export const userDevicesApi = {
  // Get my devices
  getMyDevices: async () => {
    console.log("[userDevicesApi] Calling GET /user-devices/me/devices");
    try {
      const response = await api.get("/user-devices/me/devices");
      console.log("[userDevicesApi] Response:", response);
      console.log("[userDevicesApi] Response.data:", response.data);
      console.log("[userDevicesApi] Is array?", Array.isArray(response.data));
      return response;
    } catch (error) {
      console.error("[userDevicesApi] Error fetching devices:", error);
      throw error;
    }
  },

  // Get active devices
  getMyActiveDevices: () => api.get("/user-devices/me/active-devices"),

  // Get devices by user ID
  getDevices: (userId: string) => api.get(`/user-devices/user/${userId}`),

  // Get device by ID
  getDevice: (id: string) => api.get(`/user-devices/${id}`),

  // Create new device
  createDevice: (data: any) => api.post("/user-devices", data),

  // Update device
  updateDevice: (id: string, data: any) =>
    api.patch(`/user-devices/${id}`, data),

  // Update last login
  updateLastLogin: (id: string) => api.patch(`/user-devices/${id}/last-login`),

  // Deactivate device
  deactivateDevice: (id: string) => api.patch(`/user-devices/${id}/deactivate`),

  // Remove device
  removeDevice: (id: string) => api.delete(`/user-devices/${id}`),

  // Remove all devices except current
  removeAllExcept: (userId: string, currentDeviceId: string) =>
    api.delete(`/user-devices/user/${userId}/except/${currentDeviceId}`),
};
