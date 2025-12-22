import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function PublicLayout() {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white overflow-x-hidden antialiased">
            <Navbar />
            <main>
                <Outlet />
            </main>
            {/* Footer will go here */}
        </div>
    );
}
