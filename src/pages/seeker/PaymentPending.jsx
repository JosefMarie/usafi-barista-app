import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

export function PaymentPending() {
    const { user, logout } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    // If somehow a paid user lands here, redirect to dashboard
    if (user.paymentStatus === 'paid') return <Navigate to="/seeker/dashboard" replace />;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4 font-display">
            <div className="bg-[#F5DEB3] dark:bg-white/5 p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-espresso/10 relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                <div className="h-24 w-24 bg-espresso text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-5xl">payments</span>
                </div>

                <h1 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-4">
                    Payment Required
                </h1>

                <p className="text-espresso/70 dark:text-white/70 mb-8 text-lg">
                    To access the exclusive job opportunities, you need to pay the one-time "Ready for Opportunity" fee.
                </p>

                <div className="bg-white/50 dark:bg-black/20 p-6 rounded-2xl mb-8 text-left border border-espresso/10">
                    <p className="text-sm font-bold text-espresso/50 dark:text-white/50 uppercase tracking-wide mb-2">Instructions:</p>
                    <ol className="list-decimal list-inside space-y-3 text-espresso dark:text-white font-medium">
                        <li>Send <strong>5,000 RWF</strong> to Momo Pay.</li>
                        <li>Code: <strong>*182*...#</strong> (Usafi Barista)</li>
                        <li>Use your name <strong>"{user.name}"</strong> as reference.</li>
                        <li>Wait for Admin approval (usually within 24h).</li>
                    </ol>
                </div>

                <div className="flex flex-col gap-4">
                    <button
                        disabled
                        className="w-full h-12 rounded-xl bg-gray-200 dark:bg-white/10 text-espresso/50 dark:text-white/50 font-bold cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg animate-spin">hourglass_top</span>
                        Waiting for Approval...
                    </button>

                    <button
                        onClick={() => logout()}
                        className="text-primary hover:underline font-bold text-sm"
                    >
                        Logout and check back later
                    </button>
                </div>
            </div>
        </div>
    );
}
