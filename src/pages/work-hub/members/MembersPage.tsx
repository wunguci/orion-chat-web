import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import type {
  Workspace,
  WorkspaceRole,
  WorkspaceMember,
} from "../../../types/work-hub.types";
import type {
  WorkspaceInviteLinkResponse,
  WorkspaceJoinRequestResponse,
} from "../../../features/work-hub/work-hub.api.types";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import {
  mapWorkspace,
  roleToBE,
} from "../../../features/work-hub/work-hub.mappers";
import { getUser } from "../../../utils/token";
import MemberList from "../../../components/work-hub/workspace/MemberList";
import InviteMemberDialog from "../../../components/work-hub/workspace/InviteMemberDialog";

const MembersPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLinkData, setInviteLinkData] =
    useState<WorkspaceInviteLinkResponse | null>(null);
  const [joinRequests, setJoinRequests] = useState<
    WorkspaceJoinRequestResponse[]
  >([]);

  const [showInvite, setShowInvite] = useState(false);

  const reloadWorkspace = useCallback(async () => {
    if (!workspaceId) return;

    const data = await workHubApi.getWorkspace(workspaceId);
    const mapped = mapWorkspace(data);
    setWorkspace(mapped);
    setMembers(mapped.members);
    workHubApi
      .getJoinRequests(workspaceId)
      .then(setJoinRequests)
      .catch(() => setJoinRequests([]));
  }, [workspaceId]);

  // Fetch workspace data từ API
  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    reloadWorkspace()
      .catch(() => setWorkspace(null))
      .finally(() => setLoading(false));
  }, [workspaceId, reloadWorkspace]);

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

  const handleTransferOwner = async (userId: string) => {
    if (!workspaceId) return;
    if (!confirm("Transfer workspace ownership to this member?")) return;
    try {
      await workHubApi.transferWorkspaceOwner(workspaceId, userId);
      await reloadWorkspace();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to transfer owner");
    }
  };

  const handleReviewJoinRequest = async (
    requestId: string,
    action: "approve" | "reject",
  ) => {
    if (!workspaceId) return;
    try {
      if (action === "approve") {
        await workHubApi.approveJoinRequest(workspaceId, requestId);
      } else {
        await workHubApi.rejectJoinRequest(workspaceId, requestId);
      }
      await reloadWorkspace();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to review request");
    }
  };

  const handleInvite = async (data: {
    type: "phone" | "name";
    value: string;
  }) => {
    if (!workspaceId) return;
    try {
      await workHubApi.inviteMemberByMethod(workspaceId, {
        method: data.type,
        value: data.value,
        role: "MEMBER",
      });
      await reloadWorkspace();
      alert("Invite sent successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to invite";
      alert(message);
      throw err;
    }
  };

  const currentUserId = getUser()?.userId ?? getUser()?.id ?? "";
  const currentUserRole =
    members.find((member) => member.user.id === currentUserId)?.role ?? "member";

  const handleGenerateLink = async () => {
    if (!workspaceId) return;
    try {
      const data = await workHubApi.getInviteLink(workspaceId, "MEMBER");
      setInviteLinkData(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate invite link";
      alert(message);
      throw err;
    }
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
            currentUserRole={currentUserRole}
            onRemoveMember={handleRemoveMember}
            onChangeRole={handleChangeRole}
            onTransferOwner={handleTransferOwner}
          />

          {joinRequests.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-wh-green-border-light overflow-hidden">
              <div className="px-5 py-3 border-b border-wh-green-border-light bg-wh-green-bg-light">
                <h2 className="text-sm font-semibold text-gray-800">
                  Pending Join Requests
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {joinRequests.map((request) => (
                  <div
                    key={request.requestId}
                    className="flex items-center justify-between gap-4 px-5 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={request.user.avatarUrl || "/avatar-user.png"}
                        alt={request.user.fullName}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {request.user.fullName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Requested {request.requestedRole.toLowerCase()} ·{" "}
                          {new Date(request.requestedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          void handleReviewJoinRequest(
                            request.requestId,
                            "reject",
                          )
                        }
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() =>
                          void handleReviewJoinRequest(
                            request.requestId,
                            "approve",
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-wh-green-primary text-sm text-white hover:bg-wh-green-primary-hover"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <InviteMemberDialog
        isOpen={showInvite}
        onClose={() => {
          setShowInvite(false);
          setInviteLinkData(null);
        }}
        onInvite={handleInvite}
        onGenerateLink={handleGenerateLink}
        inviteLinkData={inviteLinkData}
      />
    </div>
  );
};

export default MembersPage;

