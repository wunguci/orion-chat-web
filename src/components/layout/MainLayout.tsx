import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import AppSidebar from "../common/AppSidebar";
import { CallProvider } from "../../contexts/CallContext";
import { GroupCallProvider } from "../../contexts/GroupCallContext";
import { IncomingCallModal } from "../call/IncomingCallModal";
import { IncomingGroupCallModal } from "../call/IncomingGroupCallModal";
import { CallModal } from "../call/CallModal";
import { StreamVideoProvider } from "../../contexts/StreamVideoContext";
// import { getUser } from "../../utils/token";
import { useAuth } from "../../hooks/useAuth";
import { presenceSocketService } from "../../services/websocket/presenceSocket";
import { useUserSettings } from "../../hooks/useSettings";
import {
  APPEARANCE_THEME_CHANGED_EVENT,
  buildAppearanceThemeVars,
  type AppearanceThemeChangeDetail,
} from "../../theme/appearance";

export const MainLayout = () => {
  const { isAuthenticated, user } = useAuth();
  const userId =
    user?.userId || user?.id || localStorage.getItem("userId") || "";
  const userName = user?.fullName || user?.phoneNumber || "User";
  const { settings: userSettings } = useUserSettings();
  const [appAppearance, setAppAppearance] =
    useState<AppearanceThemeChangeDetail>({
      theme: undefined,
      appearanceColor: undefined,
    });

  useEffect(() => {
    setAppAppearance({
      theme: userSettings?.theme,
      appearanceColor: userSettings?.appearanceColor,
    });
  }, [userSettings?.appearanceColor, userSettings?.theme]);

  useEffect(() => {
    const handleAppearanceChanged = (event: Event) => {
      const customEvent =
        event as CustomEvent<AppearanceThemeChangeDetail>;

      setAppAppearance((prev) => ({
        theme: customEvent.detail?.theme ?? prev.theme,
        appearanceColor:
          customEvent.detail?.appearanceColor ?? prev.appearanceColor,
      }));
    };

    window.addEventListener(
      APPEARANCE_THEME_CHANGED_EVENT,
      handleAppearanceChanged,
    );

    return () => {
      window.removeEventListener(
        APPEARANCE_THEME_CHANGED_EVENT,
        handleAppearanceChanged,
      );
    };
  }, []);

  const appThemeVars = useMemo(
    () =>
      buildAppearanceThemeVars({
        theme: appAppearance.theme,
        appearanceColor: appAppearance.appearanceColor,
        prefix: "app",
      }) as React.CSSProperties,
    [appAppearance.appearanceColor, appAppearance.theme],
  );

  useEffect(() => {
    if (!isAuthenticated || !user || !userId) {
      presenceSocketService.disconnect();
      return;
    }

    const token = localStorage.getItem("auth_token") || undefined;
    presenceSocketService.connect(userId, token);

    return () => {
      presenceSocketService.disconnect();
    };
  }, [isAuthenticated, user, userId]);

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <StreamVideoProvider user={user}>
      <CallProvider userId={userId}>
      <GroupCallProvider userId={userId} userName={userName} userAvatar={user?.avatarUrl || user?.avatarUrl || ""}>
        <div className="flex h-screen overflow-hidden bg-white" style={appThemeVars}>
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
    </StreamVideoProvider>
  );
};
