import React, { useState } from 'react';
import AppearanceSettings from './AppearanceSettings';
import NotificationSettings from './NotificationSettings';
import PrivacySettings from './PrivacySettings';
import LinkedDevices from './LinkedDevices';

type TabType = 'appearance' | 'notifications' | 'privacy' | 'devices';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('appearance');

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'appearance', label: '🎨 Appearance', icon: '🎨' },
    { id: 'notifications', label: '🔔 Notifications', icon: '🔔' },
    { id: 'privacy', label: '🔒 Privacy & Security', icon: '🔒' },
    { id: 'devices', label: '📱 Linked Devices', icon: '📱' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'appearance':
        return <AppearanceSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'devices':
        return <LinkedDevices />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your account preferences and settings
            </p>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-56 bg-white border-r">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <div className="bg-white rounded-lg p-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
