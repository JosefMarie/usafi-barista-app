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
        <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-0 py-4 md:py-0">
            <div className="relative pl-4 md:pl-0">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 -ml-4 md:hidden"></div>
                <h1 className="text-2xl md:text-3xl font-serif font-black text-espresso dark:text-white leading-none">Student Cohort</h1>
                <p className="text-espresso/60 dark:text-white/60 font-medium mt-2 text-xs md:text-sm leading-relaxed">Manage and track progress for your assigned students</p>
            </div>

            <div className="flex gap-3 relative z-10">
                <div className="flex w-full flex-1 items-stretch rounded-2xl h-12 md:h-14 shadow-xl bg-[#F5DEB3] dark:bg-white/5 border border-espresso/10 group focus-within:border-espresso/30 transition-all overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-focus-within:bg-espresso transition-colors"></div>
                    <div className="text-espresso/40 flex items-center justify-center pl-4 md:pl-6">
                        <span className="material-symbols-outlined text-xl md:text-2xl">search</span>
                    </div>
                    <input
                        className="flex w-full min-w-0 flex-1 bg-transparent text-espresso dark:text-white focus:outline-0 border-none h-full placeholder:text-espresso/30 dark:placeholder:text-white/30 px-3 md:px-4 text-sm md:text-base font-bold"
                        placeholder="Search cohort by name or email..."
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
                        <div key={student.id} className="bg-[#F5DEB3] dark:bg-white/5 rounded-[2rem] p-4 md:p-6 shadow-xl border border-espresso/10 relative overflow-hidden group transition-all hover:-translate-y-1">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <div className="flex items-center gap-4 md:gap-5 relative z-10">
                                <div
                                    className="bg-center bg-no-repeat bg-cover rounded-2xl size-14 md:size-16 border-2 border-white/50 dark:border-white/10 shadow-lg shrink-0 group-hover:scale-105 transition-transform"
                                    style={{
                                        backgroundImage: `url("${student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'S')}&background=random`}")`
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base md:text-xl font-serif font-black text-espresso dark:text-white truncate mb-0.5 leading-none">
                                        {student.name || student.email}
                                    </h3>
                                    <p className="text-[10px] md:text-sm font-bold text-espresso/50 dark:text-white/50 truncate mb-2 leading-none">{student.email}</p>
                                    <div className="flex items-center gap-2 md:gap-3">
                                        {student.studyMethod && (
                                            <span className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-espresso text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                {student.studyMethod === 'online' ? 'Digital Stream' : 'In-Person'}
                                            </span>
                                        )}
                                        {student.status === 'active' && (
                                            <span className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-black text-green-600 uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                Active
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2.5 md:p-3 rounded-full bg-white/50 dark:bg-white/5 text-espresso/40 hover:text-espresso hover:bg-white transition-all shadow-sm active:scale-95 shrink-0">
                                        <span className="material-symbols-outlined text-base md:text-lg">chat</span>
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
