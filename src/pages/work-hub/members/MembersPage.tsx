import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import type {
  Workspace,
  WorkspaceRole,
  WorkspaceMember,
} from "../../../types/work-hub.types";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import {
  mapWorkspace,
  roleToBE,
} from "../../../features/work-hub/work-hub.mappers";
import MemberList from "../../../components/work-hub/workspace/MemberList";
import InviteMemberDialog from "../../../components/work-hub/workspace/InviteMemberDialog";

const MembersPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [showInvite, setShowInvite] = useState(false);

  // Fetch workspace data từ API
  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    workHubApi
      .getWorkspace(workspaceId)
      .then((data) => {
        const mapped = mapWorkspace(data);
        setWorkspace(mapped);
        setMembers(mapped.members);
      })
      .catch(() => setWorkspace(null))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const handleRemoveMember = async (userId: string) => {
    if (
      !workspaceId ||
      !confirm("Are you sure you want to remove this member?")
    )
      return;
    try {
      await workHubApi.removeMember(workspaceId, userId);
      setMembers(members.filter((m) => m.user.id !== userId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleChangeRole = async (userId: string, role: WorkspaceRole) => {
    if (!workspaceId) return;
    try {
      await workHubApi.updateMemberRole(workspaceId, userId, {
        role: roleToBE(role),
      });
      setMembers(
        members.map((m) => (m.user.id === userId ? { ...m, role } : m)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to change role");
    }
  };

  const handleInvite = (data: { type: string; value: string }) => {
    console.log("Invite:", data);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 lg:px-8 py-4 bg-white border-b border-wh-green-border-light">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Members</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage workspace members and permissions
            </p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="px-4 py-2 bg-wh-green-primary text-white rounded-lg text-sm font-medium hover:bg-wh-green-primary-hover transition-colors flex items-center gap-2"
          >
            <i className="fas fa-user-plus"></i>
            Invite Member
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-wh-green-bg-light">
        <div className="p-6 lg:p-8 mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-wh-green-border-light rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-900">
                {members.length}
              </div>
              <div className="text-xs text-gray-500">Total Members</div>
            </div>
            <div className="bg-white border border-wh-green-border-light rounded-xl p-4">
              <div className="text-2xl font-bold text-wh-green-primary">
                {members.filter((m) => m.user.status === "online").length}
              </div>
              <div className="text-xs text-gray-500">Online Now</div>
            </div>
            <div className="bg-white border border-wh-green-border-light rounded-xl p-4">
              <div className="text-2xl font-bold text-amber-600">
                {
                  members.filter(
                    (m) => m.role === "admin" || m.role === "owner",
                  ).length
                }
              </div>
              <div className="text-xs text-gray-500">Admins</div>
            </div>
          </div>

          <MemberList
            members={members}
            currentUserRole="owner"
            onRemoveMember={handleRemoveMember}
            onChangeRole={handleChangeRole}
          />
        </div>
      </div>

      <InviteMemberDialog
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        onInvite={handleInvite}
      />
    </div>
  );
};

export default MembersPage;

