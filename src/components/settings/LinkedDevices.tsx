import React from "react";
import { Info, Smartphone } from "lucide-react";
import Button from "../common/Button";

interface Device {
  id: string;
  deviceName: string;
  osType: string;
  osVersion: string;
  lastLogin: Date | string;
  isCurrent: boolean;
}

interface LinkedDevicesProps {
  userDevices: {
    devices: Device[];
    deactivateDevice: (deviceId: string) => Promise<void>;
    loading: boolean;
  };
  saveError: string | null;
  saveSuccess: string | null;
}

export const LinkedDevices: React.FC<LinkedDevicesProps> = ({
  userDevices,
  saveError,
  saveSuccess,
}: LinkedDevicesProps) => {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <span className="text-[28px] font-bold text-gray-primary mb-1">
          Linked Devices
        </span>
        <p className="text-gray-primary">
          Manage your active sessions and connected devices
        </p>
      </div>

      {/* Active Devices List */}
      <div className="flex flex-col gap-3">
        <span className="text-lg font-bold text-gray-primary">
          Active Devices ({userDevices.devices.length})
        </span>
        {userDevices.devices.length === 0 ? (
          <div className="px-4 py-6 bg-gray-50 rounded-xl text-center text-gray-primary">
            No active devices found
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {userDevices.devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between px-4 py-3 bg-green-bg-light rounded-xl border border-green-border-light"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-bg-heavy rounded-xl">
                    <Smartphone size={24} className="text-green-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-primary">
                      {device.deviceName}
                    </p>
                    <p className="text-sm text-gray-primary">
                      {device.osType} {device.osVersion}
                    </p>
                    <p className="text-xs text-gray-primary">
                      Last login:{" "}
                      {new Date(device.lastLogin).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => userDevices.deactivateDevice(device.id)}
                  className="px-4 py-2 text-green-primary hover:bg-green-bg-heavy rounded-lg font-semibold transition-colors"
                >
                  {device.isCurrent ? "Current Device" : "Logout"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log out from all devices */}
      <div className="flex flex-col gap-3">
        <span className="text-lg font-bold text-gray-primary">
          Security Actions
        </span>
        <Button
          label="Log out from all other devices"
          onClick={() => {
            // Implementation for logout from all devices
          }}
          padding="px-8 py-3"
        />
      </div>

      {/* Security Tip */}
      <div className="flex gap-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
        <Info size={24} className="text-blue-500 shrink-0 mt-1" />
        <div>
          <p className="font-bold text-gray-primary mb-1">Security Tip</p>
          <p className="text-sm text-gray-primary">
            Regularly check active devices and deactivate any you don't
            recognize. If you see unauthorized devices, change your password
            immediately.
          </p>
        </div>
      </div>

      {/* Error/Success Messages */}
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
    </div>
  );
};

export default LinkedDevices;
