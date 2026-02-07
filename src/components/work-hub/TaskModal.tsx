import { useState, useEffect } from "react";

interface Assignee {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => void;
  initialStatus?: "todo" | "inprogress" | "review" | "done";
  availableAssignees: Assignee[];
  weeks: Array<{ id: number; label: string; dateRange: string }>;
  taskToEdit?: any;
}

const TaskModal = ({
  isOpen,
  onClose,
  onSave,
  initialStatus = "todo",
  availableAssignees,
  weeks,
  taskToEdit,
}: TaskModalProps) => {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [dueDate, setDueDate] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(weeks[0]?.id || 1);
  const [tags, setTags] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<Assignee[]>([]);
  const [showAssigneeList, setShowAssigneeList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (taskToEdit) {
      setTaskName(taskToEdit.title || "");
      setDescription(taskToEdit.description || "");
      setStatus(taskToEdit.status || "todo");
      setPriority(taskToEdit.priority || "medium");
      setDueDate(taskToEdit.dueDate || "");
      setTags(taskToEdit.tags?.join(", ") || "");
      // Load assignees if editing
    } else {
      // Reset form for new task
      setTaskName("");
      setDescription("");
      setStatus(initialStatus);
      setPriority("medium");
      setDueDate("");
      setTags("");
      setSelectedAssignees([]);
    }
  }, [taskToEdit, initialStatus]);

  const filteredAssignees = availableAssignees.filter(
    (assignee) =>
      assignee.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedAssignees.find((a) => a.id === assignee.id),
  );

  const handleSelectAssignee = (assignee: Assignee) => {
    setSelectedAssignees([...selectedAssignees, assignee]);
    setSearchQuery("");
    setShowAssigneeList(false);
  };

  const handleRemoveAssignee = (assigneeId: string) => {
    setSelectedAssignees(selectedAssignees.filter((a) => a.id !== assigneeId));
  };

  const handleSubmit = () => {
    const taskData = {
      id: taskToEdit?.id || Date.now().toString(),
      title: taskName,
      description,
      status,
      priority,
      dueDate,
      weekId: selectedWeek,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      assignees: selectedAssignees.map((a) => a.avatar),
      labels: priority === "high" ? [{ text: "High", type: "urgent" }] : [],
      date: new Date(dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    };
    onSave(taskData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {taskToEdit ? "Edit Task" : "Create New Task"}
            </h3>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[var(--color-primary)] resize-none"
            />
          </div>

          {/* Row: Week & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Week <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[var(--color-primary)]"
              >
                {weeks.map((week) => (
                  <option key={week.id} value={week.id}>
                    {week.label} ({week.dateRange})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Row: Priority & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Assign To (Multiple) <span className="text-red-500">*</span>
            </label>

            {/* Selected Assignees */}
            {selectedAssignees.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedAssignees.map((assignee) => (
                  <div
                    key={assignee.id}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm"
                  >
                    <img
                      src={assignee.avatar}
                      alt={assignee.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-slate-900 dark:text-slate-100">
                      {assignee.name}
                    </span>
                    <button
                      onClick={() => handleRemoveAssignee(assignee.id)}
                      className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <i className="fas fa-times text-[8px]"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Assignee Dropdown */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowAssigneeList(true);
                }}
                onFocus={() => setShowAssigneeList(true)}
                placeholder="Search members..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[var(--color-primary)]"
              />

              {showAssigneeList && filteredAssignees.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                  {filteredAssignees.map((assignee) => (
                    <div
                      key={assignee.id}
                      onClick={() => handleSelectAssignee(assignee)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <img
                        src={assignee.avatar}
                        alt={assignee.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {assignee.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {assignee.role}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Add tags separated by commas"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!taskName || !dueDate || selectedAssignees.length === 0}
            className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-save"></i>
            {taskToEdit ? "Update Task" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
