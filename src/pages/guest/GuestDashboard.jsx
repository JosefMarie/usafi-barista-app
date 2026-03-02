import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

const MODULES = [
    { id: 'm1', icon: 'history_edu', color: 'from-amber-500 to-orange-600' },
    { id: 'm2', icon: 'local_fire_department', color: 'from-orange-500 to-rose-600' },
    { id: 'm3', icon: 'grain', color: 'from-rose-500 to-pink-600' },
    { id: 'm4', icon: 'coffee_maker', color: 'from-pink-500 to-purple-600' },
    { id: 'm5', icon: 'brush', color: 'from-purple-500 to-indigo-600' },
    { id: 'm6', icon: 'local_cafe', color: 'from-indigo-500 to-blue-600' },
    { id: 'm7', icon: 'science', color: 'from-blue-500 to-emerald-600' }
];

export function GuestDashboard() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [progress, setProgress] = useState({});
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        if (!user) return;

        const fetchUserData = async () => {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                setUserData(userDoc.data());
            }
        };
        fetchUserData();

        const q = query(collection(db, 'users', user.uid, 'weekend_progress'));

        // Safety timeout: stop loading after 5s regardless of Firestore response
        const timeout = setTimeout(() => setLoading(false), 5000);

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                clearTimeout(timeout);
                const newProgress = {};
                snapshot.forEach((doc) => {
                    newProgress[doc.id] = doc.data();
                });
                setProgress(newProgress);
                setLoading(false);
            },
            (error) => {
                // Firestore rules may have blocked the read — still show the dashboard
                clearTimeout(timeout);
                console.warn('Could not load progress (rules may need deployment):', error.message);
                setLoading(false);
            }
        );

        return () => {
            clearTimeout(timeout);
            unsubscribe();
        };
    }, [user]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF5E8] dark:bg-[#1c1916]">
                <div className="text-center space-y-4">
                    <p className="text-espresso/60">Please log in to access your journey.</p>
                    <a href="/guest/login" className="text-rose-500 font-bold">Go to Guest Login</a>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF5E8] dark:bg-[#1c1916]">
                <div className="size-16 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF5E8] dark:bg-[#1c1916] font-display flex flex-col">
            <Navbar />

            <main className="flex-grow pt-32 pb-20 px-4 md:px-8">
                <div className="max-w-4xl mx-auto space-y-12">
                    {/* Hero Header */}
                    <div className="relative p-10 rounded-[3rem] bg-espresso text-white overflow-hidden shadow-2xl shadow-espresso/20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="relative z-10 space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
                                <span className="material-symbols-outlined text-rose-500 text-sm animate-pulse">star</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Guest Experience Dashboard</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tight leading-none uppercase">
                                Welcome, <span className="text-rose-500">{userData?.fullName?.split(' ')[0] || 'Coffee Lover'}</span>
                            </h1>
                            <p className="text-white/60 max-w-lg font-medium lg:text-lg">
                                Your journey through the 7-Point Combo Course starts here. Track your progress and discover the secrets of professional coffee.
                            </p>
                        </div>
                    </div>

                    {/* Journey Map */}
                    <div className="relative py-10 px-6 md:px-12 bg-white/40 dark:bg-white/5 rounded-[3rem] border border-espresso/5 backdrop-blur-xl">
                        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-500 via-amber-500 to-emerald-500 opacity-10 -translate-x-1/2 hidden md:block"></div>

                        <div className="space-y-24 relative">
                            {MODULES.map((mod, index) => {
                                const modProgress = progress[mod.id] || { status: 'locked' };
                                const isCompleted = modProgress.status === 'completed';
                                const isCurrent = modProgress.status === 'in-progress' || (!isCompleted && (index === 0 || (progress[MODULES[index - 1]?.id]?.status === 'completed')));
                                const isLocked = !isCompleted && !isCurrent;

                                // If everything is locked and we are at first module, first is current
                                const actuallyCurrent = (index === 0 && isLocked) ? true : isCurrent;
                                const actuallyLocked = (index === 0 && isLocked) ? false : isLocked;

                                return (
                                    <div key={mod.id} className={`flex flex-col md:flex-row items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} relative`}>
                                        {/* Module Indicator */}
                                        <div className="relative z-10">
                                            <div className={`size-20 md:size-28 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 ${actuallyLocked ? 'bg-white/20 text-espresso/20 grayscale' : `bg-gradient-to-br ${mod.color} text-white scale-110 ring-8 ring-white dark:ring-white/5 shadow-rose-500/20`}`}>
                                                <span className="material-symbols-outlined text-3xl md:text-5xl">{mod.icon}</span>
                                            </div>
                                            {isCompleted && (
                                                <div className="absolute -top-2 -right-2 size-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border-4 border-white dark:border-[#1c1916] animate-bounce shadow-lg">
                                                    <span className="material-symbols-outlined text-sm">check</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Module Content */}
                                        <div className={`flex-1 text-center ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'} space-y-2`}>
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${actuallyLocked ? 'text-espresso/20' : 'text-rose-500'}`}>
                                                    Module 0{index + 1}
                                                </span>
                                                <h3 className={`text-2xl md:text-3xl font-serif font-black uppercase tracking-tight ${actuallyLocked ? 'text-espresso/20' : 'text-espresso dark:text-white'}`}>
                                                    {t(`weekendExperience.combo.m${index + 1}.title`)}
                                                </h3>
                                            </div>
                                            <p className={`max-w-md mx-auto ${index % 2 === 0 ? 'md:ml-0' : 'md:mr-0'} font-medium text-sm leading-relaxed ${actuallyLocked ? 'text-espresso/10' : 'text-espresso/60 dark:text-white/60'}`}>
                                                {t(`weekendExperience.combo.m${index + 1}.desc`)}
                                            </p>

                                            {actuallyCurrent && (
                                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest mt-4 animate-in fade-in slide-in-from-bottom-2`}>
                                                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                                    Your Next Step
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <style dangerouslySetInnerHTML={{
                __html: `
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
            ` }} />
        </div>
    );
}
