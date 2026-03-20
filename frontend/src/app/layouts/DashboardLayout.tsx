import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-dark-bg">
            <aside className="w-64 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-gray-800 p-4 pt-8 shrink-0 hidden md:block">
                <nav className="flex flex-col gap-2">
                    <div className="text-xl font-bold mb-8 text-primary-600">OpenSystems</div>
                    <div className="text-gray-600 dark:text-gray-300">Navigation links...</div>
                </nav>
            </aside>
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 px-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 bg-white dark:bg-dark-surface sticky top-0 z-10 w-full">
                    <div className="font-semibold text-gray-800 dark:text-white">Dashboard</div>
                    <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                </header>
                <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
