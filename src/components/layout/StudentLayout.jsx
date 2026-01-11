import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import { ThemeToggle } from '../common/ThemeToggle';
import { PortalTopBar } from './PortalTopBar';
import { PendingApproval } from '../../pages/student/PendingApproval';
import { Footer } from './Footer';

// ...

export function StudentLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [newForumPosts, setNewForumPosts] = useState(0);

    // Global Unread Listener for Sidebar Badge (Chat)
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let total = 0;
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                // Sum up unread counts for THIS user
                total += (data[`unreadCount_${user.uid}`] || 0);
            });
            setTotalUnread(total);
        });

        return () => unsubscribe();
    }, [user]);

    // Global Unread Listener for Notifications
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', user.uid),
            where('read', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadNotifications(snapshot.size);
        });

        return () => unsubscribe();
    }, [user]);

    // Forum New Posts Listener
    useEffect(() => {
        if (!user) return;

        const lastVisited = user.lastVisitedForum?.toDate?.() || new Date(0);

        const q = query(
            collection(db, 'forum_posts'),
            where('createdAt', '>', lastVisited),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // Don't count posts created by the current user
            const newPosts = snapshot.docs.filter(doc => doc.data().authorId !== user.uid);
            setNewForumPosts(newPosts.length);
        });

        return () => unsubscribe();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };



    // Redoing without inline require
    const navItems = [
        { name: 'Dashboard', path: '/student/dashboard', icon: 'dashboard' },
        { name: 'Opportunities', path: '/student/opportunities', icon: 'work' },
        { name: 'My Courses', path: '/student/courses', icon: 'school' },
        { name: 'E-Learning', path: '/student/e-learning', icon: 'video_library' },
        { name: 'CV Builder', path: '/student/cv-builder', icon: 'description' },
        { name: 'Certificates', path: '/student/certificates', icon: 'workspace_premium' },
        { name: 'Forum', path: '/student/forum', icon: 'forum', badge: newForumPosts },
        { name: 'Class Chat', path: '/student/chat', icon: 'chat', badge: totalUnread },
        { name: 'Notifications', path: '/student/notifications', icon: 'notifications', badge: unreadNotifications },
        { name: 'Profile', path: '/student/profile', icon: 'person' },
    ];

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // STRICT RBAC: Redirect Admins/Instructors to their own portal
    if (user.role === 'ceo') {
        return <Navigate to="/ceo/dashboard" replace />;
    }
    if (user.role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'instructor') {
        return <Navigate to="/instructor/dashboard" replace />;
    }
    if (user.role === 'job_seeker') {
        return <Navigate to="/seeker/dashboard" replace />;
    }

    // Both Online and Onsite students have full access to all features
    // They are differentiated by user.studyMethod property only
    const finalNavItems = navItems;

    // BLOCK PENDING STUDENTS
    // If role is student and status is not 'active', show pending screen
    if (user.role === 'student' && user.status !== 'active') {
        return <PendingApproval />;
    }

    // Log user for debugging
    console.log("StudentLayout Rendering. User:", user);

    const displayName = user.name || user.fullName || user.email || 'Student';
    // Use UI Avatars as fallback if no avatar provided
    const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

    return (
        <div className="h-screen w-full bg-[#F5DEB3] dark:bg-[#1c1916] flex overflow-hidden transition-colors duration-300">

            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-[#F5DEB3] dark:bg-[#2c2825] border-r border-espresso/10 dark:border-white/5 h-full shrink-0 z-20 shadow-2xl relative overflow-hidden group">
                {/* Lateral accent for the entire sidebar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/10"></div>

                <div className="p-6 flex items-center gap-3 border-b border-espresso/5 dark:border-white/5 relative z-10 shrink-0">
                    <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-xl overflow-hidden group-hover:scale-105 transition-transform">
                        <img src="/logo.jpg" alt="Usafi Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-serif text-lg font-bold text-espresso dark:text-white tracking-tight">
                        Usafi Student
                    </span>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto relative z-10 custom-scrollbar">
                    {finalNavItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative group/nav overflow-hidden shrink-0",
                                location.pathname === item.path
                                    ? "bg-espresso text-white shadow-xl translate-x-1"
                                    : "bg-[#7B3F00] text-white hover:bg-white/40 dark:hover:bg-white/5 hover:text-espresso dark:hover:text-primary hover:translate-x-1 shadow-sm border border-transparent hover:border-espresso/10"
                            )}
                        >
                            {/* Individual Nav Item Accent */}
                            <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
                                location.pathname === item.path ? "bg-white/40" : "bg-white/20 group-hover/nav:bg-espresso"
                            )}></div>

                            <span className={cn(
                                "material-symbols-outlined text-[20px] transition-transform group-hover/nav:scale-110",
                                location.pathname === item.path ? "text-white" : "text-white group-hover/nav:text-espresso"
                            )}>{item.icon}</span>
                            <span className="relative z-10">{item.name}</span>

                            {item.badge > 0 && (
                                <span className={cn(
                                    "ml-auto text-[10px] font-black h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm",
                                    location.pathname === item.path ? "bg-white text-espresso" : "bg-espresso text-white"
                                )}>
                                    {item.badge > 99 ? '99+' : item.badge}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-espresso/5 dark:border-white/5 relative z-10 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 px-3 py-3 text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95 border border-red-500/20"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full min-w-0 w-full transition-colors duration-300">

                <PortalTopBar
                    user={user}
                    unreadNotifications={unreadNotifications}
                    onLogout={handleLogout}
                    onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="absolute top-[0px] left-0 right-0 bg-[#F5DEB3] dark:bg-[#2c2825] shadow-2xl border-b border-espresso/10 p-6 space-y-2 animate-in slide-in-from-top duration-300" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <span className="font-serif text-lg font-bold text-espresso dark:text-white">Menu</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-espresso/5 text-espresso">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <nav className="space-y-2">
                                {finalNavItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all relative overflow-hidden",
                                            location.pathname === item.path
                                                ? "bg-espresso text-white shadow-lg"
                                                : "bg-[#7B3F00] text-white hover:bg-white/40 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute left-0 top-0 bottom-0 w-1",
                                            location.pathname === item.path ? "bg-white/40" : "bg-white/20"
                                        )}></div>
                                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                        {item.name}
                                        {item.badge > 0 && (
                                            <span className={cn(
                                                "ml-auto text-[10px] font-black h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center",
                                                location.pathname === item.path ? "bg-white text-espresso" : "bg-espresso text-white"
                                            )}>
                                                {item.badge > 99 ? '99+' : item.badge}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </nav>
                            <div className="h-px bg-espresso/5 dark:bg-white/10 my-6"></div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-3 px-3 py-4 text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm border border-red-500/20"
                            >
                                <span className="material-symbols-outlined text-xl">logout</span>
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}

                {/* Page Content */}
                {/* Page Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col w-full custom-scrollbar">
                    <div className="flex-grow p-6 flex flex-col items-start w-full">
                        <Outlet />
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );

}
