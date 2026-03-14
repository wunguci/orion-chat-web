import clsx from "clsx";

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={clsx(
        "relative w-10 h-6 rounded-full transition-colors",
        checked ? "bg-green-primary" : "bg-gray-300",
      )}
    >
      <div
        className={clsx(
          "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
}

export default ToggleSwitch;
