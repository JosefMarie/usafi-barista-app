import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export function SeekerDashboard() {
    const { t } = useTranslation();
    const { user, logout, loading: authLoading } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'opportunities'),
            where('status', '==', 'approved'),
            where('targetAudience', 'array-contains', 'public'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedJobs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setJobs(fetchedJobs);
            setDataLoading(false);
        }, (error) => {
            console.error("Error fetching opportunities:", error);
            setDataLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        window.location.href = '/seeker/login';
    };

    if (authLoading) return (
        <div className="min-h-screen bg-[#F5DEB3] dark:bg-[#1c1916] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-full border-4 border-espresso border-t-transparent animate-spin"></div>
                <p className="text-espresso/60 font-serif tracking-widest uppercase text-xs">Authenticating...</p>
            </div>
        </div>
    );

    if (!user) return <Navigate to="/seeker/login" replace />;

    if (user.role !== 'job_seeker' && user.role !== 'admin') {
        return <Navigate to="/student/dashboard" replace />;
    }
    if (user.role === 'job_seeker' && user.paymentStatus !== 'paid') {
        return <Navigate to="/seeker/payment-pending" replace />;
    }

    /* Premium Header for Seeker */
    const SeekerHeader = () => (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5DEB3]/90 dark:bg-[#1c1916]/90 backdrop-blur-md border-b border-espresso/10 px-6 py-4 shadow-sm transition-all">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3 group">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
                        <img src="/logo.jpg" alt="Usafi Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-serif text-xl font-bold text-espresso dark:text-white tracking-tight group-hover:text-espresso/80 transition-colors">
                        {t('seeker.usafi_opportunities')}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-espresso/60 dark:text-white/60 hidden md:block px-4 py-2 rounded-xl border border-espresso/5">
                        {t('seeker.hello_user', { name: user.name })}
                    </span>
                    <Link
                        to="/seeker/profile"
                        className="h-10 px-6 bg-espresso text-white rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-espresso/90 hover:-translate-y-0.5 transition-all shadow-lg shadow-espresso/20"
                    >
                        <span className="material-symbols-outlined text-[16px]">person</span>
                        <span className="hidden sm:inline">{t('seeker.profile')}</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-espresso hover:text-red-600 transition-colors"
                        title={t('seeker.sign_out')}
                    >
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                </div>
            </div>
        </header>
    );

    if (dataLoading) return (
        <div className="min-h-screen bg-[#F5DEB3] dark:bg-[#1c1916]">
            <SeekerHeader />
            <div className="flex items-center justify-center h-screen pt-20">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-espresso border-t-transparent animate-spin"></div>
                    <p className="text-espresso/60 font-serif tracking-widest uppercase text-xs">{t('seeker.loading_opportunities')}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F5DEB3] dark:bg-[#1c1916] font-display selection:bg-espresso/20">
            <SeekerHeader />

            <div className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-6 rounded-full hidden md:block"></div>
                        <h1 className="text-4xl md:text-5xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">
                            {t('seeker.available_opportunities')}
                        </h1>
                        <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-3">
                            {t('seeker.exclusive_listings')}
                        </p>
                    </div>

                    <div className="grid gap-8">
                        {jobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white/20 rounded-[3rem] border-2 border-dashed border-espresso/10 opacity-60">
                                <span className="material-symbols-outlined text-8xl text-espresso/20">work_off</span>
                                <div className="text-center">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-espresso">{t('seeker.no_opportunities_found')}</h3>
                                    <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-2 text-espresso/50">{t('seeker.check_back_later')}</p>
                                </div>
                            </div>
                        ) : (
                            jobs.map(job => (
                                <div key={job.id} className="group relative bg-white/40 dark:bg-black/20 rounded-[3rem] p-8 md:p-10 border border-espresso/10 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-espresso/10 overflow-hidden flex flex-col md:flex-row gap-8">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/5 group-hover:bg-espresso transition-colors"></div>

                                    {/* Main Content */}
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] shadow-sm border border-white/20",
                                                job.type === 'Barista' ? 'bg-amber-600 text-white' :
                                                    job.type === 'Bartender' ? 'bg-purple-600 text-white' :
                                                        'bg-blue-600 text-white'
                                            )}>
                                                {job.type} ROLE
                                            </span>
                                            <span className="text-[9px] font-black text-espresso/30 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                                {job.jobType}
                                            </span>
                                            <span className="text-[9px] font-black text-espresso/30 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                                POSTED: {job.createdAt?.toDate ? job.createdAt.toDate().toLocaleDateString().toUpperCase() : 'RECENTLY'}
                                            </span>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-3xl md:text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none group-hover:text-espresso/80 transition-colors">
                                                    {job.orgName}
                                                </h3>
                                                <p className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                                    {job.location}
                                                </p>
                                            </div>

                                            <div className="bg-white/60 dark:bg-black/40 p-6 rounded-[2rem] border border-espresso/5 shadow-inner relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                                    <span className="material-symbols-outlined text-6xl text-espresso">format_quote</span>
                                                </div>
                                                <div className="relative z-10">
                                                    <p className="text-[8px] font-black text-espresso/30 uppercase tracking-[0.4em] mb-3">{t('seeker.requirements_details')}</p>
                                                    <p className="text-espresso/80 dark:text-white/80 text-sm font-medium leading-relaxed italic whitespace-pre-line">
                                                        "{job.experience}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Side */}
                                    <div className="md:w-[280px] shrink-0 flex flex-col justify-between space-y-6 md:pt-2 md:pl-8 md:border-l border-espresso/10">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/30 dark:bg-white/5 border border-espresso/5">
                                                <div className="h-8 w-8 rounded-lg bg-espresso/10 flex items-center justify-center text-espresso dark:text-white">
                                                    <span className="material-symbols-outlined text-lg">payments</span>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-espresso/40 uppercase tracking-widest">Compensation</p>
                                                    <p className="text-sm font-bold text-espresso dark:text-white">{job.salaryRange || t('seeker.salary_competitive')}</p>
                                                </div>
                                            </div>

                                            {(job.contactPhone || job.contactEmail) && !job.applicationLink && (
                                                <div className="p-4 rounded-3xl bg-espresso/5 border border-espresso/5 space-y-3">
                                                    <p className="text-[8px] font-black text-espresso/40 uppercase tracking-widest text-center">{t('seeker.contact_to_apply')}</p>
                                                    <div className="flex flex-col gap-2">
                                                        {job.contactPhone && (
                                                            <a href={`tel:${job.contactPhone}`} className="flex items-center gap-3 hover:bg-white/50 p-2 rounded-xl transition-colors">
                                                                <span className="material-symbols-outlined text-espresso text-sm">call</span>
                                                                <span className="text-xs font-bold text-espresso">{job.contactPhone}</span>
                                                            </a>
                                                        )}
                                                        {job.contactEmail && (
                                                            <a href={`mailto:${job.contactEmail}`} className="flex items-center gap-3 hover:bg-white/50 p-2 rounded-xl transition-colors">
                                                                <span className="material-symbols-outlined text-espresso text-sm">mail</span>
                                                                <span className="text-xs font-bold text-espresso truncate">{job.contactEmail}</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {job.applicationLink ? (
                                            <a
                                                href={job.applicationLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full group/btn relative flex items-center justify-center gap-3 bg-espresso text-white py-4 rounded-2xl shadow-xl hover:shadow-espresso/30 hover:-translate-y-1 transition-all overflow-hidden"
                                            >
                                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></span>
                                                <span className="font-serif font-black text-lg tracking-wide uppercase z-10">{t('seeker.apply_now')}</span>
                                                <span className="material-symbols-outlined z-10 group-hover/btn:translate-x-1 transition-transform">open_in_new</span>
                                            </a>
                                        ) : (
                                            <div className="text-center p-3">
                                                <span className="text-[10px] font-black text-espresso/40 uppercase tracking-widest">Use details above to apply</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

