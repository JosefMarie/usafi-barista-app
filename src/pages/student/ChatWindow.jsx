import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export function ChatWindow() {
    const { t } = useTranslation();
    const { recipientId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [recipient, setRecipient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null); // Renamed from bottomRef

    // Derived Chat ID (Alphabetical Sort)
    const chatId = [user.uid, recipientId].sort().join('_');

    // Real-time Messages and Recipient Details
    useEffect(() => {
        if (!recipientId) return;

        // Fetch recipient info from users collection
        const unsubscribeRecipient = onSnapshot(doc(db, 'users', recipientId), (docSnap) => {
            if (docSnap.exists()) {
                setRecipient(docSnap.data());
            }
        });

        // Fetch messages
        const q = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Reset unread count when opening chat
        updateDoc(doc(db, 'chats', chatId), {
            [`unreadCount_${user.uid}`]: 0
        }).catch(() => { });

        return () => {
            unsubscribeRecipient();
            unsubscribeMessages();
        };
    }, [chatId, recipientId, user.uid]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => { // Renamed from handleSend
        e.preventDefault(); // Added to prevent default form submission
        if (!newMessage.trim()) return;

        const messageData = {
            text: newMessage,
            senderId: user.uid,
            createdAt: serverTimestamp()
        };

        setNewMessage(''); // Clear input immediately

        try {
            // 1. Add message to subcollection
            await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

            // 2. Update chat metadata
            await setDoc(doc(db, 'chats', chatId), {
                lastMessage: messageData.text,
                lastMessageTime: serverTimestamp(),
                participants: [user.uid, recipientId],
                [`unreadCount_${recipientId}`]: increment(1)
            }, { merge: true });

        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (!recipient) return null; // Changed from loading div to null

    const recipientAvatar = recipient.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient.fullName || recipient.name || 'User')}&background=random`;

    return (
        <div className="bg-[#FAF5E8] dark:bg-[#1c1916] h-[calc(100vh-theme(spacing.16))] md:h-[calc(100vh-80px)] flex flex-col font-sans overflow-hidden">

            {/* Header */}
            <header className="flex-none bg-[#F5DEB3]/90 dark:bg-[#1c1916]/90 backdrop-blur-md border-b border-espresso/10 px-4 md:px-8 py-3 md:py-4 shadow-sm z-10 transition-colors">
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={() => navigate('/student/chat')}
                        className="flex items-center justify-center text-espresso dark:text-white hover:bg-white/40 size-10 md:size-12 rounded-xl md:rounded-2xl active:scale-95 transition-all shrink-0"
                    >
                        <span className="material-symbols-outlined text-[20px] md:text-[24px]">arrow_back_ios_new</span>
                    </button>
                    <div className="flex flex-1 items-center gap-3 md:gap-4 min-w-0">
                        <div className="relative shrink-0">
                            <img src={recipientAvatar} alt="" className="size-10 md:size-14 rounded-full border-2 border-espresso/10 object-cover shadow-md" />
                            <div className="absolute bottom-0 right-0 size-3 md:size-4 bg-green-500 border-2 border-[#F5DEB3] dark:border-[#1c1916] rounded-full shadow-sm animate-pulse"></div>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h2 className="text-espresso dark:text-white text-base md:text-xl font-serif font-black leading-tight truncate">{recipient.fullName || recipient.name || recipient.email}</h2>
                            <span className="text-espresso/40 dark:text-white/40 text-[9px] md:text-[10px] font-black uppercase tracking-widest">{t('chat.active_now')}</span>
                        </div>
                    </div>
                    <div className="w-10 md:w-12 shrink-0"></div> {/* Spacer for balance */}
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 bg-[#FAF5E8] dark:bg-[#1c1916] scroll-smooth scrollbar-hide">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                        <span className="material-symbols-outlined text-6xl md:text-8xl mb-4 text-espresso/20">chat_bubble</span>
                        <p className="text-center text-espresso font-serif italic text-sm md:text-lg px-10">
                            {t('chat.start_convo', { name: (recipient.fullName || recipient.name || recipient.email).split(' ')[0] })}
                        </p>
                    </div>
                )}

                {messages.map(msg => {
                    const isMe = msg.senderId === user.uid;
                    return (
                        <div key={msg.id} className={`flex items-end gap-2 md:gap-4 group animate-fade-in ${isMe ? 'justify-end' : ''}`}>
                            {!isMe && (
                                <img src={recipientAvatar} className="rounded-full size-8 md:size-10 shrink-0 mb-1 shadow-md object-cover border border-espresso/5" alt="" />
                            )}

                            <div className={`flex flex-col gap-1.5 md:gap-2 max-w-[85%] md:max-w-[75%] ${isMe ? 'items-end' : ''}`}>
                                <div className={`px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl shadow-sm md:shadow-md transition-all ${isMe
                                    ? 'bg-espresso text-white rounded-br-none'
                                    : 'bg-white dark:bg-[#2c2825] text-espresso dark:text-gray-100 border border-espresso/5 dark:border-white/5 rounded-bl-none'
                                    }`}>
                                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                                </div>
                                <span className="text-espresso/30 dark:text-white/30 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-1">
                                    {msg.createdAt?.seconds ? format(msg.createdAt.toDate(), 'h:mm a') : '...'}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <footer className="flex-none p-4 md:p-6 pb-8 md:pb-10 bg-[#F5DEB3]/90 dark:bg-[#1c1916]/90 backdrop-blur-md border-t border-espresso/10">
                <div className="max-w-4xl mx-auto flex items-end gap-3 md:gap-4 px-2 md:px-4">
                    <div className="flex-1 bg-white/60 dark:bg-[#2c2825] rounded-2xl md:rounded-3xl border border-espresso/10 dark:border-white/5 shadow-inner flex items-center px-4 md:px-6 py-2 md:py-3 min-h-[48px] md:min-h-[56px] focus-within:border-espresso/30 transition-all">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            rows="1"
                            className="w-full bg-transparent border-none p-0 text-espresso dark:text-white placeholder:text-espresso/30 dark:placeholder:text-white/20 focus:ring-0 text-sm md:text-base font-bold leading-relaxed outline-none resize-none overflow-hidden"
                            placeholder={t('chat.type_placeholder') || "Type a message..."}
                        />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="flex items-center justify-center size-12 md:size-14 rounded-2xl md:rounded-3xl bg-espresso text-white hover:shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all shrink-0 shadow-lg disabled:opacity-20 disabled:grayscale"
                    >
                        <span className="material-symbols-outlined text-[20px] md:text-[24px]">send</span>
                    </button>
                </div>
            </footer>
        </div>
    );
}
