import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export function InstructorManageModule() {
    const { courseId, moduleId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [module, setModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('content'); // content, quiz, assignments

    // State for assignments tracking
    const [students, setStudents] = useState([]);
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [quizAllowedStudents, setQuizAllowedStudents] = useState([]);
    const [studentProgress, setStudentProgress] = useState({});

    // Content State
    const [selectedLang, setSelectedLang] = useState('en');
    const [langsData, setLangsData] = useState({
        en: { content: [], summaryContent: [], quiz: { questions: [], passMark: 70 } },
        fr: { content: [], summaryContent: [], quiz: { questions: [], passMark: 70 } },
        rw: { content: [], summaryContent: [], quiz: { questions: [], passMark: 70 } },
        sw: { content: [], summaryContent: [], quiz: { questions: [], passMark: 70 } }
    });

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'Français' },
        { code: 'rw', name: 'Kinyarwanda' },
        { code: 'sw', name: 'Kiswahili' }
    ];

    const [slides, setSlides] = useState([]);
    const [summarySlides, setSummarySlides] = useState([]);
    const [contentType, setContentType] = useState('full'); // full, summary

    // Quiz State
    const [quiz, setQuiz] = useState({ questions: [], passMark: 70 });

    useEffect(() => {
        const fetchModuleData = async () => {
            if (!courseId || !moduleId) return;

            try {
                // Fetch Module
                const modRef = doc(db, 'courses', courseId, 'modules', moduleId);
                const modSnap = await getDoc(modRef);

                if (modSnap.exists()) {
                    const data = modSnap.data();
                    setModule({ id: modSnap.id, ...data });

                    // Multi-Language Normalization
                    const initialLangs = {
                        en: {
                            content: data.languages?.en?.content || data.content || [],
                            summaryContent: data.languages?.en?.summaryContent || data.summaryContent || [],
                            quiz: data.languages?.en?.quiz || data.quiz || { questions: [], passMark: 70 }
                        },
                        fr: {
                            content: data.languages?.fr?.content || [],
                            summaryContent: data.languages?.fr?.summaryContent || [],
                            quiz: data.languages?.fr?.quiz || { questions: [], passMark: 70 }
                        },
                        rw: {
                            content: data.languages?.rw?.content || [],
                            summaryContent: data.languages?.rw?.summaryContent || [],
                            quiz: data.languages?.rw?.quiz || { questions: [], passMark: 70 }
                        },
                        sw: {
                            content: data.languages?.sw?.content || [],
                            summaryContent: data.languages?.sw?.summaryContent || [],
                            quiz: data.languages?.sw?.quiz || { questions: [], passMark: 70 }
                        }
                    };

                    setLangsData(initialLangs);
                    setSlides(initialLangs.en.content);
                    setSummarySlides(initialLangs.en.summaryContent);
                    setQuiz(initialLangs.en.quiz);
                    setAssignedStudents(data.assignedStudents || []);
                    setQuizAllowedStudents(data.quizAllowedStudents || []);
                } else {
                    navigate(`/instructor/courses/${courseId}`);
                }

                // Fetch All Students (Wait, instructors should only see THEIR assigned students)
                // However, 'assignedStudents' in module refers to ANY student assigned to the module.
                // Let's fetch all students to populate labels, but progress only for assigned ones.
                const q = query(collection(db, 'users'), where('role', '==', 'student'));
                const studentSnaps = await getDocs(q);
                setStudents(studentSnaps.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                setLoading(false);
            } catch (err) {
                console.error("Error fetching instructor data:", err);
                setLoading(false);
            }
        };

        fetchModuleData();
    }, [courseId, moduleId, navigate]);

    // Fetch Progress when Assignments tab is active
    useEffect(() => {
        const fetchProgress = async () => {
            if (activeTab === 'assignments' && assignedStudents.length > 0) {
                const progressMap = {};
                await Promise.all(assignedStudents.map(async (uid) => {
                    try {
                        const progDoc = await getDoc(doc(db, 'users', uid, 'progress', moduleId));
                        if (progDoc.exists()) {
                            progressMap[uid] = progDoc.data();
                        }
                    } catch (e) {
                        console.error("Error loading progress for", uid, e);
                    }
                }));
                setStudentProgress(progressMap);
            }
        };
        fetchProgress();
    }, [activeTab, assignedStudents, moduleId]);

    // Handle Language Switch
    const changeLanguage = (newLangCode) => {
        // 1. Save current content to buffer
        setLangsData(prev => ({
            ...prev,
            [selectedLang]: {
                content: slides,
                summaryContent: summarySlides,
                quiz: quiz
            }
        }));

        // 2. Load new content
        const nextLang = langsData[newLangCode];
        setSlides(nextLang.content || []);
        setSummarySlides(nextLang.summaryContent || []);
        setQuiz(nextLang.quiz || { questions: [], passMark: 70 });
        setSelectedLang(newLangCode);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-[#F5DEB3] dark:bg-[#1c1916]">
            <span className="animate-spin h-8 w-8 border-4 border-espresso border-t-transparent rounded-full"></span>
        </div>
    );

    const currentSlides = contentType === 'full' ? slides : summarySlides;

    return (
        <div className="flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#F5DEB3]/90 dark:bg-[#1c1916]/90 backdrop-blur-md border-b border-espresso/10 px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20"></div>
                <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                    <button
                        onClick={() => navigate(`/instructor/courses/${courseId}`)}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/40 hover:bg-espresso hover:text-white transition-all flex items-center justify-center active:scale-95 shadow-sm group shrink-0"
                    >
                        <span className="material-symbols-outlined text-[20px] md:text-[24px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    </button>
                    <div className="flex-1 w-full">
                        <h1 className="text-xl md:text-3xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">{module?.title}</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-1 md:mt-2">Instructional Data Review</p>
                    </div>
                </div>
                <div className="flex gap-3 md:gap-4 w-full md:w-auto">
                    <div className="flex-1 md:flex-none px-6 py-3 bg-white/40 text-espresso text-[9px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center gap-2 border border-espresso/10">
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        Read Only Access
                    </div>
                </div>
            </header>

            {/* Language Switcher & Tabs */}
            <div className="flex flex-col border-y border-espresso/10 bg-white/20 dark:bg-black/20 relative z-10 w-full mb-6">
                {/* Language bar */}
                <div className="flex items-center justify-center px-4 py-3 gap-2 bg-espresso/5 border-b border-espresso/5 overflow-x-auto no-scrollbar">
                    {languages.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                selectedLang === lang.code
                                    ? "bg-espresso text-white shadow-md scale-105"
                                    : "text-espresso/40 hover:bg-espresso/10 hover:text-espresso"
                            )}
                        >
                            {lang.name}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-center min-h-[60px] px-2 md:px-4 overflow-x-auto no-scrollbar w-full py-4">
                    {['content', 'quiz', 'assignments'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 md:px-8 py-3 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all relative group whitespace-nowrap mx-3",
                                activeTab === tab
                                    ? "bg-espresso text-white shadow-lg scale-100"
                                    : "text-espresso/60 dark:text-white/60 hover:bg-white/40 hover:text-espresso"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <main className="p-4 md:p-10 w-full pb-32">

                {/* CONTENT TAB */}
                {activeTab === 'content' && (
                    <div className="space-y-6 md:space-y-10">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-white/40 dark:bg-black/20 p-6 md:p-8 rounded-[2rem] border border-espresso/10 shadow-xl relative overflow-hidden group/meta">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/10"></div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 w-full sm:w-auto">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setContentType('full')}
                                        className={cn(
                                            "px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border",
                                            contentType === 'full' ? "bg-espresso text-white" : "bg-white/40 text-espresso/60"
                                        )}
                                    >
                                        Full Notes
                                    </button>
                                    <button
                                        onClick={() => setContentType('summary')}
                                        className={cn(
                                            "px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border",
                                            contentType === 'summary' ? "bg-espresso text-white" : "bg-white/40 text-espresso/60"
                                        )}
                                    >
                                        Summary
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-white/40 px-6 py-3 rounded-2xl border border-espresso/5 shadow-inner">
                                <span className="text-[9px] font-black uppercase tracking-widest text-espresso/40">Expected Duration:</span>
                                <span className="font-black text-espresso dark:text-white text-sm">{module?.duration || 0} MIN</span>
                            </div>
                        </div>

                        {currentSlides.map((slide, index) => (
                            <div key={index} className="bg-white/40 dark:bg-black/20 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-espresso/10 relative overflow-hidden group/slide shadow-2xl">
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/10"></div>
                                <div className="flex items-center gap-4 mb-6 md:mb-8">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-espresso text-white flex items-center justify-center font-serif font-black text-lg shadow-xl shadow-espresso/20">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-2xl font-serif font-black text-espresso dark:text-white mb-1">{slide.title || (slide.url ? (slide.type === 'pdf' ? 'Summary PDF' : 'Summary Image') : 'Untitled Slide')}</h3>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-espresso/40">
                                            {slide.url ? 'Technical Asset' : (slide.type === 'media' ? 'Relational Media Perspective' : 'Foundational Narrative')}
                                        </span>
                                    </div>
                                </div>

                                <div className={cn(
                                    "grid gap-8",
                                    (slide.type === 'media' || slide.url) ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                                )}>
                                    {slide.text ? (
                                        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-espresso/80 dark:text-white/70 font-medium" dangerouslySetInnerHTML={{ __html: slide.text }} />
                                    ) : (
                                        <div className="flex flex-col justify-center">
                                            <p className="text-sm font-bold text-espresso/60 mb-2">Attached Asset: {slide.fileName || 'Resource'}</p>
                                            {slide.type === 'pdf' ? (
                                                <button onClick={() => window.open(slide.url, '_blank')} className="px-6 py-3 bg-espresso text-white rounded-xl text-[10px] font-black uppercase tracking-widest self-start shadow-lg">View Document</button>
                                            ) : (
                                                <p className="text-[10px] font-black uppercase tracking-widest text-espresso/30 italic">Primary visual reference attached</p>
                                            )}
                                        </div>
                                    )}

                                    {(slide.url || (slide.media && slide.media.length > 0)) && (
                                        <div className={cn(
                                            "grid gap-4",
                                            (slide.type === 'media' || slide.type === 'standard' || slide.type === 'pdf') ? "grid-cols-1" : "grid-cols-2 md:grid-cols-4"
                                        )}>
                                            {slide.url ? (
                                                <div className="aspect-video bg-black/10 rounded-2xl overflow-hidden border border-espresso/5 flex items-center justify-center">
                                                    {slide.type === 'pdf' ? (
                                                        <span className="material-symbols-outlined text-5xl text-espresso/20">picture_as_pdf</span>
                                                    ) : (
                                                        <img src={slide.url} alt="" className="w-full h-full object-contain" />
                                                    )}
                                                </div>
                                            ) : (
                                                slide.media.map((item, mIdx) => (
                                                    <div key={mIdx} className="space-y-2">
                                                        <div className="aspect-video bg-black/10 rounded-2xl overflow-hidden border border-espresso/5">
                                                            <img src={item.url} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        {item.caption && <p className="text-[9px] font-black text-center uppercase tracking-widest text-espresso/40">{item.caption}</p>}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* QUIZZ TAB */}
                {activeTab === 'quiz' && (
                    <div className="space-y-8">
                        <div className="bg-espresso text-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div>
                                <h3 className="text-[9px] font-black uppercase tracking-[0.4em] mb-2 text-white/60">Integrity Threshold</h3>
                                <p className="text-xl font-serif font-black">Certification Requirements</p>
                            </div>
                            <div className="bg-white/10 px-6 py-4 rounded-2xl border border-white/20">
                                <span className="text-2xl font-serif font-black">{quiz.passMark}%</span>
                            </div>
                        </div>

                        {quiz.questions.map((q, qIdx) => (
                            <div key={qIdx} className="bg-white/40 dark:bg-black/20 p-8 md:p-10 rounded-[2.5rem] border border-espresso/10 relative shadow-xl">
                                <div className="flex items-center gap-4 mb-6 md:mb-8">
                                    <span className="px-3 py-1 bg-espresso text-white text-[8px] font-black uppercase tracking-widest rounded-full">{q.type.replace('_', ' ')}</span>
                                    <span className="text-xs font-black text-espresso/30 uppercase tracking-widest">Question {qIdx + 1} • {q.duration}s</span>
                                </div>
                                <h3 className="text-xl md:text-2xl font-serif font-black text-espresso dark:text-white mb-8">{q.question}</h3>

                                {q.type === 'multiple_choice' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {q.options.map((opt, oIdx) => (
                                            <div key={oIdx} className={cn(
                                                "p-4 rounded-2xl border text-sm font-bold flex items-center gap-4",
                                                q.correctOption === oIdx ? "bg-green-50 text-green-700 border-green-200" : "bg-white/20 border-espresso/5 text-espresso/40"
                                            )}>
                                                <div className={cn(
                                                    "size-8 rounded-lg flex items-center justify-center font-black",
                                                    q.correctOption === oIdx ? "bg-green-500 text-white" : "bg-espresso/5 text-espresso/20"
                                                )}>
                                                    {String.fromCharCode(65 + oIdx)}
                                                </div>
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'true_false' && (
                                    <div className="flex gap-4">
                                        <div className={cn("flex-1 py-4 text-center rounded-2xl border font-black text-[10px] tracking-widest", q.correctAnswer === true ? "bg-green-50 text-green-700 border-green-200" : "bg-white/20 border-espresso/5 text-espresso/20 opacity-40")}>TRUE</div>
                                        <div className={cn("flex-1 py-4 text-center rounded-2xl border font-black text-[10px] tracking-widest", q.correctAnswer === false ? "bg-red-50 text-red-700 border-red-200" : "bg-white/20 border-espresso/5 text-espresso/20 opacity-40")}>FALSE</div>
                                    </div>
                                )}

                                {q.type === 'fill_in' && (
                                    <div className="bg-white/20 p-6 rounded-2xl border border-espresso/5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-espresso/40 mb-2 italic">Correct terminology:</p>
                                        <p className="text-lg font-black text-espresso dark:text-white">{q.correctAnswer}</p>
                                    </div>
                                )}

                                {q.type === 'matching' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {q.pairs.map((pair, pIdx) => (
                                            <div key={pIdx} className="flex items-center gap-4 bg-white/20 p-4 rounded-xl border border-espresso/5 font-bold text-sm">
                                                <div className="flex-1 text-espresso dark:text-white">{pair.key}</div>
                                                <span className="material-symbols-outlined text-espresso/20">link</span>
                                                <div className="flex-1 text-espresso/60">{pair.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ASSIGNMENTS TAB */}
                {activeTab === 'assignments' && (
                    <div className="space-y-8">
                        <div className="bg-white/40 dark:bg-black/20 rounded-[2.5rem] border border-espresso/10 overflow-hidden shadow-xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/40 dark:bg-black/40 border-b border-espresso/10">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40">Student Identity</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 text-center">Assigned</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 text-center">Quiz Auth</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 text-center">Module Progress</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 text-center">Last Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-espresso/5">
                                    {students.map(student => {
                                        const progress = studentProgress[student.id];
                                        const lastSlide = progress?.lastSlideIndex ?? -1;
                                        const totalSlides = (contentType === 'full' ? slides : summarySlides).length;
                                        const percentRead = totalSlides > 0 ? Math.min(100, Math.round(((lastSlide + 1) / totalSlides) * 100)) : 0;
                                        const score = progress?.score !== undefined ? `${progress.score.toFixed(0)}%` : '-';
                                        const isAssigned = assignedStudents.includes(student.id);

                                        return (
                                            <tr key={student.id} className={cn("hover:bg-white/40 dark:hover:bg-white/5 transition-colors", !isAssigned && "opacity-40 grayscale")}>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-espresso/5 flex items-center justify-center font-black text-espresso text-sm">
                                                            {student.name?.charAt(0) || student.email?.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-espresso dark:text-white">{student.name || 'Unknown'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    {isAssigned ? <span className="material-symbols-outlined text-green-600 font-bold">check_circle</span> : <span className="material-symbols-outlined text-espresso/10">circle</span>}
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    {quizAllowedStudents.includes(student.id) ? <span className="material-symbols-outlined text-green-600 font-bold">lock_open</span> : <span className="material-symbols-outlined text-espresso/10">lock</span>}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="w-24 h-1.5 bg-espresso/5 rounded-full overflow-hidden shadow-inner">
                                                            <div className={cn("h-full", percentRead === 100 ? "bg-green-500" : "bg-espresso")} style={{ width: `${percentRead}%` }} />
                                                        </div>
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-espresso/40">{percentRead}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center font-black text-espresso">{score}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
