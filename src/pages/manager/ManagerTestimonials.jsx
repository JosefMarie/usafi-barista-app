import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

export function ManagerTestimonials() {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // 'pending', 'approved', 'rejected'

    useEffect(() => {
        const q = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTestimonials(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateDoc(doc(db, 'testimonials', id), {
                status,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently delete this testimony from our records?")) return;
        try {
            await deleteDoc(doc(db, 'testimonials', id));
        } catch (error) {
            console.error("Error deleting testimony:", error);
        }
    };

    const filteredTestimonials = testimonials.filter(t => t.status === filter);

    if (loading) return <div className="p-8">Syncing Testimonial Registry...</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-32">
            <div className="w-full px-2 py-10 space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-4 md:-ml-10"></div>
                    <div>
                        <h1 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Testimonial Ledger</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-1 md:mt-2">Reviewing Student & Public Feedback for Publication</p>
                    </div>

                    <div className="flex gap-2 p-1.5 bg-espresso/5 rounded-2xl border border-espresso/10">
                        {['pending', 'approved', 'rejected'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    filter === s
                                        ? "bg-espresso text-white shadow-lg"
                                        : "text-espresso/40 hover:text-espresso"
                                )}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {filteredTestimonials.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white/20 rounded-[3rem] border-2 border-dashed border-espresso/10 opacity-30">
                            <span className="material-symbols-outlined text-8xl">reviews</span>
                            <div className="text-center">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.5em]">No {filter} Items</h3>
                                <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-2">The registry stream is currently clear</p>
                            </div>
                        </div>
                    ) : (
                        filteredTestimonials.map(item => (
                            <div key={item.id} className="group bg-white/40 dark:bg-black/20 rounded-[2.5rem] p-8 md:p-10 border border-espresso/10 shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-8">
                                <div className={cn(
                                    "absolute left-0 top-0 bottom-0 w-2 transition-colors",
                                    item.status === 'approved' ? 'bg-green-500' : item.status === 'rejected' ? 'bg-red-500' : 'bg-primary'
                                )}></div>

                                <div className="flex-1 space-y-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="h-16 w-16 rounded-2xl bg-espresso/5 border border-espresso/10 bg-cover bg-center"
                                                style={{ backgroundImage: item.imageUrl ? `url("${item.imageUrl}")` : "url('/image/hero-image-1.webp')" }}
                                            ></div>
                                            <div>
                                                <h3 className="text-xl font-serif font-black text-espresso dark:text-white uppercase leading-none">{item.name}</h3>
                                                <p className="text-[10px] font-black text-espresso/40 uppercase tracking-widest mt-2">{item.phone} • {item.type}</p>
                                            </div>
                                        </div>
                                        <span className="px-4 py-1.5 bg-espresso/5 border border-espresso/10 rounded-xl text-espresso text-[11px] font-black uppercase tracking-widest">
                                            {item.topic || 'General'}
                                        </span>
                                    </div>

                                    <div className="relative">
                                        <span className="material-symbols-outlined text-4xl text-espresso/5 absolute -top-4 -left-4">format_quote</span>
                                        <p className="text-espresso/80 dark:text-white/80 text-lg italic leading-relaxed pl-4">
                                            "{item.content}"
                                        </p>
                                    </div>

                                    <p className="text-[9px] font-black text-espresso/20 uppercase tracking-[0.4em]">Submitted: {item.createdAt?.toDate().toLocaleString()}</p>
                                </div>

                                <div className="flex flex-row md:flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-espresso/5 pt-6 md:pt-0 md:pl-8">
                                    {item.status !== 'approved' && (
                                        <button
                                            onClick={() => handleStatusUpdate(item.id, 'approved')}
                                            className="flex-1 md:w-32 h-12 bg-green-600/10 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">check_circle</span> APPROVE
                                        </button>
                                    )}
                                    {item.status !== 'rejected' && (
                                        <button
                                            onClick={() => handleStatusUpdate(item.id, 'rejected')}
                                            className="flex-1 md:w-32 h-12 bg-amber-600/10 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">cancel</span> REJECT
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="h-12 w-12 md:w-32 bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete_forever</span>
                                        <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">PURGE</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
