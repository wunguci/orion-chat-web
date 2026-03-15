import type React from "react";
import { useState } from "react";
import { MdChat, MdNote, MdCalendarToday, MdSettings } from "react-icons/md";
import type { IconType } from "react-icons";
import { FaUsers, FaBrain } from "react-icons/fa";
import { Avatar } from "./Avatar";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../types/routes.types";
import SettingsModal from "../setting-chat/SettingModal";

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
}

const AppSidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingOpen, setIsSettingOpen] = useState(false);

  // Helper function để check active view dựa trên URL
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Mock user data
  const currentUser = {
    name: "Trần Vũ",
    avatar: undefined, // Hoặc URL ảnh thật
    status: "online" as const,
  };

  return (
    <>
      <SettingsModal
        isOpen={isSettingOpen}
        onClose={() => setIsSettingOpen(false)}
      />
      <aside className="w-16 flex flex-col items-center py-6 border-r border-slate-200 white:border-slate-800 bg-white white:bg-slate-900 shrink-0 z-20">
        {/* User Avatar */}
        <div className="mb-8">
          <Avatar
            src={currentUser.avatar}
            alt={currentUser.name}
            size="md"
            status={currentUser.status}
            onClick={() => console.log("Avatar clicked - navigate to profile")}
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
          />
          <NavItem
            icon={FaUsers}
            active={isActive(ROUTES.FRIENDS)}
            onClick={() => {
              setView("friends");
              navigate(ROUTES.FRIENDS);
            }}
            label="Friends"
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
        <div className="mt-auto">
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
}

const NavItem: React.FC<NavItemProps> = ({
  icon: Icon,
  active,
  onClick,
  label,
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
        active
          ? "bg-teal-400 text-primary shadow-sm"
          : "text-slate-400 hover:bg-slate-200"
      }`}
      title={label}
      aria-label={label}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
};

export default AppSidebar;
