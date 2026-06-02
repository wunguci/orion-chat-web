import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Workspace, WorkspaceRole } from '../types/work-hub.types';
import { workHubApi } from '../features/work-hub/work-hub.api';
import { mapWorkspace } from '../features/work-hub/work-hub.mappers';
import { getUser } from '../utils/token';

interface WorkspaceContextValue {
    workspace: Workspace | null;
    isLoading: boolean;
    role: WorkspaceRole | null;
    isOwner: boolean;
    isAdmin: boolean;
    isMember: boolean; // meaning they have at least member role
    refreshWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
    workspace: null,
    isLoading: true,
    role: null,
    isOwner: false,
    isAdmin: false,
    isMember: false,
    refreshWorkspace: async () => {},
});

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const currentUser = getUser();
    const currentUserId = currentUser?.userId ?? currentUser?.id ?? '';

    const loadWorkspace = useCallback(async () => {
        if (!workspaceId) return;
        setIsLoading(true);
        try {
            const data = await workHubApi.getWorkspace(workspaceId);
            const mapped = mapWorkspace(data);
            setWorkspace(mapped);

            // Check membership
            const member = mapped.members.find(m => m.user.id === currentUserId);
            if (!member) {
                // User is not a member of this workspace
                navigate('/work-hub', { replace: true });
                return;
            }
        } catch (err) {
            console.error('Failed to load workspace:', err);
            // navigate('/work-hub', { replace: true });
        } finally {
            setIsLoading(false);
        }
    }, [workspaceId, currentUserId, navigate]);

    useEffect(() => {
        void loadWorkspace();
    }, [loadWorkspace]);

    const role = workspace?.members.find(m => m.user.id === currentUserId)?.role || null;
    const isOwner = role === 'owner';
    const isAdmin = role === 'admin' || isOwner; // admin usually inherits owner's basic perms
    const isMember = role !== null;

    return (
        <WorkspaceContext.Provider
            value={{
                workspace,
                isLoading,
                role,
                isOwner,
                isAdmin,
                isMember,
                refreshWorkspace: loadWorkspace,
            }}
        >
            {/* Show nothing or a loading spinner while initially fetching to prevent rendering children without permissions */}
            {isLoading && !workspace ? (
                <div className="flex items-center justify-center h-screen bg-wh-green-bg-light">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wh-green-primary"></div>
                </div>
            ) : (
                children
            )}
        </WorkspaceContext.Provider>
    );
};
