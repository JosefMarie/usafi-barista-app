import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function ManagerMessages() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleReply = (msg) => {
        // Mark as replied when opening mail client
        try {
            updateDoc(doc(db, 'contact_messages', msg.id), { status: 'replied' });
        } catch (e) {
            console.error("Error updating status:", e);
        }

        const subject = encodeURIComponent(`Re: ${msg.subject || 'Inquiry'} - Usafi Barista`);
        const body = encodeURIComponent(`Hi ${msg.firstName},\n\nThank you for reaching out to us regarding "${msg.subject}".\n\n\n\nBest regards,\nUsafi Barista Team`);
        window.location.href = `mailto:${msg.email}?subject=${subject}&body=${body}`;
    };

    const toggleStatus = async (e, msg) => {
        e.stopPropagation();
        const newStatus = msg.status === 'replied' ? 'new' : 'replied';
        try {
            await updateDoc(doc(db, 'contact_messages', msg.id), { status: newStatus });
        } catch (error) {
            console.error("Error triggering status:", error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <header>
                <h1 className="text-2xl font-bold text-espresso dark:text-white font-serif">
                    Inbox
                </h1>
                <p className="text-espresso/60 dark:text-white/60">
                    View and reply to contact form inquiries
                </p>
            </header>

            <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
                {/* Message List */}
                <div className="w-1/3 bg-white dark:bg-[#1e1e1e] rounded-xl border border-black/5 dark:border-white/5 flex flex-col overflow-hidden">
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-8 text-center text-espresso/60">Loading messages...</div>
                        ) : messages.length === 0 ? (
                            <div className="p-8 text-center text-espresso/60">No messages found.</div>
                        ) : (
                            <div className="divide-y divide-black/5 dark:divide-white/5">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        onClick={() => setSelectedMessage(msg)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${selectedMessage?.id === msg.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm font-bold ${msg.status === 'new' ? 'text-espresso dark:text-white' : 'text-espresso/60 dark:text-white/60'}`}>
                                                {msg.firstName} {msg.lastName}
                                            </h4>
                                            <span className="text-xs text-espresso/40">
                                                {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleDateString() : 'Now'}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-espresso/80 dark:text-white/80 truncate mb-1">
                                            {msg.subject || 'No Subject'}
                                        </p>
                                        <p className="text-xs text-espresso/50 dark:text-white/50 truncate">
                                            {msg.message}
                                        </p>
                                        {msg.status === 'new' && (
                                            <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                                                NEW
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Message Detail */}
                <div className="flex-1 bg-white dark:bg-[#1e1e1e] rounded-xl border border-black/5 dark:border-white/5 p-8 flex flex-col overflow-y-auto">
                    {selectedMessage ? (
                        <>
                            <div className="flex justify-between items-start mb-8 border-b border-black/5 dark:border-white/5 pb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-espresso dark:text-white mb-2">
                                        {selectedMessage.subject || 'No Subject'}
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                                            {selectedMessage.firstName[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-espresso dark:text-white">
                                                {selectedMessage.firstName} {selectedMessage.lastName}
                                            </p>
                                            <p className="text-sm text-espresso/60 dark:text-white/60">
                                                {selectedMessage.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => toggleStatus(e, selectedMessage)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${selectedMessage.status === 'replied'
                                                ? 'bg-gray-100 text-gray-600 border-gray-200'
                                                : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                                            }`}
                                    >
                                        {selectedMessage.status === 'replied' ? 'Mark Unread' : 'Mark Replied'}
                                    </button>
                                    <button
                                        onClick={() => handleReply(selectedMessage)}
                                        className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">reply</span>
                                        Reply
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 text-espresso/80 dark:text-white/80 leading-relaxed whitespace-pre-wrap">
                                {selectedMessage.message}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-espresso/40 dark:text-white/40">
                            <span className="material-symbols-outlined text-6xl mb-4">mail</span>
                            <p className="text-lg">Select a message to read</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
