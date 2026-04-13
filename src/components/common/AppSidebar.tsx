/* eslint-disable */
import type React from 'react';
import {
    MdChat,
    MdContacts,
    MdOutlineWork,
    MdNote,
    MdCalendarToday,
    MdSettings,
    MdLogout,
} from 'react-icons/md';
import type { IconType } from 'react-icons';
import { FaUsers, FaBrain } from 'react-icons/fa';
import { Avatar } from './Avatar';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../types/routes.types';
import SettingsModal from '../settings/SettingsModal';
import { useState, useEffect } from 'react';
import type { User } from '../../types/auth.types';
import { getUser, logout as clearAuth } from '../../utils/token';
import { api } from '../../services/api';

type ViewMode =
    | 'chat'
    | 'contacts'
    | 'notes'
    | 'calendar'
    | 'friends'
    | 'aichat';

interface SidebarProps {
    currentView: ViewMode;
    setView: (view: ViewMode) => void;
}

const AppSidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSettingOpen, setIsSettingOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        const userData = getUser();
        if (userData) {
            setCurrentUser(userData);
        }
    }, []);

    // Handle logout with confirmation
    const handleLogout = async () => {
        if (isLoggingOut) return;

        // Show confirmation dialog
        const confirmed = window.confirm(
            'Bạn có chắc chắn muốn đăng xuất không?',
        );

        if (!confirmed) {
            return;
        }

        setIsLoggingOut(true);
        try {
            await api.post('/auth/logout', { platform: 'web' });
        } catch (error) {
            console.warn(
                'Server logout failed, clearing local auth anyway:',
                error,
            );
        } finally {
            clearAuth();
            navigate(ROUTES.AUTH.LOGIN);
            setIsLoggingOut(false);
        }
    };

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'auth_user') {
                setCurrentUser(getUser());
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const getAvatarUrl = (avatarPath?: string): string | undefined => {
        if (!avatarPath) return undefined;
        if (avatarPath.startsWith('http')) return avatarPath;

        const fullUrl = `${import.meta.env.VITE_API_URL}${avatarPath}`;

        return fullUrl;
    };

    return (
        <>
            <SettingsModal
                isOpen={isSettingOpen}
                onClose={() => setIsSettingOpen(false)}
            />
            <aside className="w-16 flex flex-col items-center py-6 border-r border-slate-200 white:border-slate-800 bg-white white:bg-slate-900 shrink-0 z-20">
                {/* User Avatar */}
                <div className="mb-8">
                    <Avatar
                        src={getAvatarUrl(currentUser?.avatarUrl)}
                        alt={currentUser?.fullName || 'User'}
                        size="md"
                        status={currentUser?.isOnline ? 'online' : 'offline'}
                        onClick={() => {}}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                </div>
                {/* Navigation Items */}
                <nav className="flex-1 flex flex-col gap-4 mt-6">
                    {/* <NavItem
                    icon={MdContacts}
                    active={isActive(ROUTES.CHAT.CONTACTS)}
                    onClick={() => {
                        setView('contacts');
                        navigate(ROUTES.CHAT.CONTACTS);
                    }}
                    label="Contacts"
                /> */}
                    <NavItem
                        icon={MdChat}
                        active={isActive(ROUTES.CHAT.ROOT)}
                        onClick={() => {
                            setView('chat');
                            navigate(ROUTES.CHAT.ROOT);
                        }}
                        label="Chat"
                    />
                    <NavItem
                        icon={FaUsers}
                        active={isActive(ROUTES.FRIENDS)}
                        onClick={() => {
                            setView('friends');
                            navigate(ROUTES.FRIENDS);
                        }}
                        label="Friends"
                    />
                    <NavItem
                        icon={MdNote}
                        active={isActive(ROUTES.NOTE)}
                        onClick={() => {
                            setView('notes');
                            navigate(ROUTES.NOTE);
                        }}
                        label="Notes"
                    />
                    <NavItem
                        icon={MdCalendarToday}
                        active={isActive(ROUTES.CALENDAR)}
                        onClick={() => {
                            setView('calendar');
                            navigate(ROUTES.CALENDAR);
                        }}
                        label="Calendar"
                    />
                    <NavItem
                        icon={FaBrain}
                        active={isActive(ROUTES.AICHAT)}
                        onClick={() => {
                            setView('aichat');
                            navigate(ROUTES.AICHAT);
                        }}
                        label="AI Chat"
                    />
                </nav>

                {/* Settings at bottom */}
                <div className="mt-auto gap-4 flex flex-col items-center">
                    <NavItem
                        icon={MdOutlineWork}
                        active={location.pathname.startsWith(
                            ROUTES.WORK_HUB.ROOT,
                        )}
                        onClick={() => navigate(ROUTES.WORK_HUB.ROOT)}
                        label="Work Hub"
                    />
                    <NavItem
                        icon={MdSettings}
                        active={false}
                        onClick={() => setIsSettingOpen(true)}
                        label="Settings"
                    />
                    <NavItem
                        icon={MdLogout}
                        active={false}
                        onClick={handleLogout}
                        label="Logout"
                        disabled={isLoggingOut}
                    />
                </div>
            </aside>
        </>
    );
};

interface NavItemProps {
    icon: IconType;
    active: boolean;
    onClick: () => void;
    label: string;
    disabled?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
    icon: Icon,
    active,
    onClick,
    label,
    disabled = false,
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                disabled
                    ? 'opacity-50 cursor-not-allowed text-slate-300'
                    : active
                      ? 'bg-teal-400 text-primary shadow-sm'
                      : 'text-slate-400 hover:bg-slate-200'
            }`}
            title={label}
            aria-label={label}
        >
            <Icon className="w-5 h-5" />
        </button>
    );
};

export default AppSidebar;
