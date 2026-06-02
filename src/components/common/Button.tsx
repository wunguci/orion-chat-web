interface Button {
    label?: string;
    children?: React.ReactNode;
    onClick?: () => void | Promise<void>;
    icon?: React.ReactNode;
    type?: 'submit' | 'cancel' | 'current';
    padding?: string;
    variant?: string;
    disabled?: boolean;
}
function Button({
    label,
    children,
    onClick,
    icon,
    type = 'submit',
    padding = 'px-4 py-2',
    variant = 'submit',
    disabled = false,
}: Button) {
    const displayText = children || label;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-2 ${padding} text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                variant === 'primary' || type === 'submit'
                    ? 'text-white bg-[var(--settings-primary,#22c55e)] hover:bg-[var(--settings-primary-hover,#16a34a)] disabled:hover:bg-[var(--settings-primary,#22c55e)]'
                    : variant === 'secondary' || type === 'cancel'
                      ? 'text-[var(--settings-text,#505050)] bg-white border border-gray-300 hover:bg-gray-50 disabled:hover:bg-white'
                      : 'bg-[var(--settings-primary-bg,#dcfce7)] text-[var(--settings-primary,#22c55e)] hover:opacity-90'
            }`}
        >
            {icon}
            {displayText}
        </button>
    );
}

export { Button };
export default Button;
