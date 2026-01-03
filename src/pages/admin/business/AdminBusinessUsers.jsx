import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { cn } from '../../../lib/utils';


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
        <div className="w-full px-4">
            <h1 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-8">Manage Business Class Students</h1>

            <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2rem] shadow-lg border border-espresso/10 overflow-hidden relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/30"></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-espresso text-white dark:bg-black/40 font-bold uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="p-5 border-b border-white/10">Name</th>
                                <th className="p-5 border-b border-white/10">Email</th>
                                <th className="p-5 border-b border-white/10">Phone</th>
                                <th className="p-5 border-b border-white/10">Joined</th>
                                <th className="p-5 border-b border-white/10">Status</th>
                                <th className="p-5 border-b border-white/10 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-espresso/5 dark:divide-white/5">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-espresso/50 dark:text-white/50 italic font-medium">
                                        No business students found in the system.
                                    </td>
                                </tr>
                            ) : (
                                students.map(student => (
                                    <tr key={student.id} className="hover:bg-white/20 dark:hover:bg-white/5 transition-all group border-b border-espresso/5 dark:border-white/5 last:border-none">
                                        <td className="p-5 font-bold text-espresso dark:text-white text-base">{student.name}</td>
                                        <td className="p-5 font-bold text-espresso/90 dark:text-white/90">{student.email}</td>
                                        <td className="p-5 text-[10px] font-black text-espresso/50 dark:text-white/50 uppercase tracking-widest">{student.phone || '-'}</td>
                                        <td className="p-5 font-bold text-espresso/70 dark:text-white/60">
                                            {student.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                                        </td>
                                        <td className="p-5">
                                            <span className={cn(
                                                "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-white/10",
                                                student.approved
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-amber-500 text-white'
                                            )}>
                                                {student.approved ? 'Approved' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button
                                                onClick={() => toggleApproval(student.id, student.approved)}
                                                className={cn(
                                                    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95",
                                                    student.approved
                                                        ? 'bg-white/40 text-red-600 border border-red-200 hover:bg-red-50'
                                                        : 'bg-espresso text-white hover:shadow-xl hover:-translate-y-0.5'
                                                )}
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
        </div>
    );
}

