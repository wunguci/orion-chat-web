import { useParams } from "react-router-dom";
import { MOCK_WORKSPACES } from "../../../data/work-hub-mock";
import type { Workspace } from "../../../types/work-hub.types";
import WorkspaceSettingsForm from "../../../components/work-hub/workspace/WorkspaceSettingsForm";

const WorkspaceSettingsPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const workspace =
    MOCK_WORKSPACES.find((w) => w.id === workspaceId) || MOCK_WORKSPACES[0];

  const handleSave = (updates: Partial<Workspace>) => {
    console.log("Save workspace settings:", updates);
  };

  return (
    <>
      {/* Header */}
      <div className="px-6 lg:px-8 py-4 bg-white border-b border-[var(--wh-green-border-light)]">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage workspace configuration
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[var(--wh-green-bg-light)]">
        <div className="p-6 lg:p-8 max-w-[800px] mx-auto">
          <WorkspaceSettingsForm workspace={workspace} onSave={handleSave} />
        </div>
      </div>
    </>
  );
};

export default WorkspaceSettingsPage;
