import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { GradientButton } from '../../components/ui/GradientButton';

export function AdminSeekers() {
    const [seekers, setSeekers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Query users where role is 'job_seeker'
        const q = query(collection(db, 'users'), where('role', '==', 'job_seeker'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSeekers(users);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const togglePaymentStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
        try {
            const userRef = doc(db, 'users', id);
            await updateDoc(userRef, { paymentStatus: newStatus });
        } catch (error) {
            console.error("Error updating payment status:", error);
            alert("Failed to update status");
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="container mx-auto max-w-6xl">
            <h1 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-8">Manage Job Seekers</h1>

            <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-black/20 text-espresso/70 dark:text-white/70 font-bold uppercase tracking-wide">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Contact</th>
                            <th className="p-4">Gender</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4">Payment Status</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {seekers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-espresso/50 dark:text-white/50">
                                    No job seekers found.
                                </td>
                            </tr>
                        ) : (
                            seekers.map(seeker => (
                                <tr key={seeker.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold text-espresso dark:text-white">{seeker.name}</td>
                                    <td className="p-4 text-espresso/80 dark:text-white/80">
                                        <div className="flex flex-col">
                                            <span>{seeker.email}</span>
                                            <span className="text-xs text-opacity-50">{seeker.phone}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-espresso/80 dark:text-white/80">{seeker.gender}</td>
                                    <td className="p-4 text-espresso/80 dark:text-white/80">
                                        {seeker.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${seeker.paymentStatus === 'paid'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {seeker.paymentStatus || 'pending'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {seeker.paymentStatus === 'paid' ? (
                                            <button
                                                onClick={() => togglePaymentStatus(seeker.id, 'paid')}
                                                className="text-xs text-red-500 hover:underline"
                                            >
                                                Revoke Payment
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => togglePaymentStatus(seeker.id, 'pending')}
                                                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-bold text-white uppercase tracking-wider shadow-md hover:scale-105 hover:shadow-lg transition-all"
                                            >
                                                Approve
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
