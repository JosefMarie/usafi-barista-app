import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { GlobalSearch } from '../common/GlobalSearch';
import { ThemeToggle } from '../common/ThemeToggle';

export function PortalTopBar({ user, unreadNotifications = 0, onLogout }) {
    const { t } = useTranslation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);

        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            clearInterval(timer);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const displayName = user?.name || user?.fullName || user?.email || 'User';
    const avatarUrl = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

    return (
        <div className="h-16 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#1c1916]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between transition-colors">

            {/* Search Trigger (Desktop) */}
            <div className="hidden sm:flex items-center flex-1 max-w-md">
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center w-full gap-3 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-espresso/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10 transition-all group"
                >
                    <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">search</span>
                    <span className="text-sm font-medium flex-1 text-left">
                        {t('search.placeholder', 'Search everything...')}
                    </span>
                    <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2825] px-1.5 font-mono text-[10px] font-medium opacity-100">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </button>
            </div>

            {/* Mobile Search Icon */}
            <button
                onClick={() => setIsSearchOpen(true)}
                className="sm:hidden p-2 rounded-lg text-espresso/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
                <span className="material-symbols-outlined">search</span>
            </button>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-4">

                {/* Date/Time (Desktop) */}
                <div className="hidden lg:flex flex-col items-end mr-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-espresso/40 dark:text-white/40">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm font-serif font-bold text-espresso dark:text-white">
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>

                <div className="h-8 w-[1px] bg-black/5 dark:bg-white/5 hidden sm:block"></div>

                {/* Notifications & Theme */}
                <ThemeToggle className="hover:bg-primary/10 transition-colors" />

                {/* User Menu */}
                <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-black/5 dark:border-white/5">
                    <div className="hidden sm:flex flex-col items-end">
                        <p className="text-xs font-bold text-espresso dark:text-white truncate max-w-[120px]">
                            {displayName}
                        </p>
                        <p className="text-[10px] text-espresso/50 dark:text-white/50 uppercase tracking-tighter font-bold">
                            {user?.role || 'Portal'}
                        </p>
                    </div>
                    <div className="relative group/user">
                        <button className="h-10 w-10 rounded-xl overflow-hidden border-2 border-primary/20 hover:border-primary transition-all shadow-sm">
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        </button>

                        {/* Simple Dropdown on Hover or click */}
                        <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all duration-200 transform translate-y-2 group-hover/user:translate-y-0 z-50">
                            <div className="bg-white dark:bg-[#2c2825] rounded-xl shadow-2xl border border-black/5 p-2">
                                <p className="sm:hidden px-3 py-2 text-xs font-bold text-espresso dark:text-white border-b border-black/5 mb-1 pb-2">
                                    {displayName}
                                </p>
                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left"
                                >
                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <GlobalSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </div>
    );
}
