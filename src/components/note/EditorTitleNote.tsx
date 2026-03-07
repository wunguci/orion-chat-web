import type React from "react";
import { MdTitle } from "react-icons/md";

interface EditorTitleNoteProps {
  value: string;
  onChange: (value: string) => void;
}

const EditorTitleNote: React.FC<EditorTitleNoteProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-5">
      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm shrink-0">
        <MdTitle size={24} />
      </div>
      <input
        type="text"
        className="h-12 flex-1 text-3xl font-bold bg-transparent border-none focus:ring-0 p-0 placeholder-slate-200 text-slate-700 tracking-tight rounded-lg px-4"
        placeholder="Untitled Note"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default EditorTitleNote;
