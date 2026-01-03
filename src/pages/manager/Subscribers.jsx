import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function ManagerSubscribers() {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newEmail, setNewEmail] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'subscribers'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setSubscribers(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAddSubscriber = async (e) => {
        e.preventDefault();
        if (!newEmail) return;

        setIsAdding(true);
        try {
            await addDoc(collection(db, 'subscribers'), {
                email: newEmail,
                source: 'manual_manager',
                createdAt: serverTimestamp(),
                active: true
            });
            setNewEmail('');
        } catch (error) {
            console.error("Error adding subscriber:", error);
            alert("Failed to add subscriber");
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this subscriber?')) {
            try {
                await deleteDoc(doc(db, 'subscribers', id));
            } catch (error) {
                console.error("Error deleting subscriber:", error);
            }
        }
    };

    const handleCopyAll = () => {
        const emails = subscribers.map(s => s.email).join(', ');
        navigator.clipboard.writeText(emails);
        alert(`${subscribers.length} emails copied to clipboard!`);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-espresso dark:text-white font-serif">
                        Newsletter Subscribers
                    </h1>
                    <p className="text-espresso/60 dark:text-white/60">
                        Manage email marketing list
                    </p>
                </div>
                <button
                    onClick={handleCopyAll}
                    disabled={subscribers.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#F5DEB3] dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10 text-espresso dark:text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 border border-espresso/10 shadow-sm active:scale-95"
                >
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    Copy All Emails
                </button>
            </header>

            {/* Add New Subscriber Card */}
            <div className="bg-[#F5DEB3] dark:bg-[#1c1916] p-8 rounded-[2rem] border border-espresso/10 shadow-xl relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                <h3 className="text-[10px] font-black text-espresso/50 dark:text-white/50 mb-6 uppercase tracking-[0.2em] relative z-10">
                    Add New Subscriber
                </h3>
                <form onSubmit={handleAddSubscriber} className="flex gap-4 relative z-10">
                    <input
                        type="email"
                        required
                        placeholder="Enter email address"
                        className="flex-1 px-4 py-3 border border-espresso/10 rounded-xl bg-white/50 dark:bg-white/5 text-espresso dark:text-white placeholder:text-espresso/30 focus:outline-none focus:ring-2 focus:ring-espresso transition-all"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={isAdding}
                        className="px-8 py-3 bg-espresso hover:shadow-xl text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-70 flex items-center gap-2 active:scale-95"
                    >
                        {isAdding ? 'Adding...' : 'Add'}
                        <span className="material-symbols-outlined">person_add</span>
                    </button>
                </form>
            </div>

            {/* Subscribers List */}
            <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2rem] border border-espresso/10 shadow-xl overflow-hidden relative group">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/30 dark:bg-white/5 border-b border-espresso/10">
                            <tr>
                                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-espresso dark:text-white">Email Address</th>
                                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-espresso dark:text-white">Source</th>
                                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-espresso dark:text-white">Date Added</th>
                                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-espresso dark:text-white text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-espresso/10">
                            {subscribers.map((sub) => (
                                <tr key={sub.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-all group/row">
                                    <td className="px-6 py-4 font-bold text-espresso dark:text-white">
                                        {sub.email}
                                    </td>
                                    <td className="px-6 py-4 text-espresso/60 dark:text-white/60 capitalize">
                                        {sub.source?.replace('_', ' ') || 'Web'}
                                    </td>
                                    <td className="px-6 py-4 text-espresso/60 dark:text-white/60">
                                        {sub.createdAt?.seconds ? new Date(sub.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(sub.id)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                            title="Remove subscriber"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && subscribers.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-espresso/60 dark:text-white/60">
                                        No subscribers yet. Add one manually or wait for signups.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
