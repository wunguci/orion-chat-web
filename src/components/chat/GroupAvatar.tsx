import React from "react";

type GroupAvatarMember = {
  userId: string;
  fullName?: string | null;
  avatarUrl?: string | null;
};

type GroupAvatarProps = {
  name?: string;
  avatarUrl?: string | null;
  members?: GroupAvatarMember[];
  size?: number;
  className?: string;
  onClick?: () => void;
};

const pickDeterministicMembers = (
  members: GroupAvatarMember[],
  seed: string,
): GroupAvatarMember[] => {
  if (members.length <= 4) return members;

  const hash = Array.from(seed).reduce((acc, char) => {
    return (acc * 31 + char.charCodeAt(0)) >>> 0;
  }, 7);

  const start = hash % members.length;
  const ordered = [...members.slice(start), ...members.slice(0, start)];
  return ordered.slice(0, 4);
};

const initialFromName = (fullName?: string | null): string => {
  if (!fullName) return "?";
  return fullName.trim().charAt(0).toUpperCase() || "?";
};

const defaultSizeClass = (size: number) => ({
  width: `${size}px`,
  height: `${size}px`,
  minWidth: `${size}px`,
  minHeight: `${size}px`,
});

export const GroupAvatar: React.FC<GroupAvatarProps> = ({
  name = "Group",
  avatarUrl,
  members = [],
  size = 40,
  className = "",
  onClick,
}) => {
  const safeMembers = members.filter((member) => member?.userId);
  const displayMembers = pickDeterministicMembers(safeMembers, name || "group");

  const fallback = (
    <div
      className="grid h-full w-full grid-cols-2 grid-rows-2 overflow-hidden bg-slate-100"
      aria-label="Group member collage"
    >
      {displayMembers.length > 0 ? (
        displayMembers.slice(0, 4).map((member, index) => (
          <div
            key={`${member.userId}-${index}`}
            className="relative flex h-full w-full items-center justify-center border border-white/60 bg-slate-200 text-[10px] font-semibold text-slate-600"
          >
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                alt={member.fullName || "member"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initialFromName(member.fullName)}</span>
            )}
          </div>
        ))
      ) : (
        <div className="col-span-2 row-span-2 flex items-center justify-center text-sm font-semibold text-slate-500">
          {initialFromName(name)}
        </div>
      )}
    </div>
  );

  const content = avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      className="h-full w-full object-cover"
      onError={(e) => {
        const target = e.currentTarget;
        target.style.display = "none";
        const parent = target.parentElement;
        if (parent) {
          const fallbackEl = parent.querySelector(".group-avatar-fallback");
          if (fallbackEl) {
            (fallbackEl as HTMLElement).style.display = "grid";
          }
        }
      }}
    />
  ) : null;

  const commonClassName = `relative overflow-hidden rounded-full border border-slate-200 ${onClick ? "cursor-pointer transition hover:opacity-90" : ""} ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={commonClassName}
        style={defaultSizeClass(size)}
        title="Chỉnh sửa ảnh nhóm"
      >
        {content}
        <div
          className="group-avatar-fallback absolute inset-0"
          style={{ display: avatarUrl ? "none" : "grid" }}
        >
          {fallback}
        </div>
      </button>
    );
  }

  return (
    <div
      className={commonClassName}
      style={defaultSizeClass(size)}
      title={name}
    >
      {content}
      <div
        className="group-avatar-fallback absolute inset-0"
        style={{ display: avatarUrl ? "none" : "grid" }}
      >
        {fallback}
      </div>
    </div>
  );
};

export default GroupAvatar;
