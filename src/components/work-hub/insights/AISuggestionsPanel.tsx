import type { AISuggestion } from "../../../types/work-hub.types";

interface AISuggestionsPanelProps {
  suggestions: AISuggestion[];
}

const typeIcons: Record<string, string> = {
  reassign: "fa-user-plus",
  deadline: "fa-calendar-alt",
  priority: "fa-flag",
  split: "fa-code-branch",
};

const typeColors: Record<string, string> = {
  reassign: "#3b82f6",
  deadline: "#F59E0B",
  priority: "#f97316",
  split: "#8b5cf6",
};

const AISuggestionsPanel = ({ suggestions }: AISuggestionsPanelProps) => {
  return (
    <div className="bg-white border border-wh-green-border-light rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">
        <i className="fas fa-magic mr-2 text-purple-500"></i>
        AI Suggestions
      </h3>

      {suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const color = typeColors[suggestion.type] || "#0d9488";
            return (
              <div
                key={suggestion.id}
                className="p-3 bg-wh-green-bg-light border border-wh-green-border-light rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    <i
                      className={`fas ${typeIcons[suggestion.type] || "fa-lightbulb"} text-sm`}
                    ></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">
                      {suggestion.title}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">
                      {suggestion.description}
                    </p>
                    <button
                      className="text-xs font-medium px-3 py-1 rounded-lg text-white transition-colors hover:opacity-90"
                      style={{ backgroundColor: color }}
                    >
                      {suggestion.actionLabel}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400">
          <i className="fas fa-robot text-xl mb-2"></i>
          <p className="text-sm">No suggestions available</p>
        </div>
      )}
    </div>
  );
};

export default AISuggestionsPanel;

