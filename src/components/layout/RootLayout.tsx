import { Outlet } from 'react-router-dom';
import { useSessionCheck } from '../../hooks/useSessionCheck';
import { useActivityTimeout } from '../../hooks/useActivityTimeout';
import { useTokenExpiry } from '../../hooks/useTokenExpiry';

/**
 * RootLayout
 * Wraps all routes with necessary providers and hooks
 */
export function RootLayout() {
    // Monitor session changes across tabs/windows
    useSessionCheck();

    // Check token expiry locally (every 60 seconds) - lightweight, no backend calls
    // Only redirects to login when JWT actually expires
    useTokenExpiry();

    // Track user activity and logout after 15 minutes of inactivity
    useActivityTimeout(15);

    return <Outlet />;
}
