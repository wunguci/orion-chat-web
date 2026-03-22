import type {
  WorkspaceMember,
  WorkspaceRole,
} from "../../../types/work-hub.types";
import Avatar from "../../common/AvatarWorkHub";

interface MemberListProps {
  members: WorkspaceMember[];
  currentUserRole: WorkspaceRole;
  onRemoveMember: (userId: string) => void;
  onChangeRole: (userId: string, role: WorkspaceRole) => void;
}

const roleColors: Record<WorkspaceRole, string> = {
  owner: "bg-amber-100 text-amber-700",
  admin: "bg-wh-green-bg-heavy text-wh-green-text-primary",
  member: "bg-gray-100 text-gray-600",
};

const MemberList = ({
  members,
  currentUserRole,
  onRemoveMember,
  onChangeRole,
}: MemberListProps) => {
  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <div className="bg-white rounded-xl border border-wh-green-border-light overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-wh-green-border-light bg-wh-green-bg-light">
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Member
            </th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Joined
            </th>
            {canManage && (
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr
              key={member.user.id}
              className="border-b border-gray-50 hover:bg-wh-green-bg-light transition-colors"
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={member.user.avatar}
                    alt={member.user.name}
                    size="sm"
                    status={member.user.status}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {member.user.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {member.user.phone || ""}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 text-sm text-gray-600">
                {member.user.email}
              </td>
              <td className="px-5 py-3">
                {canManage && member.role !== "owner" ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      onChangeRole(
                        member.user.id,
                        e.target.value as WorkspaceRole,
                      )
                    }
                    className="text-xs font-semibold px-2.5 py-1 rounded-full border-none cursor-pointer bg-wh-green-bg-heavy text-wh-green-text-primary focus:outline-none focus:ring-2 focus:ring-wh-green-primary"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                ) : (
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleColors[member.role]}`}
                  >
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                )}
              </td>
              <td className="px-5 py-3 text-sm text-gray-500">
                {new Date(member.joinedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
              {canManage && (
                <td className="px-5 py-3 text-right">
                  {member.role !== "owner" && (
                    <button
                      onClick={() => onRemoveMember(member.user.id)}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      <i className="fas fa-user-minus mr-1"></i>
                      Remove
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MemberList;

