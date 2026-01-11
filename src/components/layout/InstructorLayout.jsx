import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { ThemeToggle } from '../common/ThemeToggle';
import { PortalTopBar } from './PortalTopBar';
import { useAuth } from '../../context/AuthContext';

export function InstructorLayout() {
    const { t } = useTranslation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [newForumPosts, setNewForumPosts] = useState(0);
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

    // Forum New Posts Listener
    React.useEffect(() => {
        if (!user) return;

        const lastVisited = user.lastVisitedForum?.toDate?.() || new Date(0);

        const q = query(
            collection(db, 'forum_posts'),
            where('createdAt', '>', lastVisited),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newPosts = snapshot.docs.filter(doc => doc.data().authorId !== user.uid);
            setNewForumPosts(newPosts.length);
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
    if (user.role === 'ceo') {
        return <Navigate to="/ceo/dashboard" replace />;
    }
    if (user.role !== 'instructor') {
        // Redirect admins to admin dashboard, students to student dashboard
        return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
    }

    const navItems = [
        { icon: 'dashboard', label: t('instructor.nav.dashboard'), path: '/instructor/dashboard' },
        { icon: 'menu_book', label: t('instructor.nav.courses'), path: '/instructor/courses' },
        { icon: 'people', label: t('instructor.nav.students'), path: '/instructor/students' },
        { icon: 'chat', label: t('instructor.nav.chat'), path: '/instructor/chat' },
        { icon: 'schedule', label: t('instructor.nav.schedule'), path: '/instructor/schedule' },
        { icon: 'video_library', label: t('instructor.nav.share_video'), path: '/instructor/share-video' },
        { icon: 'forum', label: 'Forum', path: '/instructor/forum', badge: newForumPosts },
        { icon: 'person', label: t('instructor.nav.my_profile'), path: '/instructor/profile' },
    ];

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 bg-[#F5DEB3] dark:bg-[#1c1916] border-r border-espresso/10 z-20 shadow-xl">
                <div className="p-6 border-b border-espresso/10 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform overflow-hidden">
                            <img src="/logo.jpg" alt="Usafi Logo" className="w-full h-full object-cover type" />
                        </div>
                        <span className="font-serif text-lg font-bold text-espresso dark:text-white">Usafi {t('instructor.nav.instructor_default')}</span>
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
                                    : "bg-[#088F8F] text-white hover:bg-white/40 dark:hover:bg-white/5 hover:text-espresso"
                            )}
                        >
                            {location.pathname === item.path && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                            )}
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            {item.label}
                            {((item.path === '/instructor/chat' && unreadCount > 0) || (item.badge && item.badge > 0)) && (
                                <span className="ml-auto flex items-center justify-center w-5 h-5 text-[10px] font-black text-white bg-primary rounded-full shadow-sm">
                                    {item.path === '/instructor/chat' ? (unreadCount > 99 ? '99+' : unreadCount) : (item.badge > 99 ? '99+' : item.badge)}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-espresso/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        {t('instructor.nav.sign_out')}
                    </button>
                </div>
            </aside>
            {/* Main Content */}
            <div className="flex-1 md:ml-64 min-w-0 flex flex-col">
                <PortalTopBar
                    user={user}
                    unreadNotifications={unreadCount}
                    onLogout={handleLogout}
                    onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />
                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 bg-[#F5DEB3] dark:bg-[#1c1916] md:hidden flex flex-col">
                        <div className="p-6 flex items-center justify-between border-b border-espresso/10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shadow-lg overflow-hidden">
                                    <img src="/logo.jpg" alt="Usafi Logo" className="w-full h-full object-cover type" />
                                </div>
                                <span className="font-serif text-lg font-bold text-espresso dark:text-white">{t('instructor.nav.instructor_menu')}</span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-espresso/5 text-espresso dark:text-white hover:bg-espresso/10 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <nav className="flex-1 p-6 space-y-2 overflow-y-auto relative z-10 custom-scrollbar">
                            <div className="pb-4 mb-4 border-b border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-black/5 dark:bg-white/5">
                                    <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                                        {user?.name?.[0] || 'I'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-espresso dark:text-white">{user?.name || t('instructor.nav.instructor_default')}</p>
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
                                            : "bg-[#088F8F] text-white hover:bg-black/5 dark:hover:bg-white/5"
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
                                {t('instructor.nav.sign_out')}
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
