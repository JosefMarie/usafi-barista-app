import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export function InsufficientPermissions() {
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'login';

    const isLoginBlocked = type === 'login';

    return (
        <div className="min-h-screen bg-[#FAF5E8] dark:bg-[#1c1916] flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden transition-colors duration-300">
            {/* Top gold accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-[#D4Af37]"></div>
            
            {/* Background glowing decorations */}
            <div className="absolute -right-24 -top-24 size-96 rounded-full bg-[#D4Af37]/5 blur-3xl pointer-events-none"></div>
            <div className="absolute -left-24 -bottom-24 size-96 rounded-full bg-[#D4Af37]/5 blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-8 max-w-xl w-full bg-white/40 dark:bg-black/30 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-[#D4Af37]/20 shadow-2xl">
                {/* Floating premium badge/icon */}
                <div className="relative mx-auto size-28 bg-[#4B3832] dark:bg-[#2b2520] rounded-[2rem] flex items-center justify-center shadow-xl border-2 border-[#D4Af37]/30 group hover:scale-105 transition-transform duration-500">
                    <div className="absolute inset-0 bg-[#D4Af37]/5 rounded-[2rem] animate-ping opacity-75"></div>
                    <span className="material-symbols-outlined text-5xl text-[#D4Af37] relative z-10 transition-transform duration-700 group-hover:rotate-6">
                        {isLoginBlocked ? 'admin_panel_settings' : 'auto_stories'}
                    </span>
                </div>

                <div className="space-y-3">
                    <p className="text-[#D4Af37] font-black text-[10px] uppercase tracking-[0.4em] leading-none">
                        Platform Security Notice
                    </p>
                    <h1 className="text-3xl md:text-4xl font-serif font-black text-[#4B3832] dark:text-[#F5DEB3] uppercase tracking-tight leading-tight">
                        {isLoginBlocked ? (
                            <>Portal Access <span className="text-[#D4Af37]">Restricted</span></>
                        ) : (
                            <>Curriculum <span className="text-[#D4Af37]">Offline</span></>
                        )}
                    </h1>
                </div>

                <div className="h-px w-24 bg-[#D4Af37]/30 mx-auto"></div>

                <p className="text-[#4B3832]/80 dark:text-[#F5DEB3]/80 text-sm md:text-base font-medium leading-relaxed max-w-md mx-auto">
                    {isLoginBlocked ? (
                        "Student portal access has been temporarily suspended by the Executive Board. Please check back later or contact your instructor for details."
                    ) : (
                        "Access to the training courses and eLearning curricula is temporarily offline by the Administrator. Active course sessions are currently locked."
                    )}
                </p>

                <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center px-6 py-3.5 bg-[#4B3832] hover:bg-[#3d2e29] dark:bg-[#D4Af37] dark:hover:bg-[#b08d26] text-white dark:text-[#1c1916] font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 duration-200"
                    >
                        Go Back Home
                    </Link>
                    <a
                        href="mailto:support@usafi.edu"
                        className="inline-flex items-center justify-center px-6 py-3.5 bg-transparent border border-[#4B3832]/20 dark:border-[#D4Af37]/30 hover:bg-[#4B3832]/5 dark:hover:bg-white/5 text-[#4B3832] dark:text-[#F5DEB3] font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 duration-200"
                    >
                        Contact support
                    </a>
                </div>

                <div className="pt-8 opacity-45 dark:opacity-30">
                    <img src="/logo.jpg" alt="Usafi Logo" className="h-9 mx-auto rounded-full" />
                </div>
            </div>
        </div>
    );
}
