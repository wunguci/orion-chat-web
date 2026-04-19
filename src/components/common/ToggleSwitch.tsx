import clsx from 'clsx';

function ToggleSwitch({
    checked,
    onChange,
    disabled = false,
}: {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onChange}
            disabled={disabled}
            className={clsx(
                'relative w-10 h-6 rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
                checked ? 'bg-green-primary' : 'bg-gray-300',
            )}
        >
            <div
                className={clsx(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    checked ? 'translate-x-5' : 'translate-x-1',
                )}
            />
        </button>
    );
}

export default ToggleSwitch;
