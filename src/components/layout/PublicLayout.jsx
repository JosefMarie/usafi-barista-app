import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

import { Footer } from './Footer';

export function PublicLayout() {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white overflow-x-hidden antialiased flex flex-col">
            <Navbar />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
