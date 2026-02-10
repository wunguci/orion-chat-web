import type React from "react";
import { MdCategory, MdExpandMore } from "react-icons/md";

interface CategoryNoteSelectorProps {
    activeCategory: string;
    categories: string[];
    onSelect: (cat: string) => void;
    onAdd: (cat: string) => void;
}

const CategoryNoteSelector: React.FC<CategoryNoteSelectorProps> = ({ activeCategory, categories, onSelect, onAdd }) => {
  return (
    <div className="relative group/cat">
      <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-100 border border-slate-100 transition-all">
        <MdCategory className="text-[18px] text-teal-500" />
        <span className="text-[14px] font-bold text-slate-700 uppercase tracking-wide">{activeCategory}</span>
        <MdExpandMore className="text-[25px] text-slate-400 ml-auto" />
      </div>
    </div>
  );
};

export default CategoryNoteSelector;