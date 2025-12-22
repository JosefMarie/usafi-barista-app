import React from 'react';
import { Link } from 'react-router-dom';

export function ThankYou() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 animate-bounce">
                <span className="material-symbols-outlined text-5xl">check_circle</span>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
                Registration Received!
            </h1>

            <p className="text-lg text-espresso/80 dark:text-white/80 max-w-xl mb-8">
                Thank you for enrolling with Usafi Barista Training Center. We have sent an email with payment details and your next steps.
            </p>

            <div className="flex gap-4">
                <Link
                    to="/"
                    className="px-8 py-3 rounded-xl bg-primary text-white font-bold shadow-lg hover:bg-primary/90 transition-all"
                >
                    Return Home
                </Link>
            </div>
        </div>
    );
}
