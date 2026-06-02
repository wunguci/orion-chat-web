import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Workspace } from "../../../types/work-hub.types";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import {
  mapWorkspace,
  typeToBE,
} from "../../../features/work-hub/work-hub.mappers";
import WorkspaceSettingsForm from "../../../components/work-hub/workspace/WorkspaceSettingsForm";
import { useWorkspace } from "../../../contexts/WorkspaceContext";
import { AlertTriangle, Trash2 } from "lucide-react";

const WorkspaceSettingsPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { workspace, isOwner, isAdmin, refreshWorkspace } = useWorkspace();
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const handleSave = async (updates: Partial<Workspace>) => {
    if (!workspaceId) return;
    try {
      const req: Record<string, unknown> = {};
      if (updates.name !== undefined) req.workspaceName = updates.name;
      if (updates.description !== undefined)
        req.description = updates.description;
      if (updates.type !== undefined) req.type = typeToBE(updates.type);
      if (updates.color !== undefined) req.color = updates.color;
      if (updates.isPublic !== undefined) req.isPublic = updates.isPublic;

      await workHubApi.updateWorkspace(workspaceId, req);
      await refreshWorkspace();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save settings");
    }
  };

  const handleDisband = async () => {
    if (!workspaceId || confirmName !== workspace?.name) return;
    try {
      await workHubApi.deleteWorkspace(workspaceId);
      navigate('/work-hub', { replace: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to disband workspace");
    }
  };

  if (!workspace) return null;

  return (
    <>
      {/* Header */}
      <div className="px-6 lg:px-8 py-4 bg-white border-b border-wh-green-border-light">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage workspace configuration
          </p>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-wh-green-bg-light">
        <div className="p-6 lg:p-8 max-w-[800px] mx-auto space-y-8">
          <WorkspaceSettingsForm workspace={workspace} onSave={handleSave} />

          {/* Danger Zone */}
          {isOwner && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-red-800 flex items-center gap-2 mb-2">
                <AlertTriangle size={20} />
                Danger Zone
              </h3>
              <p className="text-sm text-red-600 mb-4">
                Disbanding a workspace is irreversible. All data, boards, and tasks will be soft-deleted.
              </p>
              <button
                onClick={() => setShowDisbandConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded shadow hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Disband Workspace
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Disband Confirmation Modal */}
      {showDisbandConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Disband Workspace</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to disband <strong>{workspace.name}</strong>? This action cannot be undone.
              Please type the name of the workspace to confirm.
            </p>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              placeholder={workspace.name}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDisbandConfirm(false);
                  setConfirmName("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDisband}
                disabled={confirmName !== workspace.name}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded shadow hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Disband
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkspaceSettingsPage;

