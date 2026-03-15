import { useState, useEffect } from "react";
import Modal from "../../common/Modal";
import type { Board } from "../../../types/work-hub.types";

interface BoardFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description: string;
    color: string;
    icon: string;
  }) => void;
  board?: Board;
}

const colorOptions = [
  { value: "#0d9488", label: "Teal" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#10b981", label: "Green" },
];

const iconOptions = [
  { value: "fa-rocket", label: "Rocket" },
  { value: "fa-palette", label: "Palette" },
  { value: "fa-bug", label: "Bug" },
  { value: "fa-code", label: "Code" },
  { value: "fa-star", label: "Star" },
  { value: "fa-bolt", label: "Bolt" },
];

const BoardFormDialog = ({
  isOpen,
  onClose,
  onSave,
  board,
}: BoardFormDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(colorOptions[0].value);
  const [icon, setIcon] = useState(iconOptions[0].value);

  useEffect(() => {
    if (board) {
      setName(board.name);
      setDescription(board.description || "");
      setColor(board.color);
      setIcon(board.icon);
    } else {
      setName("");
      setDescription("");
      setColor(colorOptions[0].value);
      setIcon(iconOptions[0].value);
    }
  }, [board, isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim(), color, icon });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={board ? "Edit Board" : "Create Board"}
      size="sm"
    >
      <div className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Board Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter board name..."
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
            placeholder="Describe this board..."
            rows={3}
            className="w-full px-4 py-2.5 border border-[var(--wh-green-border-light)] rounded-lg text-sm focus:outline-none focus:border-[var(--wh-green-primary)] resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="flex gap-3">
            {colorOptions.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`w-8 h-8 rounded-full transition-all ${color === c.value ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Icon
          </label>
          <div className="flex gap-2">
            {iconOptions.map((ic) => (
              <button
                key={ic.value}
                onClick={() => setIcon(ic.value)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  icon === ic.value
                    ? "bg-[var(--wh-green-primary)] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                title={ic.label}
              >
                <i className={`fas ${ic.value}`}></i>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="px-4 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--wh-green-primary-hover)] transition-colors disabled:opacity-50"
        >
          {board ? "Update Board" : "Create Board"}
        </button>
      </div>
    </Modal>
  );
};

export default BoardFormDialog;
