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
        <span className="text-[28px] font-bold text-[var(--settings-text)]">
          Notifications
        </span>

        {/* Mute all notifications */}
        <div className={clsx(
          "flex items-center justify-between px-4 py-3 rounded-xl border",
          formData.muteAll
            ? "border-[var(--settings-primary)] bg-[var(--settings-primary-bg)]"
            : "border-[var(--settings-primary-border)]",
        )}>
          <div>
            <p className="font-bold text-[var(--settings-text)] text-lg">
              Mute all notifications
            </p>
            <p className="text-sm text-[var(--settings-text)]">
              {formData.muteAll
                ? "All notifications are currently muted — turn this off to receive notifications"
                : "Temporarily silence all notifications"}
            </p>
          </div>
          <ToggleSwitch
            checked={formData.muteAll}
            onChange={() => toggleOption("muteAll")}
          />
        </div>
      </div>

      {/* Individual notification sections — disabled when muteAll is on */}
      <div className={clsx(
        "flex flex-col gap-8",
        formData.muteAll && "opacity-40 pointer-events-none select-none",
      )}>

      {/* Message Notifications */}
      <div className="flex flex-col gap-3">
        <span className="text-[22px] font-bold text-[var(--settings-text)]">
          Message Notifications
        </span>
        <div className="flex flex-col gap-2 rounded-2xl overflow-hidden border border-[var(--settings-primary-border)]">
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
                "flex items-center justify-between px-4 py-3 bg-[var(--settings-surface-bg)]",
                index === 0 && "rounded-t-lg",
                index === 1 && "rounded-b-lg",
              )}
            >
              <div className="flex items-center gap-3">
                <Icon size={24} className="text-[var(--settings-primary)]" />
                <div>
                  <p className="font-semibold text-[var(--settings-text)]">{label}</p>
                  <p className="text-sm text-[var(--settings-text)]">{description}</p>
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
        <span className="text-[22px] font-bold text-[var(--settings-text)]">
          Group Notifications
        </span>
        <div className="flex flex-col gap-2 rounded-2xl overflow-hidden border border-[var(--settings-primary-border)]">
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
                "flex items-center justify-between px-4 py-3 bg-[var(--settings-surface-bg)]",
                index === 0 && "rounded-t-lg",
                index === 1 && "rounded-b-lg",
              )}
            >
              <div>
                <p className="font-semibold text-[var(--settings-text)]">{label}</p>
                <p className="text-sm text-[var(--settings-text)]">{description}</p>
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
        <span className="text-[22px] font-bold text-[var(--settings-text)]">Call</span>
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--settings-surface-bg)] rounded-xl border border-[var(--settings-primary-border)]">
          <div className="flex items-center gap-3">
            <Bell size={24} className="text-[var(--settings-primary)]" />
            <div>
              <p className="font-semibold text-[var(--settings-text)]">
                Call Notifications
              </p>
              <p className="text-sm text-[var(--settings-text)]">
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

      </div>{/* end muteAll wrapper */}

      {/* Notification Sound */}
      <div className="flex flex-col gap-3">
        <span className="text-[22px] font-bold text-[var(--settings-text)]">
          Sound Settings
        </span>
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--settings-surface-bg)] rounded-xl border border-[var(--settings-primary-border)]">
          <div className="flex items-center gap-3">
            <Play size={24} className="text-[var(--settings-primary)]" />
            <div>
              <p className="font-semibold text-[var(--settings-text)]">
                Notification Sound
              </p>
              <p className="text-sm text-[var(--settings-text)]">
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
              className="px-4 py-2 border border-gray-200 rounded-lg text-[var(--settings-text)] focus:outline-none"
            >
              <option>Crystal Clear</option>
              <option>Bell</option>
              <option>Chime</option>
              <option>Ding</option>
            </select>
            <button className="p-2 bg-[var(--settings-primary)] text-white rounded-full hover:bg-[var(--settings-primary-hover)]">
              <Play size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 pt-4 border-t border-[var(--settings-primary-border)]">
        {saveError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="px-4 py-3 bg-[var(--settings-primary-bg)] border border-[var(--settings-primary-border)] rounded-lg text-[var(--settings-primary)] text-sm">
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
