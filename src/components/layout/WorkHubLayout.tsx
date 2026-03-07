import { Outlet, useParams } from "react-router-dom";
import SideBarWorkHub from "../common/SideBarWorkHub";

const WorkHubLayout = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--wh-green-bg-light)]">
      <SideBarWorkHub workspaceId={workspaceId || "ws1"} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default WorkHubLayout;
