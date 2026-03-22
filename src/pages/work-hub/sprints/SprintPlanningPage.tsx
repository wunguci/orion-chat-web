import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import {
  mapSprint,
  mapTask,
} from "../../../features/work-hub/work-hub.mappers";
import type { Sprint, Task } from "../../../types/work-hub.types";

const statusColors: Record<string, string> = {
  todo: "bg-gray-100 text-gray-600",
  inprogress: "bg-blue-100 text-blue-700",
  review: "bg-yellow-100 text-yellow-700",
  done: "bg-green-100 text-green-700",
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  inprogress: "In Progress",
  review: "Review",
  done: "Done",
};

const priorityIcons: Record<string, { icon: string; color: string }> = {
  critical: { icon: "fa-exclamation-circle", color: "text-red-500" },
  high: { icon: "fa-arrow-up", color: "text-orange-500" },
  medium: { icon: "fa-minus", color: "text-yellow-500" },
  low: { icon: "fa-arrow-down", color: "text-blue-400" },
};

const sprintStatusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  planning: { label: "Planning", color: "text-blue-700", bg: "bg-blue-100" },
  active: { label: "Active", color: "text-green-700", bg: "bg-green-100" },
  completed: { label: "Completed", color: "text-gray-600", bg: "bg-gray-100" },
  cancelled: { label: "Cancelled", color: "text-red-700", bg: "bg-red-100" },
};

const SprintPlanningPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>("");
  const [sprintTasks, setSprintTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Create sprint modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });
  const [creating, setCreating] = useState(false);

  // Edit sprint modal state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSprints = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const data = await workHubApi.getSprints(workspaceId);
      const mapped = data.map(mapSprint);
      setSprints(mapped);
      if (mapped.length > 0) {
        const active = mapped.find((s) => s.status === "active");
        setSelectedSprint(active?.id || mapped[0].id);
      }
    } catch {
      setSprints([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const fetchSprintTasks = useCallback(async (sprintId: string) => {
    if (!sprintId) return;
    try {
      setTasksLoading(true);
      const data = await workHubApi.getSprintTasks(sprintId);
      setSprintTasks(data.map(mapTask));
    } catch {
      setSprintTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSprints();
  }, [fetchSprints]);

  useEffect(() => {
    if (selectedSprint) {
      fetchSprintTasks(selectedSprint);
    }
  }, [selectedSprint, fetchSprintTasks]);

  const handleCreate = async () => {
    if (!workspaceId || !createForm.name.trim()) return;
    try {
      setCreating(true);
      const data = await workHubApi.createSprint(workspaceId, {
        name: createForm.name.trim(),
        goal: createForm.goal.trim() || undefined,
        startDate: createForm.startDate || undefined,
        endDate: createForm.endDate || undefined,
      });
      const newSprint = mapSprint(data);
      setSprints((prev) => [...prev, newSprint]);
      setSelectedSprint(newSprint.id);
      setShowCreate(false);
      setCreateForm({ name: "", goal: "", startDate: "", endDate: "" });
    } catch (err) {
      console.error("Failed to create sprint:", err);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (sprint: Sprint) => {
    setEditingId(sprint.id);
    setEditForm({
      name: sprint.name,
      goal: sprint.goal,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      setSaving(true);
      await workHubApi.updateSprint(editingId, {
        name: editForm.name.trim(),
        goal: editForm.goal.trim() || undefined,
        startDate: editForm.startDate || undefined,
        endDate: editForm.endDate || undefined,
      });
      setSprints((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? {
                ...s,
                name: editForm.name.trim(),
                goal: editForm.goal.trim(),
                startDate: editForm.startDate,
                endDate: editForm.endDate,
              }
            : s,
        ),
      );
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update sprint:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sprint?")) return;
    try {
      setDeleting(id);
      await workHubApi.deleteSprint(id);
      setSprints((prev) => prev.filter((s) => s.id !== id));
      if (selectedSprint === id) {
        const remaining = sprints.filter((s) => s.id !== id);
        setSelectedSprint(remaining[0]?.id || "");
      }
    } catch (err) {
      console.error("Failed to delete sprint:", err);
    } finally {
      setDeleting(null);
    }
  };

  const sprint = sprints.find((s) => s.id === selectedSprint);

  const tasksByStatus = (status: string): Task[] =>
    sprintTasks.filter((t) => t.status === status);

  if (loading) {
    return (
      <div className="p-6 overflow-auto h-full">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Sprints</h1>
          <p className="text-sm text-gray-500 mt-1">
            Plan and track iteration progress with your team.
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <i className="fas fa-spinner fa-spin text-2xl text-wh-green-primary" />
            <span className="text-sm text-gray-500">Loading sprints...</span>
          </div>
        </div>
      </div>
    );
  }

  if (sprints.length === 0 && !showCreate) {
    return (
      <div className="p-6 overflow-auto h-full">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Sprints</h1>
          <p className="text-sm text-gray-500 mt-1">
            Plan and track iteration progress with your team.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <i className="fas fa-running text-4xl text-gray-300" />
          <p className="text-gray-500">No sprints yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg bg-wh-green-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <i className="fas fa-plus mr-2" />
            Create Sprint
          </button>
        </div>
      </div>
    );
  }

  const totalTasks = sprintTasks.length;
  const doneTasks = sprintTasks.filter((t) => t.status === "done").length;
  const progress =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const startDate = sprint ? new Date(sprint.startDate) : new Date();
  const endDate = sprint ? new Date(sprint.endDate) : new Date();
  const today = new Date();
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysLeft = Math.max(
    0,
    Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Sprints</h1>
          <p className="text-sm text-gray-500 mt-1">
            Plan and track iteration progress with your team.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-2 rounded-lg bg-wh-green-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <i className="fas fa-plus mr-1.5" />
          New Sprint
        </button>
      </div>

      {/* Create Sprint Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Create Sprint
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-wh-green-primary"
                  placeholder="e.g. Sprint 6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal
                </label>
                <textarea
                  value={createForm.goal}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, goal: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-wh-green-primary resize-none"
                  rows={2}
                  placeholder="Sprint goal description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-wh-green-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-wh-green-primary"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setCreateForm({
                    name: "",
                    goal: "",
                    startDate: "",
                    endDate: "",
                  });
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !createForm.name.trim()}
                className="px-4 py-2 text-sm bg-wh-green-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creating ? (
                  <i className="fas fa-spinner fa-spin mr-1.5" />
                ) : null}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sprint Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Edit Sprint
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-wh-green-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal
                </label>
                <textarea
                  value={editForm.goal}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, goal: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-wh-green-primary resize-none"
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
                    value={editForm.startDate}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-wh-green-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-wh-green-primary"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving || !editForm.name.trim()}
                className="px-4 py-2 text-sm bg-wh-green-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? (
                  <i className="fas fa-spinner fa-spin mr-1.5" />
                ) : null}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sprint Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {sprints.map((s) => {
          const cfg =
            sprintStatusConfig[s.status] ?? sprintStatusConfig.planning;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedSprint(s.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedSprint === s.id
                  ? "bg-wh-green-primary text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s.name}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedSprint === s.id ? "bg-white/20" : `${cfg.bg} ${cfg.color}`}`}
              >
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      {sprint && (
        <>
          {/* Sprint Info */}
          <div className="bg-white rounded-xl border border-wh-green-border-light p-5 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {sprint.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{sprint.goal}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${(sprintStatusConfig[sprint.status] ?? sprintStatusConfig.planning).bg} ${(sprintStatusConfig[sprint.status] ?? sprintStatusConfig.planning).color}`}
                >
                  {
                    (
                      sprintStatusConfig[sprint.status] ??
                      sprintStatusConfig.planning
                    ).label
                  }
                </span>
                <button
                  onClick={() => startEdit(sprint)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit sprint"
                >
                  <i className="fas fa-pen text-xs" />
                </button>
                <button
                  onClick={() => handleDelete(sprint.id)}
                  disabled={deleting === sprint.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete sprint"
                >
                  {deleting === sprint.id ? (
                    <i className="fas fa-spinner fa-spin text-xs" />
                  ) : (
                    <i className="fas fa-trash text-xs" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Duration</div>
                <div className="text-sm font-semibold text-gray-700">
                  {sprint.startDate && sprint.endDate
                    ? `${totalDays} days`
                    : "--"}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Days Left</div>
                <div
                  className={`text-sm font-semibold ${daysLeft <= 3 ? "text-red-500" : "text-gray-700"}`}
                >
                  {sprint.status === "completed"
                    ? "Done"
                    : sprint.startDate && sprint.endDate
                      ? `${daysLeft} days`
                      : "--"}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Progress</div>
                <div className="text-sm font-semibold text-gray-700">
                  {progress}%
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Tasks</div>
                <div className="text-sm font-semibold text-gray-700">
                  {doneTasks} / {totalTasks}
                </div>
              </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-wh-green-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-gray-400">
              <span>{sprint.startDate || "--"}</span>
              <span>{progress}% complete</span>
              <span>{sprint.endDate || "--"}</span>
            </div>
          </div>

          {/* Kanban-style columns */}
          {tasksLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <i className="fas fa-spinner fa-spin text-xl text-wh-green-primary" />
                <span className="text-sm text-gray-500">Loading tasks...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(["todo", "inprogress", "review", "done"] as const).map(
                (status) => {
                  const tasks = tasksByStatus(status);
                  return (
                    <div key={status} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status]}`}
                          >
                            {statusLabels[status]}
                          </span>
                          <span className="text-xs text-gray-400">
                            {tasks.length}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {tasks.map((task) => {
                          const pri =
                            priorityIcons[task.priority] ?? priorityIcons.low;
                          const assignee =
                            task.assignees && task.assignees.length > 0
                              ? task.assignees[0]
                              : null;
                          return (
                            <div
                              key={task.id}
                              className="bg-white rounded-lg border border-gray-100 p-3 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-sm font-medium text-gray-800 flex-1">
                                  {task.title}
                                </span>
                                <i
                                  className={`fas ${pri.icon} text-xs ${pri.color} ml-2 mt-0.5`}
                                  title={task.priority}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {assignee && (
                                    <img
                                      src={assignee.avatar}
                                      alt=""
                                      className="w-5 h-5 rounded-full"
                                      title={assignee.name}
                                    />
                                  )}
                                </div>
                                {task.labels && task.labels.length > 0 && (
                                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {task.labels[0].text}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {tasks.length === 0 && (
                          <div className="text-center text-xs text-gray-400 py-6">
                            No tasks
                          </div>
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SprintPlanningPage;

