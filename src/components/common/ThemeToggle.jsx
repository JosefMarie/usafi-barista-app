import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle({ className = "" }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`flex items-center justify-center p-2 rounded-xl transition-all duration-300 ${theme === 'dark'
                    ? 'bg-white/10 text-yellow-400 hover:bg-white/20'
                    : 'bg-black/5 text-espresso hover:bg-black/10'
                } ${className}`}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            <span className="material-symbols-outlined text-[22px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
        </button>
    );
}
