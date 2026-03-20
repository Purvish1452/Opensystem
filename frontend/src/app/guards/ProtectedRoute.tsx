import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const ProtectedRoute = () => {
    const { isAuthenticated, isInitializing } = useAuthStore();
    const location = useLocation();

    // Show initial skeleton loader or blank until silent refresh attempts finish
    if (isInitializing) {
        return <div className="animate-pulse bg-gray-100 h-screen w-full" />;
    }

    if (!isAuthenticated) {
        // Redirect completely out if no auth
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};
