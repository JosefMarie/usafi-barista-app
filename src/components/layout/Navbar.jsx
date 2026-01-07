import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { ThemeToggle } from '../common/ThemeToggle';
import { GlobalSearch } from '../common/GlobalSearch';
import { GradientButton } from '../ui/GradientButton';

export function Navbar() {
    const { t } = useTranslation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const location = useLocation();

    // Pages that have a dark header/hero section where navbar should be white when transparent
    const isDarkHeader = location.pathname === '/' || location.pathname === '/courses';

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setActiveDropdown(null);
    }, [location.pathname]);

    const navLinks = [
        { name: t('nav.home'), path: '/' },
        { name: t('nav.about'), path: '/about' },
        { name: t('nav.courses'), path: '/courses' },
        {
            name: t('nav.explore'),
            path: '#',
            dropdown: [
                { name: t('nav.career'), path: '/career' },
                { name: t('nav.equipment'), path: '/equipment' },
                { name: t('nav.testimonials'), path: '/testimonials' },
                { name: t('nav.gallery'), path: '/gallery' },
                { name: t('nav.blog'), path: '/blog' },
                { name: t('nav.inclusion'), path: '/inclusion' },
                { name: t('nav.certificates'), path: '/certificates' },
            ]
        },
        { name: t('nav.contact'), path: '/contact' },
    ];

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full",
                isScrolled
                    ? "bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md shadow-sm py-3"
                    : "bg-transparent py-5"
            )}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
                        <img src="/logo.jpg" alt="Usafi Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className={cn(
                        "font-serif text-xl font-bold tracking-tight transition-colors",
                        isScrolled ? "text-espresso dark:text-white" : "text-white shadow-black/50 text-shadow-sm"
                    )}>
                        Usafi Barista
                    </span>

                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <div key={link.name} className="relative group/dropdown">
                            {link.dropdown ? (
                                <button
                                    className={cn(
                                        "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary focus:outline-none cursor-pointer",
                                        !isScrolled && isDarkHeader ? "text-white/90 hover:text-white" : "text-espresso dark:text-white"
                                    )}
                                >
                                    {link.name}
                                    <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                                </button>
                            ) : (
                                <Link
                                    to={link.path}
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-primary relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
                                        location.pathname === link.path ? "text-primary after:w-full" : "",
                                        !isScrolled && isDarkHeader ? "text-white/90 hover:text-white" : "" // Light text on Hero only if not scrolled
                                    )}
                                >
                                    {link.name}
                                </Link>
                            )}

                            {/* Dropdown Menu */}
                            {link.dropdown && (
                                <div className="absolute top-full left-0 mt-2 w-56 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-200 transform translate-y-2 group-hover/dropdown:translate-y-0 pt-2">
                                    <div className="bg-white dark:bg-[#2c2825] rounded-xl shadow-xl border border-black/5 overflow-hidden p-2">
                                        {link.dropdown.map((subItem) => (
                                            <Link
                                                key={subItem.path}
                                                to={subItem.path}
                                                className={cn(
                                                    "block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
                                                    location.pathname === subItem.path ? "text-primary bg-primary/5" : "text-espresso dark:text-white/90"
                                                )}
                                            >
                                                {subItem.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    <Link
                        to="/login"
                        className={cn(
                            "text-sm font-medium transition-colors hover:text-primary",
                            !isScrolled && isDarkHeader ? "text-white/90 hover:text-white" : "text-espresso dark:text-white"
                        )}
                    >
                        {t('nav.login')}
                    </Link>
                    <GradientButton to="/enroll" className="!p-[1px] !rounded-full !bg-none hover:!scale-105 hover:!shadow-lg">
                        <div className="relative flex h-10 w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-6 transition-all duration-300">
                            <span className="text-sm font-bold tracking-wide text-white">
                                {t('nav.enroll')}
                            </span>
                        </div>
                    </GradientButton>

                    {/* Search Button */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className={cn(
                            "p-2 rounded-xl transition-all duration-300 hover:bg-primary/10",
                            !isScrolled && isDarkHeader ? "text-white/90 hover:bg-white/10" : "text-espresso dark:text-white"
                        )}
                        title="Search (Cmd+K)"
                    >
                        <span className="material-symbols-outlined text-[22px]">search</span>
                    </button>

                    {/* Theme Toggle */}
                    <ThemeToggle className={cn(
                        "hover:bg-primary/10 transition-colors",
                        !isScrolled && isDarkHeader ? "text-white/90 hover:bg-white/10" : "text-espresso dark:text-white"
                    )} />

                    {/* Language Switcher */}
                    <div className="h-6 w-[1px] bg-espresso/10 dark:bg-white/10 mx-2"></div>
                    <LanguageSwitcher
                        isScrolled={isScrolled}
                        isLightHero={isDarkHeader}
                    />
                </nav>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className={cn(
                        "md:hidden p-2 rounded-lg transition-colors",
                        isScrolled ? "text-espresso dark:text-white hover:bg-black/5" : "text-white hover:bg-white/10"
                    )}
                >
                    <span className="material-symbols-outlined text-2xl">
                        {isMobileMenuOpen ? 'close' : 'menu'}
                    </span>
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={cn(
                "absolute top-full left-0 right-0 bg-background-light dark:bg-background-dark shadow-xl border-t border-black/5 transition-all duration-300 origin-top md:hidden max-h-[85vh] overflow-y-auto",
                isMobileMenuOpen ? "opacity-100 scale-y-100 visible" : "opacity-0 scale-y-95 invisible"
            )}>
                <nav className="flex flex-col p-6 gap-2">
                    {navLinks.map((link) => (
                        <div key={link.name}>
                            {link.dropdown ? (
                                <div className="py-2">
                                    <div className="text-sm font-bold text-espresso/50 dark:text-white/50 uppercase tracking-widest px-2 mb-2">
                                        {link.name}
                                    </div>
                                    <div className="pl-4 border-l-2 border-primary/20 flex flex-col gap-2">
                                        {link.dropdown.map(subItem => (
                                            <Link
                                                key={subItem.path}
                                                to={subItem.path}
                                                className={cn(
                                                    "text-base font-medium p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors block",
                                                    location.pathname === subItem.path ? "text-primary bg-primary/5" : "text-espresso dark:text-white"
                                                )}
                                            >
                                                {subItem.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    to={link.path}
                                    className={cn(
                                        "text-lg font-medium p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors block",
                                        location.pathname === link.path ? "text-primary bg-primary/5" : "text-espresso dark:text-white"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            )}
                        </div>
                    ))}
                    <div className="flex items-center gap-4 p-2">
                        <ThemeToggle className="flex-1" />
                        <Link
                            to="/login"
                            className="flex-[2] text-lg font-medium p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors block text-espresso dark:text-white border border-black/5 dark:border-white/5 text-center"
                        >
                            {t('nav.login')}
                        </Link>
                    </div>
                    <Link
                        to="/enroll"
                        className="mt-4 w-full text-center py-3 rounded-xl bg-primary text-white font-bold shadow-lg"
                    >
                        {t('nav.enroll')}
                    </Link>

                    {/* Mobile Language Switcher */}
                    <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5">
                        <div className="text-xs font-bold text-espresso/40 dark:text-white/40 uppercase tracking-widest px-2 mb-3">
                            Language / Ururimi / Langue
                        </div>
                        <LanguageSwitcher className="w-full" />
                    </div>
                </nav>
            </div>

            <GlobalSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </header>
    );
}
