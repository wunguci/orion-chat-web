import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import type { Label } from "../../../types/work-hub.types";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import { mapLabel } from "../../../features/work-hub/work-hub.mappers";

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
  "#64748b",
];

const TYPES: Label["type"][] = [
  "feature",
  "bug",
  "design",
  "urgent",
  "improvement",
];

const LabelsManagementPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editColor, setEditColor] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newType, setNewType] = useState<Label["type"]>("feature");
  const [search, setSearch] = useState("");

  const fetchLabels = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const data = await workHubApi.getLabels(workspaceId);
      setLabels(data.map(mapLabel));
    } catch {
      setLabels([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const filteredLabels = labels.filter((l) =>
    l.text.toLowerCase().includes(search.toLowerCase()),
  );

  const startEdit = (label: Label) => {
    setEditingId(label.id);
    setEditText(label.text);
    setEditColor(label.color);
  };

  const saveEdit = async (id: string) => {
    if (!workspaceId) return;
    try {
      await workHubApi.updateLabel(workspaceId, id, {
        text: editText,
        color: editColor,
      });
      setLabels((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, text: editText, color: editColor } : l,
        ),
      );
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update label:", err);
    }
  };

  const addLabel = async () => {
    if (!newText.trim() || !workspaceId) return;
    try {
      const data = await workHubApi.createLabel(workspaceId, {
        text: newText.trim(),
        color: newColor,
        type: newType.toUpperCase(),
        workspaceId,
      });
      setLabels((prev) => [...prev, mapLabel(data)]);
      setNewText("");
      setNewColor(PRESET_COLORS[0]);
      setShowAdd(false);
    } catch (err) {
      console.error("Failed to create label:", err);
    }
  };

  const deleteLabel = async (id: string) => {
    if (!workspaceId) return;
    try {
      await workHubApi.deleteLabel(workspaceId, id);
      setLabels((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error("Failed to delete label:", err);
    }
  };

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
          <h1 className="text-xl font-bold text-gray-800">Labels Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, edit, and manage labels for your workspace.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--wh-green-primary-hover)] transition-colors"
        >
          <i className="fas fa-plus mr-2" />
          New Label
        </button>
      </div>

      {/* Add Label Form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Create New Label
          </h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 mb-1 block">
                Label Name
              </label>
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="e.g. Documentation"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wh-green-primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as Label["type"])}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wh-green-primary)]"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Color</label>
              <div className="flex gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${newColor === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addLabel}
                className="px-4 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--wh-green-primary-hover)]"
              >
                Add
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
          {/* Preview */}
          {newText && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-400">Preview:</span>
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: newColor }}
              >
                {newText}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-xs">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search labels..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wh-green-primary)] focus:border-transparent"
          />
        </div>
      </div>

      {/* Labels Grid */}
      <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left py-3 px-5 text-gray-500 font-medium">
                Label
              </th>
              <th className="text-left py-3 px-5 text-gray-500 font-medium">
                Type
              </th>
              <th className="text-left py-3 px-5 text-gray-500 font-medium">
                Color
              </th>
              <th className="text-right py-3 px-5 text-gray-500 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLabels.map((label) => (
              <tr
                key={label.id}
                className="border-b border-gray-50 hover:bg-gray-50"
              >
                <td className="py-3 px-5">
                  {editingId === label.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wh-green-primary)]"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.text}
                    </span>
                  )}
                </td>
                <td className="py-3 px-5 text-gray-600 capitalize">
                  {label.type}
                </td>
                <td className="py-3 px-5">
                  {editingId === label.id ? (
                    <div className="flex gap-1">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditColor(c)}
                          className={`w-5 h-5 rounded-full border-2 ${editColor === c ? "border-gray-800" : "border-transparent"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-gray-500 text-xs">
                        {label.color}
                      </span>
                    </div>
                  )}
                </td>
                <td className="py-3 px-5 text-right">
                  {editingId === label.id ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => saveEdit(label.id)}
                        className="text-green-500 hover:text-green-700"
                        title="Save"
                      >
                        <i className="fas fa-check" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Cancel"
                      >
                        <i className="fas fa-times" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(label)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit"
                      >
                        <i className="fas fa-pen text-xs" />
                      </button>
                      <button
                        onClick={() => deleteLabel(label.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <i className="fas fa-trash text-xs" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLabels.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            {search
              ? "No labels match your search"
              : "No labels yet. Create one to get started."}
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-400">
        {labels.length} label{labels.length !== 1 ? "s" : ""} total
      </div>
    </div>
  );
};

export default LabelsManagementPage;
