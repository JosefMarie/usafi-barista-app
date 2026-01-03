import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { ThemeToggle } from '../common/ThemeToggle';
import { PortalTopBar } from './PortalTopBar';
import { useAuth } from '../../context/AuthContext';

export function ManagerLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/setup-admin');
    };

    if (!user) {
        return <Navigate to="/setup-admin" replace />;
    }

    if (user.role === 'ceo') {
        return <Navigate to="/ceo/dashboard" replace />;
    }

    if (user.role !== 'manager' && user.role !== 'admin') {
        return <Navigate to="/student/dashboard" replace />;
    }

    const navItems = [
        { icon: 'dashboard', label: 'Dashboard', path: '/manager/dashboard' },
        { icon: 'contacts', label: 'Contacts Directory', path: '/manager/contacts' },
        { icon: 'mail', label: 'Subscribers', path: '/manager/subscribers' },
        { icon: 'inbox', label: 'Inbox Messages', path: '/manager/messages' },
        { icon: 'person', label: 'My Profile', path: '/manager/profile' },
    ];

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 bg-[#F5DEB3] dark:bg-[#1c1916] border-r border-espresso/10 z-20 shadow-xl">
                <div className="p-6 border-b border-espresso/10 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="h-8 w-8 rounded-full bg-espresso flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-lg">campaign</span>
                        </div>
                        <span className="font-serif text-lg font-bold text-espresso dark:text-white">
                            Usafi Marketing
                        </span>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto py-8 px-4 flex flex-col gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all overflow-hidden group",
                                location.pathname === item.path
                                    ? "bg-espresso text-white shadow-lg translate-x-1"
                                    : "text-espresso/70 dark:text-white/70 hover:bg-white/40 dark:hover:bg-white/5"
                            )}
                        >
                            {location.pathname === item.path && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                            )}
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-espresso/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        Sign Out Portal
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 min-w-0 flex flex-col">
                <PortalTopBar
                    user={user}
                    onLogout={handleLogout}
                />

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 top-0 bg-background-light dark:bg-background-dark z-50 md:hidden overflow-y-auto">
                        <nav className="p-4 flex flex-col gap-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
                                        location.pathname === item.path
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                            : "text-espresso dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
                                    )}
                                >
                                    <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors mt-2"
                            >
                                <span className="material-symbols-outlined text-[24px]">logout</span>
                                Sign Out
                            </button>
                        </nav>
                    </div>
                )}

                <main className="flex-1 p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
