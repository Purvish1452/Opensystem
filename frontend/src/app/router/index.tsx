import { createBrowserRouter, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { RoleGuard } from '../guards/RoleGuard';
import { ROLES } from '../../lib/constants';

// Lazy loaded pages for performance
const LandingPage = lazy(() => import('../../modules/landing/LandingPage'));
const LoginPage = lazy(() => import('../../modules/auth/LoginPage'));
const FeedPage = React.lazy(() => import('../../modules/post/FeedPage'));
const ProjectList = React.lazy(() => import('../../modules/project/ProjectList'));
const AdminDashboard = React.lazy(() => import('../../modules/admin/AdminDashboard'));

// App Shell with Navbar/Sidebar
const DashboardLayout = React.lazy(() => import('../layouts/DashboardLayout'));

export const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <Suspense fallback={null}>
                <LandingPage />
            </Suspense>
        ),
    },
    {
        path: '/login',
        element: (
            <Suspense fallback={<div className="h-screen w-screen animate-pulse bg-gray-50" />}>
                <LoginPage />
            </Suspense>
        ),
    },
    // Protected Routes
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: (
                    <Suspense fallback={<div>Loading Layout...</div>}>
                        <DashboardLayout />
                    </Suspense>
                ),
                children: [
                    { path: '/', element: <Navigate to="/feed" replace /> }, // This route will now be relative to the protected group, so it will redirect from / to /feed within the protected context.
                    { path: '/feed', element: <FeedPage /> },
                    { path: '/projects', element: <ProjectList /> },

                    // Route Guard example
                    {
                        element: <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.MODERATOR]} />,
                        children: [
                            { path: '/admin', element: <AdminDashboard /> },
                        ]
                    }
                ]
            }
        ]
    }
]);
