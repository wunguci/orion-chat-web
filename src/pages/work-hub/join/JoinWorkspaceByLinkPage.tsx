import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { workHubApi } from '../../../features/work-hub/work-hub.api';
import { useAuth } from '../../../hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

const JoinWorkspaceByLinkPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const joinWorkspace = async () => {
      try {
        if (!user?.userId) {
          setError('Please log in first');
          navigate('/login');
          return;
        }

        const token = searchParams.get('token');
        const workspaceId = searchParams.get('workspace');

        if (!token || !workspaceId) {
          setError('Invalid invite link');
          return;
        }

        // Call backend to join workspace
        const response = await workHubApi.joinByInviteLink(workspaceId, { token });

        if (response) {
          // Redirect to workspace
          navigate(`/workspaces/${workspaceId}`);
        } else {
          setError('Failed to join workspace');
        }
      } catch (err) {
        console.error('Error joining workspace:', err);
        setError('Failed to join workspace. The link may have expired.');
      } finally {
        setLoading(false);
      }
    };

    joinWorkspace();
  }, [searchParams, user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Joining workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4"><FontAwesomeIcon icon={faTriangleExclamation} /></div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/workspaces')}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Go to Workspaces
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default JoinWorkspaceByLinkPage;
