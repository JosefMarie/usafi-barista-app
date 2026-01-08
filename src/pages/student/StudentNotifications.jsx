import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export function StudentNotifications() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('All');
    const [notifications, setNotifications] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        // Query for notifications where recipientId matches the user's UID
        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', user.uid),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                time: doc.data().timestamp?.toDate
                    ? new Date(doc.data().timestamp.toDate()).toLocaleString()
                    : 'Just now'
            }));
            setNotifications(fetched);
        });

        return () => unsubscribe();
    }, [user]);

    const handleRead = async (notification) => {
        if (!notification.read) {
            try {
                const ref = doc(db, 'notifications', notification.id);
                await updateDoc(ref, { read: true });
            } catch (error) {
                console.error("Error marking read:", error);
            }
        }
        // Could also navigate to related content based on notification.type or relatedId
    };

    const getIcon = (type) => {
        switch (type) {
            case 'course': return 'school';
            case 'system': return 'info';
            case 'assignment': return 'assignment_turned_in';
            default: return 'notifications';
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'course': return 'bg-primary/10 text-primary';
            case 'system': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'assignment': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const newNotifications = notifications.filter(n => !n.read);
    const earlierNotifications = notifications.filter(n => n.read);

    return (
        <div className="w-full min-h-screen pb-12 animate-fade-in bg-[#F5DEB3] dark:bg-[#1c1916]">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F5DEB3]/90 dark:bg-[#1c1916]/90 backdrop-blur-sm mb-4 border-b border-espresso/5">
                <div className="flex items-center gap-3 px-4 py-3 md:py-4">
                    <button
                        onClick={() => navigate('/student/profile')}
                        className="flex items-center justify-center size-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-espresso dark:text-white shrink-0"
                    >
                        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                    </button>
                    <h1 className="text-espresso dark:text-white text-lg md:text-xl font-serif font-bold leading-tight truncate">Notifications</h1>
                </div>
            </header>

            {/* Filter Chips */}
            <div className="w-full overflow-x-auto no-scrollbar pb-6 px-4">
                <div className="flex gap-2 md:gap-3 min-w-max">
                    {['All', 'Courses', 'Account'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex h-8 md:h-9 shrink-0 items-center justify-center px-4 md:px-5 rounded-full text-xs md:text-sm font-black uppercase tracking-widest transition-all",
                                activeTab === tab
                                    ? 'bg-espresso text-white shadow-xl scale-105'
                                    : 'bg-white/40 dark:bg-[#2c2825] border border-espresso/10 text-espresso dark:text-white/90 hover:bg-white/60'
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex flex-col gap-6 md:gap-8 px-4 w-full max-w-2xl mx-auto">
                {/* New Section */}
                {newNotifications.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-espresso/40 dark:text-white/40 pl-1">New Information</h3>
                        {newNotifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => handleRead(n)}
                                className="relative flex items-start gap-3 md:gap-4 rounded-2xl bg-white/60 dark:bg-[#2c2825] p-3.5 md:p-4 shadow-xl border border-espresso/5 transition-all cursor-pointer hover:bg-white active:scale-[0.98] group"
                            >
                                <div className={`flex size-10 md:size-12 shrink-0 items-center justify-center rounded-xl md:rounded-2xl shadow-sm ${getColor(n.type)}`}>
                                    <span className="material-symbols-outlined text-[20px] md:text-[24px]">{getIcon(n.type)}</span>
                                </div>
                                <div className="flex flex-1 flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-espresso dark:text-white text-[13px] md:text-sm font-bold leading-tight group-hover:text-primary transition-colors">{n.title}</p>
                                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter text-espresso/40 shrink-0 ml-2">{n.time}</span>
                                    </div>
                                    <p className="text-espresso/70 dark:text-white/70 text-[12px] md:text-[13px] font-medium leading-relaxed">{n.desc}</p>
                                </div>
                                <div className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Earlier Section */}
                {earlierNotifications.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-espresso/40 dark:text-white/40 pl-1">Earlier Signals</h3>
                        {earlierNotifications.map(n => (
                            <div key={n.id} className="flex items-start gap-3 md:gap-4 rounded-2xl p-3.5 md:p-4 hover:bg-white/40 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-espresso/5 active:scale-[0.98]">
                                <div className={`flex size-10 md:size-12 shrink-0 items-center justify-center rounded-xl md:rounded-2xl opacity-60 ${getColor(n.type)}`}>
                                    <span className="material-symbols-outlined text-[20px] md:text-[24px]">{getIcon(n.type)}</span>
                                </div>
                                <div className="flex flex-1 flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-espresso dark:text-white text-[13px] md:text-sm font-bold leading-tight opacity-70">{n.title}</p>
                                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter text-espresso/30 shrink-0 ml-2">{n.time}</span>
                                    </div>
                                    <p className="text-espresso/60 dark:text-white/60 text-[12px] md:text-[13px] font-medium leading-relaxed">{n.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <div className="size-20 rounded-[2rem] bg-espresso/5 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-4xl text-espresso">notifications_off</span>
                        </div>
                        <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-espresso">Strategic Silence</h3>
                        <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] mt-2 text-espresso/50">No new communications at this time</p>
                    </div>
                )}
            </main>
        </div>
    );
}
