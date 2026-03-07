import { useState } from "react";
import { MOCK_FILES, MOCK_STORAGE_STATS } from "../../../data/work-hub-mock";
import type { FileItem } from "../../../types/work-hub.types";

const FilesPage = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const allFiles = MOCK_FILES;
  const stats = MOCK_STORAGE_STATS;

  // Flatten to get files in current folder
  const getCurrentFiles = (): FileItem[] => {
    if (currentFolderId === null) {
      return allFiles.filter((f) => f.parentId === null);
    }
    const folder = allFiles.find((f) => f.id === currentFolderId);
    return folder?.children || [];
  };

  const currentFiles = getCurrentFiles().filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );

  const breadcrumbs: { id: string | null; name: string }[] = [
    { id: null, name: "Files" },
  ];
  if (currentFolderId) {
    const folder = allFiles.find((f) => f.id === currentFolderId);
    if (folder) breadcrumbs.push({ id: folder.id, name: folder.name });
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    return (bytes / 1073741824).toFixed(1) + " GB";
  };

  const getFileIcon = (item: FileItem) => {
    if (item.type === "folder") return { icon: "fa-folder", color: "#F59E0B" };
    const mime = item.mimeType || "";
    if (mime.startsWith("image/"))
      return { icon: "fa-file-image", color: "#8b5cf6" };
    if (mime.includes("pdf")) return { icon: "fa-file-pdf", color: "#ef4444" };
    if (mime.includes("word") || mime.includes("document"))
      return { icon: "fa-file-word", color: "#3b82f6" };
    if (mime.includes("sheet") || mime.includes("excel"))
      return { icon: "fa-file-excel", color: "#10b981" };
    if (mime.includes("presentation") || mime.includes("powerpoint"))
      return { icon: "fa-file-powerpoint", color: "#f97316" };
    if (mime.startsWith("video/"))
      return { icon: "fa-file-video", color: "#ec4899" };
    if (mime.includes("zip") || mime.includes("archive"))
      return { icon: "fa-file-archive", color: "#6b7280" };
    if (mime.includes("yaml") || mime.includes("json") || mime.includes("text"))
      return { icon: "fa-file-code", color: "#226262" };
    return { icon: "fa-file", color: "#9ca3af" };
  };

  const toggleSelect = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const usedPercent = (stats.usedBytes / stats.limitBytes) * 100;

  return (
    <div className="flex-1 overflow-auto bg-[var(--wh-green-bg-light)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[var(--wh-green-border-light)] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Files</h1>
            <p className="text-sm text-[var(--wh-green-text-muted)]">
              Centralized file storage for workspace
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-[var(--wh-green-border-medium)] text-[var(--wh-green-primary)] rounded-lg hover:bg-[var(--wh-green-bg-light)] transition-colors text-sm font-medium">
              <i className="fas fa-folder-plus"></i>
              New Folder
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg hover:bg-[var(--wh-green-primary-hover)] transition-colors text-sm font-medium">
              <i className="fas fa-cloud-upload-alt"></i>
              Upload
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((bc, idx) => (
              <div key={bc.id || "root"} className="flex items-center gap-1">
                {idx > 0 && (
                  <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
                )}
                <button
                  onClick={() => setCurrentFolderId(bc.id)}
                  className={`px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors ${
                    idx === breadcrumbs.length - 1
                      ? "text-gray-900 font-medium"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {idx === 0 && (
                    <i className="fas fa-hdd mr-1.5 text-[var(--wh-green-primary)]"></i>
                  )}
                  {bc.name}
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-[var(--wh-green-border-medium)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wh-green-primary)] focus:border-transparent w-56"
              />
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md text-sm transition-colors ${viewMode === "grid" ? "bg-white text-[var(--wh-green-primary)] shadow-sm" : "text-gray-400"}`}
              >
                <i className="fas fa-th-large"></i>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md text-sm transition-colors ${viewMode === "list" ? "bg-white text-[var(--wh-green-primary)] shadow-sm" : "text-gray-400"}`}
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Storage bar */}
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Storage Usage
            </span>
            <span className="text-sm text-gray-500">
              {formatSize(stats.usedBytes)} / {formatSize(stats.limitBytes)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${usedPercent}%`,
                backgroundColor:
                  usedPercent > 80
                    ? "var(--wh-priority-critical)"
                    : "var(--wh-green-primary)",
              }}
            ></div>
          </div>
        </div>

        {/* Selected actions */}
        {selectedFiles.length > 0 && (
          <div className="bg-[var(--wh-green-bg-medium)] rounded-xl p-3 mb-4 flex items-center justify-between">
            <span className="text-sm text-[var(--wh-green-text-primary)] font-medium">
              {selectedFiles.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs text-gray-600 hover:bg-white rounded-lg transition-colors">
                <i className="fas fa-download mr-1"></i> Download
              </button>
              <button className="px-3 py-1.5 text-xs text-gray-600 hover:bg-white rounded-lg transition-colors">
                <i className="fas fa-arrows-alt mr-1"></i> Move
              </button>
              <button className="px-3 py-1.5 text-xs text-red-500 hover:bg-white rounded-lg transition-colors">
                <i className="fas fa-trash mr-1"></i> Delete
              </button>
            </div>
          </div>
        )}

        {/* File Grid or List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {currentFiles.map((item) => {
              const fi = getFileIcon(item);
              const isSelected = selectedFiles.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() =>
                    item.type === "folder"
                      ? setCurrentFolderId(item.id)
                      : toggleSelect(item.id)
                  }
                  className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md group ${
                    isSelected
                      ? "border-[var(--wh-green-primary)] ring-2 ring-[var(--wh-green-primary)]/20"
                      : "border-[var(--wh-green-border-light)] hover:border-[var(--wh-green-border-medium)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <i
                      className={`fas ${fi.icon} text-2xl`}
                      style={{ color: fi.color }}
                    ></i>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all p-1 rounded hover:bg-gray-100"
                    >
                      <i className="fas fa-ellipsis-v text-xs"></i>
                    </button>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate mb-1">
                    {item.name}
                  </p>
                  {item.type === "file" ? (
                    <p className="text-xs text-gray-400">
                      {formatSize(item.size || 0)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      {item.children?.length || 0} items
                    </p>
                  )}
                  {item.type === "file" && item.uploadedBy && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <img
                        src={item.uploadedBy.avatar}
                        alt=""
                        className="w-4 h-4 rounded-full"
                      />
                      <span className="text-[11px] text-gray-400">
                        {item.uploadedBy.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Size</th>
                  <th className="text-left px-4 py-3 font-semibold">
                    Uploaded By
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Access</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {currentFiles.map((item) => {
                  const fi = getFileIcon(item);
                  return (
                    <tr
                      key={item.id}
                      onClick={() =>
                        item.type === "folder"
                          ? setCurrentFolderId(item.id)
                          : toggleSelect(item.id)
                      }
                      className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedFiles.includes(item.id)
                          ? "bg-[var(--wh-green-bg-light)]"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <i
                            className={`fas ${fi.icon}`}
                            style={{ color: fi.color }}
                          ></i>
                          <span className="text-sm font-medium text-gray-900">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.type === "file"
                          ? formatSize(item.size || 0)
                          : `${item.children?.length || 0} items`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.uploadedBy?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.uploadedAt}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            item.accessLevel === "workspace"
                              ? "bg-green-50 text-green-600"
                              : item.accessLevel === "admin_only"
                                ? "bg-red-50 text-red-600"
                                : "bg-yellow-50 text-yellow-600"
                          }`}
                        >
                          {item.accessLevel === "workspace"
                            ? "Workspace"
                            : item.accessLevel === "admin_only"
                              ? "Admin"
                              : "Specific"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                        >
                          <i className="fas fa-ellipsis-v text-xs"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {currentFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <i className="fas fa-folder-open text-4xl mb-3 text-gray-300"></i>
            <p className="font-medium text-gray-500">No files found</p>
            <p className="text-sm">
              Upload files or create folders to organize your workspace
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilesPage;
