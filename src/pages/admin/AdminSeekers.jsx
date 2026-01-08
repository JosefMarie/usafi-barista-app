import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { GradientButton } from '../../components/ui/GradientButton';
import { cn } from '../../lib/utils';


export function AdminSeekers() {
    const [seekers, setSeekers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Query users where role is 'job_seeker'
        const q = query(collection(db, 'users'), where('role', '==', 'job_seeker'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSeekers(users);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const togglePaymentStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
        try {
            const userRef = doc(db, 'users', id);
            await updateDoc(userRef, { paymentStatus: newStatus });
        } catch (error) {
            console.error("Error updating payment status:", error);
            alert("Failed to update status");
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-32">
            <div className=" w-full px-2 py-10 space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-4 md:-ml-10"></div>
                    <div>
                        <h1 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Talent Registry</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-1 md:mt-2">Candidate Database & Verification Oversight</p>
                    </div>
                </div>

                {/* Content Stream (Mobile Cards / Desktop Table) */}
                <div className="space-y-6">
                    {/* Desktop View Table */}
                    <div className="hidden lg:block bg-white/40 dark:bg-black/20 rounded-[3rem] shadow-2xl border border-espresso/10 overflow-hidden relative backdrop-blur-md">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/10"></div>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-espresso text-white dark:bg-black/40">
                                    <tr>
                                        <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/10">Candidate Identity</th>
                                        <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/10">Communications</th>
                                        <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/10 text-center">Protocol</th>
                                        <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/10">Registration</th>
                                        <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/10">Verification</th>
                                        <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/10 text-right">Synchronization</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-espresso/5">
                                    {seekers.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-24 text-center">
                                                <div className="flex flex-col items-center gap-6 opacity-20">
                                                    <span className="material-symbols-outlined text-8xl">database_off</span>
                                                    <div className="text-center">
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.5em]">Ledger Depleted</h3>
                                                        <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-2">No active seekers detected in current registry</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        seekers.map(seeker => (
                                            <tr key={seeker.id} className="group hover:bg-white/40 transition-all">
                                                <td className="p-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none group-hover:text-espresso/70 transition-colors">
                                                            {seeker.name}
                                                        </span>
                                                        <span className="text-[9px] font-black text-espresso/40 uppercase tracking-widest mt-1">ID: {seeker.id.slice(0, 8).toUpperCase()}</span>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-black text-espresso/80 dark:text-white/80 lowercase tracking-tight">{seeker.email}</span>
                                                        <span className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-[14px]">call</span>
                                                            {seeker.phone}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-8 text-center">
                                                    <span className="px-5 py-1.5 rounded-xl bg-espresso/5 border border-espresso/10 text-espresso text-[9px] font-black uppercase tracking-[0.3em] shadow-inner">
                                                        {seeker.gender || 'UNDEF'}
                                                    </span>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-espresso/40 uppercase tracking-[0.4em]">TIMESTAMP</span>
                                                        <span className="text-sm font-serif font-black text-espresso/70 dark:text-white/70">
                                                            {seeker.createdAt?.toDate().toLocaleDateString().toUpperCase() || 'EXTERNAL'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className={cn(
                                                        "flex items-center gap-3 px-5 py-2.5 rounded-2xl w-fit shadow-sm border",
                                                        seeker.paymentStatus === 'paid'
                                                            ? 'bg-green-600/10 text-green-700 border-green-200'
                                                            : 'bg-amber-600/10 text-amber-700 border-amber-200'
                                                    )}>
                                                        <div className={cn(
                                                            "w-2.5 h-2.5 rounded-full animate-pulse shadow-sm",
                                                            seeker.paymentStatus === 'paid' ? 'bg-green-600' : 'bg-amber-600'
                                                        )}></div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                                            {seeker.paymentStatus?.toUpperCase() || 'PENDING'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-8 text-right">
                                                    {seeker.paymentStatus === 'paid' ? (
                                                        <button
                                                            onClick={() => togglePaymentStatus(seeker.id, 'paid')}
                                                            className="text-[9px] font-black text-red-600/40 hover:text-red-600 uppercase tracking-[0.4em] transition-all flex items-center gap-2 justify-end ml-auto"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">history</span>
                                                            REVOKE ACCESS
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => togglePaymentStatus(seeker.id, 'pending')}
                                                            className="h-12 inline-flex items-center justify-center rounded-2xl bg-espresso text-white px-8 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-espresso/40 hover:-translate-y-1 transition-all active:scale-95 group/btn"
                                                        >
                                                            <span className="material-symbols-outlined mr-3 text-[18px] group-hover:rotate-12 transition-transform">verified_user</span>
                                                            AUTHORIZE
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile View Cards */}
                    <div className="lg:hidden space-y-6">
                        {seekers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-6 bg-white/20 rounded-[2rem] border-2 border-dashed border-espresso/10 opacity-30">
                                <span className="material-symbols-outlined text-7xl">database_off</span>
                                <div className="text-center">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em]">Ledger Depleted</h3>
                                    <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-2">No active seekers detected</p>
                                </div>
                            </div>
                        ) : (
                            seekers.map(seeker => (
                                <div key={seeker.id} className="group relative bg-white/40 dark:bg-black/20 rounded-[2rem] p-6 border border-espresso/10 shadow-xl overflow-hidden space-y-6">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/10"></div>

                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-tight truncate">
                                                {seeker.name}
                                            </h3>
                                            <p className="text-[8px] font-black text-espresso/40 uppercase tracking-widest mt-1">ID: {seeker.id.slice(0, 8).toUpperCase()}</p>
                                        </div>
                                        <span className="px-3 py-1 rounded-lg bg-espresso/5 border border-espresso/10 text-espresso text-[8px] font-black uppercase tracking-[0.2em] shrink-0">
                                            {seeker.gender || 'UNDEF'}
                                        </span>
                                    </div>

                                    <div className="space-y-4 py-4 border-y border-espresso/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-espresso/5 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[16px] text-espresso/40">mail</span>
                                            </div>
                                            <span className="text-xs font-black text-espresso/80 truncate lowercase">{seeker.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-espresso/5 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[16px] text-espresso/40">call</span>
                                            </div>
                                            <span className="text-[10px] font-black text-espresso/60 uppercase tracking-wider">{seeker.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-espresso/5 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[16px] text-espresso/40">event</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[7px] font-black text-espresso/30 uppercase tracking-widest">REGISTERED</span>
                                                <span className="text-[10px] font-black text-espresso/60 uppercase tracking-tight">
                                                    {seeker.createdAt?.toDate().toLocaleDateString().toUpperCase() || 'EXTERNAL'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm border w-full sm:w-fit justify-center",
                                            seeker.paymentStatus === 'paid'
                                                ? 'bg-green-600/10 text-green-700 border-green-200'
                                                : 'bg-amber-600/10 text-amber-700 border-amber-200'
                                        )}>
                                            <div className={cn(
                                                "w-2 h-2 rounded-full animate-pulse",
                                                seeker.paymentStatus === 'paid' ? 'bg-green-600' : 'bg-amber-600'
                                            )}></div>
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                                                {seeker.paymentStatus?.toUpperCase() || 'PENDING'}
                                            </span>
                                        </div>

                                        <div className="w-full sm:w-auto">
                                            {seeker.paymentStatus === 'paid' ? (
                                                <button
                                                    onClick={() => togglePaymentStatus(seeker.id, 'paid')}
                                                    className="w-full sm:w-auto text-[9px] font-black text-red-600/60 hover:text-red-600 uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 py-2"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">history</span>
                                                    REVOKE ACCESS
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => togglePaymentStatus(seeker.id, 'pending')}
                                                    className="w-full h-11 inline-flex items-center justify-center rounded-xl bg-espresso text-white px-6 text-[9px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-espresso/40 transition-all active:scale-95"
                                                >
                                                    <span className="material-symbols-outlined mr-2 text-[16px]">verified_user</span>
                                                    AUTHORIZE
                                                </button>
                                            )}
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



