import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

export function ChatWindow() {
    const { recipientId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [recipient, setRecipient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const bottomRef = useRef(null);

    // Derived Chat ID (Alphabetical Sort)
    const chatId = [user.uid, recipientId].sort().join('_');

    // Fetch Recipient Details
    useEffect(() => {
        const fetchRecipient = async () => {
            const docSnap = await getDoc(doc(db, 'users', recipientId));
            if (docSnap.exists()) {
                setRecipient(docSnap.data());
            }
        };
        fetchRecipient();
    }, [recipientId]);

    // Real-time Messages
    useEffect(() => {
        const q = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('createdAt', 'asc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [chatId]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        try {
            await addDoc(collection(db, 'chats', chatId, 'messages'), {
                text: newMessage,
                senderId: user.uid,
                createdAt: serverTimestamp()
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (!recipient) return <div className="p-8 text-center">Loading chat...</div>;

    const recipientAvatar = recipient.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient.fullName || 'User')}&background=random`;

    return (
        <div className="bg-background-light dark:bg-[#1c1916] h-[calc(100vh-theme(spacing.16))] md:h-[calc(100vh-64px)] flex flex-col font-sans overflow-hidden">

            {/* Header */}
            <header className="flex-none bg-background-light dark:bg-[#1c1916] border-b border-[#E6DEC8] dark:border-white/10 px-4 py-3 shadow-sm z-10">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/student/chat')}
                        className="flex items-center justify-center text-espresso dark:text-white hover:text-primary transition-colors size-10 -ml-2 rounded-full active:bg-black/5 dark:active:bg-white/10"
                    >
                        <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                    </button>
                    <div className="flex flex-1 items-center gap-3 ml-1">
                        <div className="relative">
                            <img src={recipientAvatar} alt="" className="bg-center bg-no-repeat bg-cover rounded-full size-10 border border-[#E6DEC8] object-cover" />
                            <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-background-light rounded-full"></div>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-espresso dark:text-white text-lg font-serif font-bold leading-tight">{recipient.fullName}</h2>
                            <span className="text-[#837363] text-xs font-normal">Active now</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF5E8] dark:bg-[#1c1916] scroll-smooth">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-10">Start a conversation with {recipient.fullName.split(' ')[0]}!</div>
                )}

                {messages.map(msg => {
                    const isMe = msg.senderId === user.uid;
                    return (
                        <div key={msg.id} className={`flex items-end gap-2 group ${isMe ? 'justify-end' : ''}`}>
                            {!isMe && (
                                <img src={recipientAvatar} className="rounded-full size-8 shrink-0 mb-1 shadow-sm object-cover" alt="" />
                            )}

                            <div className={`flex flex-col gap-1 max-w-[80%] ${isMe ? 'items-end' : ''}`}>
                                <div className={`p-3 rounded-2xl shadow-sm ${isMe
                                    ? 'bg-primary text-white bubble-sent rounded-br-none'
                                    : 'bg-white dark:bg-[#2c2825] text-espresso dark:text-gray-100 bubble-received border border-[#E6DEC8] dark:border-transparent rounded-bl-none'
                                    }`}>
                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                <span className="text-[#837363] text-[10px] ml-1">
                                    {msg.createdAt?.seconds ? format(msg.createdAt.toDate(), 'h:mm a') : '...'}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </main>

            {/* Input Area */}
            <footer className="flex-none p-3 pb-6 bg-background-light dark:bg-[#1c1916] border-t border-[#E6DEC8] dark:border-white/10">
                <div className="flex items-end gap-2 w-full px-4">
                    <div className="flex-1 bg-white dark:bg-[#2c2825] rounded-2xl border border-[#E6DEC8] dark:border-transparent shadow-sm flex items-center px-4 py-2 min-h-[44px]">
                        <input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSend();
                            }}
                            className="w-full bg-transparent border-none p-0 text-espresso dark:text-white placeholder:text-[#837363]/60 focus:ring-0 text-[15px] font-medium font-display leading-normal outline-none"
                            placeholder="Type a message..."
                            type="text"
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        className="flex items-center justify-center size-10 rounded-full bg-primary hover:bg-primary/90 text-white transition-colors shrink-0 shadow-md shadow-primary/30"
                    >
                        <span className="material-symbols-outlined text-[20px] ml-0.5">send</span>
                    </button>
                </div>
            </footer>
        </div>
    );
}
