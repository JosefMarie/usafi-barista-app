import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function StudentChatList() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [classmates, setClassmates] = useState([]);
    const [chats, setChats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchClassmates();
            subscribeToChats();
        }
    }, [user]);

    const fetchClassmates = async () => {
        try {
            // In a real app, you'd filter by cohort/class
            // For now, get all students except current user
            const q = query(
                collection(db, 'users'),
                where('role', '==', 'student')
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(u => u.id !== user.uid);
            setClassmates(data);
        } catch (err) {
            console.error('Error fetching classmates:', err);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToChats = () => {
        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatMap = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const otherId = data.participants.find(id => id !== user.uid);
                chatMap[otherId] = { id: doc.id, ...data };
            });
            setChats(chatMap);
        });

        return unsubscribe;
    };

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <h1 className="text-2xl font-serif font-bold text-espresso dark:text-white mb-6 px-4">{t('chat.student_list_title')}</h1>

            <div className="space-y-3 px-4">
                {loading ? (
                    <div className="text-center py-8 text-espresso/50">{t('chat.loading')}</div>
                ) : classmates.length === 0 ? (
                    <div className="text-center py-12 bg-white/50 dark:bg-white/5 rounded-2xl border border-primary/10">
                        <span className="material-symbols-outlined text-4xl text-primary/30 mb-2">person_off</span>
                        <p className="text-espresso/60">{t('chat.no_classmates')}</p>
                    </div>
                ) : (
                    classmates.map(classmate => {
                        const chat = chats[classmate.id];
                        const unreadCount = chat ? (chat[`unreadCount_${user.uid}`] || 0) : 0;
                        const lastMessage = chat?.lastMessage;

                        return (
                            <Link
                                key={classmate.id}
                                to={`${classmate.id}`}
                                className="block bg-white dark:bg-[#1c1916] rounded-2xl p-4 shadow-sm border border-primary/5 hover:border-primary/30 transition-all active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/5">
                                            {classmate.avatar ? (
                                                <img src={classmate.avatar} alt={classmate.fullName} className="h-full w-full object-cover" />
                                            ) : (
                                                classmate.fullName?.[0] || classmate.email?.[0]
                                            )}
                                        </div>
                                        {classmate.status === 'active' && (
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-[#1c1916] rounded-full"></div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h3 className="font-bold text-espresso dark:text-white truncate">
                                                {classmate.fullName || classmate.email}
                                            </h3>
                                            {unreadCount > 0 && (
                                                <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md animate-pulse">
                                                    {t('chat.new_messages', { count: unreadCount })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-espresso/60 dark:text-white/50 truncate">
                                            {lastMessage || classmate.email}
                                        </p>
                                    </div>

                                    <span className="material-symbols-outlined text-espresso/20 dark:text-white/20">chevron_right</span>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
