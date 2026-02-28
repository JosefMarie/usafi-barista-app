import React from 'react';
import { useTranslation } from 'react-i18next';

export function MaintenanceMode() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-[#4B3832] flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-1 bg-[#D4Af37]"></div>
            <div className="absolute -right-24 -top-24 size-96 rounded-full bg-[#D4Af37]/5 blur-3xl"></div>
            <div className="absolute -left-24 -bottom-24 size-96 rounded-full bg-[#D4Af37]/5 blur-3xl"></div>

            <div className="relative z-10 space-y-8 max-w-2xl">
                <div className="size-24 bg-[#D4Af37] rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-[#D4Af37]/20 border-4 border-[#F5DEB3]/20 animate-pulse">
                    <span className="material-symbols-outlined text-5xl text-[#4B3832]">construction</span>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-serif font-black text-[#F5DEB3] uppercase tracking-tighter leading-none">
                        System <span className="text-[#D4Af37]">Offline</span>
                    </h1>
                    <p className="text-[#F5DEB3]/60 font-black text-[10px] md:text-xs uppercase tracking-[0.4em]">Executive Maintenance Protocol Active</p>
                </div>

                <div className="h-px w-24 bg-[#D4Af37]/30 mx-auto"></div>

                <p className="text-[#F5DEB3]/80 text-lg md:text-xl font-light leading-relaxed">
                    The Usafi platform is currently undergoing scheduled premium updates to enhance your experience.
                    We'll be back online shortly. Thank you for your patience.
                </p>

                <div className="pt-8">
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-[#D4Af37] text-sm font-bold">
                        <span className="size-2 rounded-full bg-[#D4Af37] animate-ping"></span>
                        Expected back within 2 hours
                    </div>
                </div>

                <div className="pt-20 opacity-30">
                    <img src="/logo.jpg" alt="Usafi Logo" className="h-12 mx-auto grayscale invert" />
                </div>
            </div>
        </div>
    );
}
