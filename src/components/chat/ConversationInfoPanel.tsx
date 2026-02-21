import React, { useState } from 'react';
import { CiEdit } from 'react-icons/ci';
import { MdGroupAdd } from 'react-icons/md';
import { IoMdNotifications } from 'react-icons/io';
import { LuAlarmClockCheck } from 'react-icons/lu';
import { TiPin } from 'react-icons/ti';
import { MdOutlineGroup } from 'react-icons/md';
import { FaChevronDown } from 'react-icons/fa6';
import { FaEye } from 'react-icons/fa';
import { IoIosEyeOff } from 'react-icons/io';


type MediaTab = 'Images' | 'Files' | 'Links';

export const ConversationInfoPanel: React.FC = () => {
    const images = new Array(8)
        .fill(0)
        .map((_, i) => `https://picsum.photos/seed/${i + 10}/200/140`);
    const [autoDelete, setAutoDelete] = useState(false);
    const [imagesOpen, setImagesOpen] = useState(true);
    const [mediaTab, setMediaTab] = useState<MediaTab>('Images');
    const [tabDropdownOpen, setTabDropdownOpen] = useState(false);

    const mediaTabs: MediaTab[] = ['Images', 'Files', 'Links'];

    return (
        <aside className="w-80 bg-white text-slate-100 h-screen flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="text-center font-bold text-base py-5 px-4 text-(--color-text-primary) border-b border-slate-200 ">
                Conversation Info
            </div>

            {/* Avatar + Name */}
            <div className="flex flex-col items-center px-4 p-4 text-(--color-text-primary)">
                <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRqHljHwC3uFTM4IyU1hLVqc5KJgrzOFpMvA&s"
                    alt="avatar"
                    className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex items-center gap-2 mt-2">
                    <span className="font-semibold text-base">
                        Olivia Isabella
                    </span>

                    <CiEdit className="w-4 h-4" />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 px-4 pb-4 text-center">
                {/* Mute */}
                <div className="flex flex-col items-center gap-1">
                    <button className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                        <IoMdNotifications className="w-5 h-5" />
                    </button>
                    <span className="text-xs text-slate-400">Mute</span>
                </div>
                {/* Pin */}
                <div className="flex flex-col items-center gap-1">
                    <button className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                        <TiPin className="w-5 h-5" />
                    </button>
                    <span className="text-xs text-slate-400">Pin</span>
                </div>
                {/* Create group */}
                <div className="flex flex-col items-center gap-1">
                    <button className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                        <MdGroupAdd className="w-5 h-5" />
                    </button>
                    <span className="text-xs text-slate-400">Create group</span>
                </div>
            </div>

            {/* Auto delete messages */}
            <div className="mx-4 mb-3 flex items-center justify-between px-4 py-3 rounded-lg bg-slate-200">
                <span className="text-sm text-red-600">
                    Auto delete mesages
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={autoDelete}
                        onChange={() => setAutoDelete((v) => !v)}
                        className="sr-only"
                    />
                    <div
                        className={`w-11 h-6 rounded-full transition-colors ${autoDelete ? 'bg-red-500' : 'bg-slate-600'}`}
                    />
                    <span
                        className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoDelete ? 'translate-x-5' : ''}`}
                    />
                </label>
            </div>

            {/* Reminder board */}
            <div className="mx-4 mb-2 flex items-center gap-3 py-2">
                <LuAlarmClockCheck className="w-5 h-5 text-slate-700 shrink-0" />
                <span className="text-sm text-slate-700">Reminder board</span>
            </div>

            {/* 0 Mutual groups */}
            <div className="mx-4 mb-4 flex items-center gap-3 py-2">
                <MdOutlineGroup className="w-5 h-5 text-slate-700 shrink-0" />
                <span className="text-sm text-slate-700">0 Mutual groups</span>
            </div>

            {/* Images section */}
            <div className="mx-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                    {/* Tab selector dropdown */}
                    <div className="relative">
                        <button
                            className="text-sm text-slate-700 flex items-center gap-1 focus:outline-none"
                            onClick={() => setTabDropdownOpen((o) => !o)}
                        >
                            {mediaTab}
                            <FaChevronDown
                                className={`w-3 h-3 text-slate-400 transition-transform ${tabDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {tabDropdownOpen && (
                            <div className="absolute left-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                                {mediaTabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => {
                                            setMediaTab(tab);
                                            setTabDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 transition-colors ${
                                            mediaTab === tab
                                                ? 'text-emerald-500 font-medium bg-slate-50'
                                                : 'text-slate-700'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Collapse toggle */}
                    <button onClick={() => setImagesOpen((o) => !o)}>
                        {imagesOpen ? (
                            <FaEye className="w-3 h-3 text-slate-400" />
                        ) : (
                            <IoIosEyeOff className="w-3 h-3 text-slate-400" />
                        )}
                    </button>
                </div>

                {imagesOpen && (
                    <>
                        {mediaTab === 'Images' && (
                            <div className="grid grid-cols-4 gap-1">
                                {images.map((src, i) => (
                                    <img
                                        key={i}
                                        src={src}
                                        alt={`img-${i}`}
                                        className="w-full h-16 object-cover rounded"
                                    />
                                ))}
                            </div>
                        )}

                        {mediaTab === 'Files' && (
                            <div className="flex flex-col gap-2">
                                {[
                                    'document.pdf',
                                    'report.docx',
                                    'data.xlsx',
                                    'notes.txt',
                                ].map((name, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 px-2 py-2 bg-slate-100 rounded-lg"
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-slate-500 shrink-0"
                                        >
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                        <span className="text-xs text-slate-700 truncate">
                                            {name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {mediaTab === 'Links' && (
                            <div className="flex flex-col gap-2">
                                {[
                                    'https://github.com',
                                    'https://youtube.com',
                                    'https://google.com',
                                ].map((url, i) => (
                                    <a
                                        key={i}
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 px-2 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-slate-500 shrink-0"
                                        >
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                        </svg>
                                        <span className="text-xs text-emerald-600 truncate">
                                            {url}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </>
                )}

                <button className="mt-2 w-full text-center  bg-slate-200 text-slate-700 py-1 rounded-lg">
                    View All
                </button>
            </div>

            {/* Bottom actions */}
            <div className=" mx-4 text-sm pt-3">
                <button className="w-full text-left text-slate-700 flex items-center gap-3 py-2">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0"
                    >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="18" y1="8" x2="23" y2="13" />
                        <line x1="23" y1="8" x2="18" y2="13" />
                    </svg>
                    Block user
                </button>

                <button className="w-full text-left text-red-500 flex items-center gap-3 py-2">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0"
                    >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4h6v2" />
                    </svg>
                    Delete chat history
                </button>
            </div>
        </aside>
    );
};

export default ConversationInfoPanel;
