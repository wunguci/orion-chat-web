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
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const joinWorkspace = async () => {
      try {
        const userId = user?.userId ?? user?.id;
        if (!userId) {
          setError('Please log in first');
          navigate('/auth/login');
          return;
        }

        const token = searchParams.get('token');
        const workspaceId =
          searchParams.get('workspaceId') || searchParams.get('workspace');

        if (!token || !workspaceId) {
          setError('Invalid invite link');
          return;
        }

        const response = await workHubApi.joinByInviteLink(workspaceId, { token });

        setSuccess(
          response?.status === 'PENDING_APPROVAL'
            ? `Your request to join ${response.workspaceName} is waiting for owner/admin approval.`
            : 'Join request sent.',
        );
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
            onClick={() => navigate('/work-hub')}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Go to Workspaces
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
        <div className="text-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-md">
          <div className="text-wh-green-primary text-3xl mb-4">
            <i className="fas fa-clock"></i>
          </div>
          <p className="text-gray-800 font-medium mb-2">{success}</p>
          <p className="text-sm text-gray-500 mb-4">
            You will receive a notification when the request is reviewed.
          </p>
          <button
            onClick={() => navigate('/work-hub')}
            className="px-4 py-2 bg-wh-green-primary text-white rounded-lg hover:bg-wh-green-primary-hover"
          >
            Back to WorkHub
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default JoinWorkspaceByLinkPage;
