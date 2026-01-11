import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export function InstructorStudents() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [studentProgressMap, setStudentProgressMap] = useState({});
    const [modules, setModules] = useState({});

    useEffect(() => {
        if (user) fetchStudents();
    }, [user]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // 1. Primary: Fetch students by IDs in assignedStudentIds array (Matches Admin View)
            let studentList = [];
            if (user.assignedStudentIds && user.assignedStudentIds.length > 0) {
                const studentDocs = await Promise.all(
                    user.assignedStudentIds.map(sid => getDoc(doc(db, 'users', sid)))
                );
                studentList = studentDocs
                    .filter(d => d.exists())
                    .map(d => ({ id: d.id, ...d.data() }));
            }

            // 2. Fallback: If list is still empty, search by instructorId field
            if (studentList.length === 0) {
                const q = query(
                    collection(db, 'users'),
                    where('instructorId', '==', user.uid)
                );
                const snapshot = await getDocs(q);
                studentList = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            }

            setStudents(studentList);

            // Fetch progress for each student
            const progressMap = {};
            const modulesFound = {};

            // Optimize: Get all modules the instructor might care about
            // For now, let's just fetch progress subcollections for these students
            // Since we don't have a global "all modules" easily accessible without 
            // knowing courses, we'll fetch from the progress subcollection directly

            await Promise.all(studentList.map(async (student) => {
                const progQ = collection(db, 'users', student.id, 'progress');
                const progSnap = await getDocs(progQ);
                const progs = progSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                progressMap[student.id] = progs;

                // For each progress item, if we don't have module title, try to fetch it
                // This is a bit heavy, but works for now. 
                // A better way would be to have a modules cache.
                for (const p of progs) {
                    if (!modulesFound[p.id]) {
                        // We need the courseId to fetch the module title...
                        // Progress docs usually store courseId if we saved it there.
                        // Let's check if they do. If not, we might need to search.
                        // Assuming progress doc has 'courseId'
                        if (p.courseId) {
                            try {
                                const modRef = doc(db, 'courses', p.courseId, 'modules', p.id);
                                const modSnap = await getDoc(modRef);
                                if (modSnap.exists()) {
                                    modulesFound[p.id] = modSnap.data().title;
                                }
                            } catch (e) {
                                modulesFound[p.id] = 'Training Module';
                            }
                        } else {
                            modulesFound[p.id] = 'Training Module';
                        }
                    }
                }
            }));

            setStudentProgressMap(progressMap);
            setModules(modulesFound);

        } catch (err) {
            console.error('Error fetching students or progress:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        (student.fullName || student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-0 py-4 md:py-0 pb-20">
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
                    <span className="animate-spin h-8 w-8 border-4 border-espresso border-t-transparent rounded-full"></span>
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
                <div className="grid gap-6">
                    {filteredStudents.map(student => (
                        <div key={student.id} className="bg-[#F5DEB3] dark:bg-white/5 rounded-[2rem] p-6 md:p-8 shadow-xl border border-espresso/10 relative overflow-hidden group transition-all">
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>

                            {/* Student Header Info */}
                            <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10 mb-8 pb-6 border-b border-espresso/5">
                                <div
                                    className="bg-center bg-no-repeat bg-cover rounded-[1.5rem] size-20 border-4 border-white dark:border-white/10 shadow-xl shrink-0"
                                    style={{
                                        backgroundImage: `url("${student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName || student.name || 'S')}&background=random`}")`
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h3 className="text-xl md:text-2xl font-serif font-black text-espresso dark:text-white truncate leading-none">
                                            {student.fullName || student.name || student.email}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {student.studyMethod && (
                                                <span className="px-3 py-1 rounded-full bg-espresso text-white text-[9px] font-black uppercase tracking-widest shadow-sm">
                                                    {student.studyMethod === 'online' ? 'Digital Stream' : 'In-Person'}
                                                </span>
                                            )}
                                            {student.status === 'active' && (
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                    Live
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-espresso/50 dark:text-white/50 truncate flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">mail</span>
                                        {student.email}
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <button
                                        onClick={() => navigate(`/instructor/chat/${student.id}`)}
                                        className="w-full sm:w-auto p-4 rounded-2xl bg-white dark:bg-white/5 text-espresso/40 hover:text-espresso hover:bg-white/80 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest"
                                    >
                                        <span className="material-symbols-outlined text-xl">chat</span>
                                        Message
                                    </button>
                                    <button
                                        onClick={() => navigate(`/instructor/students/${student.id}`)}
                                        className="w-full sm:w-auto p-4 rounded-2xl bg-espresso text-white hover:bg-espresso/90 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest"
                                    >
                                        <span className="material-symbols-outlined text-xl">person_search</span>
                                        View Dossier
                                    </button>
                                </div>
                            </div>

                            {/* Progress Overview Section */}
                            <div className="relative z-10 space-y-4">
                                <h4 className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] flex items-center gap-3 mb-4">
                                    <span className="w-6 h-px bg-espresso/20"></span>
                                    Training Analytics
                                </h4>

                                {(!studentProgressMap[student.id] || studentProgressMap[student.id].length === 0) ? (
                                    <div className="py-8 bg-white/20 dark:bg-black/10 rounded-2xl border border-dashed border-espresso/10 text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-espresso/30 italic">No historical training data detected</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {studentProgressMap[student.id].map(prog => {
                                            const totalSlides = prog.slidesCount || 10; // Fallback
                                            const currentSlide = prog.lastSlideIndex || 0;
                                            const percent = prog.status === 'completed' ? 100 : Math.round((currentSlide / totalSlides) * 100);
                                            const score = prog.score !== undefined ? prog.score : null;

                                            return (
                                                <div key={prog.id} className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-espresso/5 shadow-sm group/prog hover:border-espresso/30 transition-colors">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-black text-espresso dark:text-white uppercase tracking-wider truncate mb-1">
                                                                {modules[prog.id] || 'Training Logic'}
                                                            </p>
                                                            <p className="text-[8px] font-bold text-espresso/40 dark:text-white/40 uppercase tracking-widest">
                                                                {prog.status === 'completed' ? 'Protocol Verified' : 'In Progress'}
                                                            </p>
                                                        </div>
                                                        {score !== null && (
                                                            <div className={cn(
                                                                "px-3 py-1 rounded-lg text-[10px] font-black shadow-sm",
                                                                score >= 70 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                                            )}>
                                                                {score.toFixed(0)}%
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between items-center text-[8px] font-black text-espresso/40 uppercase tracking-widest">
                                                            <span>Completion Status</span>
                                                            <span>{percent}%</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-espresso/5 rounded-full overflow-hidden shadow-inner">
                                                            <div
                                                                className={cn(
                                                                    "h-full transition-all duration-1000",
                                                                    percent === 100 ? "bg-green-500" : "bg-espresso"
                                                                )}
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
