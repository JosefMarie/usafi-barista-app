import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

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
        <div className="max-w-xl mx-auto min-h-screen bg-background-light dark:bg-background-dark shadow-xl">
            {/* Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-5 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
                <h1 className="text-espresso dark:text-white text-2xl font-serif font-bold leading-tight tracking-tight">Notifications</h1>
                <button
                    onClick={handleMarkAllRead}
                    className="text-primary hover:text-primary/80 text-sm font-semibold transition-colors"
                >
                    Mark all read
                </button>
            </header>

            {/* Filter Chips */}
            <div className="w-full overflow-x-auto no-scrollbar pb-2 pt-1 px-6">
                <div className="flex gap-3 min-w-max">
                    {['All', 'Urgency', 'Enrollment', 'Inventory'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex h-9 shrink-0 items-center justify-center px-5 rounded-full shadow-md transition-transform active:scale-95 ${activeTab === tab ? 'bg-primary text-white' : 'bg-white dark:bg-[#2c2825] border border-primary/20 text-espresso dark:text-white/90'}`}
                        >
                            <span className="text-sm font-medium">{tab}</span>
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex-1 flex flex-col gap-4 p-6 pt-4">
                {/* New Section */}
                {newNotifications.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-espresso/60 dark:text-white/50 pl-1 font-serif">New (Unread)</h3>
                        {newNotifications.map(n => (
                            <div key={n.id} className="group relative flex items-start gap-4 rounded-2xl bg-white dark:bg-[#2c2825] p-4 shadow-sm border-l-4 border-primary transition-all active:bg-gray-50 dark:active:bg-gray-800">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${getColor(n.type)}`}>
                                    <span className="material-symbols-outlined">{getIcon(n.type)}</span>
                                </div>
                                <div className="flex flex-1 flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-espresso dark:text-white text-base font-semibold leading-tight">{n.title}</p>
                                        <span className="text-xs font-medium text-primary shrink-0 ml-2">{n.time}</span>
                                    </div>
                                    <p className="text-espresso/70 dark:text-white/70 text-sm leading-normal">{n.desc}</p>
                                </div>
                                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary ring-2 ring-white dark:ring-[#2c2825]"></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Earlier Section */}
                {earlierNotifications.length > 0 && (
                    <div className="flex flex-col gap-3 mt-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-espresso/60 dark:text-white/50 pl-1 font-serif">Earlier (Read)</h3>
                        {earlierNotifications.map(n => (
                            <div key={n.id} className="relative flex items-start gap-4 rounded-2xl bg-transparent p-4 hover:bg-white/50 dark:hover:bg-[#2c2825]/50 transition-colors border border-transparent hover:border-black/5">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${getColor(n.type)}`}>
                                    <span className="material-symbols-outlined">{getIcon(n.type)}</span>
                                </div>
                                <div className="flex flex-1 flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-espresso dark:text-white text-base font-medium leading-tight opacity-90">{n.title}</p>
                                        <span className="text-xs text-espresso/50 dark:text-white/40 shrink-0 ml-2">{n.time}</span>
                                    </div>
                                    <p className="text-espresso/60 dark:text-white/60 text-sm leading-normal">{n.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-center text-espresso/50 dark:text-white/50">
                        <span className="material-symbols-outlined text-4xl mb-2">notifications_off</span>
                        <p>No notifications yet</p>
                    </div>
                )}
            </main>

            {/* Bottom Nav Simulation */}
            <div className="h-24"></div>
        </div>
    );
}
