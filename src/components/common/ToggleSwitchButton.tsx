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
    <div className="flex items-center justify-between p-4 bg-orange-bg-light rounded-xl border border-orange-border-light">
      <div className="flex items-center gap-3">
        <Icon size={24} className="text-orange-primary" />
        <div>
          <p className="font-semibold text-gray-primary">{label}</p>
          <p className="text-sm text-gray-primary">{description}</p>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

export default ToggleSwitchButton;
