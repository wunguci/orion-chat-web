import React, { useState } from "react";
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
} from "lucide-react";
import clsx from "clsx";
import "./SettingModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import InputTextWithLabel from "../common/InputTextWithLabel";
import ToggleSwitch from "../common/ToggleSwitch";
import ToggleSwitchButton from "../common/ToggleSwitchButton";
import SelectionButton from "../common/SelectionButton";
import Button from "../common/Button";

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
  const [formData, setFormData] = useState({
    displayName: "Huynh Zang",
    username: "@zangthanks",
    statusMessage: "Working on something cozy",
    pushNotifications: true,
    readReceipts: true,
    soundEffects: true,
    lastSeenVisibility: "everyone",
    profilePhotoVisibility: "contacts",
    aboutInfoVisibility: "nobody",
    muteAllNotifications: false,
    showDesktopNotifications: true,
    showMessagePreview: true,
    notificationSound: "Crystal Clear",
    enableGroupNotifications: true,
    mentionsOnly: true,
    ringtone: "Classic Ring",
    incomingCallWindow: true,
    themeMode: "light",
    selectedWallpaper: "teal",
    textSize: "medium",
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
  };

  const handleDiscard = () => {
    setHasChanges(false);
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

  const renderContent = () => {
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
                  <div className="w-25 h-25 rounded-full bg-linear-to-br from-green-bg-heavy to-green-border-light flex items-center justify-center text-2xl">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-white text-5xl"
                    />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <span className="text-xl font-bold text-gray-primary">
                      Full Name
                    </span>
                    <p className="text-sm font-semibold text-gray-primary">
                      JPG, GIF or PNG. Max size of 800K
                    </p>
                    <div className="flex gap-2">
                      <Button
                        icon={<Upload size={20} />}
                        onClick={() => {}}
                        label="Upload New"
                        type="submit"
                      />
                      <Button label="Remove" type="cancel" />
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="flex flex-col gap-7">
                  <div className="grid grid-cols-2 gap-6">
                    <InputTextWithLabel
                      label="Display Name"
                      value={formData.displayName}
                      placeholder="Enter your display name"
                      handleInputChange={handleInputChange}
                      fieldName="displayName"
                    />
                    <InputTextWithLabel
                      label="Username"
                      value={formData.username}
                      placeholder="Enter your username"
                      handleInputChange={handleInputChange}
                      fieldName="username"
                    />
                  </div>

                  <InputTextWithLabel
                    label="Status Message"
                    value={formData.statusMessage}
                    placeholder="Enter your status message"
                    handleInputChange={handleInputChange}
                    fieldName="statusMessage"
                  />
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
            <div className="flex justify-end gap-3 pt-4 border-t border-green-border-light">
              <Button
                label="Discard Changes"
                onClick={handleDiscard}
                type="cancel"
              />
              <Button label="Save Changes" onClick={handleSave} />
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
                    label: "Last seen visibility",
                    description: "Select who can see when you were last online",
                    field: "lastSeenVisibility",
                  },
                  {
                    label: "Profile Photo",
                    description: "Select who can see when your profile picture",
                    field: "profilePhotoVisibility",
                  },
                  {
                    label: "About info",
                    description: "Select who can see when your status and bio",
                    field: "aboutInfoVisibility",
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
                      {["everyone", "contacts", "nobody"].map((option) => (
                        <SelectionButton
                          key={option}
                          label={
                            option === "everyone"
                              ? "Everyone"
                              : option === "contacts"
                                ? "My Contacts"
                                : "Nobody"
                          }
                          selected={
                            formData[field as keyof typeof formData] === option
                          }
                          onClick={() => handleInputChange(field, option)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message & Safety */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                Message & Safety
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
                        If turned off, you won't send or receive Read Receipts.
                        Read receipts are always sent for group chats
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
                        14 contacts blocked
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-green-primary" />
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-green-bg-light rounded-xl border border-green-border-light">
                  <div className="flex items-center gap-3">
                    <Shield size={24} className="text-green-primary" />
                    <div>
                      <p className="font-semibold text-gray-primary">
                        Two-step Verification
                      </p>
                      <p className="text-sm text-gray-primary">
                        Add extra security to your account
                      </p>
                    </div>
                  </div>
                  <Button label="Enable" onClick={() => {}} type="submit" />
                </div>
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
                    Temporarily silence all desktop and sound alerts for a while
                  </p>
                </div>
                <ToggleSwitch
                  checked={formData.muteAllNotifications}
                  onChange={() => toggleOption("muteAllNotifications")}
                />
              </div>
            </div>

            {/* Message Notifications */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                Message Notifications
              </span>
              <div className="flex flex-col message-notifications">
                {[
                  {
                    label: "Show Desktop Notifications",
                    description:
                      "Receive a pop-up alert when you get a direct message",
                    field: "showDesktopNotifications",
                    icon: Bell,
                  },
                  {
                    label: "Show Message Preview",
                    description:
                      "Display the sender and message snippet in alerts",
                    field: "showMessagePreview",
                    icon: Eye,
                  },
                ].map(({ label, description, field, icon: Icon }) => (
                  <div
                    key={field}
                    className="flex items-center justify-between px-4 py-3 bg-green-bg-light border border-green-border-light"
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

                <div className="flex items-center justify-between px-4 py-3 bg-green-bg-light rounded-b-2xl border border-green-border-light">
                  <div className="flex items-center gap-3">
                    <Play size={24} className="text-green-primary" />
                    <div>
                      <p className="font-semibold text-gray-primary">
                        Notification Sound
                      </p>
                      <p className="text-sm text-gray-primary">
                        Choose the sound for incoming direct messages
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
                    </select>
                    <button className="p-2 bg-green-primary text-white rounded-full hover:bg-green-primary/90">
                      <Play size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Group Notifications */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                Group Notifications
              </span>
              <div className="flex flex-col message-notifications">
                {[
                  {
                    label: "Enable Group Notifications",
                    description:
                      "Receive notifications for activity in group chats",
                    field: "enableGroupNotifications",
                  },
                  {
                    label: "Mentions Only",
                    description:
                      "Only notify me if someone @mentions me in a group",
                    field: "mentionsOnly",
                  },
                ].map(({ label, description, field }) => (
                  <div
                    key={field}
                    className="flex items-center justify-between px-4 py-3 bg-green-bg-light border border-green-border-light"
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

            {/* Call */}
            <div className="flex flex-col gap-3">
              <span className="text-[22px] font-bold text-gray-primary">
                Call
              </span>
              <div className="flex flex-col message-notifications">
                <div className="flex items-center justify-between px-4 py-3 bg-green-bg-light border border-green-border-light">
                  <div className="flex items-center gap-3">
                    <Bell size={24} className="text-green-primary" />
                    <div>
                      <p className="font-semibold text-gray-primary">
                        Ringtone
                      </p>
                      <p className="text-sm text-gray-primary">
                        Sound played during incoming voice and video call
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <select
                      value={formData.ringtone}
                      onChange={(e) =>
                        handleInputChange("ringtone", e.target.value)
                      }
                      className="px-4 py-2 border border-gray-200 rounded-lg text-gray-primary focus:outline-none"
                    >
                      <option>Classic Ring</option>
                      <option>Modern Bell</option>
                      <option>Soft Chime</option>
                    </select>
                    <button className="p-2 bg-green-primary text-white rounded-full hover:bg-green-primary/90">
                      <Play size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-green-bg-light border border-green-border-light">
                  <div>
                    <p className="font-semibold text-gray-primary">
                      Incoming Call Window
                    </p>
                    <p className="text-sm text-gray-primary">
                      Show call controls even when the apps in background
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={formData.incomingCallWindow}
                    onChange={() => toggleOption("incomingCallWindow")}
                  />
                </div>
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
                  { value: "system", label: "System", icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => handleInputChange("themeMode", value)}
                    className={clsx(
                      "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-colors",
                      formData.themeMode === value
                        ? "border-green-primary bg-white"
                        : "border-gray-200 bg-white hover:border-gray-300",
                    )}
                  >
                    <Icon
                      size={32}
                      className={clsx(
                        formData.themeMode === value
                          ? "text-green-primary"
                          : "text-green-border-light",
                      )}
                    />
                    <span
                      className={clsx(
                        "font-semibold",
                        formData.themeMode === value
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
                    onClick={() =>
                      handleInputChange("selectedWallpaper", value)
                    }
                    className={clsx(
                      "h-32 rounded-2xl border-2 transition-all",
                      formData.selectedWallpaper === value
                        ? "border-green-primary scale-105"
                        : "border-transparent hover:border-gray-300",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Text Size */}
            <div className="flex flex-col gap-3 items-start w-full">
              <span className="text-[22px] font-bold text-gray-primary">
                Text Size
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
              <p className="text-sm text-gray-primary text-center">
                Adjusting the font size will change the scale all chat text
                across the app.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-5 border-t border-gray-200">
              <button
                onClick={handleDiscard}
                className="text-gray-primary hover:text-green-primary font-semibold"
              >
                Reset to default settings
              </button>

              <div className="flex gap-3">
                <Button label="Cancel" onClick={handleDiscard} type="cancel" />
                <Button label="Save Changes" onClick={handleSave} />
              </div>
            </div>
          </div>
        );

      case "devices":
        return (
          <div className="space-y-8">
            <div>
              <span className="text-[28px] font-bold text-gray-primary mb-1">
                Linked Devices
              </span>
              <p className="text-gray-primary">
                Manage your active sessions and link new devices to keep your
                conversations synced
              </p>
            </div>

            {/* Log out button */}
            <Button
              label="Log out from all other devices"
              onClick={() => {}}
              padding="px-8 py-3"
            />

            {/* Link a New Device */}
            <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-green-border-light">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-bg-heavy rounded-xl">
                  <QrCode size={28} className="text-green-primary" />
                </div>
                <div>
                  <p className="font-bold text-gray-primary text-lg">
                    Link a New Device
                  </p>
                  <p className="text-sm text-gray-primary">
                    Scan the QR code with your mobile app to link a new devices
                  </p>
                </div>
              </div>
              <Button label="Link via QR Code" onClick={() => {}} />
            </div>

            {/* Active Sessions */}
            <div className="flex flex-col gap-3">
              <span className="text-lg font-bold text-gray-primary">
                Active Sessions
              </span>
              <div className="flex flex-col gap-5">
                {[
                  {
                    device: "Macbook Pro - Chrome",
                    location: "San Francisco, USA | IP: 192.168.1.1",
                    current: true,
                    icon: Chrome,
                  },
                  {
                    device: "iPhone 15 Pro",
                    location: "Londo, UK | Last active: 2 hours ago",
                    current: false,
                    icon: Smartphone,
                  },
                  {
                    device: "Window Desktop - Edge",
                    location: "New York, USA | Last active: Oct 24, 2024",
                    current: false,
                    icon: Monitor,
                  },
                ].map((session, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-4 py-3 bg-green-bg-light rounded-xl border border-green-border-light"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-bg-heavy rounded-xl">
                        <session.icon
                          size={24}
                          className="text-green-primary"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-primary">
                          {session.device}
                        </p>
                        <p className="text-sm text-gray-primary">
                          {session.location}
                        </p>
                      </div>
                    </div>
                    {session.current ? (
                      <span className="px-4 py-2 bg-green-bg-heavy text-green-primary rounded-lg font-semibold">
                        Current Device
                      </span>
                    ) : (
                      <button className="px-4 py-2 text-green-primary hover:bg-green-bg-heavy rounded-lg font-semibold">
                        Logout
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Security Tip */}
            <div className="flex gap-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
              <Info size={24} className="text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-gray-primary mb-1">Security Tip</p>
                <p className="text-sm text-gray-primary">
                  If you see a session you don't recognize, log it out
                  immediately and change your account password
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 py-3 z-50 overflow-hidden setting-modal-isolate animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col relative setting-modal-content animate-scale-in overflow-hidden">
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
