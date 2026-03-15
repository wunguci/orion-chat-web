import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import {
  mapGoal,
  mapKeyResult,
} from "../../../features/work-hub/work-hub.mappers";
import { getUser } from "../../../utils/token";
import type { Goal, GoalStatus } from "../../../types/work-hub.types";

const statusConfig: Record<
  GoalStatus,
  { label: string; color: string; dot: string }
> = {
  on_track: {
    label: "On Track",
    color: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  at_risk: {
    label: "At Risk",
    color: "bg-yellow-100 text-yellow-700",
    dot: "bg-yellow-500",
  },
  behind: {
    label: "Behind",
    color: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
  completed: {
    label: "Completed",
    color: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
};

const ALL_STATUSES: GoalStatus[] = [
  "on_track",
  "at_risk",
  "behind",
  "completed",
];

const GoalsOKRsPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const user = getUser();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "on_track" | "at_risk" | "behind" | "completed"
  >("all");

  // Create goal form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [creatingGoal, setCreatingGoal] = useState(false);

  // Add key result form state
  const [showKRForm, setShowKRForm] = useState<string | null>(null);
  const [newKRTitle, setNewKRTitle] = useState("");
  const [newKRTarget, setNewKRTarget] = useState("");
  const [newKRUnit, setNewKRUnit] = useState("");
  const [creatingKR, setCreatingKR] = useState(false);

  // Inline edit key result current value
  const [editingKRId, setEditingKRId] = useState<string | null>(null);
  const [editKRValue, setEditKRValue] = useState("");

  const fetchGoals = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const data = await workHubApi.getGoals(workspaceId);
      const mapped = data.map(mapGoal);
      setGoals(mapped);
      if (mapped.length > 0 && !expandedGoal) {
        setExpandedGoal(mapped[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch goals:", err);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // ---- CRUD handlers ----

  const handleCreateGoal = async () => {
    if (!workspaceId || !user?.id || !newGoalTitle.trim()) return;
    try {
      setCreatingGoal(true);
      const created = await workHubApi.createGoal(workspaceId, {
        title: newGoalTitle.trim(),
        description: newGoalDescription.trim() || undefined,
        ownerId: user.id,
      });
      const mapped = mapGoal(created);
      setGoals((prev) => [...prev, mapped]);
      setNewGoalTitle("");
      setNewGoalDescription("");
      setShowCreateForm(false);
      setExpandedGoal(mapped.id);
    } catch (err) {
      console.error("Failed to create goal:", err);
    } finally {
      setCreatingGoal(false);
    }
  };

  const handleUpdateGoalStatus = async (goalId: string, status: string) => {
    try {
      await workHubApi.updateGoal(goalId, { status });
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, status: status as GoalStatus } : g,
        ),
      );
    } catch (err) {
      console.error("Failed to update goal status:", err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) return;
    try {
      await workHubApi.deleteGoal(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      if (expandedGoal === goalId) setExpandedGoal(null);
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const handleAddKeyResult = async (goalId: string) => {
    if (!newKRTitle.trim() || !newKRTarget) return;
    try {
      setCreatingKR(true);
      const created = await workHubApi.createKeyResult(goalId, {
        title: newKRTitle.trim(),
        target: Number(newKRTarget),
        unit: newKRUnit.trim() || undefined,
      });
      const mappedKR = mapKeyResult(created);
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? { ...g, keyResults: [...g.keyResults, mappedKR] }
            : g,
        ),
      );
      setNewKRTitle("");
      setNewKRTarget("");
      setNewKRUnit("");
      setShowKRForm(null);
    } catch (err) {
      console.error("Failed to create key result:", err);
    } finally {
      setCreatingKR(false);
    }
  };

  const handleUpdateKRProgress = async (
    goalId: string,
    krId: string,
    current: number,
  ) => {
    try {
      await workHubApi.updateKeyResult(krId, { current });
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? {
                ...g,
                keyResults: g.keyResults.map((kr) =>
                  kr.id === krId ? { ...kr, current } : kr,
                ),
              }
            : g,
        ),
      );
      setEditingKRId(null);
    } catch (err) {
      console.error("Failed to update key result:", err);
    }
  };

  const handleDeleteKR = async (goalId: string, krId: string) => {
    if (!window.confirm("Delete this key result?")) return;
    try {
      await workHubApi.deleteKeyResult(krId);
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? {
                ...g,
                keyResults: g.keyResults.filter((kr) => kr.id !== krId),
              }
            : g,
        ),
      );
    } catch (err) {
      console.error("Failed to delete key result:", err);
    }
  };

  // ---- Computed ----

  const filteredGoals =
    filter === "all" ? goals : goals.filter((g) => g.status === filter);

  const overallProgress =
    goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
      : 0;

  // ---- Loading state ----

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <i className="fas fa-spinner fa-spin text-[var(--wh-green-primary)] text-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Goals & OKRs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track strategic objectives and key results across your workspace.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--wh-green-primary-hover)] transition-colors"
        >
          <i className="fas fa-plus mr-2" />
          New Goal
        </button>
      </div>

      {/* Create Goal Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Create New Goal
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Title</label>
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="e.g. Increase user retention by 20%"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wh-green-primary)] focus:border-transparent"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Description (optional)
              </label>
              <textarea
                value={newGoalDescription}
                onChange={(e) => setNewGoalDescription(e.target.value)}
                placeholder="Describe the goal..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wh-green-primary)] focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateGoal}
                disabled={!newGoalTitle.trim() || creatingGoal}
                className="px-4 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--wh-green-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingGoal ? (
                  <i className="fas fa-spinner fa-spin mr-2" />
                ) : null}
                Create Goal
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewGoalTitle("");
                  setNewGoalDescription("");
                }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-4">
          <div className="text-sm text-gray-500">Total Goals</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">
            {goals.length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-4">
          <div className="text-sm text-gray-500">Overall Progress</div>
          <div className="text-2xl font-bold text-[var(--wh-green-primary)] mt-1">
            {overallProgress}%
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
            <div
              className="h-2 rounded-full bg-[var(--wh-green-primary)] transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-4">
          <div className="text-sm text-gray-500">On Track</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {goals.filter((g) => g.status === "on_track").length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-4">
          <div className="text-sm text-gray-500">At Risk / Behind</div>
          <div className="text-2xl font-bold text-red-500 mt-1">
            {
              goals.filter(
                (g) => g.status === "at_risk" || g.status === "behind",
              ).length
            }
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {(["all", "on_track", "at_risk", "behind", "completed"] as const).map(
          (f) => (
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
          ),
        )}
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.map((goal) => {
          const expanded = expandedGoal === goal.id;
          const cfg = statusConfig[goal.status];
          return (
            <div
              key={goal.id}
              className="bg-white rounded-xl border border-[var(--wh-green-border-light)] overflow-hidden"
            >
              {/* Goal Header */}
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedGoal(expanded ? null : goal.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <i
                        className={`fas fa-chevron-right text-xs text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}
                      />
                      <h3 className="font-semibold text-gray-800">
                        {goal.title}
                      </h3>
                      {/* Status dropdown */}
                      <select
                        value={goal.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleUpdateGoalStatus(goal.id, e.target.value);
                        }}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--wh-green-primary)] ${cfg.color}`}
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {statusConfig[s].label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-sm text-gray-500 ml-7">
                      {goal.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800">
                        {goal.progress}%
                      </div>
                      <div className="text-xs text-gray-400">progress</div>
                    </div>
                    <img
                      src={goal.owner.avatar}
                      alt=""
                      className="w-8 h-8 rounded-full"
                      title={goal.owner.name}
                    />
                    {/* Delete goal button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGoal(goal.id);
                      }}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      title="Delete goal"
                    >
                      <i className="fas fa-trash text-sm" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 ml-7">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        goal.progress >= 70
                          ? "bg-green-500"
                          : goal.progress >= 40
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-gray-400">
                    <span>{goal.startDate}</span>
                    <span>{goal.endDate}</span>
                  </div>
                </div>
              </div>

              {/* Key Results (expanded) */}
              {expanded && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-600">
                      <i className="fas fa-key mr-2 text-[var(--wh-green-primary)]" />
                      Key Results ({goal.keyResults.length})
                    </h4>
                    <button
                      onClick={() => {
                        setShowKRForm(showKRForm === goal.id ? null : goal.id);
                        setNewKRTitle("");
                        setNewKRTarget("");
                        setNewKRUnit("");
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[var(--wh-green-primary)] text-white hover:bg-[var(--wh-green-primary-hover)] transition-colors"
                    >
                      <i className="fas fa-plus mr-1" />
                      Add Key Result
                    </button>
                  </div>

                  <div className="space-y-3">
                    {goal.keyResults.map((kr) => {
                      const krProgress = Math.min(
                        100,
                        Math.round((kr.current / kr.target) * 100),
                      );
                      const isEditing = editingKRId === kr.id;
                      return (
                        <div
                          key={kr.id}
                          className="bg-white rounded-lg border border-gray-100 p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {kr.title}
                            </span>
                            <div className="flex items-center gap-3">
                              {kr.linkedTaskCount > 0 && (
                                <span className="text-xs text-gray-400">
                                  <i className="fas fa-link mr-1" />
                                  {kr.linkedTaskCount} tasks
                                </span>
                              )}
                              {/* Inline editable current value */}
                              {isEditing ? (
                                <span className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={editKRValue}
                                    onChange={(e) =>
                                      setEditKRValue(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleUpdateKRProgress(
                                          goal.id,
                                          kr.id,
                                          Number(editKRValue),
                                        );
                                      } else if (e.key === "Escape") {
                                        setEditingKRId(null);
                                      }
                                    }}
                                    className="w-16 px-1.5 py-0.5 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--wh-green-primary)]"
                                    autoFocus
                                  />
                                  <span className="text-sm text-gray-500">
                                    / {kr.target} {kr.unit}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleUpdateKRProgress(
                                        goal.id,
                                        kr.id,
                                        Number(editKRValue),
                                      )
                                    }
                                    className="text-green-500 hover:text-green-700 ml-1"
                                    title="Save"
                                  >
                                    <i className="fas fa-check text-xs" />
                                  </button>
                                  <button
                                    onClick={() => setEditingKRId(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                    title="Cancel"
                                  >
                                    <i className="fas fa-times text-xs" />
                                  </button>
                                </span>
                              ) : (
                                <span
                                  className="text-sm font-semibold text-gray-800 cursor-pointer hover:text-[var(--wh-green-primary)] transition-colors"
                                  onClick={() => {
                                    setEditingKRId(kr.id);
                                    setEditKRValue(String(kr.current));
                                  }}
                                  title="Click to edit progress"
                                >
                                  {kr.current} / {kr.target} {kr.unit}
                                </span>
                              )}
                              {/* Delete KR button */}
                              <button
                                onClick={() => handleDeleteKR(goal.id, kr.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                                title="Delete key result"
                              >
                                <i className="fas fa-trash text-xs" />
                              </button>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                krProgress >= 80
                                  ? "bg-green-500"
                                  : krProgress >= 50
                                    ? "bg-blue-500"
                                    : "bg-orange-500"
                              }`}
                              style={{ width: `${krProgress}%` }}
                            />
                          </div>
                          <div className="text-right mt-1">
                            <span className="text-xs text-gray-400">
                              {krProgress}%
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Key Result Form */}
                    {showKRForm === goal.id && (
                      <div className="bg-white rounded-lg border border-dashed border-gray-300 p-4">
                        <h5 className="text-xs font-semibold text-gray-500 mb-3">
                          New Key Result
                        </h5>
                        <div className="flex flex-wrap gap-3 items-end">
                          <div className="flex-1 min-w-[180px]">
                            <label className="text-xs text-gray-500 mb-1 block">
                              Title
                            </label>
                            <input
                              type="text"
                              value={newKRTitle}
                              onChange={(e) => setNewKRTitle(e.target.value)}
                              placeholder="e.g. Increase NPS score"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wh-green-primary)] focus:border-transparent"
                              autoFocus
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-xs text-gray-500 mb-1 block">
                              Target
                            </label>
                            <input
                              type="number"
                              value={newKRTarget}
                              onChange={(e) => setNewKRTarget(e.target.value)}
                              placeholder="100"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wh-green-primary)] focus:border-transparent"
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-xs text-gray-500 mb-1 block">
                              Unit
                            </label>
                            <input
                              type="text"
                              value={newKRUnit}
                              onChange={(e) => setNewKRUnit(e.target.value)}
                              placeholder="e.g. %"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wh-green-primary)] focus:border-transparent"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAddKeyResult(goal.id)}
                              disabled={
                                !newKRTitle.trim() || !newKRTarget || creatingKR
                              }
                              className="px-3 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--wh-green-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {creatingKR ? (
                                <i className="fas fa-spinner fa-spin" />
                              ) : (
                                "Add"
                              )}
                            </button>
                            <button
                              onClick={() => setShowKRForm(null)}
                              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {goal.keyResults.length === 0 && showKRForm !== goal.id && (
                    <div className="text-center text-gray-400 py-4 text-sm">
                      No key results yet. Add one to track progress.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {goals.length === 0 && !showCreateForm && (
        <div className="text-center text-gray-400 py-16">
          <i className="fas fa-bullseye text-4xl mb-4 block" />
          <p className="text-lg font-medium text-gray-500 mb-2">No goals yet</p>
          <p className="text-sm mb-4">
            Create your first goal to start tracking objectives and key results.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--wh-green-primary-hover)] transition-colors"
          >
            <i className="fas fa-plus mr-2" />
            Create First Goal
          </button>
        </div>
      )}

      {filteredGoals.length === 0 && goals.length > 0 && (
        <div className="text-center text-gray-400 py-12">
          <i className="fas fa-filter text-3xl mb-3 block" />
          No goals match the selected filter.
        </div>
      )}
    </div>
  );
};

export default GoalsOKRsPage;
