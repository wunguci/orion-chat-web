import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import {
  mapEpic,
  mapMilestone,
} from "../../../features/work-hub/work-hub.mappers";
import { getUser } from "../../../utils/token";
import type { Epic, Milestone } from "../../../types/work-hub.types";

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  planned: { label: "Planned", bg: "bg-gray-100", text: "text-gray-600" },
  in_progress: {
    label: "In Progress",
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  completed: {
    label: "Completed",
    bg: "bg-green-100",
    text: "text-green-700",
  },
  blocked: { label: "Blocked", bg: "bg-red-100", text: "text-red-700" },
};

const milestoneStatusIcon: Record<string, { icon: string; color: string }> = {
  reached: { icon: "fa-check-circle", color: "text-green-500" },
  upcoming: { icon: "fa-clock", color: "text-blue-500" },
  missed: { icon: "fa-times-circle", color: "text-red-500" },
};

const PRESET_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#f97316",
  "#10b981",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#0d9488",
];

const RoadmapPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const currentUser = getUser();

  const [allEpics, setAllEpics] = useState<Epic[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "planned" | "in_progress" | "completed"
  >("all");

  // Create epic modal
  const [showCreateEpic, setShowCreateEpic] = useState(false);
  const [epicForm, setEpicForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    color: PRESET_COLORS[0],
  });
  const [creatingEpic, setCreatingEpic] = useState(false);

  // Edit epic modal
  const [editingEpicId, setEditingEpicId] = useState<string | null>(null);
  const [editEpicForm, setEditEpicForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    color: "",
  });
  const [savingEpic, setSavingEpic] = useState(false);

  const [deletingEpic, setDeletingEpic] = useState<string | null>(null);

  // Create milestone modal
  const [showCreateMs, setShowCreateMs] = useState(false);
  const [msForm, setMsForm] = useState({ title: "", date: "" });
  const [creatingMs, setCreatingMs] = useState(false);

  // Edit milestone modal
  const [editingMsId, setEditingMsId] = useState<string | null>(null);
  const [editMsForm, setEditMsForm] = useState({ title: "", date: "" });
  const [savingMs, setSavingMs] = useState(false);

  const [deletingMs, setDeletingMs] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const [epicsData, msData] = await Promise.all([
        workHubApi.getEpics(workspaceId),
        workHubApi.getMilestones(workspaceId),
      ]);
      setAllEpics(epicsData.map(mapEpic));
      setMilestones(msData.map(mapMilestone));
    } catch {
      setAllEpics([]);
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const epics =
    filter === "all" ? allEpics : allEpics.filter((e) => e.status === filter);

  // Epic CRUD
  const handleCreateEpic = async () => {
    if (!workspaceId || !epicForm.title.trim() || !currentUser) return;
    try {
      setCreatingEpic(true);
      const data = await workHubApi.createEpic(workspaceId, {
        title: epicForm.title.trim(),
        description: epicForm.description.trim() || undefined,
        ownerId: currentUser.userId,
        startDate: epicForm.startDate || undefined,
        endDate: epicForm.endDate || undefined,
        color: epicForm.color,
      });
      setAllEpics((prev) => [...prev, mapEpic(data)]);
      setShowCreateEpic(false);
      setEpicForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        color: PRESET_COLORS[0],
      });
    } catch (err) {
      console.error("Failed to create epic:", err);
    } finally {
      setCreatingEpic(false);
    }
  };

  const startEditEpic = (epic: Epic) => {
    setEditingEpicId(epic.id);
    setEditEpicForm({
      title: epic.title,
      description: epic.description,
      startDate: epic.startDate,
      endDate: epic.endDate,
      color: epic.color,
    });
  };

  const handleUpdateEpic = async () => {
    if (!editingEpicId) return;
    try {
      setSavingEpic(true);
      await workHubApi.updateEpic(editingEpicId, {
        title: editEpicForm.title.trim(),
        description: editEpicForm.description.trim() || undefined,
        startDate: editEpicForm.startDate || undefined,
        endDate: editEpicForm.endDate || undefined,
        color: editEpicForm.color,
      });
      setAllEpics((prev) =>
        prev.map((e) =>
          e.id === editingEpicId
            ? {
                ...e,
                title: editEpicForm.title.trim(),
                description: editEpicForm.description.trim(),
                startDate: editEpicForm.startDate,
                endDate: editEpicForm.endDate,
                color: editEpicForm.color,
              }
            : e,
        ),
      );
      setEditingEpicId(null);
    } catch (err) {
      console.error("Failed to update epic:", err);
    } finally {
      setSavingEpic(false);
    }
  };

  const handleDeleteEpic = async (id: string) => {
    if (!confirm("Are you sure you want to delete this epic?")) return;
    try {
      setDeletingEpic(id);
      await workHubApi.deleteEpic(id);
      setAllEpics((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Failed to delete epic:", err);
    } finally {
      setDeletingEpic(null);
    }
  };

  // Milestone CRUD
  const handleCreateMs = async () => {
    if (!workspaceId || !msForm.title.trim() || !msForm.date) return;
    try {
      setCreatingMs(true);
      const data = await workHubApi.createMilestone(workspaceId, {
        title: msForm.title.trim(),
        date: msForm.date,
      });
      setMilestones((prev) => [...prev, mapMilestone(data)]);
      setShowCreateMs(false);
      setMsForm({ title: "", date: "" });
    } catch (err) {
      console.error("Failed to create milestone:", err);
    } finally {
      setCreatingMs(false);
    }
  };

  const startEditMs = (ms: Milestone) => {
    setEditingMsId(ms.id);
    setEditMsForm({ title: ms.title, date: ms.date });
  };

  const handleUpdateMs = async () => {
    if (!editingMsId) return;
    try {
      setSavingMs(true);
      await workHubApi.updateMilestone(editingMsId, {
        title: editMsForm.title.trim(),
        date: editMsForm.date,
      });
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === editingMsId
            ? { ...m, title: editMsForm.title.trim(), date: editMsForm.date }
            : m,
        ),
      );
      setEditingMsId(null);
    } catch (err) {
      console.error("Failed to update milestone:", err);
    } finally {
      setSavingMs(false);
    }
  };

  const handleDeleteMs = async (id: string) => {
    if (!confirm("Are you sure you want to delete this milestone?")) return;
    try {
      setDeletingMs(id);
      await workHubApi.deleteMilestone(id);
      setMilestones((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Failed to delete milestone:", err);
    } finally {
      setDeletingMs(null);
    }
  };

  // Calculate timeline range
  const { timelineStart, timelineEnd, months } = useMemo(() => {
    const allDatesArr = [
      ...allEpics.flatMap((e) => {
        const dates: Date[] = [];
        if (e.startDate) dates.push(new Date(e.startDate));
        if (e.endDate) dates.push(new Date(e.endDate));
        return dates;
      }),
      ...milestones.filter((m) => m.date).map((m) => new Date(m.date)),
    ];

    if (allDatesArr.length === 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
      return {
        timelineStart: start,
        timelineEnd: end,
        months: [
          {
            label: start.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
            start,
            end,
          },
        ],
      };
    }

    const minDate = new Date(Math.min(...allDatesArr.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDatesArr.map((d) => d.getTime())));
    minDate.setDate(1);
    maxDate.setMonth(maxDate.getMonth() + 1, 0);

    const months: { label: string; start: Date; end: Date }[] = [];
    const cursor = new Date(minDate);
    while (cursor <= maxDate) {
      const mStart = new Date(cursor);
      const mEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      months.push({
        label: mStart.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        start: mStart,
        end: mEnd,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return { timelineStart: minDate, timelineEnd: maxDate, months };
  }, [allEpics, milestones]);

  const totalDays =
    (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);

  const getPosition = (dateStr: string) => {
    const d = new Date(dateStr);
    const daysDiff =
      (d.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.min(100, (daysDiff / totalDays) * 100));
  };

  const today = new Date();
  const todayPos = getPosition(today.toISOString());

  // Loading state
  if (loading) {
    return (
      <div className="p-6 overflow-auto h-full">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Workspace Roadmap</h1>
          <p className="text-sm text-gray-500 mt-1">
            High-level view of epics, milestones, and quarterly progress across
            all boards.
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <i className="fas fa-spinner fa-spin text-2xl text-[var(--wh-green-primary)]" />
            <span className="text-sm text-gray-500">Loading roadmap...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Workspace Roadmap</h1>
          <p className="text-sm text-gray-500 mt-1">
            High-level view of epics, milestones, and quarterly progress across
            all boards.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateMs(true)}
            className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <i className="fas fa-flag mr-1.5" />
            New Milestone
          </button>
          <button
            onClick={() => setShowCreateEpic(true)}
            className="px-3 py-2 rounded-lg bg-[var(--wh-green-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <i className="fas fa-plus mr-1.5" />
            New Epic
          </button>
        </div>
      </div>

      {/* Create Epic Modal */}
      {showCreateEpic && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Create Epic
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={epicForm.title}
                  onChange={(e) =>
                    setEpicForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
                  placeholder="Epic title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={epicForm.description}
                  onChange={(e) =>
                    setEpicForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)] resize-none"
                  rows={2}
                  placeholder="Description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={epicForm.startDate}
                    onChange={(e) =>
                      setEpicForm((f) => ({
                        ...f,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={epicForm.endDate}
                    onChange={(e) =>
                      setEpicForm((f) => ({
                        ...f,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEpicForm((f) => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full transition-all ${
                        epicForm.color === c
                          ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setShowCreateEpic(false);
                  setEpicForm({
                    title: "",
                    description: "",
                    startDate: "",
                    endDate: "",
                    color: PRESET_COLORS[0],
                  });
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEpic}
                disabled={creatingEpic || !epicForm.title.trim()}
                className="px-4 py-2 text-sm bg-[var(--wh-green-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creatingEpic ? (
                  <i className="fas fa-spinner fa-spin mr-1.5" />
                ) : null}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Epic Modal */}
      {editingEpicId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Epic</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={editEpicForm.title}
                  onChange={(e) =>
                    setEditEpicForm((f) => ({
                      ...f,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editEpicForm.description}
                  onChange={(e) =>
                    setEditEpicForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)] resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editEpicForm.startDate}
                    onChange={(e) =>
                      setEditEpicForm((f) => ({
                        ...f,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editEpicForm.endDate}
                    onChange={(e) =>
                      setEditEpicForm((f) => ({
                        ...f,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() =>
                        setEditEpicForm((f) => ({ ...f, color: c }))
                      }
                      className={`w-7 h-7 rounded-full transition-all ${
                        editEpicForm.color === c
                          ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setEditingEpicId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEpic}
                disabled={savingEpic || !editEpicForm.title.trim()}
                className="px-4 py-2 text-sm bg-[var(--wh-green-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savingEpic ? (
                  <i className="fas fa-spinner fa-spin mr-1.5" />
                ) : null}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Milestone Modal */}
      {showCreateMs && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Create Milestone
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={msForm.title}
                  onChange={(e) =>
                    setMsForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
                  placeholder="Milestone title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={msForm.date}
                  onChange={(e) =>
                    setMsForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setShowCreateMs(false);
                  setMsForm({ title: "", date: "" });
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMs}
                disabled={creatingMs || !msForm.title.trim() || !msForm.date}
                className="px-4 py-2 text-sm bg-[var(--wh-green-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creatingMs ? (
                  <i className="fas fa-spinner fa-spin mr-1.5" />
                ) : null}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Milestone Modal */}
      {editingMsId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Edit Milestone
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={editMsForm.title}
                  onChange={(e) =>
                    setEditMsForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={editMsForm.date}
                  onChange={(e) =>
                    setEditMsForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setEditingMsId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMs}
                disabled={
                  savingMs || !editMsForm.title.trim() || !editMsForm.date
                }
                className="px-4 py-2 text-sm bg-[var(--wh-green-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savingMs ? (
                  <i className="fas fa-spinner fa-spin mr-1.5" />
                ) : null}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            <i className="fas fa-flag mr-2 text-[var(--wh-green-primary)]" />
            Milestones
          </h2>
        </div>
        {milestones.length === 0 ? (
          <div className="text-sm text-gray-400 py-2">No milestones yet.</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {milestones.map((ms) => {
              const cfg =
                milestoneStatusIcon[ms.status] ?? milestoneStatusIcon.upcoming;
              return (
                <div
                  key={ms.id}
                  className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 group"
                >
                  <i className={`fas ${cfg.icon} ${cfg.color}`} />
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      {ms.title}
                    </div>
                    <div className="text-xs text-gray-400">{ms.date}</div>
                  </div>
                  <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditMs(ms)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Edit"
                    >
                      <i className="fas fa-pen text-[10px]" />
                    </button>
                    <button
                      onClick={() => handleDeleteMs(ms.id)}
                      disabled={deletingMs === ms.id}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                      title="Delete"
                    >
                      {deletingMs === ms.id ? (
                        <i className="fas fa-spinner fa-spin text-[10px]" />
                      ) : (
                        <i className="fas fa-trash text-[10px]" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {(["all", "planned", "in_progress", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-[var(--wh-green-primary)] text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f === "all" ? "All" : statusConfig[f].label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {epics.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] flex flex-col items-center justify-center py-16">
          <i className="fas fa-road text-3xl text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">
            {filter === "all"
              ? "No epics yet. Create one to get started."
              : "No epics match this filter."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] overflow-hidden">
          {/* Month Headers */}
          <div className="flex border-b border-gray-100 relative">
            {months.map((m, i) => {
              const w =
                ((m.end.getTime() - m.start.getTime()) /
                  (timelineEnd.getTime() - timelineStart.getTime())) *
                100;
              return (
                <div
                  key={i}
                  className="text-xs font-semibold text-gray-500 py-3 text-center border-r border-gray-50 last:border-r-0"
                  style={{ width: `${w}%`, minWidth: 60 }}
                >
                  {m.label}
                </div>
              );
            })}
            {/* Today line in header */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
              style={{ left: `${todayPos}%` }}
            >
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 bg-red-400 text-white text-[9px] px-1 rounded-b font-medium">
                Today
              </div>
            </div>
          </div>

          {/* Epic Rows */}
          <div className="relative">
            {/* Today line */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-400/30 z-10"
              style={{ left: `${todayPos}%` }}
            />

            {epics.map((epic) => {
              if (!epic.startDate || !epic.endDate) return null;
              const left = getPosition(epic.startDate);
              const right = getPosition(epic.endDate);
              const width = right - left;
              const cfg = statusConfig[epic.status] ?? statusConfig.planned;
              return (
                <div
                  key={epic.id}
                  className="flex items-center border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors group"
                  style={{ minHeight: 64 }}
                >
                  {/* Epic bar */}
                  <div className="relative w-full px-2 py-3">
                    <div
                      className="relative rounded-lg h-10 flex items-center px-3 text-white text-sm font-medium overflow-hidden cursor-default"
                      style={{
                        marginLeft: `${left}%`,
                        width: `${Math.max(width, 5)}%`,
                        backgroundColor: epic.color,
                      }}
                      title={`${epic.title} (${epic.progress}%)`}
                    >
                      {/* Progress fill */}
                      <div
                        className="absolute inset-0 bg-black/10"
                        style={{ width: `${epic.progress}%` }}
                      />
                      <span className="relative truncate text-xs">
                        {epic.title}
                      </span>
                      <span className="relative ml-auto text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full whitespace-nowrap ml-2">
                        {epic.progress}%
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 mt-1"
                      style={{ marginLeft: `${left}%` }}
                    >
                      <img
                        src={epic.owner.avatar}
                        alt=""
                        className="w-4 h-4 rounded-full"
                      />
                      <span className="text-[10px] text-gray-400">
                        {epic.owner.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}
                      >
                        {cfg.label}
                      </span>
                      {epic.boardName && (
                        <span className="text-[10px] text-gray-400">
                          {epic.boardName}
                        </span>
                      )}
                      {/* Edit/Delete actions */}
                      <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditEpic(epic)}
                          className="p-0.5 text-gray-400 hover:text-gray-600 rounded"
                          title="Edit epic"
                        >
                          <i className="fas fa-pen text-[9px]" />
                        </button>
                        <button
                          onClick={() => handleDeleteEpic(epic.id)}
                          disabled={deletingEpic === epic.id}
                          className="p-0.5 text-gray-400 hover:text-red-500 rounded"
                          title="Delete epic"
                        >
                          {deletingEpic === epic.id ? (
                            <i className="fas fa-spinner fa-spin text-[9px]" />
                          ) : (
                            <i className="fas fa-trash text-[9px]" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapPage;
