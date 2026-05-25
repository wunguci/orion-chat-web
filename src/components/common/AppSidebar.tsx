/* eslint-disable */
import type React from "react";
import {
  MdChat,
  MdOutlineWork,
  MdNote,
  MdCalendarToday,
  MdSettings,
} from "react-icons/md";
import type { IconType } from "react-icons";
import { FaUsers, FaBrain } from "react-icons/fa";
import { Avatar } from "./Avatar";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../types/routes.types";
import SettingsModal from "../settings/SettingsModal";
import { useEffect, useMemo, useState } from "react";
import type { User } from "../../types/auth.types";
import NotificationCenter from "../notifications/NotificationCenter";
import { useUserSettings } from "../../hooks/useSettings";
import {
  APPEARANCE_THEME_CHANGED_EVENT,
  buildAppearanceThemeVars,
  type AppearanceThemeChangeDetail,
} from "../../theme/appearance";

type ViewMode =
  | "chat"
  | "contacts"
  | "notes"
  | "calendar"
  | "friends"
  | "aichat";

interface SidebarProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
  currentUser: User;
}

const AppSidebar: React.FC<SidebarProps> = ({
  currentView,
  setView,
  currentUser,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings: userSettings } = useUserSettings();
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadFriendCount, setUnreadFriendCount] = useState(0);
  const [unreadCalendarCount, setUnreadCalendarCount] = useState(0);
  const [sidebarAppearance, setSidebarAppearance] =
    useState<AppearanceThemeChangeDetail>({
      theme: undefined,
      appearanceColor: undefined,
    });
  const resolvedUserId = currentUser?.userId || currentUser?.id;

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:3000";

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getAvatarUrl = (avatarPath?: string): string | undefined => {
    if (!avatarPath) return undefined;
    if (avatarPath.startsWith("http")) return avatarPath;

    const fullUrl = `${API_BASE_URL}${avatarPath}`;

    return fullUrl;
  };

  useEffect(() => {
    setSidebarAppearance({
      theme: userSettings?.theme,
      appearanceColor: userSettings?.appearanceColor,
    });
  }, [userSettings?.appearanceColor, userSettings?.theme]);

  useEffect(() => {
    const handleAppearanceChanged = (event: Event) => {
      const customEvent = event as CustomEvent<AppearanceThemeChangeDetail>;

      setSidebarAppearance((prev) => ({
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

  const sidebarThemeVars = useMemo(
    () =>
      buildAppearanceThemeVars({
        theme: sidebarAppearance.theme,
        appearanceColor: sidebarAppearance.appearanceColor,
        prefix: "app-sidebar",
      }) as React.CSSProperties,
    [sidebarAppearance.appearanceColor, sidebarAppearance.theme],
  );

  return (
    <>
      <SettingsModal
        isOpen={isSettingOpen}
        onClose={() => setIsSettingOpen(false)}
      />
      <aside
        className="w-16 flex flex-col items-center py-6 border-r border-[var(--app-sidebar-primary-border)] bg-[var(--app-sidebar-surface)] shrink-0 z-20"
        style={sidebarThemeVars}
      >
        {/* User Avatar */}
        <div className="mb-8">
          <Avatar
            src={getAvatarUrl(currentUser?.avatarUrl)}
            alt={currentUser?.fullName || "User"}
            size="md"
            status={currentUser?.isOnline ? "online" : "offline"}
            onClick={() => {}}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          />
        </div>
        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-4 mt-6">
          {/* <NavItem
                    icon={MdContacts}
                    active={isActive(ROUTES.CHAT.CONTACTS)}
                    onClick={() => {
                        setView('contacts');
                        navigate(ROUTES.CHAT.CONTACTS);
                    }}
                    label="Contacts"
                /> */}
          <NavItem
            icon={MdChat}
            active={isActive(ROUTES.CHAT.ROOT)}
            onClick={() => {
              setView("chat");
              navigate(ROUTES.CHAT.ROOT);
            }}
            label="Chat"
            badgeCount={unreadChatCount}
          />
          <NavItem
            icon={FaUsers}
            active={isActive(ROUTES.FRIENDS)}
            onClick={() => {
              setView("friends");
              navigate(ROUTES.FRIENDS);
            }}
            label="Friends"
            badgeCount={unreadFriendCount}
          />
          <NavItem
            icon={MdNote}
            active={isActive(ROUTES.NOTE)}
            onClick={() => {
              setView("notes");
              navigate(ROUTES.NOTE);
            }}
            label="Notes"
          />
          <NavItem
            icon={MdCalendarToday}
            active={isActive(ROUTES.CALENDAR)}
            onClick={() => {
              setView("calendar");
              navigate(ROUTES.CALENDAR);
            }}
            label="Calendar"
            badgeCount={unreadCalendarCount}
          />
          <NavItem
            icon={FaBrain}
            active={isActive(ROUTES.AICHAT)}
            onClick={() => {
              setView("aichat");
              navigate(ROUTES.AICHAT);
            }}
            label="AI Chat"
          />
        </nav>

        {/* Settings at bottom */}
        <div className="mt-auto gap-4 flex flex-col items-center">
          <NotificationCenter
            userId={resolvedUserId}
            open={isNotificationOpen}
            onToggle={() => setIsNotificationOpen((prev) => !prev)}
            onUnreadMessageCountChange={setUnreadChatCount}
            onUnreadTypeCountsChange={(counts) => {
              setUnreadChatCount(counts.chat);
              setUnreadFriendCount(counts.friend);
              setUnreadCalendarCount(counts.calendar);
            }}
          />

          <NavItem
            icon={MdOutlineWork}
            active={location.pathname.startsWith(ROUTES.WORK_HUB.ROOT)}
            onClick={() => navigate(ROUTES.WORK_HUB.ROOT)}
            label="Work Hub"
          />
          <NavItem
            icon={MdSettings}
            active={false}
            onClick={() => setIsSettingOpen(true)}
            label="Settings"
          />
        </div>
      </aside>
    </>
  );
};

interface NavItemProps {
  icon: IconType;
  active: boolean;
  onClick: () => void;
  label: string;
  badgeCount?: number;
}

const NavItem: React.FC<NavItemProps> = ({
  icon: Icon,
        active,
  onClick,
  label,
  badgeCount = 0,
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
        active
          ? "bg-[var(--app-sidebar-primary)] text-white shadow-sm"
          : "text-[var(--app-sidebar-muted)] hover:bg-[var(--app-sidebar-primary-bg)] hover:text-[var(--app-sidebar-primary)]"
      }`}
      title={label}
      aria-label={label}
    >
      <Icon className="w-5 h-5" />
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-[var(--app-sidebar-primary)] px-1 text-center text-[10px] leading-4 font-semibold text-white">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </button>
  );
};

export default AppSidebar;
