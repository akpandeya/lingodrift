import { LayoutDashboard, GraduationCap, Settings, BookOpen, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="h-full w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-colors z-10 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <img src="/logo-full.svg" alt="LingoDrift" className="h-8 w-auto object-contain" />
            </div>

            <nav className="flex-1 p-4 space-y-1">
                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        clsx(
                            "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                            isActive
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                        )
                    }
                >
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                </NavLink>

                <NavLink
                    to="/my-exams"
                    className={({ isActive }) =>
                        clsx(
                            "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                            isActive
                                ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                        )
                    }
                >
                    <BookOpen className="w-5 h-5" />
                    My Exams
                </NavLink>

                <NavLink
                    to="/courses"
                    className={({ isActive }) =>
                        clsx(
                            "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                            isActive
                                ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                        )
                    }
                >
                    <GraduationCap className="w-5 h-5" />
                    Courses
                </NavLink>

                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        clsx(
                            "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                            isActive
                                ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                        )
                    }
                >
                    <Settings className="w-5 h-5" />
                    Settings
                </NavLink>
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">AK</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Akash P.</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Free Plan</p>
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <ThemeToggle />
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};
