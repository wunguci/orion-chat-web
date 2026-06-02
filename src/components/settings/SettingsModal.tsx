/*eslint-disable*/
import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Bell,
  Palette,
  Smartphone,
  ChevronRight,
  X,
  Loader,
  Bot,
} from "lucide-react";
import clsx from "clsx";
import { getUser, saveUserData } from "../../utils/token";
import { updateUserProfile } from "../../services/userService";
import {
  useUserSettings,
  useNotificationSettings,
  usePrivacySettings,
  useUserDevices,
} from "../../hooks/useSettings";
import ProfileSettings from "./ProfileSettings";
import PrivacySettings from "./PrivacySettings";
import NotificationSettings from "./NotificationSettings";
import AppearanceSettings from "./AppearanceSettings";
import LinkedDevices from "./LinkedDevices";
import {
  buildAppearanceThemeVars,
  getAppearanceColorFromWallpaper,
  notifyAppearanceThemeChanged,
} from "../../theme/appearance";
import ToggleSwitch from "../common/ToggleSwitch";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

function toAbsoluteMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

type SettingsThemeVars = React.CSSProperties &
  Record<`--settings-${string}`, string>;

function buildSettingsThemeVars(
  theme?: string | null,
  appearanceColor?: string | null,
): SettingsThemeVars {
  return buildAppearanceThemeVars({
    theme,
    appearanceColor,
    prefix: "settings",
  }) as SettingsThemeVars;
}

type TabType =
  | "profile"
  | "privacy"
  | "notifications"
  | "appearance"
  | "devices"
  | "ai";

interface SettingsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SettingsModal({
  isOpen = true,
  onClose,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Custom hooks for settings
  const userSettings = useUserSettings();
  const notificationSettings = useNotificationSettings();
  const privacySettings = usePrivacySettings();
  const userDevices = useUserDevices();

  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    birthDate: "",
    gender: "",
  });

  // Settings form state
  const [formData, setFormData] = useState({
    // User Settings
    theme: "light",
    appearanceColor: "green",
    fontSize: 16,
    fontFamily: "default",
    accentColor: "#2ab3b3",
    wallpaper: "teal",
    textSize: "medium",
    smartEmotionDetection: false,
    autoWorkflowSuggestions: true,
    aiMemoryEnabled: true,
    enabledAgents: [] as string[],

    // Notification Settings
    groupNotifications: true,
    tagNotifications: true,
    muteAll: false,
    messageNotifications: true,
    friendRequestNotifications: true,
    callNotifications: true,
    notificationSound: "Crystal Clear",
    doNotDisturbStart: 0,
    doNotDisturbEnd: 0,

    // Privacy Settings
    profileVisibility: "friends",
    messagePermission: "friends",
    lastSeenVisibility: true,
    onlineStatusVisibility: true,
    allowAIToSeeProfile: false,
    allowAIToSeeMessages: false,
    allowAIToSeeMedia: false,
    callPermission: "friends",
    allowScreenSharing: true,
    allowDataCollection: false,
    allowAnalytics: false,

    // Profile preferences
    pushNotifications: true,
    readReceipts: true,
    soundEffects: true,
  });

  const [selectedFiles, setSelectedFiles] = useState<{
    avatar?: File;
    cover?: File;
  }>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  const [hasSettingsChanges, setHasSettingsChanges] = useState(false);
  // const { currentColors } = useThemeColors(formData.wallpaper || "teal");

  useEffect(() => {
    const userData = getUser();
    if (userData) {
      setProfileData({
        fullName: userData.fullName || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
        birthDate: userData.birthDate || "",
        gender: userData.gender || "",
      });
      if (userData.avatarUrl) {
        setAvatarPreview(toAbsoluteMediaUrl(userData.avatarUrl));
      }
    }
  }, []);

  useEffect(() => {
    if (userSettings.settings) {
      setFormData((prev) => ({
        ...prev,
        theme: userSettings.settings?.theme || "light",
        appearanceColor: userSettings.settings?.appearanceColor || "green",
        fontSize: userSettings.settings?.fontSize || 16,
        fontFamily: userSettings.settings?.fontFamily || "default",
        accentColor: userSettings.settings?.accentColor || "#2ab3b3",
        wallpaper: userSettings.settings?.wallpaper || "teal",
        smartEmotionDetection:
          userSettings.settings?.smartEmotionDetection ?? false,
        autoWorkflowSuggestions:
          userSettings.settings?.autoWorkflowSuggestions ?? true,
        aiMemoryEnabled: userSettings.settings?.aiMemoryEnabled ?? true,
        enabledAgents: userSettings.settings?.enabledAgents || [],
      }));
    }
  }, [userSettings.settings]);

  useEffect(() => {
    if (notificationSettings.settings) {
      setFormData((prev) => ({
        ...prev,
        groupNotifications:
          notificationSettings.settings?.groupNotifications ?? true,
        tagNotifications:
          notificationSettings.settings?.tagNotifications ?? true,
        muteAll: notificationSettings.settings?.muteAll ?? false,
        messageNotifications:
          notificationSettings.settings?.messageNotifications ?? true,
        friendRequestNotifications:
          notificationSettings.settings?.friendRequestNotifications ?? true,
        callNotifications:
          notificationSettings.settings?.callNotifications ?? true,
        notificationSound:
          notificationSettings.settings?.notificationSound || "Crystal Clear",
        doNotDisturbStart:
          notificationSettings.settings?.doNotDisturbStart || 0,
        doNotDisturbEnd: notificationSettings.settings?.doNotDisturbEnd || 0,
      }));
    }
  }, [notificationSettings.settings]);

  useEffect(() => {
    if (privacySettings.settings) {
      setFormData((prev) => ({
        ...prev,
        profileVisibility:
          privacySettings.settings?.profileVisibility || "friends",
        messagePermission:
          privacySettings.settings?.messagePermission || "friends",
        lastSeenVisibility:
          privacySettings.settings?.lastSeenVisibility ?? true,
        onlineStatusVisibility:
          privacySettings.settings?.onlineStatusVisibility ?? true,
        allowAIToSeeProfile:
          privacySettings.settings?.allowAIToSeeProfile ?? false,
        allowAIToSeeMessages:
          privacySettings.settings?.allowAIToSeeMessages ?? false,
        allowAIToSeeMedia: privacySettings.settings?.allowAIToSeeMedia ?? false,
        callPermission: privacySettings.settings?.callPermission || "friends",
        allowScreenSharing:
          privacySettings.settings?.allowScreenSharing ?? true,
        allowDataCollection:
          privacySettings.settings?.allowDataCollection ?? false,
        allowAnalytics: privacySettings.settings?.allowAnalytics ?? false,
      }));
    }
  }, [privacySettings.settings]);

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "wallpaper" && typeof value === "string"
        ? { appearanceColor: getAppearanceColorFromWallpaper(value) }
        : {}),
    }));
    setHasSettingsChanges(true);
  };

  const handleProfileInputChange = (field: string, value: unknown) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    setHasProfileChanges(true);
  };

  const handleFileSelect = (type: "avatar" | "cover", file: File) => {
    setSelectedFiles((prev) => ({ ...prev, [type]: file }));
    setHasProfileChanges(true);

    if (type === "avatar") {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!hasProfileChanges) {
      setSaveSuccess("No changes to save");
      setTimeout(() => setSaveSuccess(null), 3000);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const result = await updateUserProfile(profileData, selectedFiles);

      const userData = getUser();
      if (userData) {
        const responseData =
          result && typeof result === "object" && "data" in result
            ? (result.data as Record<string, unknown>)
            : null;

        const avatarUrlFromResponse =
          responseData && typeof responseData.avatarUrl === "string"
            ? toAbsoluteMediaUrl(responseData.avatarUrl)
            : undefined;

        const updatedUser = {
          ...userData,
          ...profileData,
          ...(responseData ?? {}),
          ...(avatarUrlFromResponse
            ? { avatarUrl: avatarUrlFromResponse }
            : {}),
        };
        saveUserData(updatedUser);

        if (avatarUrlFromResponse) {
          setAvatarPreview(avatarUrlFromResponse);
        }
      }

      setHasProfileChanges(false);
      setSelectedFiles({});
      setSaveSuccess("Profile updated successfully!");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update profile";
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!hasSettingsChanges) {
      setSaveSuccess("No changes to save");
      setTimeout(() => setSaveSuccess(null), 3000);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // Save user settings
      if (userSettings.settings) {
        const result = await userSettings.updateSettings({
          theme: formData.theme,
          appearanceColor: formData.appearanceColor,
          fontSize: formData.fontSize,
          fontFamily: formData.fontFamily,
          accentColor: formData.accentColor,
          wallpaper: formData.wallpaper,
          smartEmotionDetection: formData.smartEmotionDetection,
          autoWorkflowSuggestions: formData.autoWorkflowSuggestions,
          aiMemoryEnabled: formData.aiMemoryEnabled,
          enabledAgents: formData.enabledAgents,
        });

        // Update formData với giá trị trả về (nếu có)
        setFormData((prev) => ({
          ...prev,
          theme: result.theme || prev.theme,
          appearanceColor: result.appearanceColor || prev.appearanceColor,
          fontSize: result.fontSize || prev.fontSize,
          fontFamily: result.fontFamily || prev.fontFamily,
          accentColor: result.accentColor || prev.accentColor,
          wallpaper: result.wallpaper || prev.wallpaper,
          smartEmotionDetection:
            result.smartEmotionDetection ?? prev.smartEmotionDetection,
          autoWorkflowSuggestions:
            result.autoWorkflowSuggestions ?? prev.autoWorkflowSuggestions,
          aiMemoryEnabled: result.aiMemoryEnabled ?? prev.aiMemoryEnabled,
          enabledAgents: result.enabledAgents || prev.enabledAgents,
        }));

        notifyAppearanceThemeChanged({
          theme: result.theme || formData.theme,
          appearanceColor: result.appearanceColor || formData.appearanceColor,
        });
      }

      // Save notification settings
      if (notificationSettings.settings) {
        const result = await notificationSettings.updateSettings({
          groupNotifications: formData.groupNotifications,
          tagNotifications: formData.tagNotifications,
          muteAll: formData.muteAll,
          messageNotifications: formData.messageNotifications,
          friendRequestNotifications: formData.friendRequestNotifications,
          callNotifications: formData.callNotifications,
          notificationSound: formData.notificationSound,
          doNotDisturbStart: formData.doNotDisturbStart,
          doNotDisturbEnd: formData.doNotDisturbEnd,
        });

        // Update formData với giá trị trả về (nếu có)
        setFormData((prev) => ({
          ...prev,
          groupNotifications:
            result.groupNotifications ?? prev.groupNotifications,
          tagNotifications: result.tagNotifications ?? prev.tagNotifications,
          muteAll: result.muteAll ?? prev.muteAll,
          messageNotifications:
            result.messageNotifications ?? prev.messageNotifications,
          friendRequestNotifications:
            result.friendRequestNotifications ??
            prev.friendRequestNotifications,
          callNotifications: result.callNotifications ?? prev.callNotifications,
          notificationSound: result.notificationSound || prev.notificationSound,
          doNotDisturbStart: result.doNotDisturbStart ?? prev.doNotDisturbStart,
          doNotDisturbEnd: result.doNotDisturbEnd ?? prev.doNotDisturbEnd,
        }));
      }

      // Save privacy settings
      if (privacySettings.settings) {
        const result = await privacySettings.updateSettings({
          profileVisibility: formData.profileVisibility,
          messagePermission: formData.messagePermission,
          callPermission: formData.callPermission,
          lastSeenVisibility: formData.lastSeenVisibility,
          onlineStatusVisibility: formData.onlineStatusVisibility,
        });
        // Update formData với giá trị trả về (nếu có)
        setFormData((prev) => ({
          ...prev,
          profileVisibility: result.profileVisibility || prev.profileVisibility,
          messagePermission: result.messagePermission || prev.messagePermission,
          callPermission: result.callPermission || prev.callPermission,
          lastSeenVisibility:
            result.lastSeenVisibility ?? prev.lastSeenVisibility,
          onlineStatusVisibility:
            result.onlineStatusVisibility ?? prev.onlineStatusVisibility,
        }));
      }

      setHasSettingsChanges(false);
      setSaveSuccess("Settings updated successfully! Changes have been saved.");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update settings";
      setSaveError(`Save failed: ${errorMessage}`);
      console.error("Settings save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    const currentUserData = getUser();
    if (currentUserData) {
      setProfileData({
        fullName: currentUserData.fullName || "",
        email: currentUserData.email || "",
        phoneNumber: currentUserData.phoneNumber || "",
        birthDate: currentUserData.birthDate || "",
        gender: currentUserData.gender || "",
      });
    }
    setHasProfileChanges(false);
    setSelectedFiles({});
    setSaveError(null);
    setSaveSuccess(null);

    if (currentUserData?.avatarUrl) {
      setAvatarPreview(toAbsoluteMediaUrl(currentUserData.avatarUrl));
    }
  };

  const handleDiscardSettings = () => {
    setFormData((prev) => ({
      ...prev,
      // Appearance / AI settings
      ...(userSettings.settings && {
        theme: userSettings.settings.theme || "light",
        appearanceColor: userSettings.settings.appearanceColor || "green",
        fontSize: userSettings.settings.fontSize || 16,
        fontFamily: userSettings.settings.fontFamily || "default",
        accentColor: userSettings.settings.accentColor || "#2ab3b3",
        wallpaper: userSettings.settings.wallpaper || "teal",
        smartEmotionDetection:
          userSettings.settings.smartEmotionDetection ?? false,
        autoWorkflowSuggestions:
          userSettings.settings.autoWorkflowSuggestions ?? true,
        aiMemoryEnabled: userSettings.settings.aiMemoryEnabled ?? true,
        enabledAgents: userSettings.settings.enabledAgents || [],
      }),
      // Notification settings
      ...(notificationSettings.settings && {
        groupNotifications:
          notificationSettings.settings.groupNotifications ?? true,
        tagNotifications:
          notificationSettings.settings.tagNotifications ?? true,
        muteAll: notificationSettings.settings.muteAll ?? false,
        messageNotifications:
          notificationSettings.settings.messageNotifications ?? true,
        friendRequestNotifications:
          notificationSettings.settings.friendRequestNotifications ?? true,
        callNotifications:
          notificationSettings.settings.callNotifications ?? true,
        notificationSound:
          notificationSettings.settings.notificationSound || "Crystal Clear",
        doNotDisturbStart: notificationSettings.settings.doNotDisturbStart || 0,
        doNotDisturbEnd: notificationSettings.settings.doNotDisturbEnd || 0,
      }),
      // Privacy settings
      ...(privacySettings.settings && {
        profileVisibility:
          privacySettings.settings.profileVisibility || "friends",
        messagePermission:
          privacySettings.settings.messagePermission || "friends",
        lastSeenVisibility: privacySettings.settings.lastSeenVisibility ?? true,
        onlineStatusVisibility:
          privacySettings.settings.onlineStatusVisibility ?? true,
        callPermission: privacySettings.settings.callPermission || "friends",
        allowScreenSharing: privacySettings.settings.allowScreenSharing ?? true,
        allowDataCollection:
          privacySettings.settings.allowDataCollection ?? false,
        allowAnalytics: privacySettings.settings.allowAnalytics ?? false,
      }),
    }));
    setHasSettingsChanges(false);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const tabs = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
      description: "Avatar, name, and bio",
    },
    {
      id: "privacy",
      label: "Privacy",
      icon: Lock,
      description: "Blocked users, encryption",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Mute, sounds, and badges",
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: Palette,
      description: "Themes, wallpapers, fonts",
    },
    // {
    //   id: "devices",
    //   label: "Devices",
    //   icon: Smartphone,
    //   description: "Active sessions and logins",
    // },
  ];

  const toggleOption = (field: string) => {
    handleInputChange(field, !formData[field as keyof typeof formData]);
  };

  const modalThemeVars = buildSettingsThemeVars(
    formData.theme,
    formData.appearanceColor,
  );

  const renderLoadingState = () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <Loader className="w-12 h-12 animate-spin text-[var(--settings-primary)] mx-auto mb-4" />
        <p className="text-[var(--settings-muted)]">Loading settings...</p>
      </div>
    </div>
  );

  const renderContent = () => {
    // Xác định trạng thái tải dựa trên tab đang hoạt động và trạng thái của từng hook
    const isLoading =
      activeTab === "profile"
        ? false
        : activeTab === "notifications"
          ? notificationSettings.loading
          : activeTab === "privacy"
            ? privacySettings.loading
            : activeTab === "devices"
              ? userDevices.loading
              : userSettings.loading;

    if (isLoading) {
      return renderLoadingState();
    }

    switch (activeTab) {
      case "profile":
        return (
          <ProfileSettings
            avatarPreview={avatarPreview}
            profileData={profileData}
            handleFileSelect={handleFileSelect}
            handleProfileInputChange={handleProfileInputChange}
            toggleOption={toggleOption}
            formData={formData}
            saveError={saveError}
            saveSuccess={saveSuccess}
            isSaving={isSaving}
            hasProfileChanges={hasProfileChanges}
            handleSaveProfile={handleSaveProfile}
            handleDiscard={handleDiscard}
          />
        );

      case "privacy":
        return (
          <PrivacySettings
            saveError={saveError}
            saveSuccess={saveSuccess}
            isSaving={isSaving}
            hasProfileChanges={hasProfileChanges}
            hasSettingsChanges={hasSettingsChanges}
            formData={{
              profileVisibility: formData.profileVisibility as
                | "public"
                | "friends"
                | "private",
              messagePermission: formData.messagePermission as
                | "everyone"
                | "friends"
                | "nobody",
              callPermission: formData.callPermission as
                | "everyone"
                | "friends"
                | "nobody",
              readReceipts: formData.readReceipts,
            }}
            handleInputChange={handleInputChange}
            handleDiscardSettings={handleDiscardSettings}
            handleSaveSettings={handleSaveSettings}
            toggleOption={toggleOption}
          />
        );

      case "notifications":
        return (
          <NotificationSettings
            formData={formData}
            handleInputChange={handleInputChange}
            toggleOption={toggleOption}
            handleDiscardSettings={handleDiscardSettings}
            handleSaveSettings={handleSaveSettings}
            saveError={saveError}
            saveSuccess={saveSuccess}
            isSaving={isSaving}
            hasSettingsChanges={hasSettingsChanges}
          />
        );

      case "appearance":
        return (
          <AppearanceSettings
            formData={formData}
            handleInputChange={handleInputChange}
            handleDiscardSettings={handleDiscardSettings}
            handleSaveSettings={handleSaveSettings}
            saveError={saveError}
            saveSuccess={saveSuccess}
            isSaving={isSaving}
            hasSettingsChanges={hasSettingsChanges}
          />
        );

      // case "devices":
      //   return (
      //     <LinkedDevices
      //       userDevices={{
      //         ...userDevices,
      //         devices: userDevices.devices.map((device) => ({
      //           ...device,
      //           lastLogin:
      //             device.lastLogin instanceof Date
      //               ? device.lastLogin.toISOString()
      //               : device.lastLogin,
      //           isCurrent: device.isCurrent ?? false,
      //         })),
      //       }}
      //       saveError={saveError}
      //       saveSuccess={saveSuccess}
      //     />
      //   );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4 py-3 z-50 overflow-hidden bg-[var(--settings-overlay)]"
      style={modalThemeVars}
    >
      <div className="bg-[var(--settings-surface)] text-[var(--settings-text)] rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-[var(--settings-close-hover)] rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={24} className="text-[var(--settings-muted)]" />
        </button>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 bg-[var(--settings-surface-bg)] border-r border-[var(--settings-primary-border)] p-6 overflow-y-auto shrink-0">
            <h1 className="text-2xl font-bold text-[var(--settings-text)] mb-2">
              Settings
            </h1>
            <p className="text-[var(--settings-muted)] mb-8">
              Manage your account and app experience
            </p>

            <div className="space-y-3">
              {tabs.map(({ id, label, icon: Icon, description }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as TabType)}
                  className={clsx(
                    "w-full flex items-start gap-3 px-4 py-3 rounded-2xl transition-all text-left",
                    activeTab === id
                      ? "bg-[var(--settings-primary-bg)] border-2 border-[var(--settings-primary)]"
                      : "hover:bg-[var(--settings-primary-bg)]",
                  )}
                >
                  <Icon
                    size={24}
                    className={clsx(
                      "mt-1 shrink-0",
                      activeTab === id
                        ? "text-[var(--settings-primary)]"
                        : "text-[var(--settings-muted)]",
                    )}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--settings-text)]">
                      {label}
                    </p>
                    <p className="text-sm text-[var(--settings-muted)]">
                      {description}
                    </p>
                  </div>
                  {activeTab === id && (
                    <ChevronRight
                      size={24}
                      className="text-[var(--settings-primary)] mt-1"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-8 overflow-y-auto bg-[var(--settings-content)]">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
