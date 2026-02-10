import type React from "react";
import { useState } from "react";
import { MdCategory, MdExpandMore } from "react-icons/md";
import { IoIosAdd } from "react-icons/io";

interface CategoryNoteSelectorProps {
  activeCategory: string;
  categories: string[];
  onSelect: (cat: string) => void;
  onAdd: (cat: string) => void;
}

const CategoryNoteSelector: React.FC<CategoryNoteSelectorProps> = ({
  activeCategory,
  categories,
  onSelect,
  onAdd,
}) => {
  const [newCatInput, setNewCatInput] = useState("");

  const handleAdd = () => {
    const trimmed = newCatInput.trim();
    if (trimmed) {
      onAdd(trimmed);
      setNewCatInput("");
    }
  };

  return (
    <div className="relative group/cat">
      <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-100 border border-slate-100 transition-all">
        <MdCategory className="text-[18px] text-teal-500" />
        <span className="text-[14px] font-bold text-slate-700 uppercase tracking-wide">
          {activeCategory}
        </span>
        <MdExpandMore className="text-[25px] text-slate-400 ml-auto" />
      </div>

      <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 opacity-0 invisible group-hover/cat:opacity-100 group-hover/cat:visible transition-all z-30">
        <div className="max-h-48 overflow-y-auto hide-scrollbar px-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={`w-full px-4 py-2.5 text-left text-[13px] font-semibold rounded-xl transition-colors mb-0.5 cursor-pointer ${
                activeCategory === cat
                  ? "bg-teal-50 text-teal-500"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="border-t border-slate-100 mt-2 p-2">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 px-2 transition-all border-none outline-none focus:outline-none focus:ring-0">
            <input
              type="text"
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="New category..."
              className="flex-1 bg-transparent border-none outline-none appearance-none shadow-none ring-0 focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 text-[12px] p-1 font-medium text-slate-600 placeholder:text-slate-400"
            />

            <button
              onClick={handleAdd}
              className="w-6 h-6 flex items-center justify-center bg-teal-500 text-white rounded-lg hover:scale-105 transition-transform cursor-pointer"
            >
              <IoIosAdd className="text-[16px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryNoteSelector;
