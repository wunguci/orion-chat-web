import { useState } from "react";
import StatCard from "../../../components/work-hub/StatCard";
import TaskColumn from "../../../components/work-hub/TaskColumn";

// Interface tạm
interface StatCard {
  icon: string;
  iconColor: string;
  value: number;
  label: string;
  change: number;
  changeDirection: "up" | "down";
}

interface Task {
  id: string;
  title: string;
  labels: Array<{ text: string; type: "feature" | "bug" | "urgent" }>;
  date: string;
  assignees: string[];
}

interface Activity {
  id: string;
  type: "task" | "comment" | "file";
  user: string;
  action: string;
  time: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "online" | "offline" | "away";
}

interface StatCardData {
  icon: string;
  iconColor: "primary" | "success" | "warning" | "danger";
  value: number;
  label: string;
  change: number;
  changeDirection: "up" | "down";
}

interface Task {
  id: string;
  title: string;
  labels: Array<{ text: string; type: "feature" | "bug" | "urgent" }>;
  date: string;
  assignees: string[];
  status: "todo" | "inprogress" | "done";
}

interface Activity {
  id: string;
  type: "task" | "comment" | "file";
  user: string;
  action: string;
  time: string;
}

const WorkHubPage = () => {
  // State for tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Implement user authentication",
      labels: [
        { text: "Feature", type: "feature" },
        { text: "Urgent", type: "urgent" },
      ],
      date: "25 Jan",
      assignees: ["avatar-user.png", "/avatar-user.png"],
      status: "todo",
    },
    {
      id: "2",
      title: "Fix login page responsive issue",
      labels: [{ text: "Bug", type: "bug" }],
      date: "26 Jan",
      assignees: ["avatar-user.png"],
      status: "todo",
    },
    {
      id: "3",
      title: "Design new landing page",
      labels: [{ text: "Feature", type: "feature" }],
      date: "28 Jan",
      assignees: ["avatar-user.png"],
      status: "todo",
    },
    {
      id: "4",
      title: "Update API documentation",
      labels: [{ text: "Feature", type: "feature" }],
      date: "24 Jan",
      assignees: ["../public/avatar-user.png"],
      status: "inprogress",
    },
    {
      id: "5",
      title: "Optimize database queries",
      labels: [{ text: "Bug", type: "bug" }],
      date: "25 Jan",
      assignees: ["../public/avatar-user.png", "../public/avatar-user.png"],
      status: "inprogress",
    },
    {
      id: "6",
      title: "Setup CI/CD pipeline",
      labels: [{ text: "Feature", type: "feature" }],
      date: "20 Jan",
      assignees: ["../public/avatar-user.png"],
      status: "done",
    },
    {
      id: "7",
      title: "Create project documentation",
      labels: [{ text: "Feature", type: "feature" }],
      date: "22 Jan",
      assignees: ["../public/avatar-user.png"],
      status: "done",
    },
  ]);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Calculate stats from tasks
  const stats: StatCardData[] = [
    {
      icon: "fa-tasks",
      iconColor: "primary",
      value: tasks.length,
      label: "Total Tasks",
      change: 12,
      changeDirection: "up",
    },
    {
      icon: "fa-check-circle",
      iconColor: "success",
      value: tasks.filter((t) => t.status === "done").length,
      label: "Completed",
      change: 8,
      changeDirection: "up",
    },
    {
      icon: "fa-clock",
      iconColor: "warning",
      value: tasks.filter((t) => t.status === "inprogress").length,
      label: "In Progress",
      change: 3,
      changeDirection: "down",
    },
    {
      icon: "fa-exclamation-circle",
      iconColor: "danger",
      value: 4,
      label: "Overdue",
      change: 5,
      changeDirection: "up",
    },
  ];

  const activities: Activity[] = [
    {
      id: "1",
      type: "task",
      user: "John Doe",
      action: 'completed task "Setup development environment"',
      time: "2 hours ago",
    },
    {
      id: "2",
      type: "comment",
      user: "Jane Smith",
      action: 'commented on "User authentication feature"',
      time: "4 hours ago",
    },
    {
      id: "3",
      type: "file",
      user: "Mike Johnson",
      action: 'uploaded file "design-mockup.fig"',
      time: "5 hours ago",
    },
  ];

  // Filter tasks by status
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "inprogress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  // Handlers
  const handleAddTask = (status: "todo" | "inprogress" | "done") => {
    console.log("Add task to:", status);
    setShowTaskModal(true);
  };

  const handleEditTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    setSelectedTask(task || null);
    setShowTaskModal(true);
  };

  const handleDeleteTask = (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  const handleTaskClick = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    setSelectedTask(task || null);
    setShowTaskModal(true);
  };

  const getActivityIconClass = (type: "task" | "comment" | "file") => {
    const classes = {
      task: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
      comment: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
      file: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
    };
    return classes[type];
  };

  const getActivityIcon = (type: "task" | "comment" | "file") => {
    const icons = {
      task: "fa-check-circle",
      comment: "fa-comment",
      file: "fa-file",
    };
    return icons[type];
  };

  return (
    <>
      {/* Header */}
      <div className="px-6 lg:px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Dashboard
            </h1>
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
              <i className="fas fa-home"></i>
              <i className="fas fa-chevron-right text-xs"></i>
              <span>WorkHub</span>
              <i className="fas fa-chevron-right text-xs"></i>
              <span className="text-slate-900 dark:text-slate-100">
                Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            {showSearch ? (
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2">
                <i className="fas fa-search text-slate-400 text-sm"></i>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-48"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
              >
                <i className="fas fa-search"></i>
              </button>
            )}

            {/* New Task Button */}
            <button
              onClick={() => setShowTaskModal(true)}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              <span className="hidden sm:inline">New Task</span>
            </button>

            {/* Notifications */}
            <button className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center relative">
              <i className="fas fa-bell"></i>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile */}
            <button className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <img
                src="https://i.pravatar.cc/150?img=50"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Tasks Board */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Tasks Board
              </h2>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <i className="fas fa-filter mr-2"></i>Filter
                </button>
                <button className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <i className="fas fa-sort mr-2"></i>Sort
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <TaskColumn
                title="To Do"
                count={todoTasks.length}
                tasks={todoTasks}
                statusColor="#94a3b8"
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

          {/* Recent Activity */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Recent Activity
              </h2>
              <button className="text-sm text-[var(--color-primary)] hover:underline">
                View All
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex gap-4 py-4 ${
                    index !== activities.length - 1
                      ? "border-b border-slate-200 dark:border-slate-700"
                      : ""
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityIconClass(
                      activity.type,
                    )}`}
                  >
                    <i className={`fas ${getActivityIcon(activity.type)}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm mb-1 text-slate-900 dark:text-slate-100">
                      <span className="font-semibold">{activity.user}</span>{" "}
                      <span className="text-slate-600 dark:text-slate-400">
                        {activity.action}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {selectedTask ? "Edit Task" : "Create New Task"}
                </h3>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedTask(null);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
                >
                  <i className="fas fa-times text-slate-600 dark:text-slate-400"></i>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-12 text-slate-500">
                <i className="fas fa-hammer text-4xl mb-4"></i>
                <p>Task form under construction...</p>
                <p className="text-sm mt-2">(Add tasks)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkHubPage;
