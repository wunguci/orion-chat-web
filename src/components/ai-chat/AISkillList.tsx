import type React from "react";
import { AISkill } from "../../types/aichat";
import { FaCode } from "react-icons/fa";
import { MdTranslate, MdHistoryEdu, MdOutlineSummarize } from "react-icons/md";

interface AISkillListProps {
  onSkillClick: (prompt: string) => void;
}

const AISkillList: React.FC<AISkillListProps> = ({ onSkillClick }) => {
  const skills = [
    {
      icon: <FaCode />,
      label: AISkill.CODING,
      prompt: "Help me with some code for...",
    },
    {
      icon: <MdTranslate />,
      label: AISkill.TRANSLATE,
      prompt: "Translate this text into...",
    },
    {
      icon: <MdHistoryEdu />,
      label: AISkill.WRITING,
      prompt: "Write a creative story about...",
    },
    {
      icon: <MdOutlineSummarize />,
      label: AISkill.DIGEST,
      prompt: "Summarize the following text...",
    },
  ];

  return (
    <div className="p-4 bg-slate-50/50">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
        AI Quick Skills
      </p>
      <div className="grid grid-cols-2 gap-2">
        {skills.map((skill) => (
          <button
            key={skill.label}
            onClick={() => onSkillClick(skill.prompt)}
            className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl hover:border-green-primary hover:shadow-sm transition-all text-left group cursor-pointer"
          >
            <span className="text-green-secondary text-xl group-hover:scale-110 transition-transform shrink-0">
              {skill.icon}
            </span>
            <span className="text-[11px] font-bold text-slate-700 truncate">
              {skill.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AISkillList;
