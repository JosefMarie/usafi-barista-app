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
        <div className="min-h-screen bg-[#FAF5E8] dark:bg-background-dark flex flex-col items-center justify-center p-6 md:p-8 text-center">

            <div className="bg-white dark:bg-[#1c1916] p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl w-full max-w-xl border border-espresso/5 space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400"></div>

                {/* Icon */}
                <div className="size-20 md:size-24 bg-yellow-400/10 rounded-3xl flex items-center justify-center mx-auto text-yellow-600 dark:text-yellow-400 shadow-lg shadow-yellow-400/5 group-hover:scale-110 transition-transform duration-500">
                    <span className="material-symbols-outlined text-4xl md:text-5xl">hourglass_top</span>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em]">Application Status</p>
                        <h1 className="text-3xl md:text-5xl font-serif font-black text-espresso dark:text-white leading-tight">
                            Under Review
                        </h1>
                    </div>

                    <p className="text-sm md:text-lg text-espresso/60 dark:text-white/60 font-serif italic">
                        Hello <span className="font-black text-espresso dark:text-white not-italic underline decoration-yellow-400/30 underline-offset-4">{user?.name || user?.email}</span>,
                    </p>
                    <p className="text-sm md:text-base text-espresso/70 dark:text-white/70 leading-relaxed max-w-md mx-auto">
                        Your enrollment is currently <strong className="text-espresso dark:text-white">Pending Approval</strong>.
                        Our administrators are diligently reviewing your application. You'll receive full access once your credentials are verified.
                    </p>
                </div>

                {/* Status Badge */}
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-yellow-400/5 text-yellow-700 dark:text-yellow-400 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest border border-yellow-400/10">
                    <span className="size-2 bg-current rounded-full animate-pulse"></span>
                    Verification Status: Pending
                </div>

                <div className="pt-8 border-t border-espresso/5 mt-8">
                    <p className="text-[9px] md:text-[10px] text-espresso/40 dark:text-white/40 uppercase tracking-widest mb-6 max-w-xs mx-auto">
                        Wait time is typically under 24 hours. If delayed, please reach out to our support team.
                    </p>

                    <button
                        onClick={handleLogout}
                        className="w-full py-5 px-8 bg-espresso text-white font-black text-xs md:text-sm uppercase tracking-widest rounded-2xl md:rounded-3xl shadow-2xl shadow-espresso/20 hover:shadow-espresso/40 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <span className="material-symbols-outlined text-xl">logout</span>
                        Sign Out
                    </button>
                </div>

            </div>
        </div>
    );
}
