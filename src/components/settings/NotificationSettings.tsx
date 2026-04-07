import React, { useState } from 'react';
import { useNotificationSettings } from '../../hooks/useSettings';

export const NotificationSettings: React.FC = () => {
  const { settings, loading, error, updateSettings, toggleMute } =
    useNotificationSettings();
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

  const handleToggleMute = async () => {
    setSaving(true);
    try {
      await toggleMute();
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Notification Settings</h3>

      {/* Mute All Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-100 rounded">
        <div>
          <label className="font-medium">Mute All Notifications</label>
          <p className="text-sm text-gray-600">
            Turn off all notifications temporarily
          </p>
        </div>
        <button
          onClick={handleToggleMute}
          disabled={saving}
          className={`px-4 py-2 rounded ${
            settings?.muteAll
              ? 'bg-red-500 text-white'
              : 'bg-gray-300 text-gray-800'
          }`}
        >
          {settings?.muteAll ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Group Notifications */}
      <div className="flex items-center justify-between p-4 border rounded">
        <div>
          <label className="font-medium">Group Notifications</label>
          <p className="text-sm text-gray-600">
            Receive notifications from groups
          </p>
        </div>
        <input
          type="checkbox"
          checked={settings?.groupNotifications || false}
          onChange={(e) => handleToggle('groupNotifications', e.target.checked)}
          disabled={saving || settings?.muteAll}
          className="w-6 h-6"
        />
      </div>

      {/* Tag Notifications */}
      <div className="flex items-center justify-between p-4 border rounded">
        <div>
          <label className="font-medium">Tag Notifications</label>
          <p className="text-sm text-gray-600">Notify when someone tags you</p>
        </div>
        <input
          type="checkbox"
          checked={settings?.tagNotifications || false}
          onChange={(e) => handleToggle('tagNotifications', e.target.checked)}
          disabled={saving || settings?.muteAll}
          className="w-6 h-6"
        />
      </div>

      {/* Message Notifications */}
      <div className="flex items-center justify-between p-4 border rounded">
        <div>
          <label className="font-medium">Message Notifications</label>
          <p className="text-sm text-gray-600">Notify when you receive messages</p>
        </div>
        <input
          type="checkbox"
          checked={settings?.messageNotifications || false}
          onChange={(e) =>
            handleToggle('messageNotifications', e.target.checked)
          }
          disabled={saving || settings?.muteAll}
          className="w-6 h-6"
        />
      </div>

      {/* Friend Request Notifications */}
      <div className="flex items-center justify-between p-4 border rounded">
        <div>
          <label className="font-medium">Friend Request Notifications</label>
          <p className="text-sm text-gray-600">
            Notify when you receive friend requests
          </p>
        </div>
        <input
          type="checkbox"
          checked={settings?.friendRequestNotifications || false}
          onChange={(e) =>
            handleToggle('friendRequestNotifications', e.target.checked)
          }
          disabled={saving || settings?.muteAll}
          className="w-6 h-6"
        />
      </div>

      {/* Call Notifications */}
      <div className="flex items-center justify-between p-4 border rounded">
        <div>
          <label className="font-medium">Call Notifications</label>
          <p className="text-sm text-gray-600">Notify when someone calls you</p>
        </div>
        <input
          type="checkbox"
          checked={settings?.callNotifications || false}
          onChange={(e) => handleToggle('callNotifications', e.target.checked)}
          disabled={saving || settings?.muteAll}
          className="w-6 h-6"
        />
      </div>

      {/* Notification Sound */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Notification Sound
        </label>
        <select
          value={settings?.notificationSound || 'all'}
          onChange={(e) =>
            updateSettings({ notificationSound: e.target.value })
          }
          disabled={saving}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="all">All</option>
          <option value="vibrate">Vibrate Only</option>
          <option value="silent">Silent</option>
        </select>
      </div>

      {/* Do Not Disturb */}
      <div className="p-4 border rounded">
        <h4 className="font-medium mb-4">Do Not Disturb</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Start Time</label>
            <input
              type="number"
              min="0"
              max="1440"
              placeholder="Minutes since midnight"
              defaultValue={settings?.doNotDisturbStart || 0}
              onBlur={(e) =>
                updateSettings({
                  doNotDisturbStart: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border rounded"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">End Time</label>
            <input
              type="number"
              min="0"
              max="1440"
              placeholder="Minutes since midnight"
              defaultValue={settings?.doNotDisturbEnd || 0}
              onBlur={(e) =>
                updateSettings({ doNotDisturbEnd: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded"
              disabled={saving}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
