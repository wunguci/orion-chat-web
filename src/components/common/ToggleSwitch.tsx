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
        "relative w-14 h-8 rounded-full transition-colors",
        checked ? "bg-orange-primary" : "bg-gray-300",
      )}
    >
      <div
        className={clsx(
          "absolute top-1 w-6 h-6 rounded-full bg-white transition-transform",
          checked ? "translate-x-7" : "translate-x-1",
        )}
      />
    </button>
  );
}

export default ToggleSwitch;
