import { Navigate, Outlet, useParams } from "react-router-dom";
import SideBarWorkHub from "../common/SideBarWorkHub";
import FloatingWorkHubChat from "../work-hub/FloatingWorkHubChat";
import { WorkspaceProvider } from "../../contexts/WorkspaceContext";

const WorkHubLayoutContent = ({ workspaceId }: { workspaceId: string }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-wh-green-bg-light">
      <SideBarWorkHub workspaceId={workspaceId} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
      <FloatingWorkHubChat workspaceId={workspaceId} />
    </div>
  );
};

const WorkHubLayout = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  if (!workspaceId) {
    return <Navigate to="/work-hub" replace />;
  }

  return (
    <WorkspaceProvider>
      <WorkHubLayoutContent workspaceId={workspaceId} />
    </WorkspaceProvider>
  );
};

export default WorkHubLayout;

