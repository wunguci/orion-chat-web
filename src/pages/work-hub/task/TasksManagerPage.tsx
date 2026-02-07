import { useState } from "react";
import TaskColumn from "../../../components/work-hub/TaskColumn";
import ProgressOverview from "../../../components/work-hub/ProgressOverview";
import WeekSelector from "../../../components/work-hub/WeekSelector";
import TaskModal from "../../../components/work-hub/TaskModal";

interface Task {
  id: string;
  title: string;
  description?: string;
  labels: Array<{ text: string; type: "feature" | "bug" | "urgent" }>;
  date: string;
  assignees: string[];
  status: "todo" | "inprogress" | "review" | "done";
  priority?: "high" | "medium" | "low";
  tags?: string[];
  dueDate?: string;
}

interface Assignee {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

const TasksManagerPage = () => {
  const availableAssignees: Assignee[] = [
    {
      id: "1",
      name: "Phan Phước Hiệp",
      role: "Backend Developer",
      avatar: "avatar-user.png",
    },
    {
      id: "2",
      name: "Mỹ Duyên",
      role: "Frontend Developer",
      avatar: "avatar-user.png",
    },
    {
      id: "3",
      name: "Thanh Giang",
      role: "UI/UX Designer",
      avatar: "avatar-user.png",
    },
    {
      id: "4",
      name: "Quang Nhân",
      role: "Technical Writer",
      avatar: "avatar-user.png",
    },
    {
      id: "5",
      name: "Long Vũ",
      role: "DevOps Engineer",
      avatar: "avatar-user.png",
    },
  ];

  // Data sample
  const weeks = [
    { id: 1, label: "Week 1", dateRange: "Jan 1-7", taskCount: 15 },
    { id: 2, label: "Week 2", dateRange: "Jan 8-14", taskCount: 18 },
    { id: 3, label: "Week 3", dateRange: "Jan 15-21", taskCount: 22 },
    { id: 4, label: "Week 4", dateRange: "Jan 22-28", taskCount: 12 },
    { id: 5, label: "Week 5", dateRange: "Jan 29-Feb 4", taskCount: 8 },
  ];

  const [selectedWeek, setSelectedWeek] = useState(3);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalStatus, setTaskModalStatus] = useState<
    "todo" | "inprogress" | "review" | "done"
  >("todo");
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>();

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Design new landing page",
      description: "Create mockups for homepage redesign with new branding",
      labels: [{ text: "Feature", type: "feature" }],
      date: "Jan 28",
      assignees: ["avatar-user.png", "avatar-user.png"],
      status: "todo",
      priority: "medium",
      tags: ["Design", "UI/UX"],
    },
    {
      id: "2",
      title: "Update documentation",
      description: "Revise API documentation with latest changes",
      labels: [{ text: "Feature", type: "feature" }],
      date: "Feb 1",
      assignees: ["avatar-user.png"],
      status: "todo",
      priority: "low",
      tags: ["Docs"],
    },
    {
      id: "3",
      title: "Implement user authentication",
      description: "Build login/register system with JWT tokens",
      labels: [{ text: "Urgent", type: "urgent" }],
      date: "Jan 25",
      assignees: ["avatar-user.png"],
      status: "inprogress",
      priority: "high",
      tags: ["Backend", "Security"],
    },
    {
      id: "4",
      title: "Setup CI/CD pipeline",
      description: "Configure GitHub Actions for automated deployments",
      labels: [{ text: "Feature", type: "feature" }],
      date: "Jan 30",
      assignees: ["avatar-user.png", "avatar-user.png"],
      status: "inprogress",
      priority: "medium",
      tags: ["DevOps"],
    },
    {
      id: "5",
      title: "Fix database connection issue",
      description: "Resolve timeout errors in production database",
      labels: [{ text: "Bug", type: "bug" }],
      date: "Jan 22",
      assignees: ["avatar-user.png"],
      status: "review",
      priority: "high",
      tags: ["Bug Fix", "Critical"],
    },
    {
      id: "6",
      title: "Write API documentation",
      description: "Document all REST endpoints with examples",
      labels: [{ text: "Feature", type: "feature" }],
      date: "Jan 20",
      assignees: ["avatar-user.png"],
      status: "done",
      priority: "low",
      tags: ["Docs"],
    },
    {
      id: "7",
      title: "Create project documentation",
      description: "Write comprehensive project setup guide",
      labels: [{ text: "Feature", type: "feature" }],
      date: "Jan 18",
      assignees: ["avatar-user.png"],
      status: "done",
      priority: "medium",
      tags: ["Docs"],
    },
  ]);

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "inprogress");
  const reviewTasks = tasks.filter((t) => t.status === "review");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const totalTasks = tasks.length;
  const completedCount = doneTasks.length;
  const inProgressCount = inProgressTasks.length;
  const overdueCount = 4;

  const handleAddTask = (status: "todo" | "inprogress" | "review" | "done") => {
    setTaskModalStatus(status);
    setTaskToEdit(undefined);
    setShowTaskModal(true);
  };

  const handleEditTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setTaskToEdit(task);
      setShowTaskModal(true);
    }
  };

  const handleDeleteTask = (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  const handleTaskClick = (id: string) => {
    handleEditTask(id);
  };

  const handleSaveTask = (taskData: any) => {
    if (taskToEdit) {
      setTasks(tasks.map((t) => (t.id === taskData.id ? taskData : t)));
    } else {
      setTasks([...tasks, taskData]);
    }
  };

  const handleWeekChange = (weekId: number) => {
    setSelectedWeek(weekId);
  };

  const handlePrevWeek = () => {
    if (selectedWeek > 1) {
      setSelectedWeek(selectedWeek - 1);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeek < weeks.length) {
      setSelectedWeek(selectedWeek + 1);
    }
  };

  const selectedWeekData = weeks.find((w) => w.id === selectedWeek);

  return (
    <>
      {/* Header */}
      <div className="px-6 lg:px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              Task Management
              <span className="px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg flex items-center gap-2">
                <i className="fas fa-crown"></i>
                Admin Access
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTaskModal(true)}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              <span className="hidden sm:inline">Create Task</span>
            </button>
            <button className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center">
              <i className="fas fa-filter"></i>
            </button>
            <button className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center">
              <i className="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          {/* Progress Overview */}
          <ProgressOverview
            totalTasks={totalTasks}
            todoCount={todoTasks.length}
            inProgressCount={inProgressCount}
            completedCount={completedCount}
            overdueCount={overdueCount}
            weeklyTrend={{
              total: 8,
              inProgress: 3,
              completed: 5,
              overdue: -2,
            }}
          />

          {/* Week Selector */}
          <WeekSelector
            weeks={weeks}
            selectedWeekId={selectedWeek}
            onWeekChange={handleWeekChange}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            currentWeekRange={selectedWeekData?.dateRange || ""}
          />

          {/* Tasks Board */}
          <div className="flex gap-5 overflow-x-auto pb-5">
            <TaskColumn
              title="To Do"
              count={todoTasks.length}
              tasks={todoTasks}
              statusColor="#6366f1"
              onAddTask={() => handleAddTask("todo")}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onTaskClick={handleTaskClick}
            />
            <TaskColumn
              title="In Progress"
              count={inProgressTasks.length}
              tasks={inProgressTasks}
              statusColor="#F59E0B"
              onAddTask={() => handleAddTask("inprogress")}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onTaskClick={handleTaskClick}
            />
            <TaskColumn
              title="Review"
              count={reviewTasks.length}
              tasks={reviewTasks}
              statusColor="#8b5cf6"
              onAddTask={() => handleAddTask("review")}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onTaskClick={handleTaskClick}
            />
            <TaskColumn
              title="Done"
              count={doneTasks.length}
              tasks={doneTasks}
              statusColor="#10B981"
              onAddTask={() => handleAddTask("done")}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onTaskClick={handleTaskClick}
            />
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setTaskToEdit(undefined);
        }}
        onSave={handleSaveTask}
        initialStatus={taskModalStatus}
        availableAssignees={availableAssignees}
        weeks={weeks}
        taskToEdit={taskToEdit}
      />
    </>
  );
};

export default TasksManagerPage;
