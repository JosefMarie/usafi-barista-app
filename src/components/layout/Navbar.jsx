import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const location = useLocation();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setActiveDropdown(null);
    }, [location.pathname]);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'About Us', path: '/about' },
        { name: 'Courses', path: '/courses' },
        {
            name: 'Explore',
            path: '#',
            dropdown: [
                { name: 'Career Support', path: '/career' },
                { name: 'Equipment', path: '/equipment' },
                { name: 'Success Stories', path: '/testimonials' },
                { name: 'Gallery', path: '/gallery' },
                { name: 'Blog', path: '/blog' },
                { name: 'Inclusion Support', path: '/inclusion' },
                { name: 'Certificates', path: '/certificates' },
            ]
        },
        { name: 'Contact', path: '/contact' },
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
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-2xl">coffee</span>
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
                                        !isScrolled && location.pathname === '/' ? "text-white/90 hover:text-white" : "text-espresso dark:text-white"
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
                                        !isScrolled && location.pathname === '/' ? "text-white/90 hover:text-white" : "" // Light text on Hero only if not scrolled
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
                            !isScrolled && location.pathname === '/' ? "text-white/90 hover:text-white" : "text-espresso dark:text-white"
                        )}
                    >
                        Login
                    </Link>
                    <Link
                        to="/enroll"
                        className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-105 transition-all active:scale-95"
                    >
                        Enroll Now
                    </Link>
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
                    <Link
                        to="/login"
                        className="text-lg font-medium p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors block text-espresso dark:text-white"
                    >
                        Login
                    </Link>
                    <Link
                        to="/enroll"
                        className="mt-4 w-full text-center py-3 rounded-xl bg-primary text-white font-bold shadow-lg"
                    >
                        Enroll Now
                    </Link>
                </nav>
            </div>

        </header>
    );
}
