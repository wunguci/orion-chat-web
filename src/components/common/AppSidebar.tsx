import type React from "react";
import {
  MdChat,
  MdContacts,
  MdNote,
  MdCalendarToday,
  MdSettings,
} from "react-icons/md";
import type { IconType } from "react-icons";
import { Avatar } from "./Avatar";

type ViewMode = "chat" | "contacts" | "notes" | "calendar";

interface SidebarProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
}

const AppSidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  // Mock user data
  const currentUser = {
    name: "Trần Vũ",
    avatar: undefined, // Hoặc URL ảnh thật
    status: "online" as const,
  };

  return (
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
        <NavItem
          icon={MdChat}
          active={currentView === "chat"}
          onClick={() => setView("chat")}
          label="Chat"
        />
        <NavItem
          icon={MdContacts}
          active={currentView === "contacts"}
          onClick={() => setView("contacts")}
          label="Contacts"
        />
        <NavItem
          icon={MdNote}
          active={currentView === "notes"}
          onClick={() => setView("notes")}
          label="Notes"
        />
        <NavItem
          icon={MdCalendarToday}
          active={currentView === "calendar"}
          onClick={() => setView("calendar")}
          label="Calendar"
        />
      </nav>

      {/* Settings at bottom */}
      <div className="mt-auto">
        <NavItem
          icon={MdSettings}
          active={false}
          onClick={() => console.log("Settings clicked")}
          label="Settings"
        />
      </div>
    </aside>
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
      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
        active
          ? "bg-teal-50 dark:bg-teal-900/30 text-primary shadow-sm"
          : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
      title={label}
      aria-label={label}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
};

export default AppSidebar;
