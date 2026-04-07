import type { WorkspaceRole } from "../../../types/work-hub.types";

interface RoleSelectorProps {
  currentRole: WorkspaceRole;
  onChange: (role: WorkspaceRole) => void;
  disabled?: boolean;
}

const RoleSelector = ({ currentRole, onChange, disabled = false }: RoleSelectorProps) => {
  return (
    <select
      value={currentRole}
      onChange={(e) => onChange(e.target.value as WorkspaceRole)}
      disabled={disabled}
      className="px-3 py-1.5 text-sm border border-wh-green-border-light rounded-lg bg-white text-gray-700 focus:outline-none focus:border-wh-green-primary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="owner">Owner</option>
      <option value="admin">Admin</option>
      <option value="member">Member</option>
    </select>
  );
};

export default RoleSelector;

