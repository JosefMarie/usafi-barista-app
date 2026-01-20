import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { GradientButton } from '../../components/ui/GradientButton';
import { cn } from '../../lib/utils';


export function ManagerOpportunities() {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // 'pending', 'approved', 'rejected'
    const [previewImage, setPreviewImage] = useState(null);

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

        // Auto-purge logic: Identify and delete approved opportunities older than 7 days
        const purgeExpired = async () => {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const expiredQuery = query(
                collection(db, 'opportunities'),
                where('status', '==', 'approved'),
                where('approvedAt', '<', oneWeekAgo)
            );

            try {
                const expiredSnap = await getDocs(expiredQuery);
                expiredSnap.forEach(async (docSnap) => {
                    const data = docSnap.data();
                    // Delete image from storage if exists
                    if (data.imageUrl) {
                        try {
                            const imageRef = ref(storage, data.imageUrl);
                            await deleteObject(imageRef);
                        } catch (e) {
                            console.error("Error deleting image from storage during purge:", e);
                        }
                    }
                    await deleteDoc(docSnap.ref);
                    console.log(`Purged expired opportunity: ${docSnap.id}`);
                });
            } catch (error) {
                console.error("Purge Error:", error);
            }
        };

        purgeExpired();

        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (job, newStatus) => {
        try {
            const jobRef = doc(db, 'opportunities', job.id);
            const updates = { status: newStatus };

            if (newStatus === 'approved') {
                updates.approvedAt = serverTimestamp();
                // If approving and no audience set, default to public
                if (!job.targetAudience || job.targetAudience.length === 0) {
                    updates.targetAudience = ['public'];
                }
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

    const handleDelete = async (job) => {
        if (!window.confirm("Are you sure you want to delete this opportunity?")) return;
        try {
            // Delete image from storage if exists
            if (job.imageUrl) {
                try {
                    const imageRef = ref(storage, job.imageUrl);
                    await deleteObject(imageRef);
                } catch (e) {
                    console.error("Error deleting image from storage:", e);
                }
            }
            await deleteDoc(doc(db, 'opportunities', job.id));
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-4 md:-ml-10"></div>
                    <div>
                        <h1 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Professional Opportunities</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-1 md:mt-2">Career Support & Institutional Placement Oversight</p>
                    </div>
                </div>

                {/* Filter Matrix */}
                <div className="flex gap-2 md:gap-4 p-1 md:p-1.5 bg-white/40 dark:bg-black/20 rounded-xl md:rounded-[1.5rem] border border-espresso/10 backdrop-blur-md w-full sm:w-fit shadow-sm overflow-x-auto no-scrollbar">
                    {['pending', 'approved', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={cn(
                                "h-10 md:h-11 px-4 md:px-8 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 md:gap-3 shrink-0 whitespace-nowrap",
                                filter === status
                                    ? "bg-espresso text-white shadow-lg"
                                    : "text-espresso/40 hover:text-espresso"
                            )}
                        >
                            <span className="material-symbols-outlined text-[16px] md:text-[18px]">
                                {status === 'pending' ? 'hourglass_top' : status === 'approved' ? 'verified' : 'cancel'}
                            </span>
                            {status}
                            <span className={cn(
                                "ml-1 px-1.5 md:px-2 py-0.5 rounded-md md:rounded-lg text-[8px] border",
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
                            <div key={job.id} className="group relative bg-white/40 dark:bg-black/20 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-espresso/10 shadow-2xl transition-all hover:-translate-y-1 hover:shadow-espresso/10 overflow-hidden flex flex-col lg:flex-row gap-8 md:gap-10">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-espresso/5 group-hover:bg-espresso transition-colors"></div>

                                <div className="flex-1 space-y-6">
                                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                        <span className={cn(
                                            "px-3 md:px-4 py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] shadow-sm border border-white/20",
                                            job.type === 'Barista' ? 'bg-amber-600 text-white' :
                                                job.type === 'Bartender' ? 'bg-purple-600 text-white' :
                                                    'bg-blue-600 text-white'
                                        )}>
                                            {job.type} NODE
                                        </span>
                                        <span className="text-[8px] md:text-[9px] font-black text-espresso/30 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[14px] md:text-[16px]">calendar_today</span>
                                            POSTED: {job.createdAt?.toDate().toLocaleDateString().toUpperCase()}
                                        </span>
                                        {job.approvedAt && (
                                            <span className="text-[8px] md:text-[9px] font-black text-green-600/60 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[14px] md:text-[16px]">verified</span>
                                                APPROVED: {job.approvedAt?.toDate().toLocaleDateString().toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    {job.imageUrl && (
                                        <div
                                            onClick={() => setPreviewImage(job.imageUrl)}
                                            className="w-full h-48 md:h-64 rounded-2xl overflow-hidden border border-espresso/10 cursor-pointer group/image relative"
                                        >
                                            <img src={job.imageUrl} alt="Opportunity Flier" className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
                                                    <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">View Full Flier</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <h3 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none group-hover:text-espresso/70 transition-colors break-words">
                                            {job.orgName}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-y-3 gap-x-4 md:gap-x-8">
                                            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-espresso/60 uppercase tracking-widest bg-espresso/5 px-2 md:px-3 py-1.5 rounded-lg md:rounded-xl border border-espresso/5 shadow-inner">
                                                <span className="material-symbols-outlined text-[16px] md:text-[18px]">location_on</span>
                                                {job.location}
                                            </div>
                                            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-espresso/60 uppercase tracking-widest bg-espresso/5 px-2 md:px-3 py-1.5 rounded-lg md:rounded-xl border border-espresso/5 shadow-inner">
                                                <span className="material-symbols-outlined text-[16px] md:text-[18px]">payments</span>
                                                {job.salaryRange || 'PROBATIONARY'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-espresso/60 uppercase tracking-widest bg-espresso/5 px-2 md:px-3 py-1.5 rounded-lg md:rounded-xl border border-espresso/5 shadow-inner">
                                                <span className="material-symbols-outlined text-[16px] md:text-[18px]">work</span>
                                                {job.jobType}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/60 dark:bg-black/40 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-espresso/5 shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <span className="material-symbols-outlined text-4xl md:text-6xl">format_quote</span>
                                        </div>
                                        <div className="space-y-4 md:space-y-6 relative z-10">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 border-b border-espresso/5 pb-4 md:pb-6">
                                                <div className="min-w-0">
                                                    <p className="text-[8px] font-black text-espresso/30 uppercase tracking-[0.4em] mb-2">Primary Liaison</p>
                                                    <p className="text-xs md:text-sm font-black text-espresso dark:text-white uppercase tracking-tight truncate">{job.contactPhone}</p>
                                                    <p className="text-xs md:text-sm font-black text-espresso dark:text-white uppercase tracking-tight truncate">{job.contactEmail}</p>
                                                </div>
                                                {job.applicationLink && (
                                                    <div className="min-w-0">
                                                        <p className="text-[8px] font-black text-espresso/30 uppercase tracking-[0.4em] mb-2">Portal Access</p>
                                                        <a href={job.applicationLink} target="_blank" rel="noreferrer" className="text-xs md:text-sm font-black text-espresso/60 hover:text-espresso transition-all underline decoration-espresso/20 underline-offset-4 truncate block">
                                                            {job.applicationLink.replace('https://', '').replace('www.', '')}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-espresso/30 uppercase tracking-[0.4em] mb-3">Institutional Requirements</p>
                                                <p className="text-espresso/70 dark:text-white/70 text-xs md:text-sm font-medium leading-relaxed italic line-clamp-3 group-hover:line-clamp-none transition-all break-words">
                                                    "{job.experience}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {filter === 'approved' && (
                                        <div className="flex flex-wrap items-center gap-3 px-4 md:px-5 py-2.5 bg-espresso text-white rounded-xl md:rounded-2xl w-fit shadow-lg shadow-espresso/20 group-hover:scale-105 transition-transform">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] md:text-[18px]">hub</span>
                                                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Visible to:</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {job.targetAudience?.map(aud => (
                                                    <span key={aud} className="bg-white/20 px-2 md:px-3 py-0.5 rounded-md md:rounded-lg text-[7px] md:text-[8px] font-black uppercase tracking-widest border border-white/10 whitespace-nowrap">
                                                        {aud}
                                                    </span>
                                                )) || <span className="bg-white/20 px-2 md:px-3 py-0.5 rounded-md md:rounded-lg text-[7px] md:text-[8px] font-black uppercase tracking-widest border border-white/10 italic">NO AUDIENCE</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Control Array */}
                                <div className="lg:w-[320px] shrink-0 space-y-6 md:space-y-8 flex flex-col justify-between pt-8 md:pt-10 lg:pt-0 lg:pl-10 lg:border-l border-espresso/10">
                                    <div className="space-y-4">
                                        {filter === 'pending' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4">
                                                <button
                                                    onClick={() => handleStatusChange(job, 'approved')}
                                                    className="w-full h-14 md:h-16 flex items-center justify-center gap-3 md:gap-4 bg-espresso text-white rounded-xl md:rounded-2xl font-serif font-black text-lg md:text-xl tracking-tight shadow-xl hover:shadow-espresso/40 hover:-translate-y-1 transition-all group/btn"
                                                >
                                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/10 flex items-center justify-center border border-white/10 group-hover/btn:rotate-12 transition-transform shadow-inner">
                                                        <span className="material-symbols-outlined text-[20px] md:text-[24px]">verified</span>
                                                    </div>
                                                    AUTHORIZE
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(job, 'rejected')}
                                                    className="w-full h-14 md:h-16 flex items-center justify-center gap-3 md:gap-4 bg-white/40 text-red-600 border border-red-100 rounded-xl md:rounded-2xl font-serif font-black text-lg md:text-xl tracking-tight shadow-sm hover:bg-red-50 hover:border-red-200 transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-[20px] md:text-[24px]">block</span>
                                                    DISMISS
                                                </button>
                                            </div>
                                        )}

                                        {filter === 'approved' && (
                                            <>
                                                <div className="space-y-3">
                                                    <p className="text-[9px] md:text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em] ml-2">Propagation Vector</p>
                                                    <div className="grid grid-cols-2 gap-2 md:gap-3">
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
                                                                    "h-10 md:h-12 border rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black tracking-widest transition-all shadow-sm flex items-center justify-center gap-1.5 md:gap-2 px-1",
                                                                    v.primary
                                                                        ? "bg-espresso text-white border-espresso hover:bg-espresso/80"
                                                                        : "bg-white/60 text-espresso border-espresso/10 hover:bg-espresso hover:text-white"
                                                                )}
                                                            >
                                                                <span className="material-symbols-outlined text-[14px] md:text-[16px]">
                                                                    {v.id === 'all' ? 'language' : v.id === 'public' ? 'public' : 'hub'}
                                                                </span>
                                                                {v.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleStatusChange(job, 'pending')}
                                                    className="w-full flex items-center justify-center gap-2 py-3 md:py-4 text-[8px] md:text-[9px] font-black text-orange-700 uppercase tracking-[0.4em] hover:bg-orange-50 rounded-xl md:rounded-2xl transition-all border border-transparent hover:border-orange-100"
                                                >
                                                    <span className="material-symbols-outlined text-[14px] md:text-[16px] animate-spin-slow">history</span>
                                                    Rollback to Pending
                                                </button>
                                            </>
                                        )}

                                        {filter === 'rejected' && (
                                            <button
                                                onClick={() => handleStatusChange(job, 'pending')}
                                                className="w-full h-14 md:h-16 flex items-center justify-center gap-3 md:gap-4 bg-white/40 text-espresso border border-espresso/10 rounded-xl md:rounded-2xl font-serif font-black text-lg md:text-xl tracking-tight shadow-sm hover:bg-espresso hover:text-white transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[20px] md:text-[24px]">undo</span>
                                                RESTORE VECTOR
                                            </button>
                                        )}
                                    </div>

                                    <div className="pt-6 md:pt-8 border-t border-espresso/5">
                                        <button
                                            onClick={() => handleDelete(job)}
                                            className="w-full h-12 md:h-14 flex items-center justify-center gap-2 md:gap-3 text-red-500 hover:text-white hover:bg-red-600 rounded-xl md:rounded-2xl transition-all text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] border border-red-100 hover:border-red-600 shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-[18px] md:text-[20px]">delete_forever</span>
                                            Purge Ledger
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2"
                        onClick={() => setPreviewImage(null)}
                    >
                        <span className="material-symbols-outlined text-4xl">close</span>
                    </button>

                    <div className="relative max-w-5xl w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                        />
                        <a
                            href={previewImage}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl backdrop-blur-md border border-white/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">open_in_new</span>
                            Open in New Tab
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}



