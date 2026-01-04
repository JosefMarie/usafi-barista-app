import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Francais' },
    { code: 'rw', name: 'Kinyarwanda' },
    { code: 'sw', name: 'Kiswahili' },
];

export function LanguageSwitcher({ className, isScrolled, isLightHero }) {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentLanguage = languages.find(lang => lang.code === (i18n.language?.split('-')[0] || 'en')) || languages[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleLanguage = (code) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className={cn("relative", className)} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-sm font-medium",
                    isLightHero && !isScrolled
                        ? "text-white/90 hover:bg-white/10 hover:text-white"
                        : "text-espresso dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                )}
            >
                <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                    isLightHero && !isScrolled ? "bg-white/20" : "bg-primary/10"
                )}>
                    <span className={cn(
                        "material-symbols-outlined text-[20px]",
                        isLightHero && !isScrolled ? "text-white" : "text-primary"
                    )}>language</span>
                </div>
                <span>{currentLanguage.name}</span>
                <span className={cn(
                    "material-symbols-outlined text-[18px] transition-transform duration-200",
                    isOpen ? "rotate-180" : ""
                )}>
                    expand_more
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#2c2825] rounded-xl shadow-xl border border-black/5 overflow-hidden z-[60] py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="absolute -top-1 right-6 w-3 h-3 bg-white dark:bg-[#2c2825] rotate-45 border-l border-t border-black/5"></div>
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => toggleLanguage(lang.code)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left relative z-10",
                                i18n.language?.startsWith(lang.code)
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-espresso dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/5"
                            )}
                        >
                            <span>{lang.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
