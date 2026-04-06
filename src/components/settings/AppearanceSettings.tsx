import React, { useState } from 'react';
import { useUserSettings } from '../../hooks/useSettings';

export const AppearanceSettings: React.FC = () => {
  const { settings, loading, error, updateSettings } = useUserSettings();
  const [localTheme, setLocalTheme] = useState(settings?.theme || 'light');
  const [localFontSize, setLocalFontSize] = useState(settings?.fontSize || 16);

  const handleThemeChange = async (theme: string) => {
    setLocalTheme(theme);
    try {
      await updateSettings({ theme });
    } catch (err) {
      console.error('Failed to update theme:', err);
    }
  };

  const handleFontSizeChange = async (size: number) => {
    setLocalFontSize(size);
    try {
      await updateSettings({ fontSize: size });
    } catch (err) {
      console.error('Failed to update font size:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Appearance</h3>

        {/* Theme Settings */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Theme</label>
          <div className="flex gap-4">
            {['light', 'dark', 'auto'].map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={`px-4 py-2 rounded capitalize ${
                  localTheme === theme
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Settings */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Font Size: {localFontSize}px
          </label>
          <input
            type="range"
            min="12"
            max="24"
            value={localFontSize}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Wallpaper Settings */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Wallpaper</label>
          <input
            type="text"
            placeholder="Enter wallpaper URL or color"
            defaultValue={settings?.wallpaper || ''}
            onBlur={(e) =>
              updateSettings({ wallpaper: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {/* Accent Color Settings */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Accent Color</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              defaultValue={settings?.accentColor || '#3B82F6'}
              onBlur={(e) =>
                updateSettings({ accentColor: e.target.value })
              }
              className="w-16 h-10 border rounded cursor-pointer"
            />
            <input
              type="text"
              defaultValue={settings?.accentColor || '#3B82F6'}
              onBlur={(e) =>
                updateSettings({ accentColor: e.target.value })
              }
              className="px-3 py-2 border rounded flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
