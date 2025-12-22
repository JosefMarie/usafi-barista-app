import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export function AdminLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Listen for unread notifications for admin
    React.useEffect(() => {
        if (!user) return;

        // Query for notifications where recipientId is 'admin' 
        // And where read is false
        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', 'admin'),
            where('read', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // STRICT RBAC: Only Admin can view this layout
    if (user.role === 'instructor') {
        return <Navigate to="/instructor/dashboard" replace />;
    }
    if (user.role !== 'admin') {
        // Students or unknown roles go to student portal
        return <Navigate to="/student/dashboard" replace />;
    }

    const navItems = [
        { icon: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
        { icon: 'menu_book', label: 'Courses', path: '/admin/courses' },
        { icon: 'forum', label: 'Forum', path: '/admin/forum' },
        { icon: 'groups', label: 'Instructors', path: '/admin/instructors' },
        { icon: 'school', label: 'Students', path: '/admin/students' },
        { icon: 'category', label: 'Categories', path: '/admin/categories' },
        { icon: 'quiz', label: 'Quizzes', path: '/admin/quizzes' },
        { icon: 'campaign', label: 'Announcements', path: '/admin/announcements' },
        { icon: 'record_voice_over', label: 'Testimonials', path: '/admin/testimonials' },
        { icon: 'history', label: 'Activity Log', path: '/admin/activity-log' },
        { icon: 'notifications', label: 'Notifications', path: '/admin/notifications' },
    ];

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 bg-white dark:bg-[#1e1e1e] border-r border-black/5 z-20">
                <div className="p-6 border-b border-black/5">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-lg">coffee</span>
                        </div>
                        <span className="font-serif text-lg font-bold text-espresso dark:text-white">
                            Usafi Admin
                        </span>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                location.pathname === item.path
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "text-espresso/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-espresso dark:hover:text-white"
                            )}
                        >
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            {item.label}
                            {/* Notification Badge */}
                            {item.path === '/admin/notifications' && unreadCount > 0 && (
                                <span className="ml-auto flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-black/5">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-black/5 dark:bg-white/5 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                            {user?.name?.[0] || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-espresso dark:text-white truncate">
                                {user?.name || 'Administrator'}
                            </p>
                            <p className="text-xs text-espresso/60 dark:text-white/60 truncate">
                                {user?.email || 'admin@usafi.com'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 min-w-0 flex flex-col">
                {/* Mobile Header */}
                <header className="md:hidden h-16 bg-white dark:bg-[#1e1e1e] border-b border-black/5 flex items-center justify-between px-4 sticky top-0 z-10">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-lg">coffee</span>
                        </div>
                        <span className="font-serif text-lg font-bold text-espresso dark:text-white">
                            Usafi Admin
                        </span>
                    </Link>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-espresso dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                    >
                        <span className="material-symbols-outlined">
                            {isMobileMenuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </header>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 top-16 bg-background-light dark:bg-background-dark z-50 md:hidden overflow-y-auto">
                        <nav className="p-4 flex flex-col gap-2">
                            <div className="pb-4 mb-4 border-b border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-black/5 dark:bg-white/5">
                                    <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                                        {user?.name?.[0] || 'A'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-espresso dark:text-white">
                                            {user?.name || 'Administrator'}
                                        </p>
                                        <p className="text-sm text-espresso/60 dark:text-white/60">
                                            {user?.email || 'admin@usafi.com'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
                                        location.pathname === item.path
                                            ? "bg-primary text-white shadow-md shadow-primary/20"
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
