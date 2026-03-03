interface AvatarProps {
  src: string;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg";
  status?: "online" | "offline" | "away";
  className?: string;
}

const sizeMap = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const statusSizeMap = {
  xs: "w-2 h-2",
  sm: "w-2.5 h-2.5",
  md: "w-3 h-3",
  lg: "w-3.5 h-3.5",
};

const statusColorMap = {
  online: "bg-[var(--color-online)]",
  offline: "bg-[var(--color-offline)]",
  away: "bg-[var(--color-away)]",
};

const Avatar = ({ src, alt = "User", size = "md", status, className = "" }: AvatarProps) => {
  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`${sizeMap[size]} rounded-full object-cover border-2 border-white`}
      />
      {status && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizeMap[size]} ${statusColorMap[status]} rounded-full border-2 border-white`}
        />
      )}
    </div>
  );
};

export default Avatar;
