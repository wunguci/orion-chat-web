import React from 'react';
import { MdFilterList, MdExpandMore } from 'react-icons/md';

type DropdownButtonProps = {
    label: string;
    isOpen: boolean;
    onClick: () => void;
    icon?: React.ElementType;
};

const DropdownButton: React.FC<DropdownButtonProps> = ({
    label,
    isOpen,
    onClick,
    icon: Icon = MdFilterList,
}) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-(--color-border) bg-(--color-background) transition-all hover:border-(--color-success) group"
            aria-haspopup="true"
            aria-expanded={isOpen}
        >
            {/* Icon mặc định là bộ lọc */}
            <Icon className="w-5 h-5 text-(--color-text-secondary) group-hover:text-(--color-success)" />

            <span className="text-sm min-w-[80px] text-left text-(--color-text-primary)">
                {label}
            </span>

            <MdExpandMore
                size={20}
                className={`text-(--color-text-secondary) transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                }`}
            />
        </button>
    );
};

export default DropdownButton;
