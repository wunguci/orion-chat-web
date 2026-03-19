import { Outlet } from "react-router-dom";
import AppSidebar from "../common/AppSidebar";
import { CallProvider } from "../../contexts/CallContext";
import { IncomingCallModal } from "../call/IncomingCallModal";
import { CallModal } from "../call/CallModal";
import { getUser } from "../../utils/token";

export const MainLayout = () => {
  const userId = getUser()?.id || localStorage.getItem("userId") || "user-001";

  return (
    <CallProvider userId={userId}>
      <div className="flex h-screen overflow-hidden bg-white">
        {/* Sidebar  */}
        <AppSidebar currentView="chat" setView={() => {}} />

        {/* Main content  */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>

      {/* Global call modals */}
      <IncomingCallModal />
      <CallModal />
    </CallProvider>
  );
};
