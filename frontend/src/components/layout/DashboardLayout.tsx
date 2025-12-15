import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export const DashboardLayout = () => {
    return (
        <div className="h-screen w-full bg-gray-50 dark:bg-gray-950 flex overflow-hidden transition-colors duration-300">
            {/* Sidebar - Static Width, Full Height */}
            <Sidebar />

            {/* Main Content - Takes remaining width, Scrollable */}
            <main className="flex-1 h-full overflow-y-auto p-8 transition-all duration-300">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
