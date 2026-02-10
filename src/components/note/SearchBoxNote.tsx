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
          // className="w-full pl-10 pr-4 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 transition-all dark:text-slate-200 placeholder:text-slate-400"

          className="w-full h-7 pl-10 pr-4 bg-slate-100 border-none rounded-sm text-sm transition-all placeholder:text-slate-800 "
          type="text"
          placeholder="Search notes..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
}

export default SearchBoxNote;