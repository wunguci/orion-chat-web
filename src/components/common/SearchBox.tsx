import type React from 'react';
import { FiSearch } from 'react-icons/fi';

interface SearchBoxProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({
    value,
    onChange,
    placeholder = 'Search...',
}) => {
    return (

        <div className="relative" onClick={(e) => e.stopPropagation()}>
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none" />
            <input
                className="w-full h-8 pl-10 pr-4 outline-none"
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

export default SearchBox;
