import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Lock,
  Bell,
  Palette,
  Smartphone,
  ChevronRight,
  Upload,
  Volume2,
  Eye,
  Shield,
  X,
  Sun,
  Moon,
  Monitor,
  QrCode,
  Chrome,
  Info,
  Play,
  Loader,
} from "lucide-react";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import InputTextWithLabel from "../common/InputTextWithLabel";
import ToggleSwitch from "../common/ToggleSwitch";
import ToggleSwitchButton from "../common/ToggleSwitchButton";
import SelectionButton from "../common/SelectionButton";
import Button from "../common/Button";
import { getUser, saveUserData } from "../../utils/token";
import { updateUserProfile } from "../../services/userService";
import {
  useUserSettings,
  useNotificationSettings,
  usePrivacySettings,
  useUserDevices,
} from "../../hooks/useSettings";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

function toAbsoluteMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

type TabType =
  | "profile"
  | "privacy"
  | "notifications"
  | "appearance"
  | "devices";

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
    fontSize: 16,
    fontFamily: "default",
    accentColor: "#2ab3b3",
    wallpaper: "teal",
    textSize: "medium",

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
    messagePermission: "everyone",
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

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<{
    avatar?: File;
    cover?: File;
  }>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  const [hasSettingsChanges, setHasSettingsChanges] = useState(false);

  // Load settings data on component mount
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

  // Load user settings from API
  useEffect(() => {
    if (userSettings.settings) {
      setFormData((prev) => ({
        ...prev,
        theme: userSettings.settings?.theme || "light",
        fontSize: userSettings.settings?.fontSize || 16,
        fontFamily: userSettings.settings?.fontFamily || "default",
        accentColor: userSettings.settings?.accentColor || "#2ab3b3",
        wallpaper: userSettings.settings?.wallpaper || "teal",
      }));
    }
  }, [userSettings.settings]);

  // Load notification settings from API
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

  // Load privacy settings from API
  useEffect(() => {
    if (privacySettings.settings) {
      setFormData((prev) => ({
        ...prev,
        profileVisibility:
          privacySettings.settings?.profileVisibility || "friends",
        messagePermission:
          privacySettings.settings?.messagePermission || "everyone",
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

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasSettingsChanges(true);
  };

  const handleProfileInputChange = (field: string, value: any) => {
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
          fontSize: formData.fontSize,
          fontFamily: formData.fontFamily,
          accentColor: formData.accentColor,
          wallpaper: formData.wallpaper,
        });
        // Update form data with returned values to ensure consistency
        setFormData((prev) => ({
          ...prev,
          theme: result.theme || prev.theme,
          fontSize: result.fontSize || prev.fontSize,
          fontFamily: result.fontFamily || prev.fontFamily,
          accentColor: result.accentColor || prev.accentColor,
          wallpaper: result.wallpaper || prev.wallpaper,
        }));
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
        // Update form data with returned values
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
          lastSeenVisibility: formData.lastSeenVisibility,
          onlineStatusVisibility: formData.onlineStatusVisibility,
          allowAIToSeeProfile: formData.allowAIToSeeProfile,
          allowAIToSeeMessages: formData.allowAIToSeeMessages,
          allowAIToSeeMedia: formData.allowAIToSeeMedia,
          callPermission: formData.callPermission,
          allowScreenSharing: formData.allowScreenSharing,
          allowDataCollection: formData.allowDataCollection,
          allowAnalytics: formData.allowAnalytics,
        });
        // Update form data with returned values
        setFormData((prev) => ({
          ...prev,
          profileVisibility: result.profileVisibility || prev.profileVisibility,
          messagePermission: result.messagePermission || prev.messagePermission,
          lastSeenVisibility:
            result.lastSeenVisibility ?? prev.lastSeenVisibility,
          onlineStatusVisibility:
            result.onlineStatusVisibility ?? prev.onlineStatusVisibility,
          allowAIToSeeProfile:
            result.allowAIToSeeProfile ?? prev.allowAIToSeeProfile,
          allowAIToSeeMessages:
            result.allowAIToSeeMessages ?? prev.allowAIToSeeMessages,
          allowAIToSeeMedia: result.allowAIToSeeMedia ?? prev.allowAIToSeeMedia,
          callPermission: result.callPermission || prev.callPermission,
          allowScreenSharing:
            result.allowScreenSharing ?? prev.allowScreenSharing,
          allowDataCollection:
            result.allowDataCollection ?? prev.allowDataCollection,
          allowAnalytics: result.allowAnalytics ?? prev.allowAnalytics,
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
    if (userSettings.settings) {
      setFormData((prev) => ({
        ...prev,
        theme: userSettings.settings?.theme || "light",
        fontSize: userSettings.settings?.fontSize || 16,
      }));
    }
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
    {
      id: "devices",
      label: "Devices",
      icon: Smartphone,
      description: "Active sessions and logins",
    },
  ];

  const toggleOption = (field: string) => {
    handleInputChange(field, !formData[field as keyof typeof formData]);
  };

  const renderLoadingState = () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <Loader className="w-12 h-12 animate-spin text-green-primary mx-auto mb-4" />
        <p className="text-gray-primary">Loading settings...</p>
      </div>
    </div>
  );

  const renderContent = () => {
    // Determine if we're loading
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
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-3">
              <span className="text-[26px] font-bold text-gray-primary">
                Profile Settings
              </span>

              <div className="flex flex-col gap-8">
                {/* Avatar Upload */}
                <div className="bg-green-bg-light rounded-2xl p-6 border border-green-border-light flex items-center gap-4">
                  <div className="w-25 h-25 rounded-full bg-linear-to-br from-green-bg-heavy to-green-border-light flex items-center justify-center text-2xl overflow-hidden">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faUser}
                        className="text-white text-5xl"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <span className="text-xl font-bold text-gray-primary">
                      {profileData.fullName || "Your Name"}
                    </span>
                    <p className="text-sm font-semibold text-gray-primary">
                      JPG, GIF or PNG. Max size of 800K
                    </p>
                    <div className="flex gap-2">
                      <Button
                        icon={<Upload size={20} />}
                        onClick={() => avatarInputRef.current?.click()}
                        label="Upload New"
                        type="submit"
                      />
                      <Button label="Remove" type="cancel" />
                    </div>
                  </div>

                  {/* Hidden file inputs */}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileSelect("avatar", file);
                      }
                    }}
                    className="hidden"
                  />
                </div>

                {/* Form Fields */}
                <div className="flex flex-col gap-7">
                  <div className="grid grid-cols-2 gap-6">
                    <InputTextWithLabel
                      label="Display Name"
                      value={profileData.fullName}
                      placeholder="Enter your display name"
                      handleInputChange={handleProfileInputChange}
                      fieldName="fullName"
                    />
                    <InputTextWithLabel
                      label="Email"
                      value={profileData.email}
                      placeholder="Enter your email"
                      handleInputChange={handleProfileInputChange}
                      fieldName="email"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <InputTextWithLabel
                      label="Phone Number"
                      value={profileData.phoneNumber}
                      placeholder="Enter your phone number"
                      handleInputChange={handleProfileInputChange}
                      fieldName="phoneNumber"
                    />
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-primary">
                        Birth Date
                      </label>
                      <input
                        type="date"
                        value={profileData.birthDate}
                        onChange={(e) =>
                          handleProfileInputChange("birthDate", e.target.value)
                        }
                        className="px-4 py-3 border border-gray-200 rounded-lg text-gray-primary focus:outline-none focus:border-green-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-primary">
                        Gender
                      </label>
                      <select
                        value={profileData.gender}
                        onChange={(e) =>
                          handleProfileInputChange("gender", e.target.value)
                        }
                        className="px-4 py-3 border border-gray-200 rounded-lg text-gray-primary focus:outline-none focus:border-green-primary transition-colors"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="flex flex-col gap-3">
              <span className="text-[26px] font-bold text-gray-primary">
                Preferences
              </span>
              <div className="flex flex-col gap-5">
                {[
                  {
                    label: "Push Notifications",
                    description: "Receive alerts for new messages",
                    field: "pushNotifications",
                    icon: Bell,
                  },
                  {
                    label: "Read Receipts",
                    description: "Others can see when you've read messages",
                    field: "readReceipts",
                    icon: Eye,
                  },
                  {
                    label: "Sound Effects",
                    description: "Play sounds for incoming messages",
                    field: "soundEffects",
                    icon: Volume2,
                  },
                ].map(({ label, description, field, icon: Icon }) => (
                  <ToggleSwitchButton
                    key={field}
                    description={description}
                    label={label}
                    checked={
                      formData[field as keyof typeof formData] as boolean
                    }
                    icon={Icon}
                    onChange={() => toggleOption(field)}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 pt-4 border-t border-green-border-light">
              {saveError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                  {saveSuccess}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  label="Discard Changes"
                  onClick={handleDiscard}
                  type="cancel"
                  disabled={isSaving}
                />
                <Button
                  label={isSaving ? "Saving..." : "Save Changes"}
                  onClick={handleSaveProfile}
                  disabled={isSaving || !hasProfileChanges}
                />
              </div>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="flex flex-col gap-12">
            <div>
              <span className="text-[26px] font-bold text-gray-primary mb-1">
                Privacy & Security
              </span>
              <p className="text-gray-primary">
                Manage who can see your information and contact you
              </p>
            </div>

            {/* Who can see my info */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                Who can see my info
              </span>
              <div className="flex flex-col gap-5">
                {[
                  {
                    label: "Profile Visibility",
                    description: "Select who can see your complete profile",
                    field: "profileVisibility",
                  },
                  {
                    label: "Message Permission",
                    description: "Select who can send you messages",
                    field: "messagePermission",
                  },
                  {
                    label: "Call Permission",
                    description: "Select who can call you",
                    field: "callPermission",
                  },
                ].map(({ label, description, field }) => (
                  <div
                    key={field}
                    className="flex flex-col gap-3 bg-green-bg-light border border-green-border-light rounded-xl py-4 px-5 w-full"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-gray-primary">{label}</p>
                      <p className="text-sm text-gray-primary">{description}</p>
                    </div>
                    <div className="flex gap-3">
                      {field === "profileVisibility"
                        ? ["public", "friends", "private"].map((option) => (
                            <SelectionButton
                              key={option}
                              label={
                                option === "public"
                                  ? "Public"
                                  : option === "friends"
                                    ? "Friends"
                                    : "Private"
                              }
                              selected={
                                formData[field as keyof typeof formData] ===
                                option
                              }
                              onClick={() => handleInputChange(field, option)}
                            />
                          ))
                        : ["everyone", "friends", "nobody"].map((option) => (
                            <SelectionButton
                              key={option}
                              label={
                                option === "everyone"
                                  ? "Everyone"
                                  : option === "friends"
                                    ? "Friends"
                                    : "Nobody"
                              }
                              selected={
                                formData[field as keyof typeof formData] ===
                                option
                              }
                              onClick={() => handleInputChange(field, option)}
                            />
                          ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Access Controls */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                AI Access Controls
              </span>
              <div className="flex flex-col gap-5">
                {[
                  {
                    label: "Allow AI to see profile",
                    description:
                      "AI assistant can view your profile information",
                    field: "allowAIToSeeProfile",
                  },
                  {
                    label: "Allow AI to see messages",
                    description:
                      "AI assistant can analyze your message content",
                    field: "allowAIToSeeMessages",
                  },
                  {
                    label: "Allow AI to see media",
                    description: "AI assistant can view your photos and videos",
                    field: "allowAIToSeeMedia",
                  },
                ].map(({ label, description, field }) => (
                  <div
                    key={field}
                    className="flex items-center justify-between px-4 py-3 bg-green-bg-light rounded-xl border border-green-border-light"
                  >
                    <div>
                      <p className="font-semibold text-gray-primary">{label}</p>
                      <p className="text-sm text-gray-primary">{description}</p>
                    </div>
                    <ToggleSwitch
                      checked={
                        formData[field as keyof typeof formData] as boolean
                      }
                      onChange={() => toggleOption(field)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Data & Analytics */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                Data & Analytics
              </span>
              <div className="flex flex-col gap-5">
                {[
                  {
                    label: "Allow Data Collection",
                    description: "Help us improve by collecting usage data",
                    field: "allowDataCollection",
                  },
                  {
                    label: "Allow Analytics",
                    description: "Share analytics data for better insights",
                    field: "allowAnalytics",
                  },
                ].map(({ label, description, field }) => (
                  <div
                    key={field}
                    className="flex items-center justify-between px-4 py-3 bg-green-bg-light rounded-xl border border-green-border-light"
                  >
                    <div>
                      <p className="font-semibold text-gray-primary">{label}</p>
                      <p className="text-sm text-gray-primary">{description}</p>
                    </div>
                    <ToggleSwitch
                      checked={
                        formData[field as keyof typeof formData] as boolean
                      }
                      onChange={() => toggleOption(field)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Other Security Options */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                Other Security Options
              </span>
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between px-4 py-3 bg-green-bg-light rounded-xl border border-green-border-light">
                  <div className="flex items-center gap-3">
                    <Eye size={24} className="text-green-primary" />
                    <div>
                      <p className="font-semibold text-gray-primary">
                        Read Receipts
                      </p>
                      <p className="text-sm text-gray-primary">
                        Others can see when you've read messages
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={formData.readReceipts}
                    onChange={() => toggleOption("readReceipts")}
                  />
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-green-bg-light rounded-xl border border-green-border-light">
                  <div className="flex items-center gap-3">
                    <Shield size={24} className="text-green-primary" />
                    <div>
                      <p className="font-semibold text-gray-primary">
                        Blocked Contacts
                      </p>
                      <p className="text-sm text-gray-primary">
                        Manage your blocked contacts list
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-green-primary" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 pt-4 border-t border-green-border-light">
              {saveError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                  {saveSuccess}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  label="Discard Changes"
                  onClick={handleDiscardSettings}
                  type="cancel"
                  disabled={isSaving}
                />
                <Button
                  label={isSaving ? "Saving..." : "Save Changes"}
                  onClick={handleSaveSettings}
                  disabled={isSaving || !hasSettingsChanges}
                />
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <span className="text-[28px] font-bold text-gray-primary">
                Notifications
              </span>

              {/* Mute all notifications */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-green-border-light">
                <div>
                  <p className="font-bold text-gray-primary text-lg">
                    Mute all notifications
                  </p>
                  <p className="text-sm text-gray-primary">
                    Temporarily silence all notifications
                  </p>
                </div>
                <ToggleSwitch
                  checked={formData.muteAll}
                  onChange={() => toggleOption("muteAll")}
                />
              </div>
            </div>

            {/* Message Notifications */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                Message Notifications
              </span>
              <div className="flex flex-col gap-2 rounded-2xl overflow-hidden border border-green-border-light">
                {[
                  {
                    label: "Message Notifications",
                    description: "Receive notifications for new messages",
                    field: "messageNotifications",
                    icon: Bell,
                  },
                  {
                    label: "Friend Request Notifications",
                    description: "Receive notifications for friend requests",
                    field: "friendRequestNotifications",
                    icon: Bell,
                  },
                ].map(({ label, description, field, icon: Icon }, index) => (
                  <div
                    key={field}
                    className={clsx(
                      "flex items-center justify-between px-4 py-3 bg-green-bg-light",
                      index === 0 && "rounded-t-lg",
                      index === 1 && "rounded-b-lg",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={24} className="text-green-primary" />
                      <div>
                        <p className="font-semibold text-gray-primary">
                          {label}
                        </p>
                        <p className="text-sm text-gray-primary">
                          {description}
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={
                        formData[field as keyof typeof formData] as boolean
                      }
                      onChange={() => toggleOption(field)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Group Notifications */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                Group Notifications
              </span>
              <div className="flex flex-col gap-2 rounded-2xl overflow-hidden border border-green-border-light">
                {[
                  {
                    label: "Group Notifications",
                    description: "Receive notifications for group chats",
                    field: "groupNotifications",
                  },
                  {
                    label: "Tag Notifications",
                    description: "Only notify me if someone tags me",
                    field: "tagNotifications",
                  },
                ].map(({ label, description, field }, index) => (
                  <div
                    key={field}
                    className={clsx(
                      "flex items-center justify-between px-4 py-3 bg-green-bg-light",
                      index === 0 && "rounded-t-lg",
                      index === 1 && "rounded-b-lg",
                    )}
                  >
                    <div>
                      <p className="font-semibold text-gray-primary">{label}</p>
                      <p className="text-sm text-gray-primary">{description}</p>
                    </div>
                    <ToggleSwitch
                      checked={
                        formData[field as keyof typeof formData] as boolean
                      }
                      onChange={() => toggleOption(field)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Call Notifications */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                Call
              </span>
              <div className="flex items-center justify-between px-4 py-3 bg-green-bg-light rounded-xl border border-green-border-light">
                <div className="flex items-center gap-3">
                  <Bell size={24} className="text-green-primary" />
                  <div>
                    <p className="font-semibold text-gray-primary">
                      Call Notifications
                    </p>
                    <p className="text-sm text-gray-primary">
                      Receive notifications for incoming calls
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={formData.callNotifications}
                  onChange={() => toggleOption("callNotifications")}
                />
              </div>
            </div>

            {/* Notification Sound */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                Sound Settings
              </span>
              <div className="flex items-center justify-between px-4 py-3 bg-green-bg-light rounded-xl border border-green-border-light">
                <div className="flex items-center gap-3">
                  <Play size={24} className="text-green-primary" />
                  <div>
                    <p className="font-semibold text-gray-primary">
                      Notification Sound
                    </p>
                    <p className="text-sm text-gray-primary">
                      Choose the sound for notifications
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={formData.notificationSound}
                    onChange={(e) =>
                      handleInputChange("notificationSound", e.target.value)
                    }
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-primary focus:outline-none"
                  >
                    <option>Crystal Clear</option>
                    <option>Bell</option>
                    <option>Chime</option>
                    <option>Ding</option>
                  </select>
                  <button className="p-2 bg-green-primary text-white rounded-full hover:bg-green-primary/90">
                    <Play size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 pt-4 border-t border-green-border-light">
              {saveError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                  {saveSuccess}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  label="Discard Changes"
                  onClick={handleDiscardSettings}
                  type="cancel"
                  disabled={isSaving}
                />
                <Button
                  label={isSaving ? "Saving..." : "Save Changes"}
                  onClick={handleSaveSettings}
                  disabled={isSaving || !hasSettingsChanges}
                />
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="flex flex-col gap-8">
            <div>
              <span className="text-[28px] font-bold text-gray-primary">
                Appearance & Theme
              </span>
              <p className="text-gray-primary">
                Customize how your chat experience looks and feels
              </p>
            </div>

            {/* Theme Mode */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                Theme Mode
              </span>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "auto", label: "Auto", icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => handleInputChange("theme", value)}
                    className={clsx(
                      "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-colors",
                      formData.theme === value
                        ? "border-green-primary bg-white"
                        : "border-gray-200 bg-white hover:border-gray-300",
                    )}
                  >
                    <Icon
                      size={32}
                      className={clsx(
                        formData.theme === value
                          ? "text-green-primary"
                          : "text-green-border-light",
                      )}
                    />
                    <span
                      className={clsx(
                        "font-semibold",
                        formData.theme === value
                          ? "text-green-primary"
                          : "text-gray-primary",
                      )}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Wallpaper */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                Chat Wallpaper
              </span>
              <div className="grid grid-cols-7 gap-4">
                {[
                  { value: "teal", color: "#2ab3b3" },
                  { value: "orange", color: "#ee652b" },
                  { value: "purple", color: "#6366f1" },
                  { value: "green", color: "#a1f258" },
                  { value: "red", color: "#ab2346" },
                  { value: "gray", color: "#c1cad8" },
                  { value: "light-gray", color: "#dfdddd" },
                ].map(({ value, color }) => (
                  <button
                    key={value}
                    onClick={() => handleInputChange("wallpaper", value)}
                    className={clsx(
                      "h-32 rounded-2xl border-2 transition-all",
                      formData.wallpaper === value
                        ? "border-green-primary scale-105"
                        : "border-transparent hover:border-gray-300",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                Font Size
              </span>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={formData.fontSize}
                  onChange={(e) =>
                    handleInputChange("fontSize", parseInt(e.target.value))
                  }
                  className="flex-1"
                />
                <span className="text-gray-primary font-semibold min-w-12">
                  {formData.fontSize}px
                </span>
              </div>
              <p className="text-sm text-gray-primary">
                Preview text will appear at the selected size
              </p>
            </div>

            {/* Accent Color */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                Accent Color
              </span>
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                  style={{ backgroundColor: formData.accentColor }}
                />
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) =>
                    handleInputChange("accentColor", e.target.value)
                  }
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* Text Size Presets
            <div className="flex flex-col gap-3 items-start w-full">
              <span className="text-[22px] font-bold text-gray-primary">
                Text Size Preset
              </span>
              <div className="grid grid-cols-3 gap-4 w-full">
                {["small", "medium", "large"].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleInputChange("textSize", size)}
                    className={clsx(
                      "px-6 py-3 rounded-xl border-2 transition-colors capitalize font-semibold",
                      formData.textSize === size
                        ? "border-green-primary bg-white text-green-primary"
                        : "border-gray-200 bg-white text-gray-primary hover:border-gray-300",
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div> */}

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 pt-4 border-t border-green-border-light">
              {saveError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                  {saveSuccess}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  label="Discard Changes"
                  onClick={handleDiscardSettings}
                  type="cancel"
                  disabled={isSaving}
                />
                <Button
                  label={isSaving ? "Saving..." : "Save Changes"}
                  onClick={handleSaveSettings}
                  disabled={isSaving || !hasSettingsChanges}
                />
              </div>
            </div>
          </div>
        );

      case "devices":
        return (
          <div className="flex flex-col gap-8">
            <div>
              <span className="text-[28px] font-bold text-gray-primary mb-1">
                Linked Devices
              </span>
              <p className="text-gray-primary">
                Manage your active sessions and connected devices
              </p>
            </div>

            {/* Active Devices List */}
            <div className="flex flex-col gap-3">
              <span className="text-lg font-bold text-gray-primary">
                Active Devices ({userDevices.devices.length})
              </span>
              {userDevices.devices.length === 0 ? (
                <div className="px-4 py-6 bg-gray-50 rounded-xl text-center text-gray-primary">
                  No active devices found
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {userDevices.devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between px-4 py-3 bg-green-bg-light rounded-xl border border-green-border-light"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-bg-heavy rounded-xl">
                          <Smartphone
                            size={24}
                            className="text-green-primary"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-primary">
                            {device.deviceName}
                          </p>
                          <p className="text-sm text-gray-primary">
                            {device.osType} {device.osVersion}
                          </p>
                          <p className="text-xs text-gray-primary">
                            Last login:{" "}
                            {new Date(device.lastLogin).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => userDevices.deactivateDevice(device.id)}
                        className="px-4 py-2 text-green-primary hover:bg-green-bg-heavy rounded-lg font-semibold transition-colors"
                      >
                        {device.isCurrent ? "Current Device" : "Logout"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Log out from all devices */}
            <div className="flex flex-col gap-3">
              <span className="text-lg font-bold text-gray-primary">
                Security Actions
              </span>
              <Button
                label="Log out from all other devices"
                onClick={() => {
                  // Implementation for logout from all devices
                }}
                padding="px-8 py-3"
              />
            </div>

            {/* Security Tip */}
            <div className="flex gap-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
              <Info size={24} className="text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-gray-primary mb-1">Security Tip</p>
                <p className="text-sm text-gray-primary">
                  Regularly check active devices and deactivate any you don't
                  recognize. If you see unauthorized devices, change your
                  password immediately.
                </p>
              </div>
            </div>

            {/* Error/Success Messages */}
            {saveError && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                {saveSuccess}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 py-3 z-50 overflow-hidden bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={24} className="text-gray-primary" />
        </button>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 bg-green-bg-light border-r border-green-border-light p-6 overflow-y-auto flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-primary mb-2">
              Settings
            </h1>
            <p className="text-gray-primary mb-8">
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
                      ? "bg-green-bg-heavy border-2 border-green-primary"
                      : "hover:bg-green-bg-heavy",
                  )}
                >
                  <Icon
                    size={24}
                    className={clsx(
                      "mt-1 flex-shrink-0",
                      activeTab === id
                        ? "text-green-primary"
                        : "text-gray-primary",
                    )}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-primary">{label}</p>
                    <p className="text-sm text-gray-primary">{description}</p>
                  </div>
                  {activeTab === id && (
                    <ChevronRight
                      size={24}
                      className="text-green-primary mt-1"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-8 overflow-y-auto">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
