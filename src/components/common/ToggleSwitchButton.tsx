import ToggleSwitch from "./ToggleSwitch";

function ToggleSwitchButton({
  label,
  description,
  checked,
  icon: Icon,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  icon: React.ComponentType<{ size: number; className?: string }>;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[var(--settings-surface-bg,#f0fdf4)] rounded-xl border border-[var(--settings-primary-border,#bbf7d0)]">
      <div className="flex items-center gap-3">
        <Icon size={24} className="text-[var(--settings-primary,#22c55e)]" />
        <div>
          <p className="font-semibold text-[var(--settings-text,#505050)]">{label}</p>
          <p className="text-sm text-[var(--settings-text,#505050)]">{description}</p>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

export default ToggleSwitchButton;
