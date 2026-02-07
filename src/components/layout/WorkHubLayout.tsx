import { Outlet } from "react-router-dom";
import SideBarWorkHub from "../common/SideBarWorkHub";

const WorkHubLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0f172a]">
      {/* Sidebar */}
      <SideBarWorkHub />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default WorkHubLayout;
