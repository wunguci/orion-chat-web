import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import {
    useSessionCheck,
    usePeriodicSessionCheck,
} from './hooks/useSessionCheck';
import { useActivityTimeout } from './hooks/useActivityTimeout';

function AppContent() {
    // Monitor session changes across tabs/windows
    useSessionCheck();

    // Periodically verify session is still valid (every 30 seconds)
    usePeriodicSessionCheck(30000);

    // Track user activity and logout after 15 minutes of inactivity
    useActivityTimeout(15);

    return <RouterProvider router={router} />;
}

function App() {
    return <AppContent />;
}

export default App;
