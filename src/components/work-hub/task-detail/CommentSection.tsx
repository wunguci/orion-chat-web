import { useState } from "react";
import type { Comment, User } from "../../../types/work-hub.types";

interface CommentSectionProps {
  comments: Comment[];
  onAdd: (text: string) => void;
  currentUser: User;
}

const CommentSection = ({ comments, onAdd, currentUser }: CommentSectionProps) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  };

  return (
    <div>
      {/* Comments list */}
      <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-800">{comment.author.name}</span>
                  <span className="text-[11px] text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 bg-[var(--wh-green-bg-light)] rounded-lg px-3 py-2">
                  {comment.text}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-400">
            <i className="fas fa-comments text-xl mb-2"></i>
            <p className="text-sm">No comments yet</p>
          </div>
        )}
      </div>

      {/* Add comment */}
      <div className="flex gap-3 pt-3 border-t border-[var(--wh-green-border-light)]">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Write a comment..."
            className="flex-1 px-3 py-2 bg-[var(--wh-green-bg-light)] border border-[var(--wh-green-border-light)] rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[var(--wh-green-primary)]"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="px-3 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg hover:bg-[var(--wh-green-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-paper-plane text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
