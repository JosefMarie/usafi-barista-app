import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export function StudentOpportunities() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Query jobs shared with 'students' OR 'public' (Seekers)
        // Firestore `array-contains-any` allows checking if the array field matches ANY of the provided values.
        const q = query(
            collection(db, 'opportunities'),
            where('status', '==', 'approved'),
            where('targetAudience', 'array-contains-any', ['students', 'public', 'all']), // Include 'all' just in case legacy data uses it as a string
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

    if (loading) return <div className="p-8 text-center text-espresso/60">Loading opportunities...</div>;

    return (
        <div className="space-y-6 w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-espresso dark:text-white">Career Opportunities</h1>
                    <p className="text-sm text-espresso/60 dark:text-white/60">Job listings curated for Usafi students.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {jobs.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-white/5 rounded-2xl border border-dashed border-gray-300">
                        <span className="material-symbols-outlined text-4xl text-espresso/30 mb-2">work_off</span>
                        <p className="text-espresso/50 dark:text-white/50">No opportunities available for students right now.</p>
                    </div>
                ) : (
                    jobs.map(job => (
                        <div key={job.id} className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${job.type === 'Barista' ? 'bg-orange-100 text-orange-700' :
                                            job.type === 'Bartender' ? 'bg-purple-100 text-purple-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {job.type}
                                        </span>
                                        <span className="text-xs text-espresso/40">
                                            {job.jobType} • {job.location}
                                        </span>
                                    </div>

                                    <h3 className="font-serif text-xl font-bold text-espresso dark:text-white mb-2">
                                        {job.type} @ {job.orgName}
                                    </h3>

                                    <p className="text-sm text-espresso/70 dark:text-white/70 mb-4 whitespace-pre-line line-clamp-3">
                                        {job.experience}
                                    </p>

                                    <div className="flex flex-wrap gap-3">
                                        {job.applicationLink ? (
                                            <a
                                                href={job.applicationLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                Apply Now <span className="material-symbols-outlined text-sm">open_in_new</span>
                                            </a>
                                        ) : (
                                            <div className="flex gap-3">
                                                {job.contactPhone && (
                                                    <a href={`tel:${job.contactPhone}`} className="px-3 py-2 bg-gray-100 dark:bg-white/10 text-espresso dark:text-white text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">call</span> {job.contactPhone}
                                                    </a>
                                                )}
                                                {job.contactEmail && (
                                                    <a href={`mailto:${job.contactEmail}`} className="px-3 py-2 bg-gray-100 dark:bg-white/10 text-espresso dark:text-white text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">mail</span> Email
                                                    </a>
                                                )}
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
    );
}
