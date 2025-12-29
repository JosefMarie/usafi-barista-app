import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { GradientButton } from '../../components/ui/GradientButton';

export function AdminOpportunities() {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // 'pending', 'approved', 'rejected'

    useEffect(() => {
        const q = query(collection(db, 'opportunities'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const jobs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setOpportunities(jobs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (job, newStatus) => {
        try {
            const jobRef = doc(db, 'opportunities', job.id);
            const updates = { status: newStatus };

            // If approving and no audience set, default to public
            if (newStatus === 'approved' && (!job.targetAudience || job.targetAudience.length === 0)) {
                updates.targetAudience = ['public'];
            }

            await updateDoc(jobRef, updates);
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const handleShare = async (id, audience) => {
        try {
            const jobRef = doc(db, 'opportunities', id);
            // This is a simplified "Share". In a real app, this might trigger notifications.
            // Here we just update the targetAudience field.
            await updateDoc(jobRef, {
                targetAudience: audience === 'all'
                    ? ['public', 'students', 'graduates']
                    : [audience]
            });
            alert(`Shared with ${audience}`);
        } catch (error) {
            console.error("Error sharing:", error);
            alert("Failed to share");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this opportunity?")) return;
        try {
            await deleteDoc(doc(db, 'opportunities', id));
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Failed to delete");
        }
    };

    const filteredJobs = opportunities.filter(job => job.status === filter);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="container mx-auto max-w-6xl">
            <h1 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-8">Manage Opportunities</h1>

            {/* Filter Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-white/10 pb-4">
                {['pending', 'approved', 'rejected'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`text-sm font-bold uppercase tracking-wide px-4 py-2 rounded-lg transition-all ${filter === status
                            ? 'bg-primary text-white'
                            : 'text-espresso/60 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/5'
                            }`}
                    >
                        {status} ({opportunities.filter(j => j.status === status).length})
                    </button>
                ))}
            </div>

            {/* Job List */}
            <div className="grid gap-6">
                {filteredJobs.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-white/5 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-espresso/50 dark:text-white/50">No {filter} opportunities found.</p>
                    </div>
                ) : (
                    filteredJobs.map(job => (
                        <div key={job.id} className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex flex-col md:flex-row gap-6">

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${job.type === 'Barista' ? 'bg-orange-100 text-orange-700' :
                                        job.type === 'Bartender' ? 'bg-purple-100 text-purple-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {job.type}
                                    </span>
                                    <span className="text-sm text-espresso/50 dark:text-white/50">
                                        Posted: {job.createdAt?.toDate().toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-serif text-xl font-bold text-espresso dark:text-white mb-1">
                                    {job.orgName}
                                </h3>
                                <div className="text-sm text-espresso/70 dark:text-white/70 mb-4 flex items-center gap-4">
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">location_on</span> {job.location}</span>
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">payments</span> {job.salaryRange || 'Not specified'}</span>
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">work</span> {job.jobType}</span>
                                </div>

                                <div className="text-sm bg-gray-50 dark:bg-black/20 p-4 rounded-xl mb-4">
                                    <p><strong>Contact:</strong> {job.contactPhone} / {job.contactEmail}</p>
                                    {job.applicationLink && <p className="mt-1"><strong>Link:</strong> <a href={job.applicationLink} target="_blank" rel="noreferrer" className="text-primary hover:underline">{job.applicationLink}</a></p>}
                                    <p className="mt-2 text-espresso/80 dark:text-white/80">{job.experience}</p>
                                </div>

                                {filter === 'approved' && (
                                    <div className="flex items-center gap-2 mt-4 text-xs text-espresso/50">
                                        <strong>Shared with:</strong> {job.targetAudience?.join(', ') || 'None'}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3 min-w-[200px] border-l border-gray-100 dark:border-white/5 pl-0 md:pl-6">
                                {filter === 'pending' && (
                                    <>
                                        <GradientButton onClick={() => handleStatusChange(job, 'approved')} className="h-10 text-sm">
                                            Approve
                                        </GradientButton>
                                        <button
                                            onClick={() => handleStatusChange(job, 'rejected')}
                                            className="h-10 px-4 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors text-sm"
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}

                                {filter === 'approved' && (
                                    <>
                                        <p className="text-xs font-bold text-espresso/50 uppercase mb-1">Share To:</p>
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => handleShare(job.id, 'public')} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20">Seekers (Public)</button>
                                            <button onClick={() => handleShare(job.id, 'students')} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20">Students</button>
                                            <button onClick={() => handleShare(job.id, 'graduates')} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20">Graduates</button>
                                            <button onClick={() => handleShare(job.id, 'all')} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20">All Groups</button>
                                        </div>
                                        <button
                                            onClick={() => handleStatusChange(job, 'pending')}
                                            className="mt-auto h-8 text-xs text-orange-600 hover:underline"
                                        >
                                            Move back to Pending
                                        </button>
                                    </>
                                )}

                                <button onClick={() => handleDelete(job.id)} className="mt-2 text-red-400 text-xs hover:text-red-600 flex items-center gap-1 justify-end">
                                    <span className="material-symbols-outlined text-sm">delete</span> Delete
                                </button>
                            </div>

                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
