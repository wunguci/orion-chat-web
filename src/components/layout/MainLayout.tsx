import { Navigate, Outlet } from "react-router-dom";
import AppSidebar from "../common/AppSidebar";
import { CallProvider } from "../../contexts/CallContext";
import { GroupCallProvider } from "../../contexts/GroupCallContext";
import { IncomingCallModal } from "../call/IncomingCallModal";
import { IncomingGroupCallModal } from "../call/IncomingGroupCallModal";
import { CallModal } from "../call/CallModal";
// import { getUser } from "../../utils/token";
import { useAuth } from "../../hooks/useAuth";

export const MainLayout = () => {
  const { isAuthenticated, user } = useAuth();
  const userId =
    user?.userId || user?.id || localStorage.getItem("userId") || "";
  const userName = user?.name || "User";

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <CallProvider userId={userId}>
      <GroupCallProvider userId={userId} userName={userName}>
        <div className="flex h-screen overflow-hidden bg-white">
          {/* Sidebar  */}
          <AppSidebar currentView="chat" setView={() => {}} currentUser={user} />

          {/* Main content  */}
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        </div>

        {/* Global call modals */}
        <IncomingCallModal />
        <IncomingGroupCallModal />
        <CallModal />
      </GroupCallProvider>
    </CallProvider>
  );
};
