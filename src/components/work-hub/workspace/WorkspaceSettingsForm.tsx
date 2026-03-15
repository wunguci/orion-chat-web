import { useState, useEffect } from "react";
import type { Workspace } from "../../../types/work-hub.types";

interface WorkspaceSettingsFormProps {
  workspace: Workspace;
  onSave: (updates: Partial<Workspace>) => void;
}

const colorOptions = [
  "#0d9488",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#f97316",
  "#10b981",
  "#ec4899",
  "#06b6d4",
];

const WorkspaceSettingsForm = ({
  workspace,
  onSave,
}: WorkspaceSettingsFormProps) => {
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description);
  const [color, setColor] = useState(workspace.color);
  const [isPublic, setIsPublic] = useState(workspace.isPublic);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(workspace.name);
    setDescription(workspace.description);
    setColor(workspace.color);
    setIsPublic(workspace.isPublic);
  }, [workspace]);

  const handleSave = () => {
    onSave({ name, description, color, isPublic });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white border border-[var(--wh-green-border-light)] rounded-xl p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Workspace Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 border border-[var(--wh-green-border-light)] rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)] focus:ring-2 focus:ring-[var(--wh-green-primary)]/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 border border-[var(--wh-green-border-light)] rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)] resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Theme Color
        </label>
        <div className="flex gap-3">
          {colorOptions.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Visibility
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setIsPublic(true)}
            className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
              isPublic
                ? "border-[var(--wh-green-primary)] bg-[var(--wh-green-bg-light)] text-[var(--wh-green-text-primary)]"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            <i className="fas fa-globe mr-2"></i>Public
          </button>
          <button
            onClick={() => setIsPublic(false)}
            className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
              !isPublic
                ? "border-[var(--wh-green-primary)] bg-[var(--wh-green-bg-light)] text-[var(--wh-green-text-primary)]"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            <i className="fas fa-lock mr-2"></i>Private
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button className="text-sm text-red-500 hover:text-red-700 transition-colors">
          <i className="fas fa-trash mr-1"></i> Delete Workspace
        </button>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-[var(--wh-green-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--wh-green-primary-hover)] transition-colors flex items-center gap-2"
        >
          {saved ? (
            <>
              <i className="fas fa-check"></i> Saved!
            </>
          ) : (
            <>
              <i className="fas fa-save"></i> Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default WorkspaceSettingsForm;
