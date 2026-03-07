import { useState, useCallback } from "react";
import type { Task, ViewMode, SortConfig, GroupByConfig, TaskStatus, TaskPriority } from "../types/work-hub.types";

export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([]);
  const [groupBy, setGroupBy] = useState<GroupByConfig>({ field: "none" });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");

  const addSort = (field: string) => {
    const existing = sortConfigs.find((s) => s.field === field);
    if (existing) {
      setSortConfigs(
        sortConfigs.map((s) =>
          s.field === field
            ? { ...s, direction: s.direction === "asc" ? "desc" : "asc" }
            : s
        )
      );
    } else {
      setSortConfigs([...sortConfigs, { field, direction: "asc" }]);
    }
  };

  const removeSort = (field: string) => {
    setSortConfigs(sortConfigs.filter((s) => s.field !== field));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterPriority("all");
    setFilterStatus("all");
    setFilterAssignee("all");
    setSortConfigs([]);
  };

  const applyFiltersAndSort = useCallback(
    (tasks: Task[]): Task[] => {
      let result = [...tasks];

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.labels.some((l) => l.text.toLowerCase().includes(q))
        );
      }

      // Priority filter
      if (filterPriority !== "all") {
        result = result.filter((t) => t.priority === filterPriority);
      }

      // Status filter
      if (filterStatus !== "all") {
        result = result.filter((t) => t.status === filterStatus);
      }

      // Assignee filter
      if (filterAssignee !== "all") {
        result = result.filter((t) =>
          t.assignees.some((a) => a.id === filterAssignee)
        );
      }

      // Sorting
      if (sortConfigs.length > 0) {
        result.sort((a, b) => {
          for (const sort of sortConfigs) {
            const dir = sort.direction === "asc" ? 1 : -1;
            let cmp = 0;

            switch (sort.field) {
              case "title":
                cmp = a.title.localeCompare(b.title);
                break;
              case "priority": {
                const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                cmp = pOrder[a.priority] - pOrder[b.priority];
                break;
              }
              case "deadline":
                cmp = (a.deadline || "").localeCompare(b.deadline || "");
                break;
              case "status": {
                const sOrder = { todo: 0, inprogress: 1, review: 2, done: 3 };
                cmp = sOrder[a.status] - sOrder[b.status];
                break;
              }
              case "createdAt":
                cmp = a.createdAt.localeCompare(b.createdAt);
                break;
            }

            if (cmp !== 0) return cmp * dir;
          }
          return 0;
        });
      }

      return result;
    },
    [searchQuery, filterPriority, filterStatus, filterAssignee, sortConfigs]
  );

  const groupTasks = useCallback(
    (tasks: Task[]): Map<string, Task[]> => {
      const groups = new Map<string, Task[]>();

      if (groupBy.field === "none") {
        groups.set("all", tasks);
        return groups;
      }

      for (const task of tasks) {
        let key = "";
        switch (groupBy.field) {
          case "status":
            key = task.status;
            break;
          case "priority":
            key = task.priority;
            break;
          case "assignee":
            key = task.assignees.map((a) => a.name).join(", ") || "Unassigned";
            break;
          case "label":
            key = task.labels.map((l) => l.text).join(", ") || "No Label";
            break;
        }

        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(task);
      }

      return groups;
    },
    [groupBy]
  );

  return {
    viewMode,
    setViewMode,
    sortConfigs,
    addSort,
    removeSort,
    groupBy,
    setGroupBy,
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
    filterStatus,
    setFilterStatus,
    filterAssignee,
    setFilterAssignee,
    clearFilters,
    applyFiltersAndSort,
    groupTasks,
  };
}
