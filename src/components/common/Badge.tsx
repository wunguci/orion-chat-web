interface BadgeProps {
  text: string;
  color?: string;
  variant?: "solid" | "outline" | "light";
  size?: "sm" | "md";
}

const Badge = ({ text, color, variant = "light", size = "sm" }: BadgeProps) => {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  if (variant === "solid") {
    return (
      <span
        className={`inline-flex items-center rounded-md font-semibold text-white ${sizeClasses}`}
        style={{ backgroundColor: color }}
      >
        {text}
      </span>
    );
  }

  if (variant === "outline") {
    return (
      <span
        className={`inline-flex items-center rounded-md font-semibold border ${sizeClasses}`}
        style={{ borderColor: color, color: color }}
      >
        {text}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-md font-semibold ${sizeClasses}`}
      style={{ backgroundColor: `${color}18`, color: color }}
    >
      {text}
    </span>
  );
};

export default Badge;
