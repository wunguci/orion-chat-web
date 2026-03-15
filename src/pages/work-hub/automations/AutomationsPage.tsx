import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import type { AutomationRule } from "../../../types/work-hub.types";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import { mapAutomationRule } from "../../../features/work-hub/work-hub.mappers";

const triggerIcons: Record<string, string> = {
  status_change: "fa-exchange-alt",
  deadline_passed: "fa-calendar-times",
  field_change: "fa-edit",
  member_joined: "fa-user-plus",
  no_activity: "fa-hourglass-half",
};

const actionIcons: Record<string, string> = {
  notify: "fa-bell",
  update_field: "fa-pencil-alt",
  assign: "fa-user-check",
  send_message: "fa-paper-plane",
  add_label: "fa-tag",
};

const TRIGGER_OPTIONS = [
  { type: "status_change", label: "Task status changes" },
  { type: "deadline_passed", label: "Task deadline passed" },
  { type: "field_change", label: "Field value changes" },
  { type: "member_joined", label: "New member joins workspace" },
  { type: "no_activity", label: "No activity for a period" },
];

const ACTION_OPTIONS = [
  { type: "notify", label: "Send notification" },
  { type: "update_field", label: "Update a field" },
  { type: "assign", label: "Assign member" },
  { type: "send_message", label: "Send message" },
  { type: "add_label", label: "Add label" },
];

const AutomationsPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTriggerType, setNewTriggerType] = useState(TRIGGER_OPTIONS[0].type);
  const [newTriggerValue, setNewTriggerValue] = useState("");
  const [newActionType, setNewActionType] = useState(ACTION_OPTIONS[0].type);
  const [newActionValue, setNewActionValue] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchRules = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const data = await workHubApi.getAutomations(workspaceId);
      setRules(data.map(mapAutomationRule));
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const toggleRule = async (id: string) => {
    try {
      await workHubApi.toggleAutomation(id);
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r)),
      );
    } catch (err) {
      console.error("Failed to toggle automation:", err);
    }
  };

  const handleCreate = async () => {
    if (!workspaceId || !newName.trim()) return;
    try {
      setCreating(true);
      const triggerLabel =
        TRIGGER_OPTIONS.find((t) => t.type === newTriggerType)?.label ?? "";
      const actionLabel =
        ACTION_OPTIONS.find((a) => a.type === newActionType)?.label ?? "";

      const res = await workHubApi.createAutomation(workspaceId, {
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        trigger: {
          type: newTriggerType,
          label: newTriggerValue.trim() || triggerLabel,
          value: newTriggerValue.trim(),
        },
        action: {
          type: newActionType,
          label: newActionValue.trim() || actionLabel,
          value: newActionValue.trim(),
        },
      });
      setRules((prev) => [mapAutomationRule(res), ...prev]);
      resetCreateForm();
    } catch (err) {
      console.error("Failed to create automation:", err);
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setShowCreateForm(false);
    setNewName("");
    setNewDescription("");
    setNewTriggerType(TRIGGER_OPTIONS[0].type);
    setNewTriggerValue("");
    setNewActionType(ACTION_OPTIONS[0].type);
    setNewActionValue("");
  };

  const startEdit = (rule: AutomationRule) => {
    setEditingId(rule.id);
    setEditName(rule.name);
    setEditDescription(rule.description);
  };

  const saveEdit = async (id: string) => {
    try {
      await workHubApi.updateAutomation(id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setRules((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                name: editName.trim(),
                description: editDescription.trim(),
              }
            : r,
        ),
      );
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update automation:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await workHubApi.deleteAutomation(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete automation:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const enabledCount = rules.filter((r) => r.isEnabled).length;
  const totalTriggers = rules.reduce((s, r) => s + r.triggerCount, 0);

  const getTriggerType = (rule: AutomationRule): string =>
    (rule.trigger as Record<string, string>)?.type ?? "";
  const getTriggerLabel = (rule: AutomationRule): string =>
    (rule.trigger as Record<string, string>)?.label ?? "Unknown trigger";
  const getActionType = (rule: AutomationRule): string =>
    (rule.action as Record<string, string>)?.type ?? "";
  const getActionLabel = (rule: AutomationRule): string =>
    (rule.action as Record<string, string>)?.label ?? "Unknown action";

  const getConditionsArray = (
    rule: AutomationRule,
  ): { field: string; operator: string; value: string }[] => {
    const c = rule.conditions;
    if (Array.isArray(c)) return c;
    if (c && typeof c === "object" && Object.keys(c).length > 0)
      return [
        c as unknown as { field: string; operator: string; value: string },
      ];
    return [];
  };

  if (loading) {
    return (
      <div className="p-6 overflow-auto h-full">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Automations</h1>
            <p className="text-sm text-gray-500 mt-1">
              Set up rules to automate repetitive tasks and notifications.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <i className="fas fa-spinner fa-spin text-2xl text-[var(--wh-green-primary)]" />
            <span className="text-sm text-gray-500">
              Loading automation rules...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Automations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Set up rules to automate repetitive tasks and notifications.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--wh-green-primary-hover)] transition-colors"
        >
          <i className="fas fa-plus mr-2" />
          New Rule
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Create New Automation Rule
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Rule Name *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Notify on task completion"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief description of this rule"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Trigger Type
              </label>
              <select
                value={newTriggerType}
                onChange={(e) => setNewTriggerType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
              >
                {TRIGGER_OPTIONS.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Trigger Detail
              </label>
              <input
                type="text"
                value={newTriggerValue}
                onChange={(e) => setNewTriggerValue(e.target.value)}
                placeholder="e.g. Status changes to Done"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Action Type
              </label>
              <select
                value={newActionType}
                onChange={(e) => setNewActionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
              >
                {ACTION_OPTIONS.map((a) => (
                  <option key={a.type} value={a.type}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Action Detail
              </label>
              <input
                type="text"
                value={newActionValue}
                onChange={(e) => setNewActionValue(e.target.value)}
                placeholder="e.g. Send notification to task creator"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={resetCreateForm}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="px-4 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--wh-green-primary-hover)] transition-colors disabled:opacity-50"
            >
              {creating ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2" />
                  Create Rule
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-4">
          <div className="text-sm text-gray-500">Total Rules</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">
            {rules.length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-4">
          <div className="text-sm text-gray-500">Active Rules</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {enabledCount}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-4">
          <div className="text-sm text-gray-500">Total Triggers</div>
          <div className="text-2xl font-bold text-[var(--wh-green-primary)] mt-1">
            {totalTriggers}
          </div>
        </div>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-12 text-center">
          <i className="fas fa-robot text-4xl text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">
            No automation rules yet. Click "New Rule" to create your first
            automation.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-white rounded-xl border p-5 transition-all ${
                rule.isEnabled
                  ? "border-[var(--wh-green-border-light)]"
                  : "border-gray-200 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {editingId === rule.id ? (
                    <div className="mb-3 space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-[var(--wh-green-primary)]"
                      />
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(rule.id)}
                          className="px-3 py-1 bg-[var(--wh-green-primary)] text-white rounded text-xs hover:bg-[var(--wh-green-primary-hover)]"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-800">
                          {rule.name}
                        </h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${rule.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {rule.isEnabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        {rule.description}
                      </p>
                    </>
                  )}

                  {/* Trigger -> Action Flow */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm">
                      <i
                        className={`fas ${triggerIcons[getTriggerType(rule)] || "fa-bolt"} text-blue-500`}
                      />
                      <span className="font-medium">When:</span>
                      <span>{getTriggerLabel(rule)}</span>
                    </div>

                    {getConditionsArray(rule).length > 0 && (
                      <>
                        <i className="fas fa-arrow-right text-gray-300" />
                        <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg text-sm">
                          <i className="fas fa-filter text-yellow-500" />
                          <span className="font-medium">If:</span>
                          <span>
                            {getConditionsArray(rule)
                              .map((c) => `${c.field} ${c.operator} ${c.value}`)
                              .join(", ")}
                          </span>
                        </div>
                      </>
                    )}

                    <i className="fas fa-arrow-right text-gray-300" />

                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">
                      <i
                        className={`fas ${actionIcons[getActionType(rule)] || "fa-cog"} text-green-500`}
                      />
                      <span className="font-medium">Then:</span>
                      <span>{getActionLabel(rule)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {editingId !== rule.id && (
                    <>
                      <button
                        onClick={() => startEdit(rule)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit rule"
                      >
                        <i className="fas fa-pen text-xs" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        disabled={deletingId === rule.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Delete rule"
                      >
                        <i
                          className={`fas ${deletingId === rule.id ? "fa-spinner fa-spin" : "fa-trash"} text-xs`}
                        />
                      </button>
                    </>
                  )}
                  {/* Toggle */}
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      rule.isEnabled
                        ? "bg-[var(--wh-green-primary)]"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.isEnabled ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                <span>
                  <i className="fas fa-bolt mr-1" />
                  {rule.triggerCount} times triggered
                </span>
                {rule.lastTriggered && (
                  <span>
                    <i className="fas fa-clock mr-1" />
                    Last: {new Date(rule.lastTriggered).toLocaleDateString()}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1">
                  <img
                    src={rule.createdBy.avatar}
                    alt=""
                    className="w-4 h-4 rounded-full"
                  />
                  {rule.createdBy.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutomationsPage;
