import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import { mapDocument } from "../../../features/work-hub/work-hub.mappers";
import { getUser } from "../../../utils/token";
import type { Document, DocumentViewMode } from "../../../types/work-hub.types";

const DocumentEditorPage = () => {
  const { workspaceId, documentId } = useParams<{
    workspaceId: string;
    documentId: string;
  }>();
  const user = getUser();

  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved",
  );
  const [viewMode, setViewMode] = useState<DocumentViewMode>("edit");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentFilter, setCommentFilter] = useState<
    "all" | "open" | "resolved"
  >("all");
  const [newComment, setNewComment] = useState("");
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [savingVersion, setSavingVersion] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  // Fetch document
  const fetchDocument = useCallback(async () => {
    if (!documentId) return;
    try {
      setLoading(true);
      const res = await workHubApi.getDocument(documentId);
      const mapped = mapDocument(res) as Document;
      setDoc(mapped);
      setTitle(mapped.title);
      setContent(mapped.content || "");
    } catch (err) {
      console.error("Failed to fetch document:", err);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const autoSaveContent = useCallback(
    (newContent: string) => {
      if (!documentId || !user?.id) return;
      setSaveStatus("unsaved");

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(async () => {
        try {
          setSaveStatus("saving");
          await workHubApi.updateDocument(documentId, {
            content: newContent,
            lastEditedById: user.id,
          });
          setSaveStatus("saved");
        } catch (err) {
          console.error("Failed to auto-save:", err);
          setSaveStatus("unsaved");
        }
      }, 1000);
    },
    [documentId, user?.id],
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (loading || viewMode !== "edit" || !editorRef.current) return;

    const quill = new Quill(editorRef.current, {
      theme: "snow",
      placeholder: "Start typing your document here...",
      modules: {
        toolbar: "#workhub-document-toolbar",
        history: {
          delay: 1000,
          maxStack: 100,
          userOnly: true,
        },
      },
    });

    quill.root.innerHTML =
      content || `<h1>${displayTitle}</h1><p>Start typing your document here...</p>`;
    quill.on("text-change", () => {
      const newContent = quill.root.innerHTML;
      setContent(newContent);
      autoSaveContent(newContent);
    });
    quillRef.current = quill;

    return () => {
      quillRef.current = null;
    };
  }, [autoSaveContent, doc?.id, loading, viewMode]);

  const handleTitleSave = async () => {
    if (!documentId || !user?.id || !title.trim()) return;
    try {
      await workHubApi.updateDocument(documentId, {
        title: title.trim(),
        lastEditedById: user.id,
      });
      setDoc((prev) => (prev ? { ...prev, title: title.trim() } : prev));
      setEditingTitle(false);
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  };

  const handleSaveVersion = async () => {
    if (!documentId || !user?.id) return;
    try {
      setSavingVersion(true);
      const latestContent = quillRef.current?.root.innerHTML ?? content;
      await workHubApi.createDocumentVersion(documentId, {
        content: latestContent,
        editedById: user.id,
        name: versionName || undefined,
      });
      setShowVersionModal(false);
      setVersionName("");
      await fetchDocument();
    } catch (err) {
      console.error("Failed to save version:", err);
    } finally {
      setSavingVersion(false);
    }
  };

  const handleAddComment = async () => {
    if (!documentId || !user?.id || !newComment.trim()) return;
    const selection = window.getSelection();
    const selectedText = selection?.toString() || "";
    try {
      await workHubApi.createInlineComment(documentId, {
        selectedText: selectedText || "(general comment)",
        text: newComment.trim(),
        authorId: user.id,
      });
      setNewComment("");
      await fetchDocument();
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      await workHubApi.resolveInlineComment(commentId);
      setDoc((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments.map((c) =>
            c.id === commentId ? { ...c, isResolved: true } : c,
          ),
        };
      });
    } catch (err) {
      console.error("Failed to resolve comment:", err);
    }
  };

  const onlineCollaborators =
    doc?.collaborators.filter((u) => u.status === "online") || [];

  const filteredComments = (doc?.comments || []).filter((c) => {
    if (commentFilter === "open") return !c.isResolved;
    if (commentFilter === "resolved") return c.isResolved;
    return true;
  });

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayTitle = doc?.title || "Untitled Document";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-wh-green-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <i className="fas fa-file-alt text-4xl text-gray-300"></i>
          <p className="font-medium text-gray-500">Document not found</p>
          <Link
            to={`/work-hub/${workspaceId}/documents`}
            className="text-sm text-wh-green-primary hover:underline"
          >
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-wh-green-border-light bg-white">
        <div className="flex items-center gap-3">
          <Link
            to={`/work-hub/${workspaceId}/documents`}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
          </Link>
          <div className="w-px h-5 bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <i className="fas fa-file-alt text-wh-green-primary"></i>
            {editingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") {
                    setTitle(doc.title);
                    setEditingTitle(false);
                  }
                }}
                className="font-semibold text-gray-900 text-sm border border-wh-green-primary rounded px-1.5 py-0.5 outline-none"
                autoFocus
              />
            ) : (
              <span
                className="font-semibold text-gray-900 text-sm cursor-pointer hover:text-wh-green-primary"
                onClick={() => setEditingTitle(true)}
                title="Click to edit title"
              >
                {displayTitle}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            {saveStatus === "saved" && (
              <>
                <i className="fas fa-cloud text-green-400"></i> Saved
              </>
            )}
            {saveStatus === "saving" && (
              <>
                <i className="fas fa-sync fa-spin text-yellow-400"></i>{" "}
                Saving...
              </>
            )}
            {saveStatus === "unsaved" && (
              <>
                <i className="fas fa-circle text-yellow-400 text-[8px]"></i>{" "}
                Unsaved
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Online collaborators */}
          <div className="flex items-center gap-1 mr-2">
            {onlineCollaborators.slice(0, 4).map((collab) => (
              <div key={collab.id} className="relative" title={collab.name}>
                <img
                  src={collab.avatar}
                  alt={collab.name}
                  className="w-7 h-7 rounded-full border-2 border-white"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white"></div>
              </div>
            ))}
            {onlineCollaborators.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-500">
                +{onlineCollaborators.length - 4}
              </div>
            )}
          </div>

          {/* View mode switcher */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {(
              [
                { key: "edit", icon: "fa-pen", tip: "Edit" },
                { key: "preview", icon: "fa-eye", tip: "Preview" },
                { key: "presentation", icon: "fa-desktop", tip: "Present" },
              ] as { key: DocumentViewMode; icon: string; tip: string }[]
            ).map((m) => (
              <button
                key={m.key}
                onClick={() => setViewMode(m.key)}
                title={m.tip}
                className={`px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  viewMode === m.key
                    ? "bg-white text-wh-green-primary shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <i className={`fas ${m.icon}`}></i>
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200"></div>

          {/* Action buttons */}
          <button
            onClick={() => setShowVersionModal(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Save Version"
          >
            <i className="fas fa-save"></i>
          </button>
          <button
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              showVersionHistory
                ? "bg-wh-green-bg-heavy text-wh-green-primary"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            title="Version History"
          >
            <i className="fas fa-history"></i>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors relative ${
              showComments
                ? "bg-wh-green-bg-heavy text-wh-green-primary"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            title="Comments"
          >
            <i className="fas fa-comment-dots"></i>
            {(doc.comments.filter((c) => !c.isResolved).length || 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                {doc.comments.filter((c) => !c.isResolved).length}
              </span>
            )}
          </button>

          <div className="w-px h-5 bg-gray-200"></div>

          <button className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <i className="fas fa-download mr-1"></i> Export
          </button>
          <button className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <i className="fas fa-share-alt mr-1"></i> Share
          </button>
        </div>
      </div>

      {/* Editor toolbar (Edit mode only) */}
      {viewMode === "edit" && (
        <div
          id="workhub-document-toolbar"
          className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex-wrap"
        >
          <div className="flex items-center gap-0.5">
            <button
              className="ql-bold p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
              title="Bold"
            />
            <button
              className="ql-italic p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
              title="Italic"
            />
            <button
              className="ql-underline p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
              title="Underline"
            />
            <button
              className="ql-strike p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
              title="Strikethrough"
            />
          </div>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>

          <select
            className="ql-header text-sm text-gray-600 bg-transparent border border-gray-200 rounded px-2 py-1 hover:bg-gray-100 cursor-pointer"
            defaultValue=""
            title="Block style"
          >
            <option value="">Paragraph</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
          </select>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>

          <select className="ql-color" title="Text color"></select>
          <select className="ql-background" title="Highlight"></select>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>

          <button
            className="ql-list p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            value="bullet"
            title="Bullet List"
          />
          <button
            className="ql-list p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            value="ordered"
            title="Numbered List"
          />
          <button
            className="ql-list p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            value="check"
            title="Checklist"
          />
          <div className="w-px h-5 bg-gray-200 mx-1"></div>

          <select className="ql-align" title="Alignment"></select>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>

          <button
            className="ql-link p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Insert Link"
          />
          <button
            className="ql-blockquote p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Quote"
          />
          <button
            className="ql-code-block p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Code Block"
          />
          <button
            className="ql-clean p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Clear Formatting"
          />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor content */}
        <div className="flex-1 overflow-auto">
          {viewMode === "edit" ? (
            <div className="max-w-3xl mx-auto py-10 px-8">
              <div
                ref={editorRef}
                className="workhub-quill min-h-[560px]"
              />
            </div>
          ) : viewMode === "preview" ? (
            <div className="max-w-3xl mx-auto py-10 px-8">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html:
                    content || `<h1>${displayTitle}</h1><p>No content yet.</p>`,
                }}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-900 text-white">
              <div className="max-w-4xl w-full p-16">
                <h1 className="text-4xl font-bold mb-6">{displayTitle}</h1>
                <div
                  className="text-xl text-gray-300"
                  dangerouslySetInnerHTML={{
                    __html: content || "Presentation mode content",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Version History Panel */}
        {showVersionHistory && (
          <div className="w-72 border-l border-wh-green-border-light bg-white overflow-y-auto">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-900">
                  Version History
                </h3>
                <button
                  onClick={() => setShowVersionHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-sm"></i>
                </button>
              </div>
            </div>
            <div className="p-3">
              {(doc.versions || []).map((version, idx) => (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    idx === 0
                      ? "bg-wh-green-bg-light border border-wh-green-border-medium"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-900">
                      {version.name || `Version ${doc.versions.length - idx}`}
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] font-semibold text-wh-green-primary bg-wh-green-bg-heavy px-1.5 py-0.5 rounded">
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <img
                      src={version.editedBy.avatar}
                      alt=""
                      className="w-4 h-4 rounded-full"
                    />
                    <span>{version.editedBy.name}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {formatDateTime(version.createdAt)}
                  </div>
                  {idx > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <button className="text-[11px] text-wh-green-primary hover:underline">
                        Restore
                      </button>
                      <button className="text-[11px] text-gray-400 hover:underline">
                        Compare
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {(doc.versions || []).length === 0 && (
                <p className="text-center text-sm text-gray-400 py-6">
                  No version history
                </p>
              )}
            </div>
          </div>
        )}

        {/* Comments Panel */}
        {showComments && (
          <div className="w-80 border-l border-wh-green-border-light bg-white overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-900">
                  Comments
                </h3>
                <button
                  onClick={() => setShowComments(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-sm"></i>
                </button>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                {(["all", "open", "resolved"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setCommentFilter(f)}
                    className={`flex-1 px-2 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                      commentFilter === f
                        ? "bg-white text-wh-green-primary shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {f === "all" ? "All" : f === "open" ? "Open" : "Resolved"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg border mb-3 ${
                    comment.isResolved
                      ? "bg-gray-50 border-gray-200 opacity-70"
                      : "bg-white border-wh-green-border-light"
                  }`}
                >
                  {/* Selected text */}
                  <div className="px-2 py-1 bg-yellow-50 border-l-2 border-yellow-400 rounded text-xs text-gray-600 mb-2 italic">
                    "{comment.selectedText}"
                  </div>

                  {/* Comment */}
                  <div className="flex items-start gap-2 mb-2">
                    <img
                      src={comment.author.avatar}
                      alt=""
                      className="w-6 h-6 rounded-full mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-900">
                          {comment.author.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {comment.text}
                      </p>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="flex items-start gap-2 ml-8 mt-2 pt-2 border-t border-gray-100"
                    >
                      <img
                        src={reply.author.avatar}
                        alt=""
                        className="w-5 h-5 rounded-full mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold text-gray-900">
                          {reply.author.name}
                        </span>
                        <p className="text-[11px] text-gray-600">
                          {reply.text}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <button className="text-[11px] text-gray-400 hover:text-wh-green-primary">
                      <i className="fas fa-reply mr-1"></i> Reply
                    </button>
                    {!comment.isResolved ? (
                      <button
                        onClick={() => handleResolveComment(comment.id)}
                        className="text-[11px] text-gray-400 hover:text-green-500"
                      >
                        <i className="fas fa-circle mr-1"></i> Resolve
                      </button>
                    ) : (
                      <span className="text-[11px] text-green-500">
                        <i className="fas fa-check-circle mr-1"></i> Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {filteredComments.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-6">
                  No {commentFilter === "all" ? "" : commentFilter} comments
                </p>
              )}
            </div>

            {/* Add comment */}
            <div className="p-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <img
                  src={user?.avatarUrl || "/avatar-user.png"}
                  alt=""
                  className="w-7 h-7 rounded-full"
                />
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddComment();
                  }}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-wh-green-primary focus:border-transparent"
                />
                <button
                  onClick={handleAddComment}
                  className="p-2 text-wh-green-primary hover:bg-wh-green-bg-light rounded-lg transition-colors"
                >
                  <i className="fas fa-paper-plane text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Save Version
              </h2>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Version Name (optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Final draft, v2.0"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wh-green-primary focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveVersion();
                }}
              />
              <p className="text-xs text-gray-400 mt-2">
                A snapshot of the current document will be saved.
              </p>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowVersionModal(false);
                  setVersionName("");
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVersion}
                disabled={savingVersion}
                className="px-4 py-2 text-sm bg-wh-green-primary text-white rounded-lg hover:bg-wh-green-primary-hover transition-colors font-medium disabled:opacity-50"
              >
                {savingVersion ? "Saving..." : "Save Version"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentEditorPage;

