import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export function InstructorChat() {
    const { user } = useAuth();
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchAssignedStudents();
            subscribeToChats();
        }
    }, [user]);

    const fetchAssignedStudents = async () => {
        try {
            const q = query(
                collection(db, 'users'),
                where('instructorId', '==', user.uid),
                where('role', '==', 'student')
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAssignedStudents(data);
        } catch (err) {
            console.error('Error fetching assigned students:', err);
        }
    };

    const subscribeToChats = () => {
        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setChats(chatData);
            setLoading(false);
        });

        return unsubscribe;
    };

    const getOtherParticipant = (chat) => {
        const otherId = chat.participants?.find(id => id !== user.uid);
        return assignedStudents.find(s => s.id === otherId);
    };

    // Filter chats to only show assigned students
    const filteredChats = chats
        .map(chat => ({
            ...chat,
            otherParticipant: getOtherParticipant(chat)
        }))
        .filter(chat => chat.otherParticipant) // Only show chats with assigned students
        .sort((a, b) => {
            const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
            const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
            return timeB - timeA;
        });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-serif font-bold text-espresso dark:text-white">Mentor Communications</h1>
                <p className="text-espresso/60 dark:text-white/60 font-medium mt-1">
                    Engage in strategic dialogue with your assigned cohort ({assignedStudents.length} student{assignedStudents.length !== 1 ? 's' : ''})
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></span>
                </div>
            ) : filteredChats.length === 0 ? (
                <div className="text-center py-20 bg-[#F5DEB3] dark:bg-white/5 rounded-3xl border border-espresso/10 shadow-xl relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    <span className="material-symbols-outlined text-6xl text-espresso/20 dark:text-white/20 mb-4 block group-hover:scale-110 transition-transform">chat_bubble</span>
                    <p className="text-espresso/40 dark:text-white/40 font-black uppercase tracking-widest text-sm">
                        {assignedStudents.length > 0 ? 'Silence in the lines. Start a strategic dialogue.' : 'No cohort members detected for communication.'}
                    </p>
                </div>
            ) : (
                <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl border border-espresso/10 shadow-xl overflow-hidden divide-y divide-espresso/5 dark:divide-white/5 relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    {filteredChats.map(chat => {
                        const otherUser = chat.otherParticipant;
                        const unreadCount = chat[`unreadCount_${user.uid}`] || 0;
                        const lastMessageTime = chat.lastMessageTime?.toDate?.();

                        return (
                            <Link
                                key={chat.id}
                                to={`/instructor/chat/${otherUser.id}`}
                                className="flex items-center gap-5 p-5 hover:bg-white/40 dark:hover:bg-white/5 transition-all relative z-10 group/item"
                            >
                                <div className="relative">
                                    <div
                                        className="bg-center bg-no-repeat bg-cover rounded-2xl h-14 w-14 border-2 border-white/50 dark:border-white/10 shadow-md group-hover/item:scale-105 transition-transform"
                                        style={{
                                            backgroundImage: `url("${otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name || 'S')}&background=random`}")`
                                        }}
                                    />
                                    {otherUser.status === 'active' && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-background-dark rounded-full shadow-sm"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h3 className="font-serif font-bold text-lg text-espresso dark:text-white truncate">
                                            {otherUser.name || otherUser.email}
                                        </h3>
                                        {lastMessageTime && (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-espresso/40 dark:text-white/40">
                                                {lastMessageTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-espresso/60 dark:text-white/60 truncate leading-relaxed">
                                            {chat.lastMessage || 'Channel established. Awaiting input.'}
                                        </p>
                                        {unreadCount > 0 && (
                                            <span className="ml-3 flex items-center justify-center min-w-[24px] h-6 px-2.5 bg-espresso text-white text-[10px] font-black rounded-full shadow-lg">
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            <div className="mt-12">
                <h2 className="text-[10px] font-black text-espresso/50 dark:text-white/50 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-espresso"></span>
                    Initiate Connection
                </h2>
                <div className="grid gap-4">
                    {assignedStudents
                        .filter(student => !chats.some(chat => chat.participants?.includes(student.id)))
                        .map(student => (
                            <Link
                                key={student.id}
                                to={`/instructor/chat/${student.id}`}
                                className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl p-5 shadow-xl border border-espresso/10 flex items-center gap-5 relative overflow-hidden group transition-all hover:-translate-y-1"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                <div
                                    className="bg-center bg-no-repeat bg-cover rounded-2xl h-14 w-14 border-2 border-white/50 dark:border-white/10 shadow-md group-hover:scale-105 transition-transform flex-shrink-0"
                                    style={{
                                        backgroundImage: `url("${student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'S')}&background=random`}")`
                                    }}
                                />
                                <div className="flex-1 min-w-0 relative z-10">
                                    <h3 className="font-serif font-bold text-lg text-espresso dark:text-white truncate mb-1">{student.name || student.email}</h3>
                                    <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest truncate">{student.email}</p>
                                </div>
                                <div className="p-3 rounded-full bg-white/50 dark:bg-white/5 text-espresso/40 group-hover:text-espresso transition-all shadow-sm">
                                    <span className="material-symbols-outlined text-xl">send</span>
                                </div>
                            </Link>
                        ))}
                </div>
            </div>
        </div>
    );
}
