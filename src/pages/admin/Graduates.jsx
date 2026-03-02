import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, doc, updateDoc, serverTimestamp, addDoc, deleteField } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { StudentTranscript } from '../../components/admin/StudentTranscript';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';

export function Graduates() {
    const { user: authUser } = useAuth();
    const [graduates, setGraduates] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [targetCourseId, setTargetCourseId] = useState(null);
    const transcriptRef = React.useRef();

    const handlePrintTranscript = useReactToPrint({
        contentRef: transcriptRef,
        documentTitle: selectedStudent ? `USAFI_Transcript_${selectedStudent.fullName || 'Student'}` : 'Transcript',
    });

    const handleRevokeGraduation = async (student) => {
        if (!window.confirm(`Are you sure you want to revoke graduation for ${student.fullName || student.name}? Status will revert to Active.`)) return;

        try {
            const studentRef = doc(db, 'users', student.id);
            await updateDoc(studentRef, {
                status: 'active',
                graduationDate: deleteField(),
                averageScore: deleteField(), // Optional: removing persisted score as they are active again
                updatedAt: serverTimestamp()
            });

            // Log activity
            await addDoc(collection(db, 'activity'), {
                userId: student.id,
                userName: student.fullName || student.name,
                adminId: authUser?.uid || 'anonymous-admin',
                action: `Revoked Graduation status`,
                type: 'graduation_revocation',
                icon: 'history',
                timestamp: serverTimestamp()
            });

            // Update local state
            setGraduates(prev => prev.filter(s => s.id !== student.id));
            alert(`${student.fullName || student.name} has been reverted to Active status.`);
        } catch (error) {
            console.error("Revocation error:", error);
            alert("Failed to revoke graduation.");
        }
    };

    useEffect(() => {
        const fetchGraduates = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, 'users'), where('status', '==', 'graduated'));
                const snap = await getDocs(q);
                const grads = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setGraduates(grads);
            } catch (error) {
                console.error("Error fetching graduates:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGraduates();
    }, []);

    const filteredGraduates = graduates.filter(s =>
        (s.fullName || s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedStudent) {
        return (
            <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#1c1916] overflow-y-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto w-full mb-8 flex justify-between items-center print:hidden">
                    <button
                        onClick={() => setSelectedStudent(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-espresso/10 text-espresso rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-espresso hover:text-white transition-all"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Graduates
                    </button>
                    <button
                        onClick={handlePrintTranscript}
                        className="flex items-center gap-2 px-6 py-3 bg-espresso text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined">print</span>
                        Print Transcript
                    </button>
                </div>
                <div className="flex justify-center w-full min-h-[700px] overflow-hidden">
                    <div className="w-full flex justify-center py-4 md:py-8 overflow-x-auto">
                        <div className="shrink-0 origin-top transform scale-[0.4] sm:scale-[0.6] md:scale-75 lg:scale-100 transition-transform print:transform-none">
                            <StudentTranscript ref={transcriptRef} student={selectedStudent} courseId={targetCourseId} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto p-4 md:p-8 pb-32">
            <header className="mb-10">
                <div className="flex items-center gap-4 mb-2">
                    <div className="size-12 bg-espresso rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <span className="material-symbols-outlined text-2xl">school</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight">Alumni Registry</h1>
                        <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em]">Official list of graduated students</p>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl w-full space-y-6">
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-espresso/40 group-focus-within:text-espresso transition-colors">search</span>
                    <input
                        type="text"
                        placeholder="Search graduates..."
                        className="w-full pl-12 pr-6 py-4 bg-white/40 dark:bg-white/5 border border-espresso/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-espresso transition-all text-espresso font-medium shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="bg-white/40 dark:bg-white/5 rounded-[2rem] overflow-hidden border border-espresso/10 shadow-xl">
                    {loading ? (
                        <div className="p-20 text-center">
                            <span className="material-symbols-outlined animate-spin text-espresso text-4xl">progress_activity</span>
                        </div>
                    ) : filteredGraduates.length > 0 ? (
                        <div className="divide-y divide-espresso/5">
                            {filteredGraduates.map(student => (
                                <div key={student.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/40 transition-colors group gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="size-14 rounded-2xl overflow-hidden border-2 border-white shadow-md shrink-0 relative">
                                            <img
                                                src={student.avatar || student.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName || student.name || 'Student')}&background=random`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="material-symbols-outlined text-green-600 text-sm">verified</span>
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-espresso dark:text-white truncate text-lg uppercase tracking-tight">{student.fullName || student.name || 'Anonymous Student'}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <p className="text-[10px] text-espresso/60 font-medium">{student.email}</p>
                                                <div className="w-1 h-1 rounded-full bg-espresso/20"></div>
                                                <p className="text-[10px] text-green-600 font-black uppercase tracking-widest flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                                    Graduated: {student.graduationDate ? format(new Date(student.graduationDate), 'dd MMM yyyy') : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 ml-auto min-w-[300px]">
                                        {student.graduatedCourses ? (
                                            Object.entries(student.graduatedCourses).map(([courseId, data]) => (
                                                <div key={courseId} className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-espresso/10 gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[7px] font-black uppercase opacity-40">Program</span>
                                                        <span className="text-[10px] font-bold text-espresso truncate max-w-[100px]">{courseId === 'bar-tender-course' ? 'Bartender' : 'Barista'}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[7px] font-black uppercase opacity-40">Graduated</span>
                                                        <span className="text-[10px] font-bold text-green-600">{data.date ? format(new Date(data.date), 'dd MMM yyyy') : 'N/A'}</span>
                                                    </div>
                                                    <div className="flex flex-col text-center">
                                                        <span className="text-[7px] font-black uppercase opacity-40">Mark</span>
                                                        <span className="text-[10px] font-bold text-espresso">{Number(data.averageScore || 0).toFixed(1)}%</span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRevokeGraduation(student); // For now revokes overall
                                                            }}
                                                            title="Revoke"
                                                            className="size-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">history</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedStudent(student);
                                                                setTargetCourseId(courseId);
                                                            }}
                                                            className="px-3 py-1.5 bg-espresso text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-[12px]">description</span>
                                                            Transcript
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleRevokeGraduation(student)}
                                                    title="Revoke Graduation"
                                                    className="size-10 flex items-center justify-center bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors active:scale-95"
                                                >
                                                    <span className="material-symbols-outlined text-lg">history</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedStudent(student);
                                                        setTargetCourseId(student.courseId || 'bean-to-brew');
                                                    }}
                                                    className="px-6 py-3 bg-espresso text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-espresso/40 transition-all active:scale-95 flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-sm">description</span>
                                                    View Transcript
                                                </button>
                                                <div className="px-4 py-3 bg-white/60 rounded-xl border border-espresso/10 text-center min-w-[80px]">
                                                    <p className="text-[8px] font-black text-espresso/40 uppercase leading-none mb-1">Final Mark</p>
                                                    <p className="text-sm font-bold text-espresso">{student.averageScore !== undefined ? Number(student.averageScore).toFixed(1) : '0.0'}%</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-20 text-center text-espresso/40">
                            <span className="material-symbols-outlined text-6xl mb-4 opacity-20">school</span>
                            <p className="font-bold text-lg uppercase tracking-widest">No graduates yet</p>
                            <p className="text-xs mt-2 opacity-60">Complete module marks and mark them as graduated in Reports.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
