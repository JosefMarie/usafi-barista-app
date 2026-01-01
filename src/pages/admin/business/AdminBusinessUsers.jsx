import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export function AdminBusinessUsers() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'users'), where('role', '==', 'business_student'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setStudents(users);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const toggleApproval = async (id, currentStatus) => {
        try {
            const userRef = doc(db, 'users', id);
            await updateDoc(userRef, { approved: !currentStatus });
        } catch (error) {
            console.error("Error updating approval status:", error);
            alert("Failed to update status");
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="container mx-auto max-w-6xl">
            <h1 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-8">Manage Business Class Students</h1>

            <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-black/20 text-espresso/70 dark:text-white/70 font-bold uppercase tracking-wide">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Phone</th>
                            <th className="p-4">Business Joined</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-espresso/50 dark:text-white/50">
                                    No business students found.
                                </td>
                            </tr>
                        ) : (
                            students.map(student => (
                                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold text-espresso dark:text-white">{student.name}</td>
                                    <td className="p-4 text-espresso/80 dark:text-white/80">{student.email}</td>
                                    <td className="p-4 text-espresso/80 dark:text-white/80">{student.phone || '-'}</td>
                                    <td className="p-4 text-espresso/80 dark:text-white/80">
                                        {student.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${student.approved
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {student.approved ? 'Approved' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => toggleApproval(student.id, student.approved)}
                                            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-bold text-white uppercase tracking-wider shadow-md transition-all hover:scale-105 ${student.approved
                                                    ? 'bg-red-500 hover:bg-red-600'
                                                    : 'bg-green-500 hover:bg-green-600'
                                                }`}
                                        >
                                            {student.approved ? 'Revoke Access' : 'Approve Access'}
                                        </button>
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
