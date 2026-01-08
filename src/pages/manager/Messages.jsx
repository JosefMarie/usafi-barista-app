import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function ManagerMessages() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showMobileDetail, setShowMobileDetail] = useState(false);

    useEffect(() => {
        // Debugging: Removing orderBy to check if it's an index issue
        const q = query(collection(db, 'contact_messages'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log("Fetched messages count:", snapshot.docs.length);
            setMessages(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
            setLoading(false);
        }, (err) => {
            console.error("Error fetching messages:", err);
            setError(err.message);
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
        <div className="max-w-7xl mx-auto space-y-6 h-[calc(100vh-100px)] flex flex-col px-4 md:px-0 py-4 md:py-0">
            <header className="relative pl-4 md:pl-0">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 -ml-4 md:hidden"></div>
                <h1 className="text-2xl md:text-3xl font-black text-espresso dark:text-white font-serif leading-none">
                    Inbox
                </h1>
                <p className="text-xs md:text-sm text-espresso/60 dark:text-white/60 mt-2 leading-relaxed">
                    View and reply to contact form inquiries
                </p>
            </header>

            {/* Desktop: Side-by-side layout */}
            <div className="hidden md:flex flex-1 gap-6 overflow-hidden min-h-0 relative">
                {/* Message List */}
                <div className="w-1/3 bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2rem] border border-espresso/10 flex flex-col overflow-hidden shadow-xl relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    <div className="overflow-y-auto flex-1 relative z-10">
                        {loading && <div className="p-8 text-center text-espresso/60">Loading messages...</div>}
                        {error && (
                            <div className="p-4 bg-red-50 text-red-700 text-sm m-4 rounded-lg">
                                <strong>Error:</strong> {error}
                            </div>
                        )}
                        {!loading && !error && messages.length === 0 && (
                            <div className="p-8 text-center text-espresso/60">No messages found.</div>
                        )}
                        {!loading && !error && messages.length > 0 && (
                            <div className="divide-y divide-black/5 dark:divide-white/5">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        onClick={() => setSelectedMessage(msg)}
                                        className={`p-5 cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 transition-all border-b border-espresso/5 ${selectedMessage?.id === msg.id ? 'bg-white/60 dark:bg-white/10' : ''}`}
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
                                            <span className="inline-block mt-2 px-3 py-1 bg-espresso text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm">
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
                <div className="flex-1 bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2rem] border border-espresso/10 p-10 flex flex-col overflow-y-auto shadow-2xl relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    {selectedMessage ? (
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-10 border-b border-espresso/10 pb-8">
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
                                        className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${selectedMessage.status === 'replied'
                                            ? 'bg-white/40 text-espresso/60 border-espresso/10'
                                            : 'bg-white text-espresso border-espresso/20 hover:shadow-lg'
                                            }`}
                                    >
                                        {selectedMessage.status === 'replied' ? 'Unread' : 'Replied'}
                                    </button>
                                    <button
                                        onClick={() => handleReply(selectedMessage)}
                                        className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-espresso text-white hover:shadow-xl transition-all flex items-center gap-2 active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">reply</span>
                                        Reply
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 text-espresso/80 dark:text-white/80 leading-relaxed whitespace-pre-wrap">
                                {selectedMessage.message}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-espresso/40 dark:text-white/40">
                            <span className="material-symbols-outlined text-6xl mb-4">email</span>
                            <p className="text-lg">Select a message to read</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile: Toggle between list and detail */}
            <div className="md:hidden flex-1 overflow-hidden relative">
                {!showMobileDetail ? (
                    <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2rem] border border-espresso/10 h-full flex flex-col overflow-hidden shadow-xl relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                        <div className="overflow-y-auto flex-1 relative z-10">
                            {loading && <div className="p-6 text-center text-espresso/60 text-sm">Loading messages...</div>}
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-xs m-4 rounded-lg">
                                    <strong>Error:</strong> {error}
                                </div>
                            )}
                            {!loading && !error && messages.length === 0 && (
                                <div className="p-6 text-center text-espresso/60 text-sm">No messages found.</div>
                            )}
                            {!loading && !error && messages.length > 0 && (
                                <div className="divide-y divide-espresso/5">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            onClick={() => {
                                                setSelectedMessage(msg);
                                                setShowMobileDetail(true);
                                            }}
                                            className="p-4 cursor-pointer active:bg-white/40 dark:active:bg-white/5 transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm font-black ${msg.status === 'new' ? 'text-espresso dark:text-white' : 'text-espresso/60 dark:text-white/60'} leading-none`}>
                                                    {msg.firstName} {msg.lastName}
                                                </h4>
                                                <span className="text-[10px] text-espresso/40">
                                                    {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Now'}
                                                </span>
                                            </div>
                                            <p className="text-xs font-medium text-espresso/80 dark:text-white/80 truncate mb-1 mt-1.5">
                                                {msg.subject || 'No Subject'}
                                            </p>
                                            <p className="text-xs text-espresso/50 dark:text-white/50 line-clamp-2 leading-relaxed">
                                                {msg.message}
                                            </p>
                                            {msg.status === 'new' && (
                                                <span className="inline-block mt-2 px-2.5 py-0.5 bg-espresso text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm">
                                                    NEW
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2rem] border border-espresso/10 p-5 h-full flex flex-col overflow-y-auto shadow-2xl relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                        {selectedMessage && (
                            <div className="relative z-10 space-y-4">
                                <button
                                    onClick={() => setShowMobileDetail(false)}
                                    className="flex items-center gap-2 text-espresso/60 dark:text-white/60 hover:text-espresso dark:hover:text-white transition-colors mb-3"
                                >
                                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                                    <span className="text-xs font-black uppercase tracking-widest">Back</span>
                                </button>
                                <div className="border-b border-espresso/10 pb-5">
                                    <h2 className="text-lg font-black text-espresso dark:text-white mb-3 leading-none">
                                        {selectedMessage.subject || 'No Subject'}
                                    </h2>
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs">
                                            {selectedMessage.firstName[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm text-espresso dark:text-white leading-none">
                                                {selectedMessage.firstName} {selectedMessage.lastName}
                                            </p>
                                            <p className="text-xs text-espresso/60 dark:text-white/60 mt-1">
                                                {selectedMessage.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={(e) => toggleStatus(e, selectedMessage)}
                                        className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedMessage.status === 'replied'
                                            ? 'bg-white/40 text-espresso/60 border-espresso/10'
                                            : 'bg-white text-espresso border-espresso/20'
                                            }`}
                                    >
                                        {selectedMessage.status === 'replied' ? 'Mark Unread' : 'Mark Replied'}
                                    </button>
                                    <button
                                        onClick={() => handleReply(selectedMessage)}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-espresso text-white transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">reply</span>
                                        Reply
                                    </button>
                                </div>
                                <div className="flex-1 text-sm text-espresso/80 dark:text-white/80 leading-relaxed whitespace-pre-wrap pt-3">
                                    {selectedMessage.message}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
