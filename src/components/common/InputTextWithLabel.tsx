import React from "react";
import type { IconType } from "react-icons";

type InputProps = {
  label: string;
  placeholder: string;
  value: string;
  handleInputChange: (field: string, value: string) => void;
  fieldName: string;
  icon?: IconType; // Thêm prop icon tùy chọn
};

function InputTextWithLabel({
  label,
  placeholder,
  value,
  handleInputChange,
  fieldName,
  icon: Icon, // Alias để dùng như một Component
}: InputProps) {
  return (
    <div className="flex flex-col gap-2 shrink w-full">
      {label && (
        <label className="block text-base font-semibold text-[#505050]">
          {label}
        </label>
      )}

      <div className="relative flex items-center group">
        {/* Render icon nếu có truyền vào */}
        {Icon && (
          <Icon
            className="absolute left-3 text-gray-400 group-focus-within:text-green-primary transition-colors"
            size={20}
          />
        )}

        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(fieldName, e.target.value)}
          className={`w-full py-2 border border-gray-200 rounded-lg text-[#505050] focus:outline-none focus:ring-2 focus:ring-green-primary transition-all
            ${Icon ? "pl-10 pr-4" : "px-4"}`} // Nếu có icon thì padding-left là 10, nếu không thì 4
        />
      </div>
    </div>
  );
}

export default InputTextWithLabel;
