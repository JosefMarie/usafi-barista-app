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
                    <h1 className="text-2xl font-bold text-espresso dark:text-white font-serif">
                        Newsletter Subscribers
                    </h1>
                    <p className="text-espresso/60 dark:text-white/60">
                        Manage email marketing list
                    </p>
                </div>
                <button
                    onClick={handleCopyAll}
                    disabled={subscribers.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-espresso dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-lg">content_copy</span>
                    Copy All Emails
                </button>
            </header>

            {/* Add New Subscriber Card */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
                <h3 className="text-sm font-bold text-espresso dark:text-white mb-4 uppercase tracking-wider">
                    Add New Subscriber
                </h3>
                <form onSubmit={handleAddSubscriber} className="flex gap-4">
                    <input
                        type="email"
                        required
                        placeholder="Enter email address"
                        className="flex-1 px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={isAdding}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors disabled:opacity-70 flex items-center gap-2"
                    >
                        {isAdding ? 'Adding...' : 'Add'}
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </form>
            </div>

            {/* Subscribers List */}
            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-black/5 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-4 font-bold text-espresso dark:text-white">Email Address</th>
                                <th className="px-6 py-4 font-bold text-espresso dark:text-white">Source</th>
                                <th className="px-6 py-4 font-bold text-espresso dark:text-white">Date Added</th>
                                <th className="px-6 py-4 font-bold text-espresso dark:text-white text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {subscribers.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-espresso dark:text-white">
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
