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
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user) {
            fetchClassmates();
            subscribeToChats();
        }
    }, [user]);

    const fetchClassmates = async () => {
        try {
            // Fetch both classmates (students) and instructors
            // Students can chat with both groups
            const studentsQuery = query(
                collection(db, 'users'),
                where('role', '==', 'student')
            );
            const instructorsQuery = query(
                collection(db, 'users'),
                where('role', '==', 'instructor')
            );

            const [studentsSnap, instructorsSnap] = await Promise.all([
                getDocs(studentsQuery),
                getDocs(instructorsQuery)
            ]);

            const students = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const instructors = instructorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Combine and filter out current user
            const allContacts = [...students, ...instructors].filter(u => u.id !== user.uid);

            setClassmates(allContacts);
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

    // Filter contacts by search term
    const filteredClassmates = classmates.filter(classmate => {
        const name = (classmate.fullName || classmate.name || '').toLowerCase();
        const email = (classmate.email || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return name.includes(search) || email.includes(search);
    });

    // Separate unread and read chats
    const classmatesWithChats = filteredClassmates.map(classmate => {
        const chat = chats[classmate.id];
        const unreadCount = chat ? (chat[`unreadCount_${user.uid}`] || 0) : 0;
        return { ...classmate, chat, unreadCount };
    });

    const unreadChats = classmatesWithChats.filter(c => c.unreadCount > 0);
    const readChats = classmatesWithChats.filter(c => c.unreadCount === 0);

    // Sort by last message time
    const sortByLastMessage = (a, b) => {
        const timeA = a.chat?.lastMessageTime?.toDate?.() || new Date(0);
        const timeB = b.chat?.lastMessageTime?.toDate?.() || new Date(0);
        return timeB - timeA;
    };

    unreadChats.sort(sortByLastMessage);
    readChats.sort(sortByLastMessage);

    const renderChatItem = (contact) => {
        const { chat, unreadCount } = contact;
        const lastMessage = chat?.lastMessage;

        return (
            <Link
                key={contact.id}
                to={`${contact.id}`}
                className="block bg-white/60 dark:bg-[#1c1916] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg hover:shadow-xl border border-espresso/5 hover:border-espresso/20 transition-all active:scale-[0.98] group"
            >
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="relative shrink-0">
                        <div className="size-14 md:size-20 rounded-2xl md:rounded-3xl bg-espresso text-white flex items-center justify-center font-black text-xl md:text-3xl overflow-hidden border-2 border-white dark:border-[#1c1916] shadow-xl group-hover:scale-105 transition-transform">
                            {contact.photoURL || contact.avatar ? (
                                <img src={contact.photoURL || contact.avatar} alt={contact.fullName || contact.name} className="size-full object-cover" />
                            ) : (
                                <span className="font-serif">{((contact.fullName || contact.name)?.[0] || contact.email?.[0] || '?').toUpperCase()}</span>
                            )}
                        </div>
                        {contact.status === 'active' && (
                            <div className="absolute -bottom-1 -right-1 size-4 md:size-6 bg-green-500 border-2 md:border-4 border-white dark:border-[#1c1916] rounded-xl shadow-lg animate-pulse"></div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 md:mb-2">
                            <h3 className="font-serif font-black text-espresso dark:text-white truncate text-base md:text-xl group-hover:text-primary transition-colors">
                                {contact.fullName || contact.name || contact.email}
                            </h3>
                            {unreadCount > 0 && (
                                <span className="bg-espresso text-white text-[8px] md:text-[10px] px-2.5 md:px-4 py-1 md:py-1.5 rounded-full font-black uppercase tracking-widest shadow-xl animate-pulse shrink-0">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-xs md:text-base text-espresso/50 dark:text-white/40 truncate font-medium">
                                {lastMessage || contact.email}
                            </p>
                            <span className="material-symbols-outlined text-espresso/20 dark:text-white/20 group-hover:text-espresso group-hover:translate-x-1 transition-all text-xl md:text-3xl shrink-0">arrow_right_alt</span>
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <div className="max-w-2xl mx-auto pb-24 md:pb-28">
            <h1 className="text-xl md:text-3xl font-serif font-black text-espresso dark:text-white mb-6 md:mb-10 px-6 md:px-8 mt-4 md:mt-8 uppercase tracking-[0.1em] md:tracking-[0.2em]">{t('chat.student_list_title')}</h1>

            {/* Search Bar */}
            <div className="px-4 md:px-8 mb-6">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-espresso/40 dark:text-white/40 text-xl md:text-2xl">search</span>
                    <input
                        type="text"
                        placeholder={t('chat.search_placeholder') || 'Search contacts...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 md:pl-14 pr-4 py-3 md:py-4 rounded-2xl md:rounded-3xl bg-white/60 dark:bg-white/5 border border-espresso/10 focus:border-espresso/30 focus:ring-2 focus:ring-espresso/20 outline-none transition-all text-espresso dark:text-white placeholder:text-espresso/30 dark:placeholder:text-white/30 font-medium"
                    />
                </div>
            </div>

            <div className="space-y-6 md:space-y-8 px-4 md:px-8">
                {loading ? (
                    <div className="text-center py-12 text-espresso/40 font-bold uppercase tracking-widest text-[10px] md:text-xs">{t('chat.loading')}</div>
                ) : filteredClassmates.length === 0 ? (
                    <div className="text-center py-16 md:py-24 bg-white/40 dark:bg-white/5 rounded-3xl md:rounded-[2.5rem] border border-espresso/5 shadow-xl">
                        <span className="material-symbols-outlined text-5xl md:text-7xl text-espresso/10 mb-4">person_off</span>
                        <p className="text-espresso/50 font-serif italic text-sm md:text-lg">
                            {searchTerm ? t('chat.no_results') || 'No contacts found' : t('chat.no_classmates')}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Unread Messages Section */}
                        {unreadChats.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="h-2 w-2 rounded-full bg-espresso animate-pulse"></span>
                                    <h2 className="text-[10px] md:text-xs font-black text-espresso/60 dark:text-white/60 uppercase tracking-[0.2em]">
                                        {t('chat.unread_messages') || 'Unread Messages'} ({unreadChats.length})
                                    </h2>
                                    <div className="flex-1 h-px bg-espresso/10"></div>
                                </div>
                                <div className="space-y-3 md:space-y-4">
                                    {unreadChats.map(renderChatItem)}
                                </div>
                            </div>
                        )}

                        {/* All Conversations Section */}
                        {readChats.length > 0 && (
                            <div>
                                {unreadChats.length > 0 && (
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="h-2 w-2 rounded-full bg-espresso/30"></span>
                                        <h2 className="text-[10px] md:text-xs font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.2em]">
                                            {t('chat.all_conversations') || 'All Conversations'}
                                        </h2>
                                        <div className="flex-1 h-px bg-espresso/10"></div>
                                    </div>
                                )}
                                <div className="space-y-3 md:space-y-4">
                                    {readChats.map(renderChatItem)}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
