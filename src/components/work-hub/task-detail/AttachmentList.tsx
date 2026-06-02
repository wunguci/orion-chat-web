import type { Attachment } from "../../../types/work-hub.types";

interface AttachmentListProps {
  attachments: Attachment[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  busy?: boolean;
}

const fileIcons: Record<string, string> = {
  "image/png": "fa-file-image",
  "image/jpeg": "fa-file-image",
  "image/gif": "fa-file-image",
  "application/pdf": "fa-file-pdf",
  "text/plain": "fa-file-alt",
  "application/zip": "fa-file-archive",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const AttachmentList = ({
  attachments,
  onAdd,
  onRemove,
  busy = false,
}: AttachmentListProps) => {
  return (
    <div>
      {attachments.length > 0 ? (
        <div className="space-y-2 mb-3">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-3 p-3 bg-wh-green-bg-light border border-wh-green-border-light rounded-lg group"
            >
              <div className="w-10 h-10 rounded-lg bg-wh-green-bg-heavy flex items-center justify-center text-wh-green-primary flex-shrink-0">
                <i className={`fas ${fileIcons[att.type] || "fa-file"}`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{att.name}</p>
                <p className="text-[11px] text-gray-400">
                  {formatFileSize(att.size)} &middot; {att.uploadedBy.name} &middot;{" "}
                  {new Date(att.uploadedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => onRemove(att.id)}
                className="w-7 h-7 rounded flex items-center justify-center text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
              >
                <i className="fas fa-trash-alt text-xs"></i>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400 mb-3">
          <i className="fas fa-paperclip text-xl mb-2"></i>
          <p className="text-sm">No attachments</p>
        </div>
      )}

      <button
        onClick={onAdd}
        disabled={busy}
        className="w-full py-2 border border-dashed border-wh-green-border-medium rounded-lg text-sm text-wh-green-text-muted hover:text-wh-green-primary hover:border-wh-green-primary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        <i className={`fas ${busy ? "fa-spinner fa-spin" : "fa-plus"} mr-2`}></i>
        {busy ? "Uploading..." : "Add Attachment"}
      </button>
    </div>
  );
};

export default AttachmentList;

