import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { PortalTopBar } from './PortalTopBar';
import { useAuth } from '../../context/AuthContext';

export function CEOLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Listen for unread notifications for CEO (or admin if shared)
    React.useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', 'ceo'), // Dedicated notifications for CEO
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

    // STRICT RBAC: Only CEO can view this layout
    if (user.role !== 'ceo') {
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
        if (user.role === 'instructor') return <Navigate to="/instructor/dashboard" replace />;
        return <Navigate to="/student/dashboard" replace />;
    }

    const navItems = [
        { icon: 'monitoring', label: 'Executive Dashboard', path: '/ceo/dashboard' },
        { icon: 'badge', label: 'Staff Management', path: '/ceo/staff' },
        { icon: 'analytics', label: 'Revenue Report', path: '/ceo/revenue' },
        { icon: 'settings', label: 'Global Settings', path: '/ceo/settings' },
        { icon: 'person', label: 'My Profile', path: '/ceo/profile' },
    ];

    return (
        <div className="h-screen w-full bg-[#FAF5E8] dark:bg-[#1c1916] flex overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-[#4B3832] dark:bg-[#2c2825] border-r border-[#D4Af37]/20 h-full shrink-0 z-20 shadow-2xl relative group">
                {/* Gold accent for sidebar */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#D4Af37] via-[#F5DEB3] to-[#D4Af37]"></div>

                <div className="p-6 flex items-center gap-3 border-b border-[#D4Af37]/10 relative z-10 shrink-0">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#D4Af37] to-[#B8860B] flex items-center justify-center text-[#4B3832] shadow-xl shadow-[#D4Af37]/20">
                        <span className="material-symbols-outlined text-3xl">diamond</span>
                    </div>
                    <div>
                        <span className="font-serif text-xl font-bold text-[#F5DEB3] tracking-tight block leading-none">
                            USAFI
                        </span>
                        <span className="text-[9px] font-black text-[#D4Af37] uppercase tracking-[0.3em]">
                            EXECUTIVE
                        </span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto relative z-10 custom-scrollbar">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-4 px-4 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative group/nav overflow-hidden shrink-0",
                                location.pathname === item.path
                                    ? "bg-[#D4Af37] text-[#4B3832] shadow-lg shadow-[#D4Af37]/20 translate-x-1"
                                    : "text-[#F5DEB3]/60 hover:bg-[#D4Af37]/10 hover:text-[#D4Af37] hover:translate-x-1 border border-transparent hover:border-[#D4Af37]/20"
                            )}
                        >
                            {/* Active/Hover Indicator */}
                            <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
                                location.pathname === item.path ? "bg-[#4B3832]/20" : "bg-transparent group-hover/nav:bg-[#D4Af37]"
                            )}></div>

                            <span className={cn(
                                "material-symbols-outlined text-[20px] transition-transform group-hover/nav:scale-110",
                                location.pathname === item.path ? "text-[#4B3832]" : "text-[#D4Af37]/70"
                            )}>{item.icon}</span>
                            <span className="relative z-10">{item.label}</span>

                            {item.path === '/ceo/notifications' && unreadCount > 0 && (
                                <span className={cn(
                                    "ml-auto text-[10px] font-black h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm",
                                    location.pathname === item.path ? "bg-[#4B3832] text-[#D4Af37]" : "bg-[#D4Af37] text-[#4B3832]"
                                )}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-[#D4Af37]/10 relative z-10 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-[#F5DEB3] hover:bg-red-900/40 hover:text-red-400 transition-all relative overflow-hidden shadow-sm border border-transparent hover:border-red-500/20"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full min-w-0 transition-colors duration-300">
                <PortalTopBar
                    user={user}
                    unreadNotifications={unreadCount}
                    onLogout={handleLogout}
                    roleLabel="CHIEF EXECUTIVE"
                    themeColor="text-[#D4Af37]"
                    onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 bg-[#4B3832] md:hidden flex flex-col">
                        <div className="p-6 flex items-center justify-between border-b border-[#D4Af37]/10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#D4Af37] to-[#B8860B] flex items-center justify-center text-[#4B3832]">
                                    <span className="material-symbols-outlined text-2xl">diamond</span>
                                </div>
                                <span className="font-serif text-lg font-bold text-[#F5DEB3]">Executive Menu</span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 text-[#D4Af37] hover:bg-white/10 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <nav className="flex-1 p-6 space-y-2 overflow-y-auto relative z-10 custom-scrollbar">
                            <div className="pb-4 mb-4 border-b border-[#D4Af37]/20">
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#D4Af37]/10">
                                    <div className="h-10 w-10 rounded-full bg-[#D4Af37] text-[#4B3832] flex items-center justify-center font-bold text-lg">
                                        {user?.name?.[0] || 'C'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#F5DEB3]">
                                            {user?.name || 'CEO'}
                                        </p>
                                        <p className="text-sm text-[#D4Af37]">
                                            Chief Executive Officer
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
                                            ? "bg-[#D4Af37] text-[#4B3832] shadow-md shadow-[#D4Af37]/20"
                                            : "text-[#F5DEB3] hover:bg-[#D4Af37]/10"
                                    )}
                                >
                                    <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-400 hover:bg-red-900/20 transition-colors mt-2"
                            >
                                <span className="material-symbols-outlined text-[24px]">logout</span>
                                Sign Out
                            </button>
                        </nav>
                    </div>
                )}

                <main className="flex-1 relative overflow-hidden flex flex-col p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
