import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export function Notifications() {
    const [activeTab, setActiveTab] = useState('All');
    const [notifications, setNotifications] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        // Query for notifications where recipientId is 'admin'
        // Ordered by timestamp desc
        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', 'admin'),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Helper to format timestamp roughly
                time: doc.data().timestamp?.toDate
                    ? new Date(doc.data().timestamp.toDate()).toLocaleString()
                    : 'Just now'
            }));
            setNotifications(fetched);
        });

        return () => unsubscribe();
    }, [user]);

    const handleMarkAllRead = async () => {
        const batch = writeBatch(db);
        const unread = notifications.filter(n => !n.read);
        unread.forEach(n => {
            const ref = doc(db, 'notifications', n.id);
            batch.update(ref, { read: true });
        });
        await batch.commit();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'inventory': return 'inventory_2';
            case 'enrollment': return 'school';
            case 'finance': return 'credit_card_off';
            case 'support': return 'support_agent';
            case 'material': return 'upload_file';
            default: return 'notifications';
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'inventory': return 'bg-primary/10 text-primary';
            case 'enrollment': return 'bg-primary/10 text-primary';
            case 'finance': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            case 'support': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
            case 'material': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    // Client-side categorization for "New" vs "Earlier" based on 'read' status or timestamp
    // For simplicity, we can use 'read' status to group
    const newNotifications = notifications.filter(n => !n.read);
    const earlierNotifications = notifications.filter(n => n.read);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-32">
            <div className=" w-full px-2 py-10 space-y-10">
                {/* Header Section */}
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-10"></div>
                    <div>
                        <h1 className="text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Directive Registry</h1>
                        <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-2">Administrative Protocol & Intelligence Feed</p>
                    </div>
                    <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-black text-espresso uppercase tracking-[0.2em] hover:text-espresso/60 transition-colors border-b-2 border-espresso/20 pb-1"
                    >
                        Mark all archived
                    </button>
                </div>

                {/* Filter Array */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {['All', 'Urgency', 'Enrollment', 'Inventory'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex h-10 shrink-0 items-center justify-center px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm",
                                activeTab === tab
                                    ? "bg-espresso text-white shadow-lg"
                                    : "bg-white/40 dark:bg-black/20 border border-espresso/10 text-espresso/60 hover:bg-white/60"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Directives Stream */}
                <div className="space-y-12">
                    {/* New Directives */}
                    {newNotifications.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.4em] flex items-center gap-3">
                                <span className="w-8 h-px bg-espresso/20"></span>
                                Priority Synchronizations
                            </h3>
                            <div className="grid gap-6">
                                {newNotifications.map(n => (
                                    <div key={n.id} className="group relative bg-white dark:bg-black/40 rounded-[2.5rem] p-8 border border-primary/20 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso group-hover:bg-espresso/80 transition-colors"></div>
                                        <div className="flex gap-8 items-start">
                                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${getColor(n.type)}`}>
                                                <span className="material-symbols-outlined text-[32px]">{getIcon(n.type)}</span>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-2xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-tight group-hover:text-espresso/80 transition-colors">
                                                        {n.title}
                                                    </h4>
                                                    <span className="text-[9px] font-black text-espresso/40 uppercase tracking-widest">{n.time}</span>
                                                </div>
                                                <p className="text-espresso/60 dark:text-white/60 text-sm leading-relaxed font-medium italic">
                                                    "{n.desc}"
                                                </p>
                                                <div className="absolute top-8 right-8 h-3 w-3 rounded-full bg-espresso animate-pulse shadow-[0_0_15px_rgba(75,56,50,0.5)]"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Archived Directives */}
                    {earlierNotifications.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.4em] flex items-center gap-3">
                                <span className="w-8 h-px bg-espresso/20"></span>
                                Historical Archives
                            </h3>
                            <div className="grid gap-4">
                                {earlierNotifications.map(n => (
                                    <div key={n.id} className="group relative bg-white/20 dark:bg-black/20 rounded-3xl p-6 border border-espresso/5 shadow-sm transition-all hover:bg-white/40 overflow-hidden opacity-60 hover:opacity-100">
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/10 group-hover:bg-espresso/20 transition-colors"></div>
                                        <div className="flex gap-6 items-center">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${getColor(n.type)} opacity-50 group-hover:opacity-100 transition-opacity`}>
                                                <span className="material-symbols-outlined text-[24px]">{getIcon(n.type)}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="text-base font-serif font-black text-espresso dark:text-white uppercase tracking-tight truncate">
                                                        {n.title}
                                                    </h4>
                                                    <span className="text-[8px] font-black text-espresso/30 uppercase tracking-widest">{n.time}</span>
                                                </div>
                                                <p className="text-espresso/40 dark:text-white/40 text-[10px] font-medium truncate uppercase tracking-wider">
                                                    {n.desc}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {notifications.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 gap-6 opacity-20">
                            <span className="material-symbols-outlined text-8xl">encryption_lock</span>
                            <div className="text-center">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.5em]">System Lockdown</h3>
                                <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-2">Zero active directives detected in primary stream</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}



