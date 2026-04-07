import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import { mapActivityEntry } from "../../../features/work-hub/work-hub.mappers";
import type { ActivityEntry, User } from "../../../types/work-hub.types";
import type { ActivityLogResponse } from "../../../features/work-hub/work-hub.api.types";

interface FeedItem {
  id: string;
  type: string;
  user: User;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  target?: string;
  boardName?: string;
}

type FilterType = "all" | "task" | "comment" | "member" | "file" | "other";

const typeConfig: Record<string, { icon: string; color: string; bg: string }> =
  {
    task_created: {
      icon: "fa-plus-circle",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    task_completed: {
      icon: "fa-check-circle",
      color: "text-green-600",
      bg: "bg-green-100",
    },
    task_moved: {
      icon: "fa-arrow-right",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    comment_added: {
      icon: "fa-comment",
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    member_joined: {
      icon: "fa-user-plus",
      color: "text-teal-600",
      bg: "bg-teal-100",
    },
    board_created: {
      icon: "fa-columns",
      color: "text-indigo-600",
      bg: "bg-indigo-100",
    },
    file_uploaded: {
      icon: "fa-file-upload",
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    document_edited: {
      icon: "fa-file-alt",
      color: "text-pink-600",
      bg: "bg-pink-100",
    },
    label_added: { icon: "fa-tag", color: "text-cyan-600", bg: "bg-cyan-100" },
    sprint_started: {
      icon: "fa-running",
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    deadline_changed: {
      icon: "fa-calendar-alt",
      color: "text-red-600",
      bg: "bg-red-100",
    },
  };

const filterConfig: { id: FilterType; label: string }[] = [
  { id: "all", label: "All Activity" },
  { id: "task", label: "Tasks" },
  { id: "comment", label: "Comments" },
  { id: "member", label: "Members" },
  { id: "file", label: "Files & Docs" },
  { id: "other", label: "Other" },
];

const filterMap: Record<FilterType, string[]> = {
  all: [],
  task: [
    "task_created",
    "task_completed",
    "task_moved",
    "deadline_changed",
    "label_added",
  ],
  comment: ["comment_added"],
  member: ["member_joined"],
  file: ["file_uploaded", "document_edited"],
  other: ["board_created", "sprint_started"],
};

function mapToFeedItem(al: ActivityLogResponse): FeedItem {
  const entry: ActivityEntry = mapActivityEntry(al);
  return {
    id: entry.id,
    type: al.action,
    user: entry.user,
    description: entry.description,
    timestamp: entry.timestamp,
    metadata: entry.metadata,
    target: al.task?.title || (al.metadata?.target as string) || undefined,
    boardName: (al.metadata?.boardName as string) || undefined,
  };
}

const ActivityFeedPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [activities, setActivities] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  const fetchActivities = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const data = await workHubApi.getWorkspaceActivities(workspaceId);
      setActivities(data.map(mapToFeedItem));
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const filteredActivities =
    filter === "all"
      ? activities
      : activities.filter((a) => filterMap[filter].includes(a.type));

  // Group by date
  const groupedByDate = filteredActivities.reduce<Record<string, FeedItem[]>>(
    (acc, item) => {
      const date = new Date(item.timestamp).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    },
    {},
  );

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const todayCount = activities.filter((a) => {
    const d = new Date(a.timestamp);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <i className="fas fa-spinner fa-spin text-wh-green-primary text-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Activity Feed</h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-time activity stream across your entire workspace.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-wh-green-border-light p-4">
          <div className="text-sm text-gray-500">Today's Activity</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">
            {todayCount}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-wh-green-border-light p-4">
          <div className="text-sm text-gray-500">Total Events</div>
          <div className="text-2xl font-bold text-wh-green-primary mt-1">
            {activities.length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-wh-green-border-light p-4">
          <div className="text-sm text-gray-500">Active Members</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">
            {new Set(activities.map((a) => a.user.id)).size}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {filterConfig.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.id
                ? "bg-wh-green-primary text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedByDate).map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-semibold text-gray-500">{date}</h3>
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">
                {items.length} events
              </span>
            </div>

            <div className="space-y-1">
              {items.map((item) => {
                const cfg = typeConfig[item.type] || {
                  icon: "fa-circle",
                  color: "text-gray-500",
                  bg: "bg-gray-100",
                };
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 bg-white rounded-xl border border-wh-green-border-light p-4 hover:shadow-sm transition-shadow"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
                    >
                      <i className={`fas ${cfg.icon} text-xs ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <img
                          src={item.user.avatar}
                          alt=""
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="text-sm font-medium text-gray-800">
                          {item.user.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.description}
                        </span>
                        {item.target && (
                          <span className="text-sm font-medium text-wh-green-primary cursor-pointer hover:underline">
                            {item.target}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {formatTime(item.timestamp)}
                        </span>
                        {item.boardName && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {item.boardName}
                          </span>
                        )}
                        {/* TODO: Fix */}
                        {/* {item.metadata?.from && item.metadata?.to && (
                          <span className="text-xs text-gray-400">
                            {item.metadata.from as string} →{" "}
                            {item.metadata.to as string}
                          </span>
                        )} */}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <i className="fas fa-stream text-3xl mb-3 block" />
          {activities.length === 0
            ? "No activity yet. Actions in this workspace will appear here."
            : "No activity found for this filter."}
        </div>
      )}
    </div>
  );
};

export default ActivityFeedPage;
