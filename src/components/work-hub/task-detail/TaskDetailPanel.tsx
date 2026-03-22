import { useState } from "react";
import type { Task, TaskStatus, User } from "../../../types/work-hub.types";
import SubTaskList from "./SubTaskList";
import CommentSection from "./CommentSection";
import ActivityTimeline from "./ActivityTimeline";
import AttachmentList from "./AttachmentList";
import TaskTransferDialog from "./TaskTransferDialog";
import Badge from "../../common/Badge";
import AvatarGroup from "../../common/AvatarGroup";

interface TaskDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAddComment: (taskId: string, text: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, parentId: string | null) => void;
  onTransfer: (taskId: string, toUserId: string, reason: string) => void;
  users: User[];
}

type TabKey = "details" | "subtasks" | "comments" | "activity" | "attachments";

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: "details", label: "Details", icon: "fa-info-circle" },
  { key: "subtasks", label: "Subtasks", icon: "fa-list-check" },
  { key: "comments", label: "Comments", icon: "fa-comments" },
  { key: "activity", label: "Activity", icon: "fa-history" },
  { key: "attachments", label: "Files", icon: "fa-paperclip" },
];

const priorityColors: Record<string, string> = {
  low: "#3b82f6",
  medium: "#F59E0B",
  high: "#f97316",
  critical: "#ef4444",
};

const TaskDetailPanel = ({
  task,
  isOpen,
  onClose,
  onStatusChange,
  onAddComment,
  onToggleSubtask,
  onDeleteSubtask,
  onAddSubtask,
  onTransfer,
  users,
}: TaskDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [showTransfer, setShowTransfer] = useState(false);

  if (!isOpen || !task) return null;

  const currentUser = users[0];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[600px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="px-6 py-4 border-b border-wh-green-border-light flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: priorityColors[task.priority] }}
                title={task.priority}
              />
              <h2 className="text-lg font-bold text-gray-900 line-clamp-1">{task.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTransfer(true)}
                className="w-8 h-8 rounded-lg hover:bg-wh-green-bg-heavy flex items-center justify-center text-gray-400 hover:text-wh-green-primary transition-colors"
                title="Transfer task"
              >
                <i className="fas fa-share text-sm"></i>
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-3">
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
              className="px-3 py-1.5 text-sm border border-wh-green-border-light rounded-lg bg-wh-green-bg-light text-wh-green-text-primary font-medium focus:outline-none focus:border-wh-green-primary"
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
            <span className="text-xs text-gray-400">
              <i className="fas fa-eye mr-1"></i>
              {task.viewCount} views
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-wh-green-border-light px-6 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-wh-green-primary text-wh-green-primary"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <i className={`fas ${tab.icon} mr-1.5`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "details" && (
            <div className="space-y-5">
              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Description</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {task.description || "No description"}
                </p>
              </div>

              {/* Assignees */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Assignees</h4>
                <div className="flex items-center gap-2">
                  <AvatarGroup
                    users={task.assignees.map((a) => ({ src: a.avatar, alt: a.name }))}
                    max={5}
                    size="sm"
                  />
                  <div className="flex flex-wrap gap-1 ml-2">
                    {task.assignees.map((a) => (
                      <span key={a.id} className="text-xs text-gray-500">
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Labels */}
              {task.labels.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Labels</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {task.labels.map((label) => (
                      <Badge key={label.id} text={label.text} color={label.color} size="sm" />
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                {task.startDate && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">Start Date</h4>
                    <p className="text-sm text-gray-500">
                      <i className="far fa-calendar mr-1.5"></i>
                      {new Date(task.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {task.deadline && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">Deadline</h4>
                    <p className="text-sm text-gray-500">
                      <i className="far fa-calendar-check mr-1.5"></i>
                      {new Date(task.deadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Created by */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Created by</h4>
                <div className="flex items-center gap-2">
                  <img src={task.createdBy.avatar} alt={task.createdBy.name} className="w-6 h-6 rounded-full" />
                  <span className="text-sm text-gray-600">{task.createdBy.name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "subtasks" && (
            <SubTaskList
              subtasks={task.subtasks}
              onToggle={(subtaskId) => onToggleSubtask(task.id, subtaskId)}
              onDelete={(subtaskId) => onDeleteSubtask(task.id, subtaskId)}
              onAdd={(parentId) => onAddSubtask(task.id, parentId)}
            />
          )}

          {activeTab === "comments" && (
            <CommentSection
              comments={task.comments}
              onAdd={(text) => onAddComment(task.id, text)}
              currentUser={currentUser}
            />
          )}

          {activeTab === "activity" && <ActivityTimeline activities={task.activityHistory} />}

          {activeTab === "attachments" && (
            <AttachmentList
              attachments={task.attachments}
              onAdd={() => {}}
              onRemove={() => {}}
            />
          )}
        </div>
      </div>

      {/* Transfer Dialog */}
      <TaskTransferDialog
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
        onTransfer={(toUserId, reason) => onTransfer(task.id, toUserId, reason)}
        users={users}
        currentAssignees={task.assignees}
      />
    </>
  );
};

export default TaskDetailPanel;

