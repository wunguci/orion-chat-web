import type { SortConfig } from "../../../types/work-hub.types";

interface ListHeaderProps {
  sortConfig: SortConfig[];
  onSort: (field: string) => void;
}

const columns = [
  { field: "title", label: "Title", width: "flex-1" },
  { field: "status", label: "Status", width: "w-28" },
  { field: "priority", label: "Priority", width: "w-24" },
  { field: "assignees", label: "Assignees", width: "w-28" },
  { field: "deadline", label: "Deadline", width: "w-28" },
  { field: "progress", label: "Progress", width: "w-24" },
];

const ListHeader = ({ sortConfig, onSort }: ListHeaderProps) => {
  const getSortIcon = (field: string) => {
    const sort = sortConfig.find((s) => s.field === field);
    if (!sort) return "fa-sort";
    return sort.direction === "asc" ? "fa-sort-up" : "fa-sort-down";
  };

  const isActive = (field: string) => sortConfig.some((s) => s.field === field);

  return (
    <div className="flex items-center bg-wh-green-bg-heavy px-4 py-2.5 rounded-t-lg border-b border-wh-green-border-light">
      {columns.map((col) => (
        <button
          key={col.field}
          onClick={() => onSort(col.field)}
          className={`${col.width} flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            isActive(col.field)
              ? "text-wh-green-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {col.label}
          <i className={`fas ${getSortIcon(col.field)} text-[10px]`}></i>
        </button>
      ))}
    </div>
  );
};

export default ListHeader;

