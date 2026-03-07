import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MOCK_DOCUMENTS, MOCK_USERS } from "../../../data/work-hub-mock";
import type { DocumentViewMode } from "../../../types/work-hub.types";

const DocumentEditorPage = () => {
  const { workspaceId, documentId } = useParams<{
    workspaceId: string;
    documentId: string;
  }>();
  const doc = MOCK_DOCUMENTS.find((d) => d.id === documentId);

  const [viewMode, setViewMode] = useState<DocumentViewMode>("edit");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentFilter, setCommentFilter] = useState<
    "all" | "open" | "resolved"
  >("all");

  const title = doc?.title || "Untitled Document";

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

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--wh-green-border-light)] bg-white">
        <div className="flex items-center gap-3">
          <Link
            to={`/work-hub/${workspaceId}/documents`}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
          </Link>
          <div className="w-px h-5 bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <i className="fas fa-file-alt text-[var(--wh-green-primary)]"></i>
            <span className="font-semibold text-gray-900 text-sm">{title}</span>
          </div>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <i className="fas fa-cloud text-green-400"></i> Saved
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Online collaborators */}
          <div className="flex items-center gap-1 mr-2">
            {onlineCollaborators.slice(0, 4).map((user) => (
              <div key={user.id} className="relative" title={user.name}>
                <img
                  src={user.avatar}
                  alt={user.name}
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
                    ? "bg-white text-[var(--wh-green-primary)] shadow-sm"
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
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              showVersionHistory
                ? "bg-[var(--wh-green-bg-heavy)] text-[var(--wh-green-primary)]"
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
                ? "bg-[var(--wh-green-bg-heavy)] text-[var(--wh-green-primary)]"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            title="Comments"
          >
            <i className="fas fa-comment-dots"></i>
            {(doc?.comments.filter((c) => !c.isResolved).length || 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                {doc?.comments.filter((c) => !c.isResolved).length}
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
        <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex-wrap">
          {/* Text formatting */}
          <div className="flex items-center gap-0.5">
            <button
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
              title="Bold"
            >
              <i className="fas fa-bold"></i>
            </button>
            <button
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
              title="Italic"
            >
              <i className="fas fa-italic"></i>
            </button>
            <button
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
              title="Underline"
            >
              <i className="fas fa-underline"></i>
            </button>
            <button
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
              title="Strikethrough"
            >
              <i className="fas fa-strikethrough"></i>
            </button>
          </div>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>

          {/* Heading */}
          <select className="text-sm text-gray-600 bg-transparent border border-gray-200 rounded px-2 py-1 hover:bg-gray-100 cursor-pointer">
            <option>Paragraph</option>
            <option>Heading 1</option>
            <option>Heading 2</option>
            <option>Heading 3</option>
            <option>Heading 4</option>
            <option>Heading 5</option>
            <option>Heading 6</option>
          </select>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>

          {/* Colors */}
          <button
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Text Color"
          >
            <i className="fas fa-font"></i>
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Highlight"
          >
            <i className="fas fa-highlighter"></i>
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>

          {/* Lists */}
          <button
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Bullet List"
          >
            <i className="fas fa-list-ul"></i>
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Numbered List"
          >
            <i className="fas fa-list-ol"></i>
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Checklist"
          >
            <i className="fas fa-tasks"></i>
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>

          {/* Alignment */}
          <button
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Align Left"
          >
            <i className="fas fa-align-left"></i>
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Align Center"
          >
            <i className="fas fa-align-center"></i>
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Align Right"
          >
            <i className="fas fa-align-right"></i>
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>

          {/* Insert */}
          <button
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Insert Image"
          >
            <i className="fas fa-image"></i>
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Insert Table"
          >
            <i className="fas fa-table"></i>
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Insert Link"
          >
            <i className="fas fa-link"></i>
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Code Block"
          >
            <i className="fas fa-code"></i>
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-sm w-8 h-8"
            title="Divider"
          >
            <i className="fas fa-minus"></i>
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-200 text-[var(--wh-green-primary)] text-sm w-8 h-8"
            title="Embed Task Link"
          >
            <i className="fas fa-clipboard-check"></i>
          </button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor content */}
        <div className="flex-1 overflow-auto">
          {viewMode === "edit" ? (
            <div className="max-w-3xl mx-auto py-10 px-8">
              <div
                className="prose prose-sm max-w-none min-h-[500px] outline-none"
                contentEditable
                suppressContentEditableWarning
              >
                <h1>{title}</h1>
                <p>Start typing your document here...</p>
                <p></p>
                <h2>Section 1</h2>
                <p>
                  Add your content. You can format text, insert images, tables,
                  and more using the toolbar above.
                </p>
                <ul>
                  <li>List item 1</li>
                  <li>List item 2</li>
                  <li>List item 3</li>
                </ul>
                <p></p>
                <h2>Section 2</h2>
                <p>Continue writing your document...</p>
                <blockquote>
                  <p>
                    You can add quotes, code blocks, and other rich content.
                  </p>
                </blockquote>
              </div>
            </div>
          ) : viewMode === "preview" ? (
            <div className="max-w-3xl mx-auto py-10 px-8">
              <div className="prose prose-sm max-w-none">
                <h1>{title}</h1>
                <p>Start typing your document here...</p>
                <h2>Section 1</h2>
                <p>
                  Add your content. You can format text, insert images, tables,
                  and more using the toolbar above.
                </p>
                <ul>
                  <li>List item 1</li>
                  <li>List item 2</li>
                  <li>List item 3</li>
                </ul>
                <h2>Section 2</h2>
                <p>Continue writing your document...</p>
                <blockquote>
                  <p>
                    You can add quotes, code blocks, and other rich content.
                  </p>
                </blockquote>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-900 text-white">
              <div className="max-w-4xl w-full p-16">
                <h1 className="text-4xl font-bold mb-6">{title}</h1>
                <p className="text-xl text-gray-300">
                  Presentation mode content
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Version History Panel */}
        {showVersionHistory && (
          <div className="w-72 border-l border-[var(--wh-green-border-light)] bg-white overflow-y-auto">
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
              {(doc?.versions || []).map((version, idx) => (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    idx === 0
                      ? "bg-[var(--wh-green-bg-light)] border border-[var(--wh-green-border-medium)]"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-900">
                      {version.name || `Version ${doc!.versions.length - idx}`}
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] font-semibold text-[var(--wh-green-primary)] bg-[var(--wh-green-bg-heavy)] px-1.5 py-0.5 rounded">
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
                      <button className="text-[11px] text-[var(--wh-green-primary)] hover:underline">
                        Restore
                      </button>
                      <button className="text-[11px] text-gray-400 hover:underline">
                        Compare
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {(doc?.versions || []).length === 0 && (
                <p className="text-center text-sm text-gray-400 py-6">
                  No version history
                </p>
              )}
            </div>
          </div>
        )}

        {/* Comments Panel */}
        {showComments && (
          <div className="w-80 border-l border-[var(--wh-green-border-light)] bg-white overflow-y-auto flex flex-col">
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
                        ? "bg-white text-[var(--wh-green-primary)] shadow-sm"
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
                      : "bg-white border-[var(--wh-green-border-light)]"
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
                    <button className="text-[11px] text-gray-400 hover:text-[var(--wh-green-primary)]">
                      <i className="fas fa-reply mr-1"></i> Reply
                    </button>
                    <button
                      className={`text-[11px] ${comment.isResolved ? "text-green-500" : "text-gray-400 hover:text-green-500"}`}
                    >
                      <i
                        className={`fas ${comment.isResolved ? "fa-check-circle" : "fa-circle"} mr-1`}
                      ></i>
                      {comment.isResolved ? "Resolved" : "Resolve"}
                    </button>
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
                  src={MOCK_USERS[0].avatar}
                  alt=""
                  className="w-7 h-7 rounded-full"
                />
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[var(--wh-green-primary)] focus:border-transparent"
                />
                <button className="p-2 text-[var(--wh-green-primary)] hover:bg-[var(--wh-green-bg-light)] rounded-lg transition-colors">
                  <i className="fas fa-paper-plane text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentEditorPage;
