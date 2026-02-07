import { Outlet } from "react-router-dom";
import AppSidebar from "../common/AppSidebar";

export const MainLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar  */}
      <AppSidebar currentView="chat" setView={() => {}} />

      {/* Main content  */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};
