import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import type { Workspace } from "../../../types/work-hub.types";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import {
  mapWorkspace,
  typeToBE,
} from "../../../features/work-hub/work-hub.mappers";
import WorkspaceSettingsForm from "../../../components/work-hub/workspace/WorkspaceSettingsForm";

const WorkspaceSettingsPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    workHubApi
      .getWorkspace(workspaceId)
      .then((data) => setWorkspace(mapWorkspace(data)))
      .catch(() => setWorkspace(null))
      .finally(() => setLoading(false));
  }, [workspaceId]);

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

      const data = await workHubApi.updateWorkspace(workspaceId, req);
      setWorkspace(mapWorkspace(data));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save settings");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-wh-green-bg-light">
        <i
          className="fas fa-spinner fa-spin text-3xl"
          style={{ color: "#0d9488" }}
        ></i>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex-1 flex items-center justify-center bg-wh-green-bg-light">
        <p className="text-gray-500">Workspace not found</p>
      </div>
    );
  }

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
        <div className="p-6 lg:p-8 max-w-[800px] mx-auto">
          <WorkspaceSettingsForm workspace={workspace} onSave={handleSave} />
        </div>
      </div>
    </>
  );
};

export default WorkspaceSettingsPage;

