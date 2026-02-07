import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  id: string;
  icon: string;
  label: string;
  path?: string;
  badge?: number;
  active?: boolean;
}

interface Channel {
  id: string;
  name: string;
  icon: string;
  badge?: number;
  active?: boolean;
  isPrivate?: boolean;
}

const SideBarWorkHub = () => {
  const location = useLocation();
  const [activeChannel, setActiveChannel] = useState("general");

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      icon: "fa-home",
      label: "Dashboard",
      path: "/work-hub",
      active: true,
    },
    {
      id: "tasks",
      icon: "fa-tasks",
      label: "Tasks",
      path: "/work-hub/tasks",
      badge: 12,
    },
    {
      id: "calendar",
      icon: "fa-calendar",
      label: "Calendar",
      path: "/work-hub/calendar",
    },
    {
      id: "documents",
      icon: "fa-file-alt",
      label: "Documents",
      path: "/work-hub/documents",
    },
    { id: "files", icon: "fa-folder", label: "Files", path: "/work-hub/files" },
  ];

  const channels: Channel[] = [
    { id: "general", name: "general", icon: "#", badge: 3, active: true },
    { id: "development", name: "development", icon: "#" },
    { id: "design", name: "design", icon: "#", badge: 1 },
    { id: "private-team", name: "private-team", icon: "#", isPrivate: true },
  ];

  const settingsItems: NavItem[] = [
    { id: "members", icon: "fa-user-friends", label: "Members" },
    { id: "settings", icon: "fa-cog", label: "Settings" },
  ];

  return (
    <div className="w-[280px] bg-[#1e293b] flex flex-col border-r border-[#475569]">
      {/* Sidebar Header */}
      <div className="p-5 bg-[#0f172a] border-b border-[#475569]">
        <div className="flex items-center justify-between p-3 bg-[#334155] rounded-[10px] cursor-pointer transition-all hover:bg-[#334155]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)] flex items-center justify-center font-bold text-white text-sm">
              OP
            </div>
            <span className="font-semibold text-[15px] text-[#f1f5f9]">
              Orion Project
            </span>
          </div>
          <i className="fas fa-chevron-down text-[#94a3b8] text-sm"></i>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className="flex-1 overflow-y-auto py-5 px-[15px]">
        <div className="mb-6">
          <div className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide px-2.5 mb-2.5">
            Menu
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-1 text-sm ${
                  isActive
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[#94a3b8] hover:bg-[#334155] hover:text-[#f1f5f9]"
                }`}
              >
                <i className={`fas ${item.icon} w-5 text-center`}></i>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-[10px] ${
                      isActive ? "bg-white/20" : "bg-[#0f172a]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mb-6">
          <div className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide px-2.5 mb-2.5">
            Channels
          </div>
          {channels.map((channel) => (
            <div
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all mb-0.5 text-sm ${
                activeChannel === channel.id
                  ? "bg-[#334155] text-[#f1f5f9]"
                  : "text-[#94a3b8] hover:bg-[#334155] hover:text-[#f1f5f9]"
              }`}
            >
              <span className="text-xs">{channel.icon}</span>
              <span className="flex-1">{channel.name}</span>
              {channel.badge && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[10px] bg-[#0f172a]">
                  {channel.badge}
                </span>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 px-3 py-2 text-[#94a3b8] cursor-pointer text-[13px] transition-all hover:text-[var(--color-primary)]">
            <i className="fas fa-plus"></i>
            <span>Add Channel</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide px-2.5 mb-2.5">
            Settings
          </div>
          {settingsItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-1 text-sm text-[#94a3b8] hover:bg-[#334155] hover:text-[#f1f5f9]"
            >
              <i className={`fas ${item.icon} w-5 text-center`}></i>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SideBarWorkHub;
