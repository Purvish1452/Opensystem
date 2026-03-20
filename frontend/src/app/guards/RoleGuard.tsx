import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { Role } from '../../lib/constants';

interface RoleGuardProps {
    allowedRoles: Role[];
}

export const RoleGuard = ({ allowedRoles }: RoleGuardProps) => {
    const { user, isInitializing } = useAuthStore();

    if (isInitializing) return null;

    if (!user || (!allowedRoles.includes(user.role as Role) && user.role !== 'admin')) {
        // Users without permission shown 403 or redirected to dashboard
        return <Navigate to="/feed" replace />;
    }

    return <Outlet />;
};
