interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
}

function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <label className="flex items-center cursor-pointer gap-2">
      {label && <span className="text-sm text-gray-primary">{label}</span>}
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 rounded border-orange-border-light text-orange-primary focus:ring-orange-primary accent-orange-primary focus:ring-2 cursor-pointer"
      />
    </label>
  );
}

export default Checkbox;
