import Avatar from "./Avatar";

interface AvatarUser {
  src: string;
  alt?: string;
}

interface AvatarGroupProps {
  users: AvatarUser[];
  max?: number;
  size?: "xs" | "sm" | "md";
}

const AvatarGroup = ({ users, max = 3, size = "xs" }: AvatarGroupProps) => {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  const overflowSize = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
  };

  return (
    <div className="flex -space-x-2">
      {visible.map((user, i) => (
        <Avatar key={i} src={user.src} alt={user.alt} size={size} />
      ))}
      {overflow > 0 && (
        <div
          className={`${overflowSize[size]} rounded-full bg-[var(--wh-green-bg-heavy)] text-[var(--wh-green-text-primary)] font-semibold flex items-center justify-center border-2 border-white`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;
