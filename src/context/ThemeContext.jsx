import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // Force light theme always
    const theme = 'light';

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove dark mode class if it exists and force light
        root.classList.remove('dark');
        root.classList.add('light');

        // Force light color scheme
        root.style.colorScheme = 'light';

        // Clear any saved preference
        localStorage.removeItem('theme');
    }, []);

    const toggleTheme = () => {
        // No-op: Dark mode is disabled
        console.log('Dark mode is permanently disabled');
    };

    const setTheme = () => { };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
