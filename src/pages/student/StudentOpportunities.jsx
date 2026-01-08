import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export function StudentOpportunities() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'opportunities'),
            where('status', '==', 'approved'),
            where('targetAudience', 'array-contains-any', ['students', 'public', 'all']),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedJobs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setJobs(fetchedJobs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching student opportunities:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-full border-4 border-espresso border-t-transparent animate-spin"></div>
                <p className="text-espresso/60 font-serif tracking-widest uppercase text-xs">Loading Opportunities...</p>
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto w-full px-4 sm:px-0">
            <div className="w-full space-y-8 md:space-y-10">
                {/* Header Section */}
                <div className="flex items-center justify-between relative mb-8 md:mb-12">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-espresso/20 -ml-2 rounded-full"></div>
                    <div>
                        <h1 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">
                            Career Opportunities
                        </h1>
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-2">
                            Curated Roles from our Industry Partners
                        </p>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid gap-6 md:gap-8 pb-20">
                    {jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 md:py-32 gap-6 bg-white/20 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-espresso/10 opacity-60">
                            <span className="material-symbols-outlined text-6xl md:text-8xl text-espresso/20">work_off</span>
                            <div className="text-center">
                                <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-espresso">No Openings Available</h3>
                                <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.3em] mt-2 text-espresso/50">Check back later for new opportunities</p>
                            </div>
                        </div>
                    ) : (
                        jobs.map(job => (
                            <div key={job.id} className="group relative bg-white/40 dark:bg-black/20 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-espresso/10 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-espresso/10 overflow-hidden flex flex-col md:flex-row gap-6 md:gap-8">
                                <div className="absolute left-0 top-0 bottom-0 w-1 md:w-1.5 bg-espresso/5 group-hover:bg-espresso transition-colors"></div>

                                {/* Main Content */}
                                <div className="flex-1 space-y-5 md:space-y-6">
                                    <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                                        <span className={cn(
                                            "px-3 md:px-4 py-1.5 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] shadow-sm border border-white/20",
                                            job.type === 'Barista' ? 'bg-amber-600 text-white' :
                                                job.type === 'Bartender' ? 'bg-purple-600 text-white' :
                                                    'bg-blue-600 text-white'
                                        )}>
                                            {job.type} ROLE
                                        </span>
                                        <span className="text-[8px] md:text-[9px] font-black text-espresso/30 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[14px] md:text-[16px]">calendar_today</span>
                                            POSTED: {job.createdAt?.toDate ? job.createdAt.toDate().toLocaleDateString().toUpperCase() : 'RECENTLY'}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none group-hover:text-espresso/80 transition-colors">
                                                {job.orgName}
                                            </h3>
                                            <p className="text-[9px] md:text-[10px] font-black text-espresso/40 uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1">
                                                {job.jobType} • {job.location}
                                            </p>
                                        </div>

                                        <div className="bg-white/60 dark:bg-black/40 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-espresso/5 shadow-inner relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-3 md:p-4 opacity-5">
                                                <span className="material-symbols-outlined text-4xl md:text-6xl text-espresso">format_quote</span>
                                            </div>
                                            <div className="relative z-10">
                                                <p className="text-[7px] md:text-[8px] font-black text-espresso/30 uppercase tracking-[0.4em] mb-2 md:mb-3">Job Description & Requirements</p>
                                                <p className="text-espresso/80 dark:text-white/80 text-xs md:text-sm font-medium leading-relaxed italic whitespace-pre-line">
                                                    "{job.experience}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Side */}
                                <div className="md:w-[280px] shrink-0 flex flex-col justify-between space-y-6 pt-5 md:pt-2 border-t md:border-t-0 md:pl-8 md:border-l border-espresso/10">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/30 dark:bg-white/5 border border-espresso/5">
                                            <div className="size-8 rounded-lg bg-espresso/10 flex items-center justify-center text-espresso dark:text-white shrink-0">
                                                <span className="material-symbols-outlined text-lg">payments</span>
                                            </div>
                                            <div>
                                                <p className="text-[7px] md:text-[8px] font-black text-espresso/40 uppercase tracking-widest">Compensation</p>
                                                <p className="text-xs md:text-sm font-bold text-espresso dark:text-white">{job.salaryRange || 'Not Disclosed'}</p>
                                            </div>
                                        </div>

                                        {(job.contactPhone || job.contactEmail) && !job.applicationLink && (
                                            <div className="p-4 rounded-[1.5rem] bg-espresso/5 border border-espresso/5 space-y-3">
                                                <p className="text-[7px] md:text-[8px] font-black text-espresso/40 uppercase tracking-widest text-center">Contact Directly</p>
                                                <div className="flex flex-col gap-2">
                                                    {job.contactPhone && (
                                                        <a href={`tel:${job.contactPhone}`} className="flex items-center gap-3 hover:bg-white/50 p-2 rounded-xl transition-colors">
                                                            <span className="material-symbols-outlined text-espresso text-sm shrink-0">call</span>
                                                            <span className="text-[11px] md:text-xs font-bold text-espresso">{job.contactPhone}</span>
                                                        </a>
                                                    )}
                                                    {job.contactEmail && (
                                                        <a href={`mailto:${job.contactEmail}`} className="flex items-center gap-3 hover:bg-white/50 p-2 rounded-xl transition-colors">
                                                            <span className="material-symbols-outlined text-espresso text-sm shrink-0">mail</span>
                                                            <span className="text-[11px] md:text-xs font-bold text-espresso truncate">{job.contactEmail}</span>
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
                                            className="w-full group/btn relative flex items-center justify-center gap-3 bg-espresso text-white py-3.5 md:py-4 rounded-xl md:rounded-2xl shadow-xl hover:shadow-espresso/30 transition-all overflow-hidden"
                                        >
                                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></span>
                                            <span className="font-serif font-black text-base md:text-lg tracking-wide uppercase z-10">Apply Now</span>
                                            <span className="material-symbols-outlined z-10 group-hover/btn:translate-x-1 transition-transform text-xl">arrow_forward</span>
                                        </a>
                                    ) : (
                                        <div className="text-center p-3">
                                            <span className="text-[9px] md:text-[10px] font-black text-espresso/40 uppercase tracking-widest">Use details above to apply</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
