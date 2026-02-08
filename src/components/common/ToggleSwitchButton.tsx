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
    <div className="flex items-center justify-between p-4 bg-[#fdfaf9] rounded-xl border border-[#fbe7df]">
      <div className="flex items-center gap-3">
        <Icon size={24} className="text-[#ee652b]" />
        <div>
          <p className="font-semibold text-[#505050]">{label}</p>
          <p className="text-sm text-[#505050]">{description}</p>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

export default ToggleSwitchButton;
