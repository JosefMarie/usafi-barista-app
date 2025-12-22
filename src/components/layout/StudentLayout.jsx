import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { PendingApproval } from '../../pages/student/PendingApproval';

// ...

export function StudentLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

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

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };



    // Redoing without inline require
    const navItems = [
        { name: 'Dashboard', path: '/student/dashboard', icon: 'dashboard' },
        { name: 'My Courses', path: '/student/courses', icon: 'school' },
        { name: 'E-Learning', path: '/student/e-learning', icon: 'video_library' },
        { name: 'Forum', path: '/student/forum', icon: 'forum' },
        { name: 'Class Chat', path: '/student/chat', icon: 'chat', badge: totalUnread },
        { name: 'Notifications', path: '/student/notifications', icon: 'notifications', badge: unreadNotifications },
        { name: 'Profile', path: '/student/profile', icon: 'person' },
    ];

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // STRICT RBAC: Redirect Admins/Instructors to their own portal
    if (user.role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'instructor') {
        return <Navigate to="/instructor/dashboard" replace />;
    }

    // Filter Navigation for Onsite Students
    // Onsite students cannot access the online course portal
    const isOnsite = user.studyMethod === 'onsite';

    // Dynamic Nav Items
    const finalNavItems = navItems.filter(item => {
        if (isOnsite) {
            // Onsite students only see Profile, Forum, Chat (maybe), but definitely not Courses/Dashboard (if dashboard is course-centric)
            // User request: "Onsite students can not use the Online portal"
            // We'll leave them with Profile and basic communication if applicable, or maybe just Profile.
            // Let's assume they might want Forum/Chat, but definitely not "My Courses".
            return ['Profile', 'Forum', 'Class Chat'].includes(item.name);
        }
        return true;
    });

    // Route Guard for Onsite Students trying to access restricted pages
    const restrictedPaths = ['/student/dashboard', '/student/courses'];
    if (isOnsite && restrictedPaths.some(path => location.pathname.startsWith(path))) {
        // Redirect onsite students to Profile if they try to go to Dashboard or Courses
        return <Navigate to="/student/profile" replace />;
    }

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
        <div className="min-h-screen bg-gray-50 dark:bg-[#1c1916] flex transition-colors duration-300">

            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-[#2c2825] border-r border-gray-200 dark:border-white/5 fixed h-full transition-colors duration-300 z-20">
                <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-white/5">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white shadow-md">
                        <span className="material-symbols-outlined text-xl">coffee</span>
                    </div>
                    <span className="font-serif text-lg font-bold text-espresso dark:text-white tracking-tight">
                        Usafi Student
                    </span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {finalNavItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
                                location.pathname === item.path
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "text-espresso/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary"
                            )}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            {item.name}
                            {item.badge > 0 && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                                    {item.badge > 99 ? '99+' : item.badge}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-gray-50 dark:bg-white/5">
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className="h-9 w-9 rounded-full object-cover border border-gray-200 dark:border-white/10"
                            onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=User'; }}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-espresso dark:text-white truncate">{displayName}</p>
                            <p className="text-[10px] text-espresso/60 dark:text-white/60 truncate">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

                {/* Mobile Header */}
                <header className="md:hidden bg-white dark:bg-[#2c2825] border-b border-gray-200 dark:border-white/5 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
                    <Link to="/student/dashboard" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-xl">coffee</span>
                        </div>
                        <span className="font-serif text-lg font-bold text-espresso dark:text-white">
                            Usafi
                        </span>
                    </Link>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-espresso dark:text-white p-1">
                        <span className="material-symbols-outlined text-2xl">
                            {isMobileMenuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </header>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-20 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="absolute top-[60px] left-0 right-0 bg-white dark:bg-[#2c2825] shadow-xl border-b border-black/5 p-4 space-y-2" onClick={e => e.stopPropagation()}>
                            {finalNavItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors relative",
                                        location.pathname === item.path
                                            ? "bg-primary text-white"
                                            : "text-espresso dark:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                                    )}
                                >
                                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                    {item.name}
                                    {item.badge > 0 && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center">
                                            {item.badge > 99 ? '99+' : item.badge}
                                        </span>
                                    )}
                                </Link>
                            ))}
                            <div className="h-px bg-gray-100 dark:bg-white/10 my-2"></div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined text-xl">logout</span>
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-x-hidden">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
