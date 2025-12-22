import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Query users where role is 'student'
        const q = query(
            collection(db, 'users'),
            where('role', '==', 'student')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const studentsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setStudents(studentsList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (e, studentId) => {
        e.preventDefault(); // Prevent Link navigation
        try {
            await updateDoc(doc(db, 'users', studentId), {
                status: 'active'
            });
            // Toast or notification could go here
        } catch (error) {
            console.error("Error approving student:", error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-espresso dark:text-white">Loading students...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-espresso dark:text-white text-2xl font-serif font-bold leading-tight tracking-tight">Students</h2>
                <div className="flex gap-2">
                    <button className="flex items-center justify-center rounded-full bg-white dark:bg-[#2c2825] border border-black/5 w-10 h-10 shadow-sm text-primary">
                        <span className="material-symbols-outlined">filter_list</span>
                    </button>
                    <button className="flex items-center justify-center rounded-full bg-primary text-white w-10 h-10 shadow-sm hover:bg-primary/90 transition-colors">
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex w-full items-stretch rounded-xl h-12 shadow-sm bg-white dark:bg-[#2c2825] border border-black/5">
                <div className="text-primary/60 flex items-center justify-center pl-4 rounded-l-xl">
                    <span className="material-symbols-outlined">search</span>
                </div>
                <input
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl bg-transparent text-espresso dark:text-white focus:outline-0 focus:ring-0 border-none h-full placeholder:text-espresso/50 dark:placeholder:text-white/50 px-3 text-base"
                    placeholder="Search students..."
                />
            </div>

            {/* Pending Approvals Notification */}
            {students.filter(s => s.status === 'pending').length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 mb-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold">
                            <span className="material-symbols-outlined">notifications_active</span>
                            <h3>{students.filter(s => s.status === 'pending').length} New Enrollment(s) Pending Approval</h3>
                        </div>
                    </div>
                    <div className="grid gap-3">
                        {students.filter(s => s.status === 'pending').map(student => (
                            <div key={student.id} className="bg-white dark:bg-[#1e1e1e] p-3 rounded-lg flex items-center justify-between shadow-sm">
                                <Link to={`/admin/students/${student.id}`} className="flex items-center gap-3 hover:opacity-75 transition-opacity">
                                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                                        <img src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName || 'Student')}&background=random`} alt="" className="h-full w-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-espresso dark:text-white">{student.fullName}</p>
                                        <p className="text-xs text-espresso/60 dark:text-white/60">
                                            {student.studyMethod === 'online' ? 'Online • Start: ' + student.startDate : 'Onsite • ' + (student.shift || 'No Shift')}
                                        </p>
                                    </div>
                                </Link>
                                <button
                                    onClick={(e) => handleApprove(e, student.id)}
                                    className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                                >
                                    Approve & Activate
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4">
                {students.length === 0 ? (
                    <div className="text-center py-12 text-espresso/50 dark:text-white/50 bg-white dark:bg-[#2c2825] rounded-xl border border-dashed border-espresso/10">
                        No students found.
                    </div>
                ) : (
                    students.map(student => (
                        <Link to={`/admin/students/${student.id}`} key={student.id} className="bg-white dark:bg-[#2c2825] p-4 rounded-xl shadow-sm border border-primary/5 flex items-center justify-between hover:border-primary/30 transition-colors group">
                            <div className="flex items-center gap-4">
                                <img
                                    src={student.avatar || `https://ui-avatars.com/api/?name=${student.fullName}&background=random`}
                                    alt={student.fullName}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <div>
                                    <h3 className="font-bold text-espresso dark:text-white group-hover:text-primary transition-colors">
                                        {student.fullName}
                                    </h3>
                                    <p className="text-xs text-espresso/60 dark:text-white/60">
                                        {student.email} • {student.phone}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${student.status === 'active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {student.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-espresso/50 dark:text-white/50 capitalize">{student.course}</span>

                                    {/* Quick Approve Action for Pending Students */}
                                    {student.status === 'pending' && (
                                        <button
                                            onClick={(e) => handleApprove(e, student.id)}
                                            className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary/90 transition-colors z-10"
                                            title="Activate Account"
                                        >
                                            Approve
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
