interface Button {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  type?: "submit" | "cancel" | "current";
  padding?: string;
}
function Button({
  label,
  onClick,
  icon,
  type = "submit",
  padding = "px-4 py-2",
}: Button) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 ${padding} text-sm font-semibold  rounded-lg ${
        type === "submit"
          ? "text-white bg-green-primary hover:bg-green-primary/90"
          : type === "cancel"
            ? "text-gray-primary bg-white border border-gray-300 hover:bg-gray-50"
            : "bg-green-bg-heavy text-green-primary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default Button;
