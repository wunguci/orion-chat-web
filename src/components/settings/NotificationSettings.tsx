/*eslint-disable*/
import React from "react";
import { clsx } from "clsx";
import Button from "../common/Button";
import { Bell, Play } from "lucide-react";
import ToggleSwitch from "../common/ToggleSwitch";

interface NotificationSettingsProps {
  formData: {
    muteAll: boolean;
    messageNotifications: boolean;
    friendRequestNotifications: boolean;
    groupNotifications: boolean;
    tagNotifications: boolean;
    callNotifications: boolean;
    notificationSound: string;
  };
  handleInputChange: (field: string, value: unknown) => void;
  toggleOption: (field: string) => void;
  handleDiscardSettings: () => void;
  handleSaveSettings: () => void;
  saveError: string | null;
  saveSuccess: string | null;
  isSaving: boolean;
  hasSettingsChanges: boolean;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  formData,
  handleInputChange,
  toggleOption,
  handleDiscardSettings,
  handleSaveSettings,
  saveError,
  saveSuccess,
  isSaving,
  hasSettingsChanges,
}: NotificationSettingsProps) => {
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
                  <p className="font-semibold text-gray-primary">{label}</p>
                  <p className="text-sm text-gray-primary">{description}</p>
                </div>
              </div>
              <ToggleSwitch
                checked={formData[field as keyof typeof formData] as boolean}
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
                checked={formData[field as keyof typeof formData] as boolean}
                onChange={() => toggleOption(field)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Call Notifications */}
      <div className="flex flex-col gap-3">
        <span className="text-[22px] font-bold text-gray-primary">Call</span>
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
};

export default NotificationSettings;
