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
        <span className="text-[28px] font-bold text-[var(--settings-text)] mb-1">
          Linked Devices
        </span>
        <p className="text-[var(--settings-text)]">
          Manage your active sessions and connected devices
        </p>
      </div>

      {/* Active Devices List */}
      <div className="flex flex-col gap-3">
        <span className="text-lg font-bold text-[var(--settings-text)]">
          Active Devices ({userDevices.devices.length})
        </span>
        {userDevices.devices.length === 0 ? (
          <div className="px-4 py-6 bg-gray-50 rounded-xl text-center text-[var(--settings-text)]">
            No active devices found
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {userDevices.devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between px-4 py-3 bg-[var(--settings-surface-bg)] rounded-xl border border-[var(--settings-primary-border)]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[var(--settings-primary-bg)] rounded-xl">
                    <Smartphone size={24} className="text-[var(--settings-primary)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--settings-text)]">
                      {device.deviceName}
                    </p>
                    <p className="text-sm text-[var(--settings-text)]">
                      {device.osType} {device.osVersion}
                    </p>
                    <p className="text-xs text-[var(--settings-text)]">
                      Last login:{" "}
                      {new Date(device.lastLogin).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => userDevices.deactivateDevice(device.id)}
                  className="px-4 py-2 text-[var(--settings-primary)] hover:bg-[var(--settings-primary-bg)] rounded-lg font-semibold transition-colors"
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
        <span className="text-lg font-bold text-[var(--settings-text)]">
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
      <div className="flex gap-3 px-4 py-3 bg-[var(--settings-primary-bg)] rounded-xl border border-[var(--settings-primary-border)]">
        <Info size={24} className="text-[var(--settings-primary)] shrink-0 mt-1" />
        <div>
          <p className="font-bold text-[var(--settings-text)] mb-1">Security Tip</p>
          <p className="text-sm text-[var(--settings-text)]">
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
        <div className="px-4 py-3 bg-[var(--settings-primary-bg)] border border-[var(--settings-primary-border)] rounded-lg text-[var(--settings-primary)] text-sm">
          {saveSuccess}
        </div>
      )}
    </div>
  );
};

export default LinkedDevices;
