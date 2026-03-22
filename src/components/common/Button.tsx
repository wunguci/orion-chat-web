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
            className={`flex items-center gap-2 ${padding} text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                variant === 'primary' || type === 'submit'
                    ? 'text-white bg-green-primary hover:bg-green-primary/90 disabled:hover:bg-green-primary'
                    : variant === 'secondary' || type === 'cancel'
                      ? 'text-gray-primary bg-white border border-gray-300 hover:bg-gray-50 disabled:hover:bg-white'
                      : 'bg-green-bg-heavy text-green-primary hover:opacity-90'
            }`}
        >
            {icon}
            {displayText}
        </button>
    );
}

export { Button };
export default Button;
