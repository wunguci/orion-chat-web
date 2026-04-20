import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef } from "react";
import Button from "../common/Button";
import { Bell, Eye, Upload, Volume2 } from "lucide-react";
import InputTextWithLabel from "../common/InputTextWithLabel";
import ToggleSwitchButton from "../common/ToggleSwitchButton";

interface ProfileSettingsProps {
  avatarPreview: string | null;
  profileData: {
    fullName: string;
    email: string;
    phoneNumber: string;
    birthDate: string;
    gender: string;
  };
  handleFileSelect: (type: "avatar" | "cover", file: File) => void;
  handleProfileInputChange: (field: string, value: string) => void;
  toggleOption: (field: string) => void;
  formData: {
    pushNotifications: boolean;
    readReceipts: boolean;
    soundEffects: boolean;
  };
  saveError: string | null;
  saveSuccess: string | null;
  isSaving: boolean;
  hasProfileChanges: boolean;
  handleSaveProfile: () => void;
  handleDiscard: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  avatarPreview,
  profileData,
  handleFileSelect,
  handleProfileInputChange,
  toggleOption,
  formData,
  saveError,
  saveSuccess,
  isSaving,
  hasProfileChanges,
  handleSaveProfile,
  handleDiscard,
}: ProfileSettingsProps) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
              checked={formData[field as keyof typeof formData] as boolean}
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
};

export default ProfileSettings;
