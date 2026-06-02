/*eslint-disable*/
import { ChevronRight, Eye, Shield } from "lucide-react";
import ToggleSwitch from "../common/ToggleSwitch";
import Button from "../common/Button";
import SelectionButton from "../common/SelectionButton";

interface PrivacySettingsProps {
  saveError: string | null;
  saveSuccess: string | null;
  isSaving: boolean;
  hasProfileChanges: boolean;
  hasSettingsChanges: boolean;
  formData: {
    profileVisibility: "public" | "friends" | "private";
    messagePermission: "everyone" | "friends" | "nobody";
    callPermission: "everyone" | "friends" | "nobody";
    readReceipts: boolean;
  };
  handleInputChange: (field: string, value: string) => void;
  handleDiscardSettings: () => void;
  handleSaveSettings: () => void;
  toggleOption: (field: string) => void;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  saveError,
  saveSuccess,
  isSaving,
  hasSettingsChanges,
  formData,
  handleInputChange,
  handleDiscardSettings,
  handleSaveSettings,
  toggleOption,
}: PrivacySettingsProps) => {
  return (
    <div className="flex flex-col gap-12">
      <div>
        <span className="text-[26px] font-bold text-[var(--settings-text)] mb-1">
          Privacy & Security
        </span>
        <p className="text-[var(--settings-text)]">
          Manage who can see your information and contact you
        </p>
      </div>

      {/* Who can see my info */}
      <div className="flex flex-col gap-3">
        <span className="text-[22px] font-bold text-[var(--settings-text)]">
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
              className="flex flex-col gap-3 bg-[var(--settings-surface-bg)] border border-[var(--settings-primary-border)] rounded-xl py-4 px-5 w-full"
            >
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-[var(--settings-text)]">{label}</p>
                <p className="text-sm text-[var(--settings-text)]">{description}</p>
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
                          formData[field as keyof typeof formData] === option
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

      {/* Other Security Options */}
      <div className="flex flex-col gap-3">
        <span className="text-[22px] font-bold text-[var(--settings-text)]">
          Other Security Options
        </span>
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--settings-surface-bg)] rounded-xl border border-[var(--settings-primary-border)]">
            <div className="flex items-center gap-3">
              <Eye size={24} className="text-[var(--settings-primary)]" />
              <div>
                <p className="font-semibold text-[var(--settings-text)]">Read Receipts</p>
                <p className="text-sm text-[var(--settings-text)]">
                  Others can see when you've read messages
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={formData.readReceipts}
              onChange={() => toggleOption("readReceipts")}
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3 bg-[var(--settings-surface-bg)] rounded-xl border border-[var(--settings-primary-border)]">
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-[var(--settings-primary)]" />
              <div>
                <p className="font-semibold text-[var(--settings-text)]">
                  Blocked Contacts
                </p>
                <p className="text-sm text-[var(--settings-text)]">
                  Manage your blocked contacts list
                </p>
              </div>
            </div>
            <ChevronRight size={24} className="text-[var(--settings-primary)]" />
          </div>

          <div className="flex items-center justify-between px-4 py-3 bg-[var(--settings-surface-bg)] rounded-xl border border-[var(--settings-primary-border)]">
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-[var(--settings-primary)]" />
              <div>
                <p className="font-semibold text-[var(--settings-text)]">
                  Two-step Verification
                </p>
                <p className="text-sm text-[var(--settings-text)]">
                  Add extra security to your account
                </p>
              </div>
            </div>
            <Button label="Enable" onClick={() => {}} type="submit" />
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

export default PrivacySettings;
