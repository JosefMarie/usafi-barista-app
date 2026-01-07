import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { ThemeToggle } from '../common/ThemeToggle';
import { PortalTopBar } from './PortalTopBar';
import { useAuth } from '../../context/AuthContext';

export function AdminLayout() {
    const { t } = useTranslation();
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
        navigate('/setup-admin');
    };

    if (!user) {
        return <Navigate to="/setup-admin" replace />;
    }

    // STRICT RBAC: Only Admin can view this layout
    if (user.role === 'ceo') {
        return <Navigate to="/ceo/dashboard" replace />;
    }
    if (user.role === 'instructor') {
        return <Navigate to="/instructor/dashboard" replace />;
    }
    if (user.role === 'manager') {
        return <Navigate to="/manager/dashboard" replace />;
    }
    if (user.role !== 'admin') {
        // Students or unknown roles go to student portal
        return <Navigate to="/student/dashboard" replace />;
    }

    const navItems = [
        { icon: 'dashboard', label: t('admin.nav.dashboard'), path: '/admin/dashboard' },
        { icon: 'menu_book', label: t('admin.nav.courses'), path: '/admin/courses' },
        { icon: 'forum', label: t('admin.nav.forum'), path: '/admin/forum' },
        { icon: 'groups', label: t('admin.nav.instructors'), path: '/admin/instructors' },
        { icon: 'school', label: t('admin.nav.students'), path: '/admin/students' },
        { icon: 'quiz', label: t('admin.nav.quizzes'), path: '/admin/quizzes' },
        { icon: 'campaign', label: t('admin.nav.announcements'), path: '/admin/announcements' },
        { icon: 'record_voice_over', label: t('admin.nav.testimonials'), path: '/admin/testimonials' },
        { icon: 'notifications', label: t('admin.nav.notifications'), path: '/admin/notifications' },
        { icon: 'work', label: t('admin.nav.manage_jobs'), path: '/admin/opportunities' },
        { icon: 'diversity_3', label: t('admin.nav.job_seekers'), path: '/admin/seekers' },
        { icon: 'admin_panel_settings', label: t('admin.nav.business_students'), path: '/admin/business/users' },
        { icon: 'menu_book', label: t('admin.nav.business_courses'), path: '/admin/business/courses' },
        { icon: 'person', label: t('admin.nav.my_profile'), path: '/admin/profile' },
    ];

    return (
        <div className="h-screen w-full bg-[#F5DEB3] dark:bg-[#1c1916] flex overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-[#F5DEB3] dark:bg-[#2c2825] border-r border-espresso/10 dark:border-white/5 h-full shrink-0 z-20 shadow-2xl relative group">
                {/* Lateral accent for the entire sidebar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/10"></div>

                <div className="p-6 flex items-center gap-3 border-b border-espresso/5 dark:border-white/5 relative z-10 shrink-0">
                    <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-xl overflow-hidden group-hover:scale-105 transition-transform">
                        <img src="/logo.jpg" alt="Usafi Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <span className="font-serif text-lg font-bold text-espresso dark:text-white tracking-tight block leading-none">
                            Usafi
                        </span>
                        <span className="text-[8px] font-black text-espresso/40 uppercase tracking-[0.3em]">
                            Command
                        </span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto relative z-10 custom-scrollbar">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative group/nav overflow-hidden shrink-0",
                                location.pathname === item.path
                                    ? "bg-espresso text-white shadow-xl translate-x-1"
                                    : "text-espresso/60 dark:text-white/60 hover:bg-white/40 dark:hover:bg-white/5 hover:text-espresso dark:hover:text-primary hover:translate-x-1 shadow-sm border border-transparent hover:border-espresso/10"
                            )}
                        >
                            {/* Individual Nav Item Accent */}
                            <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
                                location.pathname === item.path ? "bg-white/40" : "bg-espresso/10 group-hover/nav:bg-espresso"
                            )}></div>

                            <span className={cn(
                                "material-symbols-outlined text-[20px] transition-transform group-hover/nav:scale-110",
                                location.pathname === item.path ? "text-white" : "text-espresso/40"
                            )}>{item.icon}</span>
                            <span className="relative z-10">{item.label}</span>

                            {item.path === '/admin/notifications' && unreadCount > 0 && (
                                <span className={cn(
                                    "ml-auto text-[10px] font-black h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm",
                                    location.pathname === item.path ? "bg-white text-espresso" : "bg-espresso text-white"
                                )}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-espresso/10 dark:border-white/5 relative z-10 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all relative overflow-hidden shadow-sm border border-transparent hover:border-red-200"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        {t('admin.nav.sign_out')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full min-w-0 transition-colors duration-300">
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
                                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-xl overflow-hidden">
                                    <img src="/logo.jpg" alt="Usafi Logo" className="w-full h-full object-cover" />
                                </div>
                                <span className="font-serif text-lg font-bold text-espresso dark:text-white">{t('admin.nav.admin_menu')}</span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-espresso/5 text-espresso dark:text-white hover:bg-espresso/10 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <nav className="flex-1 p-6 space-y-2 overflow-y-auto relative z-10 custom-scrollbar">
                            {/* ... Mobile nav logic mostly unchanged ... */}
                            {/* Note: I'm keeping existing mobile logic implied or preserving as much as possible, 
                                 but user request is specific to desktop layout gap. 
                                 For shortness, I assume mobile menu code block is preserved or handled by surrounding context if possible. 
                                 Since I am replacing the whole return block, I must include enough.
                             */}
                            <div className="pb-4 mb-4 border-b border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-black/5 dark:bg-white/5">
                                    <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                                        {user?.name?.[0] || 'A'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-espresso dark:text-white">
                                            {user?.name || t('admin.nav.admin_default')}
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
                                {t('admin.nav.sign_out')}
                            </button>
                        </nav>
                    </div>
                )}

                <main className="flex-1 relative overflow-hidden flex flex-col">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
