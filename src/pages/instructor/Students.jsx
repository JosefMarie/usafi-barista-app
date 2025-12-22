import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export function InstructorStudents() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user) fetchStudents();
    }, [user]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Fetch students assigned to this instructor
            const q = query(
                collection(db, 'users'),
                where('instructorId', '==', user.uid),
                where('role', '==', 'student')
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setStudents(data);
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-serif font-bold text-espresso dark:text-white">My Students</h1>
                <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">Students assigned to you</p>
            </div>

            {/* Search */}
            <div className="flex gap-3">
                <div className="flex w-full flex-1 items-stretch rounded-xl h-12 shadow-sm bg-white dark:bg-[#2c2825] border border-black/5">
                    <div className="text-primary/60 flex items-center justify-center pl-4">
                        <span className="material-symbols-outlined">search</span>
                    </div>
                    <input
                        className="flex w-full min-w-0 flex-1 bg-transparent text-espresso dark:text-white focus:outline-0 border-none h-full placeholder:text-espresso/50 dark:placeholder:text-white/50 px-3 text-base"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></span>
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-[#2c2825] rounded-xl border border-black/5">
                    <span className="material-symbols-outlined text-5xl text-espresso/30 dark:text-white/30 mb-3 block">people</span>
                    <p className="text-espresso/60 dark:text-white/60">
                        {searchTerm ? 'No students match your search.' : 'No students assigned to you yet.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredStudents.map(student => (
                        <div key={student.id} className="bg-white dark:bg-[#2c2825] rounded-xl p-4 shadow-sm border border-black/5">
                            <div className="flex items-center gap-4">
                                <div
                                    className="bg-center bg-no-repeat bg-cover rounded-full h-14 w-14 border-2 border-background-light shadow-sm flex-shrink-0"
                                    style={{
                                        backgroundImage: `url("${student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'S')}&background=random`}")`
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-espresso dark:text-white truncate">
                                        {student.name || student.email}
                                    </h3>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 truncate">{student.email}</p>
                                    {student.studyMethod && (
                                        <span className="inline-flex items-center mt-2 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                                            {student.studyMethod === 'online' ? 'Online' : 'Onsite'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {student.status === 'active' && (
                                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
