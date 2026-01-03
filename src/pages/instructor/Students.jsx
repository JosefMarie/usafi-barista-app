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
                <h1 className="text-3xl font-serif font-bold text-espresso dark:text-white">Student Cohort</h1>
                <p className="text-espresso/60 dark:text-white/60 font-medium mt-1">Manage and track progress for your assigned students</p>
            </div>

            {/* Search */}
            <div className="flex gap-3 relative z-10">
                <div className="flex w-full flex-1 items-stretch rounded-2xl h-14 shadow-xl bg-[#F5DEB3] dark:bg-white/5 border border-espresso/10 group focus-within:border-espresso/30 transition-all overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-focus-within:bg-espresso transition-colors"></div>
                    <div className="text-espresso/40 flex items-center justify-center pl-6">
                        <span className="material-symbols-outlined">search</span>
                    </div>
                    <input
                        className="flex w-full min-w-0 flex-1 bg-transparent text-espresso dark:text-white focus:outline-0 border-none h-full placeholder:text-espresso/30 dark:placeholder:text-white/30 px-4 text-base font-bold"
                        placeholder="Search student directory by name or email..."
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
                <div className="text-center py-16 bg-[#F5DEB3] dark:bg-white/5 rounded-3xl border border-espresso/10 shadow-xl relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    <span className="material-symbols-outlined text-6xl text-espresso/20 dark:text-white/20 mb-4 block group-hover:scale-110 transition-transform">people</span>
                    <p className="text-espresso/40 dark:text-white/40 font-black uppercase tracking-widest text-sm">
                        {searchTerm ? 'No matches found in cohort' : 'No students registered in your cohort'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredStudents.map(student => (
                        <div key={student.id} className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl p-6 shadow-xl border border-espresso/10 relative overflow-hidden group transition-all hover:-translate-y-1">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <div className="flex items-center gap-5 relative z-10">
                                <div
                                    className="bg-center bg-no-repeat bg-cover rounded-2xl h-16 w-16 border-2 border-white/50 dark:border-white/10 shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform"
                                    style={{
                                        backgroundImage: `url("${student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'S')}&background=random`}")`
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-serif font-bold text-espresso dark:text-white truncate mb-1">
                                        {student.name || student.email}
                                    </h3>
                                    <p className="text-sm font-bold text-espresso/50 dark:text-white/50 truncate mb-3">{student.email}</p>
                                    <div className="flex items-center gap-3">
                                        {student.studyMethod && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-espresso text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                {student.studyMethod === 'online' ? 'Digital Stream' : 'In-Person'}
                                            </span>
                                        )}
                                        {student.status === 'active' && (
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-green-600 uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                Active Now
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-3 rounded-full bg-white/50 dark:bg-white/5 text-espresso/40 hover:text-espresso hover:bg-white transition-all shadow-sm active:scale-95">
                                        <span className="material-symbols-outlined text-lg">chat</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
