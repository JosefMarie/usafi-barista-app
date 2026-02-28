import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, where, doc, updateDoc, arrayUnion, serverTimestamp, getDoc, collectionGroup } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { StudentTranscript } from '../../components/admin/StudentTranscript';
import { StudentCertificate } from '../../components/admin/StudentCertificate';
import { useReactToPrint } from 'react-to-print';

export function AdminReports() {
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'transcript', 'certificate', 'reevaluation'
    const [studentProgress, setStudentProgress] = useState(null);
    const [allModules, setAllModules] = useState([]);

    // Printing Refs
    const transcriptRef = useRef();
    const certificateRef = useRef();

    const handlePrintTranscript = useReactToPrint({
        contentRef: transcriptRef,
        documentTitle: selectedStudent ? `USAFI_Transcript_${selectedStudent.fullName || 'Student'}` : 'Transcript',
    });

    const handlePrintCertificate = useReactToPrint({
        contentRef: certificateRef,
        documentTitle: selectedStudent ? `USAFI_Certificate_${selectedStudent.fullName || 'Student'}` : 'Certificate',
    });

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                // 1. Fetch Students
                const q = query(collection(db, 'users'), where('role', '==', 'student'));
                const snap = await getDocs(q);
                const studentsWithData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // 2. Fetch Modules (default course)
                const modulesSnap = await getDocs(query(collection(db, 'courses', 'bean-to-brew', 'modules')));
                const mods = modulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setAllModules(mods);

                // 3. Fetch All Progress via collectionGroup
                let progressSnap;
                let progressByStudent = {};

                try {
                    progressSnap = await getDocs(collectionGroup(db, 'progress'));
                    progressSnap.docs.forEach(doc => {
                        const studentId = doc.ref.parent.parent.id;
                        if (!progressByStudent[studentId]) progressByStudent[studentId] = {};
                        progressByStudent[studentId][doc.id] = doc.data();
                    });
                } catch (e) {
                    console.warn("CollectionGroup 'progress' might not be indexed, falling back to per-student fetch.");
                    // Fallback to fetching per student if collectionGroup fails or returns empty
                }

                // 4. Calculate marks for each student
                const enrichedStudents = await Promise.all(studentsWithData.map(async (student) => {
                    let prog = progressByStudent[student.id];

                    // Fallback: Fetch progress for this student if not found in collectionGroup
                    if (!prog || Object.keys(prog).length === 0) {
                        try {
                            const pSnap = await getDocs(collection(db, 'users', student.id, 'progress'));
                            prog = {};
                            pSnap.docs.forEach(d => { prog[d.id] = d.data(); });
                        } catch (err) {
                            prog = {};
                        }
                    }

                    const totalMarks = mods.reduce((acc, m) => acc + (prog[m.id]?.score || 0), 0);
                    const averageScore = mods.length > 0 ? totalMarks / mods.length : 0;

                    // Logic for "Finished": If all modules in the course have marks
                    // User said: "if in the report all modules have marks mark that student as completed the course"
                    const isFinished = mods.length > 0 && mods.every(m => prog[m.id]?.score !== undefined);

                    return {
                        ...student,
                        averageScore,
                        isCourseFinished: isFinished
                    };
                }));

                setStudents(enrichedStudents);
            } catch (error) {
                console.error("Error fetching students and progress:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const filteredStudents = students.filter(s =>
        (s.fullName || s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.uid?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedStudent) {
        if (viewMode === 'reevaluation') {
            return (
                <ReevaluationManager
                    student={selectedStudent}
                    onBack={() => {
                        setSelectedStudent(null);
                        setViewMode('list');
                    }}
                />
            );
        }
        return (
            <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#1c1916] overflow-y-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto w-full mb-8 flex justify-between items-center print:hidden">
                    <button
                        onClick={() => {
                            setSelectedStudent(null);
                            setViewMode('list');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-espresso/10 text-espresso rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-espresso hover:text-white transition-all"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to List
                    </button>
                    {viewMode === 'transcript' ? (
                        <button
                            onClick={handlePrintTranscript}
                            className="flex items-center gap-2 px-6 py-3 bg-espresso text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined">print</span>
                            Print Transcript
                        </button>
                    ) : (
                        <button
                            onClick={handlePrintCertificate}
                            className="flex items-center gap-2 px-6 py-3 bg-espresso text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined">print</span>
                            Print Certificate
                        </button>
                    )}
                </div>
                <div className="flex justify-center w-full min-h-[700px] overflow-hidden">
                    {viewMode === 'transcript' ? (
                        <div className="w-full flex justify-center py-4 md:py-8 overflow-x-auto">
                            <div className="shrink-0 origin-top transform scale-[0.4] sm:scale-[0.6] md:scale-75 lg:scale-100 transition-transform print:transform-none">
                                <StudentTranscript ref={transcriptRef} student={selectedStudent} />
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full max-w-[1300px] overflow-auto flex justify-center py-4 md:py-8">
                            <div className="shrink-0 origin-top transform scale-[0.35] sm:scale-[0.5] md:scale-75 lg:scale-90 xl:scale-100 shadow-none print:transform-none">
                                <StudentCertificate
                                    ref={certificateRef}
                                    student={selectedStudent}
                                    className="shadow-none print:shadow-none"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto p-4 md:p-8 pb-32">
            <header className="mb-10">
                <h1 className="text-3xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight mb-2">Academic Reports</h1>
                <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em]">Generate and print official student transcripts</p>
            </header>

            <div className="max-w-4xl w-full space-y-6">
                {/* Search Bar */}
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-espresso/40 group-focus-within:text-espresso transition-colors">search</span>
                    <input
                        type="text"
                        placeholder="Search student by name, email or ID..."
                        className="w-full pl-12 pr-6 py-4 bg-white/40 dark:bg-white/5 border border-espresso/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-espresso transition-all text-espresso font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* List */}
                <div className="bg-white/40 dark:bg-white/5 rounded-[2rem] overflow-hidden border border-espresso/10 shadow-xl">
                    {loading ? (
                        <div className="p-20 text-center">
                            <span className="material-symbols-outlined animate-spin text-espresso text-4xl">progress_activity</span>
                        </div>
                    ) : filteredStudents.length > 0 ? (
                        <div className="divide-y divide-espresso/5">
                            {filteredStudents.map(student => (
                                <div key={student.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/40 transition-colors group gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 md:size-12 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0">
                                            <img
                                                src={student.avatar || student.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName || student.name || 'Student')}&background=random`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-espresso dark:text-white truncate text-sm md:text-base">{student.fullName || student.name || 'Anonymous Student'}</h3>
                                            <p className="text-[10px] md:text-xs text-espresso/60 truncate">{student.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setViewMode('transcript');
                                            }}
                                            className={cn(
                                                "flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center gap-2",
                                                student.isCourseFinished
                                                    ? "bg-green-500 text-white border-green-600 hover:bg-green-600 shadow-md shadow-green-500/20"
                                                    : "bg-amber-400 text-espresso border-amber-500 hover:bg-amber-500 shadow-sm shadow-amber-500/10"
                                            )}
                                        >
                                            <span className="opacity-70 font-black">{(student.averageScore || 0).toFixed(1)}%</span>
                                            Transcript
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setViewMode('certificate');
                                            }}
                                            className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-espresso text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-espresso/20 transition-all active:scale-95"
                                        >
                                            Certificate
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setViewMode('reevaluation');
                                            }}
                                            className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-amber-500 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">payments</span>
                                            Re-eval
                                        </button>

                                        {/* Date Inputs for Training Period */}
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white/40 dark:bg-white/5 rounded-xl border border-espresso/10">
                                            <div className="flex flex-col">
                                                <span className="text-[7px] font-black uppercase opacity-40">Start Date</span>
                                                <input
                                                    type="date"
                                                    defaultValue={student.courseStartDate ? (student.courseStartDate.toDate ? student.courseStartDate.toDate().toISOString().split('T')[0] : student.courseStartDate) : ""}
                                                    onBlur={async (e) => {
                                                        const newVal = e.target.value;
                                                        if (newVal === (student.courseStartDate?.toDate ? student.courseStartDate.toDate().toISOString().split('T')[0] : student.courseStartDate)) return;
                                                        try {
                                                            await updateDoc(doc(db, 'users', student.id), { courseStartDate: newVal });
                                                            // We could update local state here but for a simple date field, 
                                                            // blur-save is often enough for admin tools.
                                                        } catch (err) { console.error("Error saving start date:", err); }
                                                    }}
                                                    className="bg-transparent text-[10px] font-bold text-espresso dark:text-white focus:outline-none"
                                                />
                                            </div>
                                            <div className="w-px h-6 bg-espresso/10"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[7px] font-black uppercase opacity-40">End Date</span>
                                                <input
                                                    type="date"
                                                    defaultValue={student.courseEndDate ? (student.courseEndDate.toDate ? student.courseEndDate.toDate().toISOString().split('T')[0] : student.courseEndDate) : ""}
                                                    onBlur={async (e) => {
                                                        const newVal = e.target.value;
                                                        if (newVal === (student.courseEndDate?.toDate ? student.courseEndDate.toDate().toISOString().split('T')[0] : student.courseEndDate)) return;
                                                        try {
                                                            await updateDoc(doc(db, 'users', student.id), { courseEndDate: newVal });
                                                        } catch (err) { console.error("Error saving end date:", err); }
                                                    }}
                                                    className="bg-transparent text-[10px] font-bold text-espresso dark:text-white focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-20 text-center text-espresso/40">
                            <span className="material-symbols-outlined text-4xl mb-2">person_search</span>
                            <p className="font-bold uppercase tracking-widest text-[10px]">No students found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ReevaluationManager({ student, onBack }) {
    const [loading, setLoading] = useState(true);
    const [modules, setModules] = useState([]);
    const [progress, setProgress] = useState({});
    const [processingId, setProcessingId] = useState(null);

    const COURSE_ID = student?.courseId || 'bean-to-brew';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Modules
                const modsSnap = await getDocs(query(collection(db, 'courses', COURSE_ID, 'modules')));
                const mods = modsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setModules(mods.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true })));

                // Fetch Student Progress
                const progressSnap = await getDocs(query(collection(db, 'users', student.id, 'progress')));
                const progMap = {};
                progressSnap.docs.forEach(d => { progMap[d.id] = d.data(); });
                setProgress(progMap);
            } catch (error) {
                console.error("Error fetching re-evaluation data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [student, COURSE_ID]);

    const totalMarks = modules.reduce((acc, m) => acc + (progress[m.id]?.score || 0), 0);
    const averageScore = modules.length > 0 ? totalMarks / modules.length : 0;
    const isFeeRequired = averageScore < 70;

    const failedModules = modules.filter(m => {
        const p = progress[m.id];
        return p && !p.passed && p.attempts >= 3;
    });

    const handleGrantAccess = async (moduleId) => {
        if (!confirm("Are you sure you want to grant re-evaluation access? This will reset attempts to 0.")) return;
        setProcessingId(moduleId);
        try {
            const progressRef = doc(db, 'users', student.id, 'progress', moduleId);

            // 1. Reset progress document
            await updateDoc(progressRef, {
                quizRequested: false,
                isAuthorized: true, // RESET PERMISSION SLOT
                attempts: 0, // Reset to allow 3 more
                passed: false,
                score: 0,
                updatedAt: serverTimestamp()
            });

            // 2. Add to module authorization list
            // Note: student.uid should be used if available, fallback to id
            const studentUid = student.uid || student.id;
            const moduleRef = doc(db, 'courses', COURSE_ID, 'modules', moduleId);
            await updateDoc(moduleRef, {
                quizAllowedStudents: arrayUnion(studentUid)
            });

            // 3. Update local state
            setProgress(prev => ({
                ...prev,
                [moduleId]: { ...prev[moduleId], attempts: 0, quizRequested: false, passed: false, score: 0 }
            }));

            alert(`Access granted for ${modules.find(m => m.id === moduleId).title}`);
        } catch (error) {
            console.error("Error granting re-eval access:", error);
            alert("Failed to grant access. Check permissions.");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#1c1916] p-8">
            <span className="material-symbols-outlined animate-spin text-espresso text-4xl">progress_activity</span>
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-espresso/40">Synchronizing Matrix...</p>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto p-4 md:p-8 pb-32">
            <div className="max-w-4xl mx-auto w-full space-y-8">
                <header className="flex justify-between items-center">
                    <div>
                        <button onClick={onBack} className="flex items-center gap-2 text-espresso/40 hover:text-espresso transition-colors text-[10px] font-black uppercase tracking-widest mb-2">
                            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Registry
                        </button>
                        <h2 className="text-3xl font-serif font-black text-espresso dark:text-white uppercase leading-none">Re-evaluation Dashboard</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-espresso/40">Student Dossier</p>
                        <p className="font-bold text-espresso dark:text-white uppercase">{student.fullName || student.name}</p>
                    </div>
                </header>

                {/* Score Summary Card */}
                <div className="bg-espresso text-white rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl shadow-inner"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Final Academic Average</p>
                            <h3 className="text-5xl md:text-7xl font-serif font-black tracking-tighter">{averageScore.toFixed(1)}%</h3>
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-40">System Computed Total / {modules.length} Modules</p>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-4">
                            <div className={cn(
                                "px-6 py-3 rounded-2xl border-2 font-black uppercase tracking-widest text-xs shadow-xl backdrop-blur-md",
                                isFeeRequired
                                    ? "bg-red-500/10 border-red-500/40 text-red-100"
                                    : "bg-green-500/10 border-green-500/40 text-green-100"
                            )}>
                                {isFeeRequired ? 'Fee Required: 20,000 RWF' : 'Policy: Fee Exempted'}
                            </div>
                            <p className="text-[10px] font-medium text-white/40 max-w-[200px] text-center md:text-right italic">
                                {isFeeRequired
                                    ? "Average is below 70%. Student must provide payment proof before granting access."
                                    : "Average is above 70%. Administration can grant free access to failed modules."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Failed Modules List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.4em] flex items-center gap-3">
                            <span className="w-8 h-px bg-espresso/20"></span>
                            Locked Modules ({failedModules.length})
                        </h4>
                    </div>

                    {failedModules.length > 0 ? (
                        <div className="grid gap-4">
                            {failedModules.map(mod => (
                                <div key={mod.id} className="bg-white/40 dark:bg-white/5 border border-espresso/10 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-white/60 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 border border-red-500/20 shadow-inner">
                                            <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-espresso dark:text-white uppercase transition-colors group-hover:text-black">{mod.title}</h5>
                                            <div className="flex gap-4 mt-1">
                                                <p className="text-[9px] font-black text-espresso/40 uppercase tracking-widest">Score: {progress[mod.id]?.score?.toFixed(1)}%</p>
                                                <p className="text-[9px] font-black text-espresso/40 uppercase tracking-widest">Attempts: {progress[mod.id]?.attempts}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        disabled={processingId === mod.id}
                                        onClick={() => handleGrantAccess(mod.id)}
                                        className={cn(
                                            "px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 flex items-center gap-2",
                                            processingId === mod.id
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                : "bg-espresso text-white hover:bg-black"
                                        )}
                                    >
                                        {processingId === mod.id ? (
                                            <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[16px]">verified</span>
                                        )}
                                        {isFeeRequired ? "Grant after Payment" : "Authorize Access"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-20 text-center border-2 border-dashed border-espresso/10 rounded-[2rem] bg-white/20">
                            <span className="material-symbols-outlined text-4xl text-espresso/20 mb-2">assignment_turned_in</span>
                            <p className="text-[10px] font-black text-espresso/40 uppercase tracking-widest">No modules currently locked at max attempts</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
