/*eslint-disable*/
import React, { useState } from "react";
import { usePrivacySettings } from "../../hooks/useSettings";

export const PrivacySettings: React.FC = () => {
  const { settings, loading, error, updateSettings } = usePrivacySettings();
  const [saving, setSaving] = useState(false);

  const handleToggle = async (field: string, value: boolean) => {
    setSaving(true);
    try {
      await updateSettings({ [field]: value } as any);
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectChange = async (field: string, value: string) => {
    setSaving(true);
    try {
      await updateSettings({ [field]: value } as any);
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Privacy & Security Settings</h3>

      {/* Profile Visibility */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Profile Visibility
        </label>
        <select
          value={settings?.profileVisibility || "friends"}
          onChange={(e) =>
            handleSelectChange("profileVisibility", e.target.value)
          }
          disabled={saving}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="public">Public - Everyone can see</option>
          <option value="friends">Friends Only</option>
          <option value="private">Private - No one can see</option>
        </select>
      </div>

      {/* Message Permission */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Who can message you
        </label>
        <select
          value={settings?.messagePermission || "friends"}
          onChange={(e) =>
            handleSelectChange("messagePermission", e.target.value)
          }
          disabled={saving}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="everyone">Everyone</option>
          <option value="friends">Friends Only</option>
          <option value="none">No one</option>
        </select>
      </div>

      {/* Call Permission */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Who can call you
        </label>
        <select
          value={settings?.callPermission || "friends"}
          onChange={(e) => handleSelectChange("callPermission", e.target.value)}
          disabled={saving}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="everyone">Everyone</option>
          <option value="friends">Friends Only</option>
          <option value="none">No one</option>
        </select>
      </div>

      {/* Last Seen Visibility */}
      <div className="flex items-center justify-between p-4 border rounded">
        <div>
          <label className="font-medium">Show Last Seen</label>
          <p className="text-sm text-gray-600">
            Let others see when you were last active
          </p>
        </div>
        <input
          type="checkbox"
          checked={settings?.lastSeenVisibility || false}
          onChange={(e) => handleToggle("lastSeenVisibility", e.target.checked)}
          disabled={saving}
          className="w-6 h-6"
        />
      </div>

      {/* Online Status Visibility */}
      <div className="flex items-center justify-between p-4 border rounded">
        <div>
          <label className="font-medium">Show Online Status</label>
          <p className="text-sm text-gray-600">
            Let others see when you're online
          </p>
        </div>
        <input
          type="checkbox"
          checked={settings?.onlineStatusVisibility || false}
          onChange={(e) =>
            handleToggle("onlineStatusVisibility", e.target.checked)
          }
          disabled={saving}
          className="w-6 h-6"
        />
      </div>

      {/* Data Collection */}
      <div className="border-t pt-6 mt-6">
        <h4 className="font-semibold mb-4">Data & Analytics</h4>

        <div className="flex items-center justify-between p-4 border rounded mb-3">
          <div>
            <label className="font-medium">Allow Data Collection</label>
            <p className="text-sm text-gray-600">
              Help improve our service by sharing usage data
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings?.allowDataCollection || false}
            onChange={(e) =>
              handleToggle("allowDataCollection", e.target.checked)
            }
            disabled={saving}
            className="w-6 h-6"
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded">
          <div>
            <label className="font-medium">Allow Analytics</label>
            <p className="text-sm text-gray-600">
              Allow us to track analytics for feature improvements
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings?.allowAnalytics || false}
            onChange={(e) => handleToggle("allowAnalytics", e.target.checked)}
            disabled={saving}
            className="w-6 h-6"
          />
        </div>
      </div>

      {/* Screen Sharing */}
      <div className="border-t pt-6 mt-6">
        <div className="flex items-center justify-between p-4 border rounded">
          <div>
            <label className="font-medium">Allow Screen Sharing</label>
            <p className="text-sm text-gray-600">
              Allow others to share screen during calls
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings?.allowScreenSharing || false}
            onChange={(e) =>
              handleToggle("allowScreenSharing", e.target.checked)
            }
            disabled={saving}
            className="w-6 h-6"
          />
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
