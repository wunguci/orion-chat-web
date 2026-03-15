import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Workspace } from "../../types/work-hub.types";
import { workHubApi } from "../../features/work-hub/work-hub.api";
import { mapWorkspace } from "../../features/work-hub/work-hub.mappers";

interface SideBarWorkHubProps {
  workspaceId: string;
}

const SideBarWorkHub = ({ workspaceId }: SideBarWorkHubProps) => {
  const location = useLocation();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  // Fetch workspace từ API
  useEffect(() => {
    if (!workspaceId) return;
    workHubApi
      .getWorkspace(workspaceId)
      .then((data) => setWorkspace(mapWorkspace(data)))
      .catch(() => setWorkspace(null));
  }, [workspaceId]);

  const navItems = [
    {
      id: "dashboard",
      icon: "fa-th-large",
      label: "Dashboard",
      path: `/work-hub/${workspaceId}`,
    },
    {
      id: "insights",
      icon: "fa-chart-line",
      label: "AI Insights",
      path: `/work-hub/${workspaceId}/insights`,
    },
    {
      id: "members",
      icon: "fa-users",
      label: "Members",
      path: `/work-hub/${workspaceId}/members`,
      badge: workspace?.members.length,
    },
    {
      id: "settings",
      icon: "fa-cog",
      label: "Settings",
      path: `/work-hub/${workspaceId}/settings`,
    },
  ];

  const boards = workspace?.boards || [];

  // Channels và DM threads chưa có API, tạm để rỗng
  const channels: {
    id: string;
    name: string;
    type: string;
    unreadCount: number;
  }[] = [];
  const totalChannelUnread = 0;
  const dmThreads: {
    id: string;
    unreadCount: number;
    participants: {
      id: string;
      name: string;
      avatar: string;
      status: string;
    }[];
  }[] = [];
  const totalDmUnread = 0;
  const currentUserId = "u1";

  const isActive = (path: string) => {
    if (path === `/work-hub/${workspaceId}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const isBoardActive = (boardId: string) =>
    location.pathname.includes(`/boards/${boardId}`);

  return (
    <div
      className="flex flex-col border-r border-[var(--wh-green-border-light)] bg-white"
      style={{ width: "var(--wh-sidebar-width)" }}
    >
      {/* Workspace Header */}
      <div className="p-4 border-b border-[var(--wh-green-border-light)]">
        <div className="flex items-center gap-3 p-3 bg-[var(--wh-green-bg-light)] rounded-xl cursor-pointer hover:bg-[var(--wh-green-bg-heavy)] transition-colors">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm"
            style={{
              backgroundColor: workspace?.color || "var(--wh-green-primary)",
            }}
          >
            {workspace?.name?.substring(0, 2).toUpperCase() || "WS"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">
              {workspace?.name || "Workspace"}
            </div>
            <div className="text-[11px] text-[var(--wh-green-text-muted)]">
              {workspace?.members.length || 0} members
            </div>
          </div>
          <i className="fas fa-chevron-down text-[var(--wh-green-text-muted)] text-xs"></i>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {/* Menu Section */}
        <div className="mb-5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Menu
          </div>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-0.5 text-sm ${
                  active
                    ? "bg-[var(--wh-green-primary)] text-white"
                    : "text-gray-600 hover:bg-[var(--wh-green-bg-heavy)] hover:text-[var(--wh-green-text-primary)]"
                }`}
              >
                <i className={`fas ${item.icon} w-5 text-center text-sm`}></i>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      active
                        ? "bg-white/20"
                        : "bg-[var(--wh-green-bg-heavy)] text-[var(--wh-green-text-primary)]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Boards Section */}
        <div className="mb-5">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Boards
            </span>
            <Link
              to={`/work-hub/${workspaceId}`}
              className="text-[var(--wh-green-text-muted)] hover:text-[var(--wh-green-primary)] transition-colors"
              title="Add Board"
            >
              <i className="fas fa-plus text-xs"></i>
            </Link>
          </div>
          {boards.map((board) => {
            const active = isBoardActive(board.id);
            return (
              <Link
                key={board.id}
                to={`/work-hub/${workspaceId}/boards/${board.id}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all mb-0.5 text-sm ${
                  active
                    ? "bg-[var(--wh-green-bg-heavy)] text-[var(--wh-green-text-primary)] font-medium"
                    : "text-gray-600 hover:bg-[var(--wh-green-bg-light)]"
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: board.color }}
                />
                <i
                  className={`fas ${board.icon} text-xs w-4 text-center`}
                  style={{ color: board.color }}
                ></i>
                <span className="flex-1 truncate">{board.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Documents & Files Section */}
        <div className="mb-5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Workspace
          </div>
          {[
            {
              id: "documents",
              icon: "fa-file-alt",
              label: "Documents",
              path: `/work-hub/${workspaceId}/documents`,
            },
            {
              id: "files",
              icon: "fa-folder",
              label: "Files",
              path: `/work-hub/${workspaceId}/files`,
            },
          ].map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-0.5 text-sm ${
                  active
                    ? "bg-[var(--wh-green-primary)] text-white"
                    : "text-gray-600 hover:bg-[var(--wh-green-bg-heavy)] hover:text-[var(--wh-green-text-primary)]"
                }`}
              >
                <i className={`fas ${item.icon} w-5 text-center text-sm`}></i>
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Channels Section */}
        <div className="mb-5 hidden">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Channels
            </span>
            <Link
              to={`/work-hub/${workspaceId}/channels`}
              className="text-[var(--wh-green-text-muted)] hover:text-[var(--wh-green-primary)] transition-colors"
              title="Browse Channels"
            >
              <i className="fas fa-plus text-xs"></i>
            </Link>
          </div>
          {channels.slice(0, 5).map((channel) => {
            const channelPath = `/work-hub/${workspaceId}/channels`;
            const active =
              isActive(channelPath) && location.search.includes(channel.id);
            return (
              <Link
                key={channel.id}
                to={`/work-hub/${workspaceId}/channels`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all mb-0.5 text-sm ${
                  active
                    ? "bg-[var(--wh-green-bg-heavy)] text-[var(--wh-green-text-primary)] font-medium"
                    : "text-gray-600 hover:bg-[var(--wh-green-bg-light)]"
                }`}
              >
                <span className="w-5 text-center text-gray-400 text-xs">
                  {channel.type === "private" ? (
                    <i className="fas fa-lock"></i>
                  ) : (
                    <span className="font-bold text-sm">#</span>
                  )}
                </span>
                <span className="flex-1 truncate">{channel.name}</span>
                {channel.unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {channel.unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
          {channels.length > 5 && (
            <Link
              to={`/work-hub/${workspaceId}/channels`}
              className="flex items-center gap-3 px-3 py-1.5 text-xs text-[var(--wh-green-text-muted)] hover:text-[var(--wh-green-primary)] transition-colors"
            >
              <span className="w-5"></span>
              <span>View all channels ({channels.length})</span>
            </Link>
          )}
        </div>

        {/* Direct Messages Section */}
        <div className="mb-5 hidden">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Direct Messages
            </span>
            <Link
              to={`/work-hub/${workspaceId}/messages`}
              className="text-[var(--wh-green-text-muted)] hover:text-[var(--wh-green-primary)] transition-colors"
              title="New Message"
            >
              <i className="fas fa-plus text-xs"></i>
            </Link>
          </div>
          {dmThreads.map((thread) => {
            const otherUser =
              thread.participants.find((p) => p.id !== currentUserId) ||
              thread.participants[0];
            const dmPath = `/work-hub/${workspaceId}/messages`;
            const active =
              isActive(dmPath) && location.search.includes(thread.id);
            return (
              <Link
                key={thread.id}
                to={`/work-hub/${workspaceId}/messages`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all mb-0.5 text-sm ${
                  active
                    ? "bg-[var(--wh-green-bg-heavy)] text-[var(--wh-green-text-primary)] font-medium"
                    : "text-gray-600 hover:bg-[var(--wh-green-bg-light)]"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={otherUser.avatar}
                    alt=""
                    className="w-5 h-5 rounded-full"
                  />
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                      otherUser.status === "online"
                        ? "bg-green-400"
                        : otherUser.status === "away"
                          ? "bg-yellow-400"
                          : "bg-gray-300"
                    }`}
                  ></div>
                </div>
                <span className="flex-1 truncate">{otherUser.name}</span>
                {thread.unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-[var(--wh-green-primary)] text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {thread.unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-[var(--wh-green-border-light)]">
        <Link
          to="/chat"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
        >
          <i className="fas fa-arrow-left w-5 text-center text-sm"></i>
          <span>Back to Chat</span>
        </Link>
      </div>
    </div>
  );
};

export default SideBarWorkHub;
