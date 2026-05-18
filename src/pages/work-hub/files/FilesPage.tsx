import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import { mapWorkspaceFile } from "../../../features/work-hub/work-hub.mappers";
import type { FileItem } from "../../../types/work-hub.types";

const FilesPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<
    { id: string | null; name: string }[]
  >([{ id: null, name: "Files" }]);
  const [search, setSearch] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileFormat, setNewFileFormat] = useState<"docx" | "doc" | "xlsx">(
    "docx",
  );
  const [creatingFile, setCreatingFile] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(
    null,
  );
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploadMimeType, setUploadMimeType] = useState("");
  const [uploadSize, setUploadSize] = useState("");
  const [uploading, setUploading] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    fileId: string;
    x: number;
    y: number;
  } | null>(null);

  const fetchFiles = useCallback(
    async (parentId?: string | null) => {
      if (!workspaceId) return;
      try {
        setLoading(true);
        const res = await workHubApi.getWorkspaceFiles(
          workspaceId,
          parentId ?? undefined,
        );
        const mapped = (res ?? []).map(mapWorkspaceFile);
        setFiles(mapped);
      } catch (err) {
        console.error("Failed to fetch files:", err);
      } finally {
        setLoading(false);
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    fetchFiles(currentFolderId);
  }, [fetchFiles, currentFolderId]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setSelectedFiles([]);
    setBreadcrumbs((prev) => [...prev, { id: folderId, name: folderName }]);
  };

  const navigateToBreadcrumb = (bcId: string | null, bcIndex: number) => {
    setCurrentFolderId(bcId);
    setSelectedFiles([]);
    setBreadcrumbs((prev) => prev.slice(0, bcIndex + 1));
  };

  const handleCreateFolder = async () => {
    if (!workspaceId || !newFolderName.trim()) return;
    try {
      setCreatingFolder(true);
      await workHubApi.createWorkspaceFolder(workspaceId, {
        name: newFolderName.trim(),
        parentId: currentFolderId ?? undefined,
      });
      setShowNewFolderModal(false);
      setNewFolderName("");
      await fetchFiles(currentFolderId);
    } catch (err) {
      console.error("Failed to create folder:", err);
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleUploadFile = async () => {
    if (!workspaceId || (!selectedUploadFile && !uploadName.trim())) return;
    try {
      setUploading(true);
      if (selectedUploadFile) {
        await workHubApi.uploadWorkspaceFile(workspaceId, selectedUploadFile, {
          parentId: currentFolderId ?? undefined,
        });
      } else {
        await workHubApi.createWorkspaceFile(workspaceId, {
          name: uploadName.trim(),
          mimeType: uploadMimeType || undefined,
          size: uploadSize ? Number(uploadSize) : undefined,
          url: uploadUrl || undefined,
          parentId: currentFolderId ?? undefined,
        });
      }
      setShowUploadModal(false);
      setSelectedUploadFile(null);
      setUploadName("");
      setUploadUrl("");
      setUploadMimeType("");
      setUploadSize("");
      await fetchFiles(currentFolderId);
    } catch (err) {
      console.error("Failed to upload file:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await workHubApi.deleteWorkspaceFile(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      setSelectedFiles((prev) => prev.filter((id) => id !== fileId));
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(
        selectedFiles.map((id) => workHubApi.deleteWorkspaceFile(id)),
      );
      setSelectedFiles([]);
      await fetchFiles(currentFolderId);
    } catch (err) {
      console.error("Failed to delete files:", err);
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameTarget.name.trim()) return;
    try {
      await workHubApi.updateWorkspaceFile(renameTarget.id, {
        name: renameTarget.name.trim(),
      });
      setRenameTarget(null);
      await fetchFiles(currentFolderId);
    } catch (err) {
      console.error("Failed to rename file:", err);
    }
  };

  const currentFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Compute storage stats from files
  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

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
      return { icon: "fa-file-code", color: "#0d9488" };
    return { icon: "fa-file", color: "#9ca3af" };
  };

  const toggleSelect = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const handleCreateFile = async () => {
    if (!workspaceId || !newFileName.trim()) return;
    try {
      setCreatingFile(true);
      await workHubApi.createWorkspaceFile(workspaceId, {
        name: newFileName.trim(),
        fileFormat: newFileFormat,
        parentId: currentFolderId ?? undefined,
      });
      setShowNewFileModal(false);
      setNewFileName("");
      setNewFileFormat("docx");
      await fetchFiles(currentFolderId);
    } catch (err) {
      console.error("Failed to create file:", err);
    } finally {
      setCreatingFile(false);
    }
  };

  const resetUploadForm = () => {
    setShowUploadModal(false);
    setSelectedUploadFile(null);
    setUploadName("");
    setUploadUrl("");
    setUploadMimeType("");
    setUploadSize("");
  };

  const isOfficeEditableFile = (item: FileItem) => {
    const extension = item.name.split(".").pop()?.toLowerCase();
    if (extension === "doc" || extension === "docx" || extension === "xlsx") {
      return true;
    }

    const mime = item.mimeType || "";
    return (
      mime.includes("word") ||
      mime.includes("msword") ||
      mime.includes("spreadsheet") ||
      mime.includes("excel")
    );
  };

  const openFile = (item: FileItem) => {
    if (item.type === "folder") {
      navigateToFolder(item.id, item.name);
      return;
    }

    if (workspaceId && isOfficeEditableFile(item)) {
      navigate(`/work-hub/${workspaceId}/files/${item.id}/edit`);
      return;
    }

    if (item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="flex-1 overflow-auto bg-wh-green-bg-light">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-wh-green-border-light px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Files</h1>
            <p className="text-sm text-wh-green-text-muted">
              Centralized file storage for workspace
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewFileModal(true)}
              className="flex items-center gap-2 px-3 py-2 border border-wh-green-border-medium text-wh-green-primary rounded-lg hover:bg-wh-green-bg-light transition-colors text-sm font-medium"
            >
              <i className="fas fa-file-circle-plus"></i>
              New File
            </button>
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="flex items-center gap-2 px-3 py-2 border border-wh-green-border-medium text-wh-green-primary rounded-lg hover:bg-wh-green-bg-light transition-colors text-sm font-medium"
            >
              <i className="fas fa-folder-plus"></i>
              New Folder
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-wh-green-primary text-white rounded-lg hover:bg-wh-green-primary-hover transition-colors text-sm font-medium"
            >
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
                  onClick={() => navigateToBreadcrumb(bc.id, idx)}
                  className={`px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors ${
                    idx === breadcrumbs.length - 1
                      ? "text-gray-900 font-medium"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {idx === 0 && (
                    <i className="fas fa-hdd mr-1.5 text-wh-green-primary"></i>
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
                className="pl-9 pr-4 py-2 border border-wh-green-border-medium rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wh-green-primary focus:border-transparent w-56"
              />
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md text-sm transition-colors ${viewMode === "grid" ? "bg-white text-wh-green-primary shadow-sm" : "text-gray-400"}`}
              >
                <i className="fas fa-th-large"></i>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md text-sm transition-colors ${viewMode === "list" ? "bg-white text-wh-green-primary shadow-sm" : "text-gray-400"}`}
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-wh-green-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Loading files...</p>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {/* Storage bar */}
          <div className="bg-white rounded-xl border border-wh-green-border-light p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Current Folder
              </span>
              <span className="text-sm text-gray-500">
                {currentFiles.length} items &middot; {formatSize(totalSize)}{" "}
                total
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all bg-wh-green-primary"
                style={{
                  width: `${Math.min((totalSize / (5 * 1073741824)) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Selected actions */}
          {selectedFiles.length > 0 && (
            <div className="bg-wh-green-bg-medium rounded-xl p-3 mb-4 flex items-center justify-between">
              <span className="text-sm text-wh-green-text-primary font-medium">
                {selectedFiles.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-xs text-gray-600 hover:bg-white rounded-lg transition-colors">
                  <i className="fas fa-download mr-1"></i> Download
                </button>
                <button className="px-3 py-1.5 text-xs text-gray-600 hover:bg-white rounded-lg transition-colors">
                  <i className="fas fa-arrows-alt mr-1"></i> Move
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="px-3 py-1.5 text-xs text-red-500 hover:bg-white rounded-lg transition-colors"
                >
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
                    onClick={() => openFile(item)}
                    className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md group ${
                      isSelected
                        ? "border-wh-green-primary ring-2 ring-wh-green-primary/20"
                        : "border-wh-green-border-light hover:border-wh-green-border-medium"
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
                          const rect = e.currentTarget.getBoundingClientRect();
                          setContextMenu({
                            fileId: item.id,
                            x: rect.right,
                            y: rect.bottom,
                          });
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
                      <p className="text-xs text-gray-400">Folder</p>
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
            <div className="bg-white rounded-xl border border-wh-green-border-light overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-semibold">Name</th>
                    <th className="text-left px-4 py-3 font-semibold">Size</th>
                    <th className="text-left px-4 py-3 font-semibold">
                      Uploaded By
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">Date</th>
                    <th className="text-left px-4 py-3 font-semibold">
                      Access
                    </th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentFiles.map((item) => {
                    const fi = getFileIcon(item);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => openFile(item)}
                        className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedFiles.includes(item.id)
                            ? "bg-wh-green-bg-light"
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
                            : "Folder"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {item.uploadedBy?.name || "\u2014"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(item.uploadedAt)}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setContextMenu({
                                fileId: item.id,
                                x: rect.right,
                                y: rect.bottom,
                              });
                            }}
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
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              const file = files.find((f) => f.id === contextMenu.fileId);
              if (file) openFile(file);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <i className="fas fa-external-link-alt w-4 text-gray-400"></i>
            Open
          </button>
          <button
            onClick={() => {
              const file = files.find((f) => f.id === contextMenu.fileId);
              if (file) {
                setRenameTarget({ id: file.id, name: file.name });
              }
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <i className="fas fa-pen w-4 text-gray-400"></i>
            Rename
          </button>
          <button
            onClick={() => {
              handleDeleteFile(contextMenu.fileId);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <i className="fas fa-trash w-4"></i>
            Delete
          </button>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Create New Folder
              </h2>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Folder Name
              </label>
              <input
                type="text"
                placeholder="New Folder"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wh-green-primary focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                }}
              />
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName("");
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={creatingFolder}
                className="px-4 py-2 text-sm bg-wh-green-primary text-white rounded-lg hover:bg-wh-green-primary-hover transition-colors font-medium disabled:opacity-50"
              >
                {creatingFolder ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Create New File
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  File Name
                </label>
                <input
                  type="text"
                  placeholder="Project brief"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wh-green-primary focus:border-transparent"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFile();
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "docx", label: "DOCX" },
                    { value: "doc", label: "DOC" },
                    { value: "xlsx", label: "Excel" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setNewFileFormat(option.value as "docx" | "doc" | "xlsx")
                      }
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        newFileFormat === option.value
                          ? "border-wh-green-primary bg-wh-green-bg-heavy text-wh-green-primary"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewFileModal(false);
                  setNewFileName("");
                  setNewFileFormat("docx");
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFile}
                disabled={creatingFile || !newFileName.trim()}
                className="px-4 py-2 text-sm bg-wh-green-primary text-white rounded-lg hover:bg-wh-green-primary-hover transition-colors font-medium disabled:opacity-50"
              >
                {creatingFile ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Upload File
              </h2>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Local File
                </label>
                <input
                  key={selectedUploadFile ? "file-selected" : "file-empty"}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setSelectedUploadFile(file);
                    if (file) {
                      setUploadName(file.name);
                      setUploadMimeType(file.type);
                      setUploadSize(String(file.size));
                      setUploadUrl("");
                    }
                  }}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-wh-green-bg-heavy file:px-3 file:py-2 file:text-sm file:font-medium file:text-wh-green-primary hover:file:bg-wh-green-bg-medium"
                />
                {selectedUploadFile && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    <span className="truncate">{selectedUploadFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUploadFile(null);
                        setUploadName("");
                        setUploadMimeType("");
                        setUploadSize("");
                      }}
                      className="ml-3 text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-100"></div>
                <span className="text-xs text-gray-400">or save link</span>
                <div className="h-px flex-1 bg-gray-100"></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  File Name
                </label>
                <input
                  type="text"
                  placeholder="document.pdf"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wh-green-primary focus:border-transparent"
                  disabled={!!selectedUploadFile}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  File URL
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wh-green-primary focus:border-transparent"
                  disabled={!!selectedUploadFile}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    MIME Type
                  </label>
                  <input
                    type="text"
                    placeholder="application/pdf"
                    value={uploadMimeType}
                    onChange={(e) => setUploadMimeType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wh-green-primary focus:border-transparent"
                    disabled={!!selectedUploadFile}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Size (bytes)
                  </label>
                  <input
                    type="number"
                    placeholder="1024"
                    value={uploadSize}
                    onChange={(e) => setUploadSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wh-green-primary focus:border-transparent"
                    disabled={!!selectedUploadFile}
                  />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={resetUploadForm}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadFile}
                disabled={
                  uploading || (!selectedUploadFile && !uploadName.trim())
                }
                className="px-4 py-2 text-sm bg-wh-green-primary text-white rounded-lg hover:bg-wh-green-primary-hover transition-colors font-medium disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Rename</h2>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                New Name
              </label>
              <input
                type="text"
                value={renameTarget.name}
                onChange={(e) =>
                  setRenameTarget({ ...renameTarget, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wh-green-primary focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setRenameTarget(null);
                }}
              />
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setRenameTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                className="px-4 py-2 text-sm bg-wh-green-primary text-white rounded-lg hover:bg-wh-green-primary-hover transition-colors font-medium"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesPage;

