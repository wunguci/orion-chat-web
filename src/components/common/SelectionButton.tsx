import clsx from "clsx";
import { CircleCheck } from "lucide-react";

function SelectionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center justify-center gap-5 px-6 py-3 rounded-xl border-2 transition-colors w-full",
        selected
          ? "border-[var(--settings-primary,#22c55e)] bg-white text-[var(--settings-primary,#22c55e)]"
          : "border-[0.5px] border-[var(--settings-primary-border,#bbf7d0)] bg-white text-[var(--settings-text,#505050)] hover:border-[var(--settings-primary,#22c55e)]",
      )}
    >
      {selected && <CircleCheck size={20} className="fill-current" />}
      {label}
    </button>
  );
}

export default SelectionButton;
