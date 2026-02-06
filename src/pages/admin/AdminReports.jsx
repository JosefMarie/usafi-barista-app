import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
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
    const [viewMode, setViewMode] = useState('list'); // 'list', 'transcript', 'certificate'

    // Certificate Printing
    const certificateRef = useRef();
    const handlePrintCertificate = useReactToPrint({
        contentRef: certificateRef,
        documentTitle: selectedStudent ? `USAFI_Certificate_${selectedStudent.fullName || 'Student'}` : 'Certificate',
    });

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, 'users'), where('role', '==', 'student'));
                const snap = await getDocs(q);
                const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStudents(data);
            } catch (error) {
                console.error("Error fetching students:", error);
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
                            onClick={() => window.print()}
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
                <div className="flex justify-center w-full min-h-[700px]">
                    {viewMode === 'transcript' ? (
                        <div className="w-full max-w-5xl">
                            <StudentTranscript student={selectedStudent} />
                        </div>
                    ) : (
                        <div className="w-full h-full max-w-[1300px] overflow-auto flex justify-center py-8">
                            {/* Display the HTML certificate */}
                            <StudentCertificate
                                ref={certificateRef}
                                student={selectedStudent}
                                className="transform scale-90 md:scale-100 origin-top shadow-none"
                            />
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
                                <div key={student.id} className="p-6 flex items-center justify-between hover:bg-white/40 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                                            <img
                                                src={student.avatar || student.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName || student.name || 'Student')}&background=random`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-espresso dark:text-white">{student.fullName || student.name || 'Anonymous Student'}</h3>
                                            <p className="text-xs text-espresso/60">{student.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setViewMode('transcript');
                                            }}
                                            className="px-4 py-2 bg-espresso/5 text-espresso rounded-xl text-[10px] font-black uppercase tracking-widest border border-espresso/10 hover:bg-espresso hover:text-white transition-all active:scale-95"
                                        >
                                            Transcript
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setViewMode('certificate');
                                            }}
                                            className="px-4 py-2 bg-espresso text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-espresso/20 transition-all active:scale-95"
                                        >
                                            Certificate
                                        </button>
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
