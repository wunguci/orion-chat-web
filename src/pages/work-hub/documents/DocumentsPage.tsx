import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MOCK_DOCUMENTS } from "../../../data/work-hub-mock";

type DocFilter = "all" | "favorites" | "my_docs";

const DocumentsPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DocFilter>("all");
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");

  const currentUserId = "u1";

  const filteredDocs = MOCK_DOCUMENTS.filter((doc) => {
    const matchesSearch = doc.title
      .toLowerCase()
      .includes(search.toLowerCase());
    if (filter === "favorites") return matchesSearch && doc.isFavorite;
    if (filter === "my_docs")
      return matchesSearch && doc.createdBy.id === currentUserId;
    return matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return formatDate(dateStr);
  };

  return (
    <div className="flex-1 overflow-auto bg-[var(--wh-green-bg-light)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[var(--wh-green-border-light)] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Documents</h1>
            <p className="text-sm text-[var(--wh-green-text-muted)]">
              {filteredDocs.length} documents in workspace
            </p>
          </div>
          <button
            onClick={() => setShowNewDocModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg hover:bg-[var(--wh-green-primary-hover)] transition-colors text-sm font-medium"
          >
            <i className="fas fa-plus"></i>
            New Document
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[var(--wh-green-border-medium)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wh-green-primary)] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {(
              [
                { key: "all", label: "All" },
                { key: "favorites", label: "Favorites" },
                { key: "my_docs", label: "My Docs" },
              ] as { key: DocFilter; label: string }[]
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === f.key
                    ? "bg-white text-[var(--wh-green-primary)] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <Link
              key={doc.id}
              to={`/work-hub/${workspaceId}/documents/${doc.id}`}
              className="bg-white rounded-xl border border-[var(--wh-green-border-light)] hover:border-[var(--wh-green-border-medium)] hover:shadow-md transition-all group"
            >
              {/* Card header with icon */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--wh-green-bg-medium)] flex items-center justify-center">
                    <i className="fas fa-file-alt text-[var(--wh-green-primary)] text-lg"></i>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.isFavorite && (
                      <i className="fas fa-star text-yellow-400 text-sm"></i>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all"
                    >
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-[var(--wh-green-primary)] transition-colors">
                  {doc.title}
                </h3>
                <p className="text-xs text-gray-400">
                  Edited {timeAgo(doc.updatedAt)} by {doc.lastEditedBy.name}
                </p>
              </div>

              {/* Card footer */}
              <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {/* Collaborator avatars */}
                  <div className="flex -space-x-1.5">
                    {doc.collaborators.slice(0, 3).map((user) => (
                      <img
                        key={user.id}
                        src={user.avatar}
                        alt={user.name}
                        title={user.name}
                        className="w-6 h-6 rounded-full border-2 border-white"
                      />
                    ))}
                    {doc.collaborators.length > 3 && (
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-500">
                        +{doc.collaborators.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-eye"></i> {doc.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-comment"></i> {doc.comments.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-history"></i> {doc.versions.length}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredDocs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <i className="fas fa-file-alt text-4xl mb-3 text-gray-300"></i>
            <p className="font-medium text-gray-500">No documents found</p>
            <p className="text-sm">Create a new document to get started</p>
          </div>
        )}
      </div>

      {/* New Document Modal */}
      {showNewDocModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Create New Document
              </h2>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Document Title
              </label>
              <input
                type="text"
                placeholder="Untitled Document"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--wh-green-primary)] focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewDocModal(false);
                  setNewDocTitle("");
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <Link
                to={`/work-hub/${workspaceId}/documents/new`}
                onClick={() => setShowNewDocModal(false)}
                className="px-4 py-2 text-sm bg-[var(--wh-green-primary)] text-white rounded-lg hover:bg-[var(--wh-green-primary-hover)] transition-colors font-medium"
              >
                Create & Open
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
