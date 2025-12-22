import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export function StudentChatList() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                // Fetch active students (excluding self)
                const q = query(
                    collection(db, 'users'),
                    where('role', '==', 'student'),
                    where('status', '==', 'active')
                );

                const snapshot = await getDocs(q);
                const list = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(s => s.id !== user.uid); // Exclude self

                setStudents(list);
            } catch (error) {
                console.error("Error fetching students:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchStudents();
    }, [user]);

    // Fetch Access to Unread Counts
    useEffect(() => {
        if (!user) return;

        // Query all chats where current user is a participant
        // Note: Firestore array-contains check
        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const counts = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                // Determine OTHER USER ID from participants
                // We need to map chatId -> unreadCount, but better map otherUserId -> unreadCount
                // The chatId is sorted(uid1_uid2), so we can revert or just use the field participants
                const otherUserId = data.participants.find(p => p !== user.uid);
                if (otherUserId) {
                    counts[otherUserId] = data[`unreadCount_${user.uid}`] || 0;
                }
            });
            setUnreadCounts(counts);
        });

        return () => unsubscribe();
    }, [user]);


    if (loading) return <div className="p-8 text-center">Loading classmates...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-espresso dark:text-white text-2xl font-serif font-bold">Classmates Chat</h2>

            <div className="grid gap-3">
                {students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No other active students found to chat with.
                    </div>
                ) : (
                    students.map(student => (
                        <Link
                            to={`/student/chat/${student.id}`}
                            key={student.id}
                            className="flex items-center gap-4 p-4 bg-white dark:bg-[#1c1916] rounded-xl shadow-sm border border-primary/10 hover:border-primary/50 transition-all group"
                        >
                            <div className="relative">
                                <img
                                    src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName || 'User')}&background=random`}
                                    alt={student.fullName}
                                    className="w-12 h-12 rounded-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#1c1916] rounded-full"></div>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-espresso dark:text-white">{student.fullName}</h3>
                                    {unreadCounts[student.id] > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                            {unreadCounts[student.id]} New
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-espresso/60 dark:text-white/60 truncate">{student.email}</p>
                            </div>
                            <button className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors">
                                <span className="material-symbols-outlined">chat</span>
                            </button>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
