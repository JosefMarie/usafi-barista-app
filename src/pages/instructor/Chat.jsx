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
                <h1 className="text-2xl font-serif font-bold text-espresso dark:text-white">Chat with Students</h1>
                <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">
                    Message your assigned students ({assignedStudents.length} student{assignedStudents.length !== 1 ? 's' : ''})
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></span>
                </div>
            ) : filteredChats.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-[#2c2825] rounded-xl border border-black/5">
                    <span className="material-symbols-outlined text-5xl text-espresso/30 dark:text-white/30 mb-3 block">chat</span>
                    <p className="text-espresso/60 dark:text-white/60">
                        No conversations yet. Start chatting with your assigned students!
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#2c2825] rounded-xl border border-black/5 divide-y divide-black/5 dark:divide-white/5">
                    {filteredChats.map(chat => {
                        const otherUser = chat.otherParticipant;
                        const unreadCount = chat[`unreadCount_${user.uid}`] || 0;
                        const lastMessageTime = chat.lastMessageTime?.toDate?.();

                        return (
                            <Link
                                key={chat.id}
                                to={`/instructor/chat/${otherUser.id}`}
                                className="flex items-center gap-4 p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            >
                                <div className="relative">
                                    <div
                                        className="bg-center bg-no-repeat bg-cover rounded-full h-12 w-12 border-2 border-background-light shadow-sm"
                                        style={{
                                            backgroundImage: `url("${otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name || 'S')}&background=random`}")`
                                        }}
                                    />
                                    {otherUser.status === 'active' && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-espresso dark:text-white truncate">
                                            {otherUser.name || otherUser.email}
                                        </h3>
                                        {lastMessageTime && (
                                            <span className="text-xs text-espresso/50 dark:text-white/50">
                                                {lastMessageTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-espresso/60 dark:text-white/60 truncate">
                                            {chat.lastMessage || 'No messages yet'}
                                        </p>
                                        {unreadCount > 0 && (
                                            <span className="ml-2 flex items-center justify-center min-w-[20px] h-5 px-2 bg-primary text-white text-xs font-bold rounded-full">
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

            {/* Show list of assigned students to start new chats */}
            {assignedStudents.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-bold text-espresso dark:text-white mb-4">Start New Chat</h2>
                    <div className="grid gap-3">
                        {assignedStudents
                            .filter(student => !chats.some(chat => chat.participants?.includes(student.id)))
                            .map(student => (
                                <Link
                                    key={student.id}
                                    to={`/instructor/chat/${student.id}`}
                                    className="flex items-center gap-4 p-4 bg-white dark:bg-[#2c2825] rounded-xl border border-black/5 hover:shadow-md transition-shadow"
                                >
                                    <div
                                        className="bg-center bg-no-repeat bg-cover rounded-full h-12 w-12 border-2 border-background-light shadow-sm"
                                        style={{
                                            backgroundImage: `url("${student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'S')}&background=random`}")`
                                        }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-espresso dark:text-white truncate">{student.name || student.email}</h3>
                                        <p className="text-sm text-espresso/60 dark:text-white/60 truncate">{student.email}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-primary">arrow_forward</span>
                                </Link>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
