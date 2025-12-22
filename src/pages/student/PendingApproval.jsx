import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function PendingApproval() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-4 text-center">

            <div className="bg-white dark:bg-[#2c2825] p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full border border-gray-100 dark:border-white/5 space-y-6">

                {/* Icon */}
                <div className="h-20 w-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto text-yellow-600 dark:text-yellow-400">
                    <span className="material-symbols-outlined text-4xl">hourglass_top</span>
                </div>

                {/* Text Content */}
                <div className="space-y-3">
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-espresso dark:text-white">
                        Application Under Review
                    </h1>
                    <p className="text-espresso/70 dark:text-white/70">
                        Hello <span className="font-bold">{user?.name || user?.email}</span>,
                    </p>
                    <p className="text-espresso/70 dark:text-white/70 leading-relaxed">
                        Your enrollment is currently <strong>Pending Approval</strong>.
                        Our administrators are reviewing your application. You will be able to access the dashboard and courses once your account is activated.
                    </p>
                </div>

                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm font-medium">
                    <span className="w-2 h-2 bg-current rounded-full animate-pulse"></span>
                    Status: Pending
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                    <p className="text-xs text-espresso/50 dark:text-white/50 mb-4">
                        If you believe this is a mistake or have waited longer than 24 hours, please contact support.
                    </p>

                    <button
                        onClick={handleLogout}
                        className="w-full py-3 px-6 bg-espresso text-white font-bold rounded-xl hover:bg-espresso/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Sign Out
                    </button>
                </div>

            </div>
        </div>
    );
}
