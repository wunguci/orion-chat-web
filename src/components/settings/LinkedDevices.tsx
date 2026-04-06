import React, { useState } from "react";
import { useUserDevices } from "../../hooks/useSettings";

export const LinkedDevices: React.FC = () => {
  const { devices, loading, error, removeDevice, deactivateDevice } =
    useUserDevices();
  const [saving, setSaving] = useState<string | null>(null);

  const handleRemoveDevice = async (id: string) => {
    if (confirm("Are you sure you want to remove this device?")) {
      setSaving(id);
      try {
        await removeDevice(id);
      } catch (err) {
        console.error("Failed to remove device:", err);
      } finally {
        setSaving(null);
      }
    }
  };

  const handleDeactivateDevice = async (id: string) => {
    setSaving(id);
    try {
      await deactivateDevice(id);
    } catch (err) {
      console.error("Failed to deactivate device:", err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Linked Devices</h3>
        <p className="text-sm text-gray-600 mb-6">
          Manage devices where you're logged in
        </p>

        {devices.length === 0 ? (
          <p className="text-gray-500">No devices linked</p>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 border rounded hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">
                      {device.deviceType === "mobile" ? "📱" : "💻"}
                    </div>
                    <div>
                      <h4 className="font-semibold">{device.deviceName}</h4>
                      <p className="text-sm text-gray-600">
                        {device.osType} {device.osVersion}
                      </p>
                    </div>
                    {device.isCurrent && (
                      <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        Current device
                      </span>
                    )}
                    {device.isActive ? (
                      <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="ml-2 px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      Added: {new Date(device.createdAt).toLocaleDateString()}
                    </p>
                    {device.lastLogin && (
                      <p>
                        Last login:{" "}
                        {new Date(device.lastLogin).toLocaleString()}
                      </p>
                    )}
                    {device.ipAddress && <p>IP: {device.ipAddress}</p>}
                  </div>
                </div>

                <div className="flex gap-2">
                  {device.isActive && !device.isCurrent && (
                    <button
                      onClick={() => handleDeactivateDevice(device.id)}
                      disabled={saving === device.id}
                      className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
                    >
                      {saving === device.id ? "Deactivating..." : "Current"}
                    </button>
                  )}
                  {!device.isCurrent && (
                    <button
                      onClick={() => handleRemoveDevice(device.id)}
                      disabled={saving === device.id}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                    >
                      {saving === device.id ? "Removing..." : "Remove"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-semibold text-blue-900 mb-2">🔒 Security Tip</h4>
          <p className="text-sm text-blue-800">
            Regularly review your linked devices and remove unknown devices
            immediately. If you see unauthorized devices, change your password.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LinkedDevices;
