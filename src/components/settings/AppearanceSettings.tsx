import React from "react";
import { clsx } from "clsx";
import Button from "../common/Button";
import { Monitor, Moon, Sun } from "lucide-react";

// Giao diện Cài đặt Hình nền
interface AppearanceSettingsProps {
  formData: {
    theme: string;
    wallpaper: string;
    fontSize: number;
    accentColor: string;
  };
  handleInputChange: (field: string, value: unknown) => void;
  handleDiscardSettings: () => void;
  handleSaveSettings: () => void;
  saveError: string | null;
  saveSuccess: string | null;
  isSaving: boolean;
  hasSettingsChanges: boolean;
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  formData,
  handleInputChange,
  handleDiscardSettings,
  handleSaveSettings,
  saveError,
  saveSuccess,
  isSaving,
  hasSettingsChanges,
}: AppearanceSettingsProps) => {
  // Bản đồ màu cho từng loại hình nền
  const wallpaperColorMap: Record<string, string> = {
    teal: "#2ab3b3",
    orange: "#ee652b",
    purple: "#6366f1",
    green: "#a1f258",
    red: "#ab2346",
    gray: "#c1cad8",
    "light-gray": "#dfdddd",
  };

  // Màu hiện tại của hình nền đã chọn
  const currentWallpaperColor =
    wallpaperColorMap[formData.wallpaper] || "#2ab3b3";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <span className="text-[28px] font-bold text-[var(--settings-text)]">
          Wallpaper & Theme
        </span>
        <p className="text-[var(--settings-text)]">
          Customize how your chat interface looks
        </p>
      </div>

      {/* Chế độ chủ đề */}
      <div className="flex flex-col gap-3">
        <span className="text-[22px] font-bold text-[var(--settings-text)]">
          Theme mode
        </span>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
            { value: "auto", label: "Auto", icon: Monitor },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleInputChange("theme", value)}
              className={clsx(
                "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-colors",
                formData.theme === value
                  ? "border-[var(--settings-primary)] bg-white"
                  : "border-gray-200 bg-white hover:border-[var(--settings-primary-border)]",
              )}
            >
              <Icon
                size={32}
                className={clsx(
                  formData.theme === value
                    ? "text-[var(--settings-primary)]"
                    : "text-[var(--settings-primary-border)]",
                )}
              />
              <span
                className={clsx(
                  "font-semibold",
                  formData.theme === value
                    ? "text-[var(--settings-primary)]"
                    : "text-[var(--settings-text)]",
                )}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chọn hình nền */}
      <div className="flex flex-col gap-3">
        <span className="text-[22px] font-bold text-[var(--settings-text)]">
          Chat wallpaper
        </span>
        <div className="grid grid-cols-7 gap-4">
          {[
            { value: "teal", name: "Teal", color: "#2ab3b3" },
            { value: "orange", name: "Orange", color: "#ee652b" },
            { value: "purple", name: "Purple", color: "#6366f1" },
            { value: "green", name: "Green", color: "#a1f258" },
            { value: "red", name: "Red", color: "#ab2346" },
            { value: "gray", name: "Gray", color: "#c1cad8" },
            { value: "light-gray", name: "Light Gray", color: "#dfdddd" },
          ].map(({ value, name, color }) => (
            <button
              key={value}
              onClick={() => handleInputChange("wallpaper", value)}
              className={clsx(
                "h-32 rounded-2xl border-2 transition-all relative group",
                formData.wallpaper === value
                  ? "border-[var(--settings-primary)] scale-105"
                  : "border-transparent hover:border-gray-300",
              )}
              style={{ backgroundColor: color }}
              title={name}
            >
              {/* Hiển thị tên màu khi hover */}
              <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-semibold">{name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Xem trước màu hình nền */}
      <div className="flex flex-col gap-3">
        <span className="text-[22px] font-bold text-[var(--settings-text)]">
          Wallpaper preview
        </span>
        <div
          className="rounded-2xl p-8 border-2 border-[var(--settings-primary-border)] transition-all"
          style={{ backgroundColor: currentWallpaperColor }}
        >
          <div className="text-center">
            <p className="text-white font-semibold mb-4 drop-shadow">
              Chat preview
            </p>
            <div className="bg-white/90 rounded-lg p-4 text-[var(--settings-text)]">
              <p className="text-sm">
                This is how the wallpaper will look with the selected color
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kích thước phông chữ */}
      <div className="flex flex-col gap-3">
        <span className="text-[22px] font-bold text-[var(--settings-text)]">
          Font size
        </span>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="12"
            max="24"
            value={formData.fontSize}
            onChange={(e) =>
              handleInputChange("fontSize", parseInt(e.target.value))
            }
            className="flex-1 accent-[var(--settings-primary)]"
          />
          <span className="text-[var(--settings-text)] font-semibold min-w-12">
            {formData.fontSize}px
          </span>
        </div>
        <p className="text-sm text-[var(--settings-text)]">
          Preview text will appear in the selected size
        </p>
      </div>

      {/* Màu nhấn */}
      <div className="flex flex-col gap-3">
        <span className="text-[22px] font-bold text-[var(--settings-text)]">
          Accent color
        </span>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-[var(--settings-primary-border)]"
            style={{ backgroundColor: formData.accentColor }}
          />
          <input
            type="color"
            value={formData.accentColor}
            onChange={(e) => handleInputChange("accentColor", e.target.value)}
            className="cursor-pointer accent-[var(--settings-primary)]"
          />
        </div>
      </div>

      {/* Nút thao tác */}
      <div className="flex flex-col gap-4 pt-4 border-t border-[var(--settings-primary-border)]">
        {/* Hiển thị lỗi nếu có */}
        {saveError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {saveError}
          </div>
        )}
        {/* Hiển thị thông báo thành công */}
        {saveSuccess && (
          <div className="px-4 py-3 bg-[var(--settings-primary-bg)] border border-[var(--settings-primary-border)] rounded-lg text-[var(--settings-primary)] text-sm">
            {saveSuccess}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button
            label="Cancel changes"
            onClick={handleDiscardSettings}
            type="cancel"
            disabled={isSaving}
          />
          <Button
            label={isSaving ? "Saving..." : "Save changes"}
            onClick={handleSaveSettings}
            disabled={isSaving || !hasSettingsChanges}
          />
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
