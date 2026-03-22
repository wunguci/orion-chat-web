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
          ? "border-green-primary bg-white text-green-primary"
          : "border-[0.5px] border-green-border-light bg-white text-gray-primary hover:border-gray-300",
      )}
    >
      {selected && <CircleCheck size={20} className="fill-current" />}
      {label}
    </button>
  );
}

export default SelectionButton;
