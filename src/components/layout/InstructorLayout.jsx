import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { ThemeToggle } from '../common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';

export function InstructorLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Listen for unread notifications for instructor (if any)
    React.useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', user.uid),
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
    // Only instructors can view this layout
    if (user.role !== 'instructor') {
        // Redirect admins to admin dashboard, students to student dashboard
        return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
    }

    const navItems = [
        { icon: 'dashboard', label: 'Dashboard', path: '/instructor/dashboard' },
        { icon: 'menu_book', label: 'Courses', path: '/instructor/courses' },
        { icon: 'people', label: 'Students', path: '/instructor/students' },
        { icon: 'chat', label: 'Chat', path: '/instructor/chat' },
        { icon: 'schedule', label: 'Schedule', path: '/instructor/schedule' },
        { icon: 'video_library', label: 'Share Video', path: '/instructor/share-video' },
        { icon: 'person', label: 'My Profile', path: '/instructor/profile' },
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
                        <span className="font-serif text-lg font-bold text-espresso dark:text-white">Usafi Instructor</span>
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
                            {item.path === '/instructor/chat' && unreadCount > 0 && (
                                <span className="ml-auto flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-black/5">
                    <Link
                        to="/instructor/profile"
                        className="flex items-center gap-3 px-4 py-4 rounded-xl bg-black/5 dark:bg-white/5 mb-4 hover:bg-primary/5 transition-colors group"
                    >
                        <div className="h-10 w-10 rounded-full border-2 border-primary/20 overflow-hidden shrink-0">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Instructor" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                    {user?.name?.[0] || 'I'}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-espresso dark:text-white truncate group-hover:text-primary transition-colors">
                                {user?.name || 'Instructor'}
                            </p>
                            <p className="text-[10px] text-espresso/40 dark:text-white/40 truncate uppercase tracking-widest font-bold">
                                View Profile
                            </p>
                        </div>
                    </Link>
                    <div className="mb-4">
                        <ThemeToggle className="w-full justify-start gap-3 bg-black/5 dark:bg-white/5" />
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
                        <span className="font-serif text-lg font-bold text-espresso dark:text-white">Usafi Instructor</span>
                    </Link>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-espresso dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                    >
                        <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                    </button>
                </header>
                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 top-16 bg-background-light dark:bg-background-dark z-50 md:hidden overflow-y-auto">
                        <nav className="p-4 flex flex-col gap-2">
                            <div className="pb-4 mb-4 border-b border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-black/5 dark:bg-white/5">
                                    <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                                        {user?.name?.[0] || 'I'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-espresso dark:text-white">{user?.name || 'Instructor'}</p>
                                        <p className="text-sm text-espresso/60 dark:text-white/60">{user?.email}</p>
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
