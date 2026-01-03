import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { GradientButton } from '../../components/ui/GradientButton';

export function SeekerDashboard() {
    const { user, logout, loading: authLoading } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Query approved opportunities visible to 'public'
        // NOTE: We also include jobs with NO targetAudience defined, assuming they are public by default once approved.
        // But Firestore queries are restrictive. We'll rely on the Admin ensuring 'public' tag is present.
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
        // Force redirect to seeker login or public opportunities
        window.location.href = '/seeker/login';
    };

    if (authLoading) return <div className="p-8 text-center">Loading authentication...</div>;

    if (!user) return <Navigate to="/seeker/login" replace />;

    if (user.role !== 'job_seeker' && user.role !== 'admin') {
        // If a student tries to access this, redirect to their dashboard
        return <Navigate to="/student/dashboard" replace />;
    }
    if (user.role === 'job_seeker' && user.paymentStatus !== 'paid') {
        return <Navigate to="/seeker/payment-pending" replace />;
    }

    /* Simple Header for Seeker */
    const SeekerHeader = () => (
        <header className="bg-[#F5DEB3] dark:bg-[#1c1916] border-b border-espresso/10 sticky top-0 z-20 px-6 py-4 shadow-sm">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-espresso flex items-center justify-center text-white shadow-lg shadow-espresso/20">
                        <span className="material-symbols-outlined text-xl">coffee</span>
                    </div>
                    <span className="font-serif text-xl font-bold text-espresso dark:text-white tracking-tight">
                        Usafi Opportunities
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-espresso dark:text-white hidden md:block bg-white/40 dark:bg-white/5 px-4 py-2 rounded-xl border border-white/20">
                        Hello, {user.name}
                    </span>
                    <Link
                        to="/seeker/profile"
                        className="text-sm font-black text-white bg-espresso hover:bg-espresso/90 px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 uppercase tracking-wide"
                    >
                        <span className="material-symbols-outlined text-lg">person</span>
                        <span className="hidden sm:inline">Profile</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="text-sm font-bold text-espresso hover:bg-white/40 px-4 py-2 rounded-xl transition-colors flex items-center gap-1"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </header>
    );

    if (dataLoading) return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            <SeekerHeader />
            <div className="container mx-auto px-6 py-12 text-center">
                Loading opportunities...
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
            <SeekerHeader />

            <div className="container mx-auto px-6 py-12">
                <div className="max-w-4xl mx-auto">
                    <h1 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-2">Available Opportunities</h1>
                    <p className="text-espresso/70 dark:text-white/70 mb-8">
                        Exclusive job listings matches for you.
                    </p>

                    <div className="grid gap-6">
                        {jobs.length === 0 ? (
                            <div className="text-center py-16 bg-white dark:bg-white/5 rounded-3xl border border-dashed border-espresso/10">
                                <span className="material-symbols-outlined text-4xl text-espresso/30 mb-4">work_off</span>
                                <h3 className="text-lg font-bold text-espresso/70 dark:text-white/70">No opportunities found</h3>
                                <p className="text-espresso/50 dark:text-white/50">Check back later for new updates.</p>
                            </div>
                        ) : (
                            jobs.map(job => (
                                <div key={job.id} className="bg-[#F5DEB3] dark:bg-[#1c1916] p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-espresso/10 hover:border-espresso/20 hover:shadow-2xl transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-espresso/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${job.type === 'Barista' ? 'bg-orange-100 text-orange-700' :
                                                    job.type === 'Bartender' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {job.type}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs font-bold text-espresso/60 uppercase tracking-wide">
                                                    <span className="material-symbols-outlined text-sm">schedule</span> {job.jobType}
                                                </span>
                                                <span className="text-xs text-espresso/40">
                                                    Posted {job.createdAt?.toDate().toLocaleDateString()}
                                                </span>
                                            </div>

                                            <h3 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-3 group-hover:text-primary transition-colors leading-tight">
                                                {job.type} Role at {job.orgName}
                                            </h3>

                                            <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-espresso/70 dark:text-white/70 mb-6">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-lg">location_on</span>
                                                    {job.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-lg">payments</span>
                                                    {job.salaryRange || 'Competitive'}
                                                </span>
                                            </div>

                                            <div className="bg-white/40 dark:bg-white/5 p-6 rounded-2xl mb-8 border border-white/20">
                                                <h4 className="font-bold text-sm text-espresso dark:text-white mb-2">Requirements / Details:</h4>
                                                <p className="text-sm text-espresso/80 dark:text-white/80 leading-relaxed whitespace-pre-line">
                                                    {job.experience}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4">
                                                {job.applicationLink ? (
                                                    <a
                                                        href={job.applicationLink}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                                    >
                                                        Apply Now
                                                        <span className="material-symbols-outlined ml-2 text-lg">open_in_new</span>
                                                    </a>
                                                ) : (
                                                    <div className="flex items-center gap-4 bg-primary/5 px-6 py-3 rounded-xl border border-primary/10">
                                                        <span className="text-sm font-bold text-primary">Contact to Apply:</span>
                                                        <div className="flex flex-col md:flex-row gap-4">
                                                            <a href={`tel:${job.contactPhone}`} className="flex items-center gap-1 text-sm font-bold text-espresso hover:text-primary">
                                                                <span className="material-symbols-outlined">call</span> {job.contactPhone}
                                                            </a>
                                                            <a href={`mailto:${job.contactEmail}`} className="flex items-center gap-1 text-sm font-bold text-espresso hover:text-primary">
                                                                <span className="material-symbols-outlined">mail</span> {job.contactEmail}
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
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
