import type React from "react";
import { FiSearch } from "react-icons/fi";

interface SearchBoxNoteProps {
    value: string;
    onChange: (value: string) => void;
}

const SearchBoxNote: React.FC<SearchBoxNoteProps> = ({value, onChange}) => {
    return (
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]" />
        <input
          className="w-full h-8 pl-10 pr-4 bg-slate-100 border-none outline-none appearance-none shadow-none ring-0
          focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 rounded-sm text-sm transition-all placeholder:text-slate-800"
          type="text"
          placeholder="Search notes..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
}

export default SearchBoxNote;