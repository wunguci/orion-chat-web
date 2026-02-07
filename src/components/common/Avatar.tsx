import { cn } from "../../utils/cn";

interface AvatarProps {
  src?: string;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away";
  className?: string;
  onClick?: () => void;
}

/**
 * Avatar Component
 *
 * Features:
 * - Hiển thị ảnh hoặc chữ cái đầu nếu không có ảnh
 * - Status indicator (online/offline/away)
 * - Multiple sizes
 * - Click handler
 *
 * Usage:
 * <Avatar src="url" alt="User name" size="md" status="online" />
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = "md",
  status,
  className,
  onClick,
}) => {
  // Size mapping
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
  };

  // Status dot size mapping
  const statusSizeClasses = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
  };

  // Lấy chữ cái đầu từ alt
  const getInitials = (name: string): string => {
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Avatar */}
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-medium overflow-hidden",
          "bg-gradient-to-br from-blue-400 to-blue-600 text-white",
          sizeClasses[size],
          onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        )}
        onClick={onClick}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials(alt)}</span>
        )}
      </div>

      {/* Status Indicator */}
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white",
            statusSizeClasses[size],
            {
              "bg-green-500": status === "online",
              "bg-gray-400": status === "offline",
              "bg-orange-400": status === "away",
            },
          )}
          aria-label={status}
        />
      )}
    </div>
  );
};
