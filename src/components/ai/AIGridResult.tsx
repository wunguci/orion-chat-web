import {
  AlertTriangle,
  Ban,
  Brain,
  CalendarPlus,
  CheckCircle2,
  Copy,
  FilePenLine,
  FileText,
  Flame,
  ListChecks,
  LoaderCircle,
  MessageSquareText,
  Search,
  SmilePlus,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import type { AiAction, AiCard, AiGridResponse } from "../../types/orion-ai";

const toneClass: Record<string, string> = {
  positive: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  neutral: "border-slate-200 bg-white text-slate-700",
};

const iconMap = {
  "alert-triangle": AlertTriangle,
  "calendar-plus": CalendarPlus,
  "check-circle-2": CheckCircle2,
  "file-pen-line": FilePenLine,
  "file-text": FileText,
  "list-checks": ListChecks,
  "loader-circle": LoaderCircle,
  "message-square-text": MessageSquareText,
  "wand-sparkles": WandSparkles,
  "smile-plus": SmilePlus,
  "alarm-clock": AlertTriangle,
  search: Search,
  sparkles: Sparkles,
  flame: Flame,
  ban: Ban,
  brain: Brain,
};

const resolveIcon = (name?: string) => {
  return iconMap[(name || "sparkles") as keyof typeof iconMap] || Sparkles;
};

const valueToText = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

interface AIGridResultProps {
  result: AiGridResponse;
  onClose?: () => void;
  onAction?: (action: AiAction) => void;
  compact?: boolean;
}

const AIGridResult = ({
  result,
  onClose,
  onAction,
  compact = false,
}: AIGridResultProps) => {
  const renderCard = (card: AiCard) => {
    const Icon = resolveIcon(card.icon);
    return (
      <div
        key={card.id}
        className={`rounded-lg border p-3 ${
          toneClass[card.tone || "neutral"] || toneClass.neutral
        }`}
      >
        <div className="flex items-start gap-2">
          <div className="mt-0.5 shrink-0">
            <Icon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug break-words">
              {card.title}
            </p>
            {card.subtitle && (
              <p className="mt-0.5 text-[11px] opacity-70 break-words">
                {card.subtitle}
              </p>
            )}
            {card.body && (
              <p className="mt-2 text-xs leading-relaxed opacity-90 whitespace-pre-wrap break-words">
                {card.body}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white shadow-sm ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="shrink-0 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900 break-words">
              {result.title}
            </h3>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 break-words">
            {result.summary}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {result.cards.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {result.cards.map(renderCard)}
        </div>
      )}

      {result.table && result.table.rows.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {result.table.columns.map((column) => (
                  <th key={column.key} className="px-3 py-2 font-semibold">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.table.rows.map((row, index) => (
                <tr key={index} className="text-slate-700">
                  {result.table?.columns.map((column) => (
                    <td key={column.key} className="px-3 py-2 align-top">
                      {valueToText(row[column.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.actions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {result.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={action.disabled}
              onClick={() => {
                if (action.type === "copy_text") {
                  const text = valueToText(action.payload?.text);
                  void navigator.clipboard?.writeText(text);
                }
                onAction?.(action);
              }}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {action.type === "copy_text" && <Copy size={13} />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIGridResult;
