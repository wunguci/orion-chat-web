import { Outlet } from 'react-router-dom';
import { useSessionCheck } from '../../hooks/useSessionCheck';
import { useActivityTimeout } from '../../hooks/useActivityTimeout';
import { useTokenExpiry } from '../../hooks/useTokenExpiry';
import { useSessionConflictDetection } from '../../hooks/useSessionConflictDetection';

/**
 * Root layout wrapper that sets up global hooks
 * Must be inside RouterProvider context
 */
export function RootLayout() {
    // Monitor session changes across tabs/windows
    useSessionCheck();

    // Check token expiry locally (every 60 seconds) - lightweight, no backend calls
    // Only redirects to login when JWT actually expires
    useTokenExpiry();

    // Detect session conflict (duplicate login on other device)
    // Must be inside RouterProvider context to use useNavigate()
    useSessionConflictDetection();

    // Track user activity and logout after 15 minutes of inactivity
    useActivityTimeout(15);

    return <Outlet />;
}
