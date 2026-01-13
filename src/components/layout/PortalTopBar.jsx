import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { GlobalSearch } from '../common/GlobalSearch';

import { LanguageSwitcher } from '../LanguageSwitcher';

export function PortalTopBar({ user, onLogout, onToggleMobileMenu }) {
    const { t, i18n } = useTranslation();
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

    const displayName = user?.name || user?.fullName || user?.email || t('nav.user_default');
    const avatarUrl = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

    return (
        <div className="h-16 md:h-20 border-b border-espresso/10 bg-espresso/95 dark:bg-[#1c1916]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center transition-colors gap-4">

            {/* Mobile Menu Toggle */}
            {/* Mobile Menu Toggle */}
            <button
                onClick={onToggleMobileMenu}
                className="md:hidden p-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95"
            >
                <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>

            {/* Mobile Search Icon */}
            {/* Mobile Search Icon */}
            <button
                onClick={() => setIsSearchOpen(true)}
                className="sm:hidden p-2 rounded-lg text-white hover:bg-white/5 dark:hover:bg-white/5 transition-colors ml-auto"
            >
                <span className="material-symbols-outlined">search</span>
            </button>

            {/* Right-Aligned Content */}
            <div className="hidden sm:flex items-center gap-4 ml-auto">
                {/* Search Trigger */}
                {/* Search Trigger */}
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/10 dark:border-white/5 text-white hover:bg-white/20 dark:hover:bg-white/10 transition-all group shadow-sm w-[280px]"
                >
                    <span className="material-symbols-outlined text-[20px] transition-colors">search</span>
                    <span className="text-[11px] font-black uppercase tracking-widest flex-1 text-left">
                        {t('search.placeholder', 'Search everything...')}
                    </span>
                    <kbd className="hidden lg:inline-flex h-6 items-center gap-1 rounded-lg border border-white/20 dark:border-white/10 bg-white/10 dark:bg-[#2c2825] px-2 font-mono text-[10px] font-black opacity-100 shadow-sm text-white">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </button>

                {/* Date/Time (Desktop) */}
                <div className="hidden lg:flex flex-col items-end">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                        {currentTime.toLocaleDateString(i18n.language, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm font-serif font-bold text-white">
                        {currentTime.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>

                <div className="h-8 w-[1px] bg-white/10 dark:bg-white/5 hidden lg:block"></div>

                {/* Language Switcher */}
                <LanguageSwitcher className="hidden lg:block" isLightHero={true} />

                {/* Theme Toggle */}


                {/* User Menu */}
                <div className="flex items-center gap-4 pl-4 border-l border-white/10 dark:border-white/5">
                    <div className="hidden sm:flex flex-col items-end">
                        <p className="text-[11px] font-black uppercase tracking-wider text-white truncate max-w-[150px]">
                            {displayName}
                        </p>
                        <p className="text-[10px] text-white/60 uppercase tracking-widest font-black">
                            {user?.role || 'Portal'}
                        </p>
                    </div>
                    <div className="relative group/user">
                        <button className="h-12 w-12 rounded-2xl overflow-hidden border-2 border-white/10 hover:border-white transition-all shadow-xl group-hover/user:scale-105">
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        </button>

                        {/* Simple Dropdown on Hover or click */}
                        <div className="absolute right-0 top-full mt-3 w-56 opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all duration-300 transform translate-y-3 group-hover/user:translate-y-0 z-50">
                            <div className="bg-[#F5DEB3] dark:bg-[#2c2825] rounded-3xl shadow-2xl border border-espresso/10 p-3 overflow-hidden relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20"></div>
                                <p className="sm:hidden px-3 py-3 text-[10px] font-black uppercase tracking-widest text-[#00008B] border-b border-espresso/5 mb-2 pb-3">
                                    {displayName}
                                </p>
                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm group-hover/btn:shadow-lg"
                                >
                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                    {t('nav.logout')}
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
