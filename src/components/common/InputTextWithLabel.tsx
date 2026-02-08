function InputTextWithLabel({
  label,
  placeholder,
  value,
  handleInputChange,
  fieldName,
}: {
  label: string;
  placeholder: string;
  value: string;
  handleInputChange: (field: string, value: string) => void;
  fieldName: string;
}) {
  return (
    <div className="flex flex-col gap-2 shrink">
      <label className="block text-base font-semibold text-[#505050]">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleInputChange(fieldName, e.target.value)}
        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-[#505050] focus:outline-none focus:ring-2 focus:ring-[#ee652b]"
      />
    </div>
  );
}

export default InputTextWithLabel;
