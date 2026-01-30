import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export function StudentTranscript({ student }) {
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [progress, setProgress] = useState({});
    const [loading, setLoading] = useState(true);

    const BEAN_TO_BREW_ID = student?.courseId || 'bean-to-brew';

    useEffect(() => {
        if (!student) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Course Info
                const courseSnap = await getDoc(doc(db, 'courses', BEAN_TO_BREW_ID));
                if (courseSnap.exists()) {
                    setCourse(courseSnap.data());
                }

                // 2. Fetch Modules
                const modulesSnap = await getDocs(query(collection(db, 'courses', BEAN_TO_BREW_ID, 'modules')));
                const mods = modulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                mods.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
                setModules(mods);

                // 3. Fetch Student Progress
                const progressSnap = await getDocs(query(collection(db, 'users', student.id, 'progress')));
                const progMap = {};
                progressSnap.docs.forEach(d => { progMap[d.id] = d.data(); });
                setProgress(progMap);

            } catch (error) {
                console.error("Error fetching transcript data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [student]);

    if (loading) return <div className="p-20 text-center animate-pulse text-espresso/40 uppercase font-black tracking-widest">Generating Digital Record...</div>;

    const totalMarks = modules.filter(m => !m.isFinalAssessment).reduce((acc, m) => {
        const p = progress[m.id];
        return acc + (p?.score || 0);
    }, 0);

    const finalAssessment = modules.find(m => m.isFinalAssessment);
    const finalScore = progress[finalAssessment?.id]?.score || 0;

    // Calculate average or final-weighted score as needed. 
    // Usually total is on 100 based on modules + final.
    // Let's assume the user wants the final score as the "Final Marks on 100" if it's a comprehensive final, 
    // or an average of all. The request says: "The last row should show the Final marks the total on 100"
    const averageScore = modules.length > 0 ? (totalMarks + finalScore) / (modules.length) : 0;

    return (
        <div className="transcript-sheet bg-white text-black p-[10mm] shadow-2xl relative print:shadow-none print:p-0 border border-gray-200 print:border-none mx-auto mb-20 overflow-hidden" style={{ width: '210mm', minHeight: '297mm', fontFamily: '"Tw Cen MT", "Century Gothic", sans-serif' }}>
            {/* WATERMARK LAYER - Forced to background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ opacity: 0.1 }}>
                <img src="/logo.jpg" alt="" className="w-1/2 object-contain" />
            </div>

            {/* CONTENT LAYER - Forced to foreground */}
            <div className="relative z-10 flex flex-col h-full w-full">
                {/* INLINE CSS FOR PRINT */}
                <style>{`
                    @media print {
                        @page { 
                            size: A4; 
                            margin: 0mm !important; 
                        }
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            height: 100%;
                            font-family: "Tw Cen MT", "Century Gothic", sans-serif !important;
                        }
                        body * {
                            visibility: hidden;
                        }
                        .transcript-sheet, .transcript-sheet * {
                            visibility: visible;
                            font-family: '"Tw Cen MT", "Century Gothic", sans-serif' !important;
                        }
                        .transcript-sheet {
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            width: 210mm !important;
                            min-height: 297mm !important;
                            margin: 0 !important;
                            padding: 10mm !important;
                            border: none !important;
                            box-shadow: none !important;
                            background: white !important;
                            -webkit-print-color-adjust: exact;
                        }
                        /* Ensure table rows don't break halfway */
                        tr { page-break-inside: avoid; }
                    }
                    
                    .transcript-sheet {
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        font-family: "Tw Cen MT", "Century Gothic", sans-serif !important;
                    }
                    .transcript-sheet * {
                        font-family: "Tw Cen MT", "Century Gothic", sans-serif !important;
                    }
                `}</style>

                {/* HEADER */}
                <div className="flex justify-between items-start border-b border-black pb-2 mb-4">
                    {/* USAFI INFO */}
                    <div className="flex gap-3">
                        <img src="/logo.jpg" alt="USAFI" className="size-14 object-contain" />
                        <div className="space-y-0.5">
                            <h2 className="text-sm font-bold uppercase leading-tight">USAFI Barista International<br />Training Center</h2>
                            <p className="text-[8px] font-medium uppercase text-gray-600">Kigali - Rwanda | Rubangura Plaza</p>
                            <p className="text-[8px] font-medium uppercase text-gray-600">0787709171 | usafi-barista.com</p>
                        </div>
                    </div>

                    {/* STUDENT INFO */}
                    <div className="text-right flex gap-3">
                        <div className="space-y-0.5">
                            <h3 className="text-xs font-bold uppercase">{student?.fullName || student?.name}</h3>
                            <p className="text-[8px] uppercase font-bold text-gray-400">Reg No: {student?.uid?.slice(0, 10).toUpperCase()}</p>
                            <p className="text-[8px] uppercase text-gray-600">{student?.residence || 'Kigali, Rwanda'}</p>
                            <p className="text-[8px] lowercase text-gray-600">{student?.email}</p>
                        </div>
                        <div className="size-14 border border-black overflow-hidden bg-gray-50">
                            <img
                                src={student?.avatar || student?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.fullName || student?.name || 'Student')}&background=random`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* BODY */}
                <div className="space-y-2">
                    <div className="text-center mb-2">
                        <h1 className="text-lg font-bold uppercase tracking-[0.2em] underline underline-offset-4">Academic Transcript</h1>
                    </div>

                    <div className="mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest">
                            Course: <span className="border-b border-black inline-block px-2">{course?.title || 'Professional Barista Course'}</span>
                        </p>
                    </div>

                    <table className="w-full border-collapse border-2 border-black text-[11px] relative z-20 bg-transparent">
                        <thead>
                            <tr className="bg-gray-100/50 italic font-bold">
                                <th className="border border-black p-2 text-center w-10">No</th>
                                <th className="border border-black p-2 text-left">Module Name</th>
                                <th className="border border-black p-2 text-center w-24">Marks Obtained</th>
                                <th className="border border-black p-2 text-center w-32">Decision</th>
                                <th className="border border-black p-2 text-center w-32">Re Assignment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modules.map((mod, index) => {
                                const prog = progress[mod.id] || {};
                                const score = prog.score || 0;
                                const attempts = prog.attempts || 0;
                                const isPassed = prog.passed;
                                const isFirstTimePass = isPassed && attempts === 1;
                                const isReassignmentPass = isPassed && attempts > 1;

                                return (
                                    <tr key={mod.id} className={cn(mod.isFinalAssessment && "font-bold bg-gray-50/30")}>
                                        <td className="border border-black p-2 text-center">{index + 1}</td>
                                        <td className="border border-black p-2 uppercase">{mod.title} {mod.isFinalAssessment && "(FINAL ASSESSMENT)"}</td>
                                        <td className="border border-black p-1 text-center font-bold tracking-tighter" style={{ width: '100px', fontSize: '10px' }}>{score.toFixed(1)}%</td>
                                        <td className="border border-black p-1 text-center uppercase font-bold" style={{ fontSize: '9px' }}>
                                            {isFirstTimePass ? 'COMPETENT' : (isPassed ? 'NOT COMPETENT' : '-')}
                                        </td>
                                        <td className="border border-black p-1 text-center uppercase font-bold" style={{ fontSize: '9px' }}>
                                            {isReassignmentPass ? 'COMPETENT' : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* FINAL MARKS ROW */}
                            <tr className="bg-gray-100/50 font-bold text-xs">
                                <td colSpan={2} className="border border-black p-1 text-right uppercase tracking-widest">Final Marks Total (Average)</td>
                                <td className="border border-black p-1 text-center">{averageScore.toFixed(0)}%</td>
                                <td colSpan={2} className="border border-black p-1 text-center uppercase">
                                    {averageScore >= 80 ? 'EXCELLENT' : (averageScore >= 70 ? 'VERY GOOD' : 'PASS')}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* FOOTER */}
                <div className="mt-2 pt-1">
                    <div className="flex justify-between items-start mb-2">
                        {/* LEFT SIDE */}
                        <div className="space-y-1">
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-bold uppercase">Trainer: Ebenezer ISHIMWE</p>
                                <p className="text-[9px] font-bold uppercase">Signature: ............................................</p>
                            </div>
                        </div>

                        {/* RIGHT SIDE */}
                        <div className="space-y-1 flex flex-col items-end text-right">
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-bold uppercase">Manager: Sandrine GASARASI</p>
                                <p className="text-[9px] font-bold uppercase">Signature: ..................................</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center space-y-0 border-t border-gray-100 pt-1 mt-auto">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Issued by Usafi International Training Center</p>
                        <p className="text-[7px] font-medium text-gray-400">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
