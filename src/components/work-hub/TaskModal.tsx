import { useState, useEffect } from "react";
import type {
  TaskFormData,
  TaskStatus,
  TaskPriority,
} from "../../types/work-hub.types";
import { MOCK_USERS, MOCK_LABELS } from "../../data/work-hub-mock";
import Modal from "../common/Modal";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData) => void;
  initialStatus?: TaskStatus;
  editData?: TaskFormData;
}

const TaskModal = ({
  isOpen,
  onClose,
  onSave,
  initialStatus = "todo",
  editData,
}: TaskModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  useEffect(() => {
    if (editData) {
      setTitle(editData.title);
      setDescription(editData.description);
      setStatus(editData.status);
      setPriority(editData.priority);
      setAssigneeIds(editData.assigneeIds);
      setLabelIds(editData.labelIds);
      setStartDate(editData.startDate);
      setDeadline(editData.deadline);
    } else {
      setTitle("");
      setDescription("");
      setStatus(initialStatus);
      setPriority("medium");
      setAssigneeIds([]);
      setLabelIds([]);
      setStartDate("");
      setDeadline("");
    }
  }, [editData, initialStatus, isOpen]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      title,
      description,
      status,
      priority,
      assigneeIds,
      labelIds,
      startDate,
      deadline,
    });
    onClose();
  };

  const toggleAssignee = (userId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const toggleLabel = (labelId: string) => {
    setLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId],
    );
  };

  const selectedUsers = MOCK_USERS.filter((u) => assigneeIds.includes(u.id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Edit Task" : "Create New Task"}
      size="lg"
    >
      <div className="space-y-5 p-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Task Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task name"
            className="w-full px-4 py-2.5 bg-[var(--wh-green-bg-light)] border border-[var(--wh-green-border-light)] rounded-lg text-gray-900 focus:outline-none focus:border-[var(--wh-green-primary)]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description"
            rows={3}
            className="w-full px-4 py-2.5 bg-[var(--wh-green-bg-light)] border border-[var(--wh-green-border-light)] rounded-lg text-gray-900 focus:outline-none focus:border-[var(--wh-green-primary)] resize-none"
          />
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-4 py-2.5 bg-[var(--wh-green-bg-light)] border border-[var(--wh-green-border-light)] rounded-lg text-gray-900 focus:outline-none focus:border-[var(--wh-green-primary)]"
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-4 py-2.5 bg-[var(--wh-green-bg-light)] border border-[var(--wh-green-border-light)] rounded-lg text-gray-900 focus:outline-none focus:border-[var(--wh-green-primary)]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--wh-green-bg-light)] border border-[var(--wh-green-border-light)] rounded-lg text-gray-900 focus:outline-none focus:border-[var(--wh-green-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--wh-green-bg-light)] border border-[var(--wh-green-border-light)] rounded-lg text-gray-900 focus:outline-none focus:border-[var(--wh-green-primary)]"
            />
          </div>
        </div>

        {/* Assignees */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Assignees
          </label>
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--wh-green-bg-heavy)] border border-[var(--wh-green-border-medium)] rounded-full text-sm"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-gray-700">{user.name}</span>
                  <button
                    onClick={() => toggleAssignee(user.id)}
                    className="w-4 h-4 rounded-full bg-gray-300 text-white flex items-center justify-center hover:bg-red-400 transition-colors"
                  >
                    <i className="fas fa-times" style={{ fontSize: "8px" }}></i>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="relative">
            <button
              onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              className="w-full px-4 py-2.5 bg-[var(--wh-green-bg-light)] border border-[var(--wh-green-border-light)] rounded-lg text-gray-500 text-left text-sm focus:outline-none focus:border-[var(--wh-green-primary)]"
            >
              <i className="fas fa-user-plus mr-2"></i>
              Add assignees...
            </button>
            {showAssigneeDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--wh-green-border-light)] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {MOCK_USERS.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => toggleAssignee(user.id)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--wh-green-bg-light)] cursor-pointer"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-full"
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      {user.name}
                    </span>
                    {assigneeIds.includes(user.id) && (
                      <i className="fas fa-check text-[var(--wh-green-primary)] text-sm"></i>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Labels */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Labels
          </label>
          <div className="flex flex-wrap gap-2">
            {MOCK_LABELS.map((label) => (
              <button
                key={label.id}
                onClick={() => toggleLabel(label.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  labelIds.includes(label.id)
                    ? "border-transparent text-white"
                    : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                }`}
                style={
                  labelIds.includes(label.id)
                    ? { backgroundColor: label.color }
                    : undefined
                }
              >
                {label.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-[var(--wh-green-border-light)]">
        <button
          onClick={onClose}
          className="px-5 py-2 border border-[var(--wh-green-border-light)] text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="px-5 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg hover:bg-[var(--wh-green-primary-hover)] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <i className="fas fa-save"></i>
          {editData ? "Update Task" : "Create Task"}
        </button>
      </div>
    </Modal>
  );
};

export default TaskModal;
