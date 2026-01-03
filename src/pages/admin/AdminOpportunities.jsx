import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { GradientButton } from '../../components/ui/GradientButton';
import { cn } from '../../lib/utils';


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
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-32">
            <div className=" w-full px-2 py-10 space-y-10">
                {/* Header Section */}
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-10"></div>
                    <div>
                        <h1 className="text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Professional Opportunities</h1>
                        <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-2">Career Support & Institutional Placement Oversight</p>
                    </div>
                </div>

                {/* Filter Matrix */}
                <div className="flex gap-4 p-1.5 bg-white/40 dark:bg-black/20 rounded-[1.5rem] border border-espresso/10 backdrop-blur-md w-fit shadow-sm">
                    {['pending', 'approved', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={cn(
                                "h-11 px-8 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3",
                                filter === status
                                    ? "bg-espresso text-white shadow-lg"
                                    : "text-espresso/40 hover:text-espresso"
                            )}
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {status === 'pending' ? 'hourglass_top' : status === 'approved' ? 'verified' : 'cancel'}
                            </span>
                            {status}
                            <span className={cn(
                                "ml-1 px-2 py-0.5 rounded-lg text-[9px] border",
                                filter === status ? "bg-white/20 border-white/20" : "bg-espresso/5 border-espresso/10"
                            )}>
                                {opportunities.filter(j => j.status === status).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content Matrix */}
                <div className="grid gap-8">
                    {filteredJobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white/20 rounded-[3rem] border-2 border-dashed border-espresso/10 opacity-30">
                            <span className="material-symbols-outlined text-8xl">work_off</span>
                            <div className="text-center">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.5em]">Zero Vectors Detected</h3>
                                <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-2">No {filter} opportunities currently active in stream</p>
                            </div>
                        </div>
                    ) : (
                        filteredJobs.map(job => (
                            <div key={job.id} className="group relative bg-white/40 dark:bg-black/20 rounded-[3rem] p-10 border border-espresso/10 shadow-2xl transition-all hover:-translate-y-1 hover:shadow-espresso/10 overflow-hidden flex flex-col lg:flex-row gap-10">
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover:bg-espresso transition-colors"></div>

                                <div className="flex-1 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <span className={cn(
                                            "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] shadow-sm border border-white/20",
                                            job.type === 'Barista' ? 'bg-amber-600 text-white' :
                                                job.type === 'Bartender' ? 'bg-purple-600 text-white' :
                                                    'bg-blue-600 text-white'
                                        )}>
                                            {job.type} NODE
                                        </span>
                                        <span className="text-[9px] font-black text-espresso/30 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                            POSTED: {job.createdAt?.toDate().toLocaleDateString().toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none group-hover:text-espresso/70 transition-colors">
                                            {job.orgName}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-y-3 gap-x-8">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-espresso/60 uppercase tracking-widest bg-espresso/5 px-3 py-1.5 rounded-xl border border-espresso/5 shadow-inner">
                                                <span className="material-symbols-outlined text-[18px]">location_on</span>
                                                {job.location}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-espresso/60 uppercase tracking-widest bg-espresso/5 px-3 py-1.5 rounded-xl border border-espresso/5 shadow-inner">
                                                <span className="material-symbols-outlined text-[18px]">payments</span>
                                                {job.salaryRange || 'PROBATIONARY'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-espresso/60 uppercase tracking-widest bg-espresso/5 px-3 py-1.5 rounded-xl border border-espresso/5 shadow-inner">
                                                <span className="material-symbols-outlined text-[18px]">work</span>
                                                {job.jobType}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/60 dark:bg-black/40 p-8 rounded-[2rem] border border-espresso/5 shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <span className="material-symbols-outlined text-6xl">format_quote</span>
                                        </div>
                                        <div className="space-y-4 relative z-10">
                                            <div className="grid grid-cols-2 gap-8 border-b border-espresso/5 pb-6">
                                                <div>
                                                    <p className="text-[8px] font-black text-espresso/30 uppercase tracking-[0.4em] mb-2">Primary Liaison</p>
                                                    <p className="text-sm font-black text-espresso dark:text-white uppercase tracking-tight">{job.contactPhone}</p>
                                                    <p className="text-sm font-black text-espresso dark:text-white uppercase tracking-tight truncate">{job.contactEmail}</p>
                                                </div>
                                                {job.applicationLink && (
                                                    <div>
                                                        <p className="text-[8px] font-black text-espresso/30 uppercase tracking-[0.4em] mb-2">Portal Access</p>
                                                        <a href={job.applicationLink} target="_blank" rel="noreferrer" className="text-sm font-black text-espresso/60 hover:text-espresso transition-all underline decoration-espresso/20 underline-offset-4 truncate block">
                                                            {job.applicationLink.replace('https://', '').replace('www.', '')}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-espresso/30 uppercase tracking-[0.4em] mb-3">Institutional Requirements</p>
                                                <p className="text-espresso/70 dark:text-white/70 text-sm font-medium leading-relaxed italic line-clamp-3 group-hover:line-clamp-none transition-all">
                                                    "{job.experience}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {filter === 'approved' && (
                                        <div className="flex items-center gap-3 px-5 py-2.5 bg-espresso text-white rounded-2xl w-fit shadow-lg shadow-espresso/20 group-hover:scale-105 transition-transform">
                                            <span className="material-symbols-outlined text-[18px]">hub</span>
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Visible to:</span>
                                            <div className="flex gap-2">
                                                {job.targetAudience?.map(aud => (
                                                    <span key={aud} className="bg-white/20 px-3 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10">
                                                        {aud}
                                                    </span>
                                                )) || <span className="bg-white/20 px-3 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10 italic">NO AUDIENCE</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Control Array */}
                                <div className="lg:w-[320px] shrink-0 space-y-8 flex flex-col justify-between pt-10 lg:pt-0 lg:pl-10 lg:border-l border-espresso/10">
                                    <div className="space-y-4">
                                        {filter === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusChange(job, 'approved')}
                                                    className="w-full h-16 flex items-center justify-center gap-4 bg-espresso text-white rounded-2xl font-serif font-black text-xl tracking-tight shadow-xl hover:shadow-espresso/40 hover:-translate-y-1 transition-all group/btn"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 group-hover/btn:rotate-12 transition-transform">
                                                        <span className="material-symbols-outlined text-[24px]">verified</span>
                                                    </div>
                                                    AUTHORIZE
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(job, 'rejected')}
                                                    className="w-full h-16 flex items-center justify-center gap-4 bg-white/40 text-red-600 border border-red-100 rounded-2xl font-serif font-black text-xl tracking-tight shadow-sm hover:bg-red-50 hover:border-red-200 transition-all"
                                                >
                                                    <span className="material-symbols-outlined">block</span>
                                                    DISMISS
                                                </button>
                                            </>
                                        )}

                                        {filter === 'approved' && (
                                            <>
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em] ml-2">Propagation Vector</p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {[
                                                            { id: 'public', label: 'GLOBAL' },
                                                            { id: 'students', label: 'NODES' },
                                                            { id: 'graduates', label: 'ALUMNI' },
                                                            { id: 'all', label: 'UNIVERSAL', primary: true }
                                                        ].map(v => (
                                                            <button
                                                                key={v.id}
                                                                onClick={() => handleShare(job.id, v.id)}
                                                                className={cn(
                                                                    "h-12 border rounded-xl text-[9px] font-black tracking-widest transition-all shadow-sm flex items-center justify-center gap-2",
                                                                    v.primary
                                                                        ? "bg-espresso text-white border-espresso hover:bg-espresso/80"
                                                                        : "bg-white/60 text-espresso border-espresso/10 hover:bg-espresso hover:text-white"
                                                                )}
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">
                                                                    {v.id === 'all' ? 'language' : v.id === 'public' ? 'public' : 'hub'}
                                                                </span>
                                                                {v.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleStatusChange(job, 'pending')}
                                                    className="w-full flex items-center justify-center gap-2 py-4 text-[9px] font-black text-orange-700 uppercase tracking-[0.4em] hover:bg-orange-50 rounded-2xl transition-all border border-transparent hover:border-orange-100"
                                                >
                                                    <span className="material-symbols-outlined text-[16px] animate-spin-slow">history</span>
                                                    Rollback to Pending
                                                </button>
                                            </>
                                        )}

                                        {filter === 'rejected' && (
                                            <button
                                                onClick={() => handleStatusChange(job, 'pending')}
                                                className="w-full h-16 flex items-center justify-center gap-4 bg-white/40 text-espresso border border-espresso/10 rounded-2xl font-serif font-black text-xl tracking-tight shadow-sm hover:bg-espresso hover:text-white transition-all"
                                            >
                                                <span className="material-symbols-outlined">undo</span>
                                                RESTORE VECTOR
                                            </button>
                                        )}
                                    </div>

                                    <div className="pt-8 border-t border-espresso/5">
                                        <button
                                            onClick={() => handleDelete(job.id)}
                                            className="w-full h-14 flex items-center justify-center gap-3 text-red-500 hover:text-white hover:bg-red-600 rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.4em] border border-red-100 hover:border-red-600 shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                                            Purge Ledger
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}



