import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdOutlineWork,
    MdDashboard,
    MdGroup,
    MdInsights,
    MdFolder,
    MdAdd,
} from 'react-icons/md';
import { isTokenValid, getUser } from '../../../utils/token';
import { workHubApi } from '../../../features/work-hub/work-hub.api';
import type { WorkspaceResponse } from '../../../features/work-hub/work-hub.api.types';

const features = [
    {
        icon: MdDashboard,
        title: 'Project Boards',
        description:
            'Organize tasks with Kanban boards, list views, and calendar views. Track progress across your team in real time.',
    },
    {
        icon: MdGroup,
        title: 'Team Collaboration',
        description:
            'Channels, direct messages, and document collaboration built right into your workspace for seamless teamwork.',
    },
    {
        icon: MdInsights,
        title: 'AI Insights',
        description:
            'Get AI-powered analysis of project progress, identify risks early, and receive actionable recommendations.',
    },
    {
        icon: MdFolder,
        title: 'Files & Documents',
        description:
            'Centralized file storage and collaborative document editing so your entire team stays on the same page.',
    },
];

/* ── Folder Pop Loader ── */
const FolderPopLoader = () => (
    <div className="flex flex-col items-center gap-5 flex-1 h-full">
        <style>{`
      .folder-wrap {
        width: 72px;
        height: 68px;
        position: relative;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }
      .folder-body {
        width: 64px;
        height: 44px;
        background: #14b8a6;
        border-radius: 0 8px 8px 8px;
        position: absolute;
        bottom: 0;
        animation: folder-bounce 1.4s cubic-bezier(0.4,0,0.2,1) infinite;
        transform-origin: center bottom;
      }
      .folder-tab {
        width: 28px;
        height: 12px;
        background: #0d9488;
        border-radius: 5px 5px 0 0;
        position: absolute;
        bottom: 44px;
        left: 0;
        animation: folder-bounce 1.4s cubic-bezier(0.4,0,0.2,1) infinite;
        transform-origin: center bottom;
      }
      .folder-lid {
        width: 64px;
        height: 10px;
        background: #0d9488;
        border-radius: 4px 4px 0 0;
        position: absolute;
        bottom: 44px;
        left: 0;
        animation: lid-open 1.4s cubic-bezier(0.4,0,0.2,1) infinite;
        transform-origin: center bottom;
      }
      .folder-doc {
        width: 36px;
        height: 28px;
        background: white;
        border-radius: 4px;
        position: absolute;
        bottom: 14px;
        left: 14px;
        opacity: 0;
        animation: doc-pop 1.4s ease-in-out infinite;
      }
      .folder-doc::before {
        content: '';
        position: absolute;
        top: 7px;
        left: 6px;
        right: 6px;
        height: 2px;
        background: #99f6e4;
        border-radius: 2px;
      }
      .folder-doc::after {
        content: '';
        position: absolute;
        top: 13px;
        left: 6px;
        right: 10px;
        height: 2px;
        background: #99f6e4;
        border-radius: 2px;
      }

      @keyframes folder-bounce {
        0%,100% { transform: scaleX(1) scaleY(1); }
        30%      { transform: scaleX(0.92) scaleY(1.08); }
        50%      { transform: scaleX(1.06) scaleY(0.94); }
        65%      { transform: scaleX(0.98) scaleY(1.02); }
      }
      @keyframes lid-open {
        0%,15%,80%,100% { transform: rotateX(0deg) scaleX(1) scaleY(1); }
        35%,60%         { transform: rotateX(-45deg); }
        30%             { transform: scaleX(0.92) scaleY(1.08); }
        50%             { transform: rotateX(-45deg) scaleX(1.06) scaleY(0.94); }
      }
      @keyframes doc-pop {
        0%,18%   { opacity: 0; transform: translateY(8px) scale(0.9); }
        38%,62%  { opacity: 1; transform: translateY(-12px) scale(1); }
        80%,100% { opacity: 0; transform: translateY(8px) scale(0.9); }
      }
    `}</style>

        <div className="folder-wrap">
            <div className="folder-tab" />
            <div className="folder-lid" />
            <div className="folder-body">
                <div className="folder-doc" />
            </div>
        </div>

        <p className="text-slate-400 text-sm tracking-wide animate-pulse">
            Loading Work Hub…
        </p>
    </div>
);

const WorkspaceSelector = ({
    workspaces,
    onSelect,
    onCreate,
}: {
    workspaces: WorkspaceResponse[];
    onSelect: (id: string) => void;
    onCreate: () => void;
}) => (
    <div className="flex-1 overflow-y-auto bg-[#f5f7fa]">
        <div className="max-w-3xl mx-auto px-8 pt-16 pb-20">
            <div className="text-center mb-10">
                <div className="w-16 h-16 mx-auto mb-6 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <MdOutlineWork className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                    Select Workspace
                </h1>
                <p className="text-slate-500">
                    Select a workspace to continue or create a new one
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {workspaces.filter(ws => ws != null).map((ws) => (
                    <button
                        key={ws.workspaceId}
                        onClick={() => onSelect(ws.workspaceId)}
                        className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-teal-300 transition-all text-left cursor-pointer group"
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                            style={{ backgroundColor: ws.color || '#0d9488' }}
                        >
                            {ws.workspaceName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-slate-800 truncate group-hover:text-teal-600 transition-colors">
                                {ws.workspaceName}
                            </h3>
                            <p className="text-sm text-slate-400 truncate">
                                {ws.members?.length || 0} members · {ws.type}
                            </p>
                        </div>
                    </button>
                ))}
            </div>

            <div className="text-center">
                <button
                    onClick={onCreate}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer"
                >
                    <MdAdd className="w-5 h-5" />
                    Create new Workspace
                </button>
            </div>
        </div>
    </div>
);

const WorkHubIntroPage = () => {
    const navigate = useNavigate();
    const [phase, setPhase] = useState<'loading' | 'reveal' | 'select'>(
        'loading',
    );
    const [heroVisible, setHeroVisible] = useState(false);
    const [visibleCards, setVisibleCards] = useState<boolean[]>(
        new Array(features.length).fill(false),
    );
    const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);

    useEffect(() => {
        const checkUserWorkspaces = async () => {
            if (!isTokenValid()) {
                navigate('/auth/login');
                return;
            }

            const user = getUser();
            if (!user || !user.userId) {
                navigate('/auth/login');
                return;
            }

            try {
                const userWorkspaces = await workHubApi.getWorkspaces(
                    user.userId?.toString() || '',
                );
                if (userWorkspaces && userWorkspaces.length > 0) {
                    setWorkspaces(userWorkspaces);
                    if (userWorkspaces.length === 1) {
                        navigate(`/work-hub/${userWorkspaces[0].workspaceId}`, {
                            replace: true,
                        });
                        return;
                    }
                    setPhase('select');
                    return;
                }
            } catch {}

            setTimeout(() => setPhase('reveal'), 1500);
        };

        checkUserWorkspaces();
    }, [navigate]);

    useEffect(() => {
        if (phase !== 'reveal') return;
        const t2 = setTimeout(() => setHeroVisible(true), 80);
        const timers = features.map((_, i) =>
            setTimeout(
                () =>
                    setVisibleCards((prev) => {
                        const next = [...prev];
                        next[i] = true;
                        return next;
                    }),
                300 + i * 130,
            ),
        );
        return () => {
            clearTimeout(t2);
            timers.forEach(clearTimeout);
        };
    }, [phase]);

    if (phase === 'loading') {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f5f7fa]">
                <FolderPopLoader />
            </div>
        );
    }

    if (phase === 'select') {
        return (
            <WorkspaceSelector
                workspaces={workspaces}
                onSelect={(id) => navigate(`/work-hub/${id}`)}
                onCreate={() => navigate('/work-hub/create')}
            />
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f7fa]">
            {/* Hero Section */}
            <div
                className="max-w-4xl mx-auto px-8 pt-20 pb-14 text-center transition-all duration-700 ease-out"
                style={{
                    opacity: heroVisible ? 1 : 0,
                    transform: heroVisible
                        ? 'translateY(0)'
                        : 'translateY(24px)',
                }}
            >
                <div className="w-20 h-20 mx-auto mb-8 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <MdOutlineWork className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-slate-800 mb-4">
                    Welcome to Work Hub
                </h1>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-4 leading-relaxed">
                    Your all-in-one workspace for project management, team
                    collaboration, and productivity. Everything your team needs,
                    in one place.
                </p>
                <p className="text-slate-400 text-sm mb-10">
                    Create a workspace to get started with boards, channels,
                    documents, and more.
                </p>
                <button
                    onClick={() => navigate('/work-hub/create')}
                    className="px-10 py-3.5 bg-teal-500 text-white font-medium text-base rounded-xl hover:bg-teal-600 transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer"
                >
                    Create Workspace
                </button>
            </div>

            {/* Feature Cards */}
            <div className="max-w-5xl mx-auto px-8 pb-20">
                <h2
                    className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wider mb-8 transition-all duration-700 ease-out"
                    style={{
                        opacity: heroVisible ? 1 : 0,
                        transform: heroVisible
                            ? 'translateY(0)'
                            : 'translateY(16px)',
                        transitionDelay: '150ms',
                    }}
                >
                    What you can do with Work Hub
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {features.map((feature, i) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.title}
                                className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-md transition-shadow duration-200"
                                style={{
                                    opacity: visibleCards[i] ? 1 : 0,
                                    transform: visibleCards[i]
                                        ? 'translateY(0)'
                                        : 'translateY(28px)',
                                    transition:
                                        'opacity 0.5s ease-out, transform 0.5s ease-out, box-shadow 0.2s',
                                }}
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
