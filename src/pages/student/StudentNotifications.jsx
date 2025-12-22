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
        <div className="max-w-2xl mx-auto min-h-screen pb-12 animate-fade-in">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-gray-50/90 dark:bg-[#1c1916]/90 backdrop-blur-sm mb-4">
                <div className="flex items-center gap-3 px-4 py-4">
                    <button
                        onClick={() => navigate('/student/profile')}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-espresso dark:text-white"
                    >
                        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                    </button>
                    <h1 className="text-espresso dark:text-white text-xl font-serif font-bold leading-tight">Notifications</h1>
                </div>
            </header>

            {/* Filter Chips */}
            <div className="w-full overflow-x-auto no-scrollbar pb-4 px-4">
                <div className="flex gap-3 min-w-max">
                    {['All', 'Courses', 'Account'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex h-9 shrink-0 items-center justify-center px-5 rounded-full text-sm font-medium transition-colors ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'bg-white dark:bg-[#2c2825] border border-gray-200 dark:border-white/10 text-espresso dark:text-white/90'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex flex-col gap-6 px-4">
                {/* New Section */}
                {newNotifications.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-espresso/60 dark:text-white/50 pl-1 font-serif">New</h3>
                        {newNotifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => handleRead(n)}
                                className="relative flex items-start gap-4 rounded-xl bg-white dark:bg-[#2c2825] p-4 shadow-sm border border-gray-100 dark:border-white/5 transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getColor(n.type)}`}>
                                    <span className="material-symbols-outlined text-[20px]">{getIcon(n.type)}</span>
                                </div>
                                <div className="flex flex-1 flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-espresso dark:text-white text-sm font-semibold leading-tight">{n.title}</p>
                                        <span className="text-[10px] font-medium text-primary shrink-0 ml-2">{n.time}</span>
                                    </div>
                                    <p className="text-espresso/70 dark:text-white/70 text-sm leading-snug">{n.desc}</p>
                                </div>
                                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary ring-2 ring-white dark:ring-[#2c2825]"></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Earlier Section */}
                {earlierNotifications.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-espresso/60 dark:text-white/50 pl-1 font-serif">Earlier</h3>
                        {earlierNotifications.map(n => (
                            <div key={n.id} className="flex items-start gap-4 rounded-xl p-4 hover:bg-white/50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/5">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getColor(n.type)} opacity-80`}>
                                    <span className="material-symbols-outlined text-[20px]">{getIcon(n.type)}</span>
                                </div>
                                <div className="flex flex-1 flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-espresso dark:text-white text-sm font-medium leading-tight opacity-90">{n.title}</p>
                                        <span className="text-[10px] text-espresso/50 dark:text-white/40 shrink-0 ml-2">{n.time}</span>
                                    </div>
                                    <p className="text-espresso/60 dark:text-white/60 text-sm leading-snug">{n.desc}</p>
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
        </div>
    );
}
