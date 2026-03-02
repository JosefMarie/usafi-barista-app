import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

const MODULES = [
    { id: 'm1', title: 'Introduction to coffee' },
    { id: 'm2', title: 'Coffee roasting profile' },
    { id: 'm3', title: 'Coffee grinding chart' },
    { id: 'm4', title: 'Espresso extraction' },
    { id: 'm5', title: 'Latte art practice' },
    { id: 'm6', title: 'Espresso-based drinks' },
    { id: 'm7', title: 'Basic manual brewing' }
];

export function WeekendManage() {
    const { t } = useTranslation();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [progress, setProgress] = useState({});

    useEffect(() => {
        const q = query(collection(db, 'weekend_bookings'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!selectedBooking?.userId) return;

        const q = query(collection(db, 'users', selectedBooking.userId, 'weekend_progress'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newProgress = {};
            snapshot.forEach((doc) => {
                newProgress[doc.id] = doc.data();
            });
            setProgress(newProgress);
        });
        return () => unsubscribe();
    }, [selectedBooking]);

    const handleToggleModule = async (moduleId) => {
        if (!selectedBooking?.userId) return;

        const currentStatus = progress[moduleId]?.status || 'locked';
        const newStatus = currentStatus === 'completed' ? 'locked' : 'completed';

        await setDoc(doc(db, 'users', selectedBooking.userId, 'weekend_progress', moduleId), {
            status: newStatus,
            updatedAt: serverTimestamp(),
            updatedBy: 'admin'
        }, { merge: true });
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="size-10 border-4 border-espresso/20 border-t-espresso rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="font-serif text-3xl md:text-4xl font-black text-espresso dark:text-white uppercase tracking-tight">Weekend Experience Management</h1>
                    <p className="text-espresso/60 dark:text-white/40 font-medium">Manage bookings and track visitor progress through the 7-Point Combo course.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-6 py-3 rounded-2xl bg-white dark:bg-white/5 border border-espresso/10 shadow-sm">
                        <p className="text-[10px] font-black uppercase text-espresso/40">Total Bookings</p>
                        <p className="text-xl font-bold">{bookings.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Bookings List */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-white/5 rounded-3xl border border-espresso/10 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-espresso/5 border-b border-espresso/10">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-espresso/40">Visitor</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-espresso/40">Date & duration</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-espresso/40">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-espresso/40 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-espresso/5">
                                    {bookings.map((booking) => (
                                        <tr key={booking.id} className={`hover:bg-espresso/5 transition-colors cursor-pointer ${selectedBooking?.id === booking.id ? 'bg-espresso/5' : ''}`} onClick={() => setSelectedBooking(booking)}>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-espresso dark:text-white">{booking.fullName}</div>
                                                <div className="text-xs text-espresso/40">{booking.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-xs">{booking.date}</div>
                                                <div className="text-[10px] uppercase font-black text-rose-500">{booking.duration} Day(s)</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="size-8 rounded-lg bg-espresso text-white flex items-center justify-center hover:scale-110 transition-transform">
                                                    <span className="material-symbols-outlined text-sm">visibility</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {bookings.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-espresso/30 italic">No bookings found yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Progress Tracking Panel */}
                <div className="space-y-6">
                    {selectedBooking ? (
                        <div className="bg-espresso text-[#F5DEB3] p-8 rounded-[3rem] shadow-2xl space-y-8 animate-in slide-in-from-right-4 duration-500 sticky top-32">
                            <div>
                                <h2 className="font-serif text-2xl font-black uppercase mb-1">{selectedBooking.fullName}</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Journey Progress</p>
                            </div>

                            <div className="space-y-4">
                                {MODULES.map((mod, i) => {
                                    const isCompleted = progress[mod.id]?.status === 'completed';
                                    return (
                                        <button
                                            key={mod.id}
                                            onClick={() => handleToggleModule(mod.id)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${isCompleted ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/5 hover:border-white/20'}`}
                                        >
                                            <div className={`size-10 rounded-xl flex items-center justify-center transition-colors ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/20'}`}>
                                                <span className="material-symbols-outlined text-xl">{isCompleted ? 'check_circle' : 'circle'}</span>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Module {i + 1}</p>
                                                <p className={`font-bold text-sm ${isCompleted ? 'text-white' : 'text-white/60'}`}>{mod.title}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {!selectedBooking.userId && (
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                                    <div className="flex gap-2 items-center mb-1">
                                        <span className="material-symbols-outlined text-sm">warning</span>
                                        <span className="font-black uppercase tracking-widest">Guest Account Missing</span>
                                    </div>
                                    This visitor hasn't created an account yet or the booking was made before the auth system was enabled.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] border-2 border-dashed border-espresso/10 rounded-[3rem] flex flex-col items-center justify-center text-center p-8 text-espresso/20">
                            <span className="material-symbols-outlined text-6xl mb-4">touch_app</span>
                            <p className="font-bold">Select a booking to manage their journey</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
