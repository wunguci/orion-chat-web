import { useNavigate } from "react-router-dom";
import {
  MdOutlineWork,
  MdDashboard,
  MdGroup,
  MdInsights,
  MdFolder,
} from "react-icons/md";

const features = [
  {
    icon: MdDashboard,
    title: "Project Boards",
    description:
      "Organize tasks with Kanban boards, list views, and calendar views. Track progress across your team in real time.",
  },
  {
    icon: MdGroup,
    title: "Team Collaboration",
    description:
      "Channels, direct messages, and document collaboration built right into your workspace for seamless teamwork.",
  },
  {
    icon: MdInsights,
    title: "AI Insights",
    description:
      "Get AI-powered analysis of project progress, identify risks early, and receive actionable recommendations.",
  },
  {
    icon: MdFolder,
    title: "Files & Documents",
    description:
      "Centralized file storage and collaborative document editing so your entire team stays on the same page.",
  },
];

const WorkHubIntroPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f7fa]">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-8 pt-20 pb-14 text-center">
        <div className="w-20 h-20 mx-auto mb-8 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
          <MdOutlineWork className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-800 mb-4">
          Welcome to Work Hub
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-4 leading-relaxed">
          Your all-in-one workspace for project management, team collaboration,
          and productivity. Everything your team needs, in one place.
        </p>
        <p className="text-slate-400 text-sm mb-10">
          Create a workspace to get started with boards, channels, documents,
          and more.
        </p>
        <button
          onClick={() => navigate("/work-hub/create")}
          className="px-10 py-3.5 bg-teal-500 text-white font-medium text-base rounded-xl hover:bg-teal-600 transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer"
        >
          Create Workspace
        </button>
      </div>

      {/* Feature Cards */}
      <div className="max-w-5xl mx-auto px-8 pb-20">
        <h2 className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wider mb-8">
          What you can do with Work Hub
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-md transition-all"
              >
                <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center text-teal-500 mb-5">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkHubIntroPage;
