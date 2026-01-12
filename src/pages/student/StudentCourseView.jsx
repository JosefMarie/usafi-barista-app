import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, updateDoc, arrayUnion, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { NoteEditor } from '../../components/common/NoteEditor';
import { useTranslation } from 'react-i18next';

export function StudentCourseView() {
    const { courseId } = useParams();
    const [searchParams] = useSearchParams();
    const moduleId = searchParams.get('module');
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, i18n } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [module, setModule] = useState(null);

    // Playback State
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showQuiz, setShowQuiz] = useState(false);

    // Quiz State
    const [userAnswers, setUserAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const [showNotes, setShowNotes] = useState(false);
    const [isProgressLoaded, setIsProgressLoaded] = useState(false);

    // Advanced Quiz State
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [matchingOrder, setMatchingOrder] = useState([]);

    // Study Mode State
    const [studyMode, setStudyMode] = useState('full'); // full, summary
    const [studyLanguage, setStudyLanguage] = useState(i18n.language?.split('-')[0] || 'en');
    const [quizRequested, setQuizRequested] = useState(false);
    const [isQuizAllowed, setIsQuizAllowed] = useState(false);

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'Français' },
        { code: 'rw', name: 'Kinyarwanda' },
        { code: 'sw', name: 'Kiswahili' }
    ];


    useEffect(() => {
        if (!courseId || !moduleId || !user) return;

        const docRef = doc(db, 'courses', courseId, 'modules', moduleId);
        const unsubscribe = onSnapshot(docRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (!data.assignedStudents?.includes(user.uid)) {
                    alert(t('student.course_view.not_assigned'));
                    navigate('/student/courses');
                    return;
                }
                setModule({ id: docSnap.id, ...data });
                setIsQuizAllowed(data.quizAllowedStudents?.includes(user.uid) || false);

                // Progress still fetched once as it's user-specific and changes frequently
                if (!isProgressLoaded) {
                    try {
                        const progressRef = doc(db, 'users', user.uid, 'progress', moduleId);
                        const progressSnap = await getDoc(progressRef);
                        if (progressSnap.exists()) {
                            const progressData = progressSnap.data();
                            if (progressData.lastSlideIndex !== undefined) {
                                setCurrentSlide(Math.max(0, progressData.lastSlideIndex));
                            }
                            setQuizRequested(progressData.quizRequested || false);
                        }
                        setIsProgressLoaded(true);
                    } catch (err) {
                        console.error("Error fetching progress:", err);
                    }
                }
            } else {
                navigate('/student/courses');
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to module:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [courseId, moduleId, user, navigate, t, isProgressLoaded]);

    useEffect(() => {
        const saveProgress = async () => {
            if (!user || !moduleId || !module) return;
            try {
                const progressRef = doc(db, 'users', user.uid, 'progress', moduleId);

                // Check if this is a new "Start" event
                const progressSnap = await getDoc(progressRef);
                const isNewStart = !progressSnap.exists();

                await setDoc(progressRef, {
                    courseId,
                    moduleId,
                    lastSlideIndex: currentSlide,
                    updatedAt: serverTimestamp(),
                    status: 'in-progress',
                    studentName: user.name || user.fullName || user.email // Helpful denormalization for admin logs
                }, { merge: true });

                if (isNewStart && currentSlide === 0) {
                    await addDoc(collection(db, 'activity'), {
                        userId: user.uid,
                        userName: user.name || user.fullName || user.email,
                        action: `Started module: ${module.title}`,
                        type: 'module_start',
                        icon: 'play_arrow',
                        timestamp: serverTimestamp(),
                        moduleId,
                        courseId
                    });
                }
            } catch (error) {
                console.error("Error saving slide progress:", error);
            }
        };

        if (module && !showQuiz && isProgressLoaded) {
            saveProgress();
        }
    }, [currentSlide, user, moduleId, module, showQuiz, courseId, isProgressLoaded]);

    useEffect(() => {
        if (showQuiz && quizStarted && !quizResult) {
            const handleBeforeUnload = (e) => {
                e.preventDefault();
                e.returnValue = '';
                return t('student.course_view.anti_cheat.unload_warning');
            };

            const handlePopState = () => {
                if (!quizResult) submitQuiz();
            };

            window.addEventListener('beforeunload', handleBeforeUnload);
            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [showQuiz, quizStarted, quizResult, t]);

    useEffect(() => {
        if (showQuiz && quizStarted && !quizResult) {
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'hidden') {
                    submitQuiz();
                    alert(t('student.course_view.anti_cheat.visibility_warning'));
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    }, [showQuiz, quizStarted, quizResult, t]);

    useEffect(() => {
        let timer;
        if (showQuiz && quizStarted && !quizResult && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleNextQuestion();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [showQuiz, quizStarted, quizResult, timeLeft, currentQuestionIndex]);

    const startQuiz = () => {
        setQuizStarted(true);
        setCurrentQuestionIndex(0);
        const firstQ = activeQuiz?.questions[0];
        setTimeLeft(firstQ?.duration || 30);
        if (firstQ?.type === 'matching') {
            setMatchingOrder(firstQ.pairs.map((_, i) => i).sort(() => Math.random() - 0.5));
        }
    };

    const handleNextQuestion = () => {
        const nextIdx = currentQuestionIndex + 1;
        if (nextIdx < (activeQuiz?.questions?.length || 0)) {
            setCurrentQuestionIndex(nextIdx);
            const nextQ = activeQuiz.questions[nextIdx];
            setTimeLeft(nextQ.duration || 30);
            if (nextQ.type === 'matching') {
                setMatchingOrder(nextQ.pairs.map((_, i) => i).sort(() => Math.random() - 0.5));
            }
        } else {
            submitQuiz();
        }
    };

    const requestQuizAccess = async () => {
        if (!user || !moduleId) return;
        try {
            await setDoc(doc(db, 'users', user.uid, 'progress', moduleId), {
                quizRequested: true,
                requestedAt: serverTimestamp()
            }, { merge: true });
            setQuizRequested(true);
            alert("Quiz access requested. Please wait for admin approval.");
        } catch (error) {
            console.error("Error requesting quiz access:", error);
        }
    };
    const getActiveContent = () => {
        if (!module) return [];
        const langData = module.languages?.[studyLanguage];
        if (langData) {
            return studyMode === 'full' ? (langData.content || []) : (langData.summaryContent || []);
        }
        if (studyLanguage === 'en') {
            return studyMode === 'full' ? (module.content || []) : (module.summaryContent || []);
        }
        return [];
    };

    const getActiveQuiz = () => {
        if (!module) return { questions: [], passMark: 70 };
        const langData = module.languages?.[studyLanguage];
        if (langData?.quiz?.questions?.length > 0) return langData.quiz;
        if (studyLanguage === 'en' && module.quiz?.questions?.length > 0) return module.quiz;
        return module.quiz || { questions: [], passMark: 70 };
    };

    const activeContent = getActiveContent();
    const activeQuiz = getActiveQuiz();
    const currentSlideData = activeContent[currentSlide];

    const handleNext = () => {
        if (currentSlide < activeContent.length - 1) {
            setCurrentSlide(curr => curr + 1);
        } else {
            setShowQuiz(true);
        }
    };

    const handlePrev = () => {
        if (showQuiz) {
            setShowQuiz(false);
        } else if (currentSlide > 0) {
            setCurrentSlide(curr => curr - 1);
        }
    };

    const handleAnswer = (qIndex, optionIndex) => {
        setUserAnswers(prev => ({
            ...prev,
            [qIndex]: optionIndex
        }));
    };

    const submitQuiz = async () => {
        if (!activeQuiz?.questions) return;

        let correctCount = 0;
        activeQuiz.questions.forEach((q, idx) => {
            const answer = userAnswers[idx];
            if (q.type === 'multiple_choice') {
                if (answer === q.correctOption) correctCount++;
            } else if (q.type === 'true_false') {
                if (answer === q.correctAnswer) correctCount++;
            } else if (q.type === 'fill_in') {
                if (answer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim()) correctCount++;
            } else if (q.type === 'matching') {
                let isCorrect = true;
                q.pairs.forEach((p, pIdx) => {
                    if (userAnswers[idx]?.[pIdx] !== pIdx) isCorrect = false;
                });
                if (isCorrect) correctCount++;
            }
        });

        const total = activeQuiz.questions.length;
        const score = (correctCount / total) * 100;
        const passMark = activeQuiz.passMark || 70;
        const passed = score >= passMark;

        setQuizResult({ score, passed });
        setQuizStarted(false);

        try {
            await setDoc(doc(db, 'users', user.uid, 'progress', moduleId), {
                courseId,
                moduleId,
                score,
                passed,
                completedAt: serverTimestamp(),
                status: passed ? 'completed' : 'failed'
            }, { merge: true });

            // Log completion activity
            await addDoc(collection(db, 'activity'), {
                userId: user.uid,
                userName: user.name || user.fullName || user.email,
                action: passed ? `Completed module: ${module.title}` : `Attempted quiz: ${module.title}`,
                status: passed ? 'passed' : 'failed',
                score,
                type: 'module_completion',
                icon: passed ? 'workspace_premium' : 'quiz',
                timestamp: serverTimestamp(),
                moduleId,
                courseId
            });

            if (passed) {
                try {
                    const modulesRef = collection(db, 'courses', courseId, 'modules');
                    const modulesSnap = await getDocs(modulesRef);
                    const modules = modulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    modules.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
                    const currentIndex = modules.findIndex(m => m.id === moduleId);
                    if (currentIndex !== -1 && currentIndex < modules.length - 1) {
                        const nextModule = modules[currentIndex + 1];
                        await updateDoc(doc(db, 'courses', courseId, 'modules', nextModule.id), {
                            assignedStudents: arrayUnion(user.uid)
                        });
                        alert(t('student.course_view.unlock_success', { title: nextModule.title }));
                    }
                } catch (unlockError) {
                    console.error("Error unlocking next module:", unlockError);
                }
            }
        } catch (error) {
            console.error("Error saving progress:", error);
        }
    };

    const handleModeToggle = (mode) => {
        setStudyMode(mode);
        setCurrentSlide(0);
    };

    const handleLanguageToggle = (langCode) => {
        setStudyLanguage(langCode);
        setCurrentSlide(0);
    };
    const retakeModule = () => {
        setShowQuiz(false);
        setQuizStarted(false);
        setCurrentQuestionIndex(0);
        setTimeLeft(0);
        setCurrentSlide(0);
        setUserAnswers({});
        setQuizResult(null);
        window.scrollTo(0, 0);
    };

    const moveMatching = (qIdx, fromIdx, toIdx) => {
        const newOrder = [...matchingOrder];
        [newOrder[fromIdx], newOrder[toIdx]] = [newOrder[toIdx], newOrder[fromIdx]];
        setMatchingOrder(newOrder);
        handleAnswer(qIdx, newOrder);
    };

    const progressPercent = activeContent.length
        ? Math.round(((currentSlide + 1) / activeContent.length) * 100)
        : 0;

    if (loading) return <div className="h-screen flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;

    if (!module) return null;

    return (
        <div className="min-h-screen bg-[#F5DEB3] dark:bg-background-dark flex flex-col select-none" onContextMenu={(e) => e.preventDefault()}>
            <header className="bg-[#F5DEB3]/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border-b border-espresso/10 sticky top-0 z-30 px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-6">
                    <button onClick={() => navigate('/student/courses')} className="size-10 md:size-12 flex items-center justify-center bg-white/40 hover:bg-white text-espresso rounded-xl md:rounded-2xl transition-all shadow-sm active:scale-95 shrink-0">
                        <span className="material-symbols-outlined text-[20px] md:text-[24px]">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <h1 className="font-serif font-bold text-espresso dark:text-white text-base md:text-xl leading-tight truncate">{module.title}</h1>
                        <div className="flex items-center gap-3 md:gap-4 mt-1">
                            <div className="w-16 md:w-32 h-1.5 md:h-2 bg-espresso/10 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-espresso transition-all duration-1000 ease-out" style={{ width: `${showQuiz ? 100 : progressPercent}%` }} />
                            </div>
                            <p className="text-[8px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.1em] md:tracking-[0.2em] truncate">
                                {showQuiz ? t('student.course_view.assessment_phase') : t('student.course_view.extraction', { percent: progressPercent })}
                                <span className="ml-2 opacity-50">[{module.id}]</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Mode Toggle & Language Selector */}
                    <div className="flex flex-wrap items-center gap-4 bg-white/40 dark:bg-black/20 p-2 rounded-2xl border border-espresso/10 backdrop-blur-md shadow-sm">
                        {/* Mode Toggle */}
                        {((module.summaryContent && module.summaryContent.length > 0) || (module.languages?.[studyLanguage]?.summaryContent?.length > 0)) && (
                            <div className="flex bg-espresso/5 dark:bg-white/5 rounded-xl p-1 shrink-0">
                                <button
                                    onClick={() => handleModeToggle('full')}
                                    className={cn(
                                        "px-3 md:px-5 py-2 md:py-2 text-[8px] md:text-[10px] font-black rounded-lg transition-all uppercase tracking-widest",
                                        studyMode === 'full' ? "bg-espresso text-white shadow-md" : "text-espresso/40 hover:text-espresso"
                                    )}
                                >
                                    {t('student.course_view.full_notes')}
                                </button>
                                <button
                                    onClick={() => handleModeToggle('summary')}
                                    className={cn(
                                        "px-3 md:px-5 py-2 md:py-2 text-[8px] md:text-[10px] font-black rounded-lg transition-all uppercase tracking-widest",
                                        studyMode === 'summary' ? "bg-espresso text-white shadow-md" : "text-espresso/40 hover:text-espresso"
                                    )}
                                >
                                    {t('student.course_view.summary')}
                                </button>
                            </div>
                        )}

                        <div className="w-px h-6 bg-espresso/10 hidden lg:block"></div>

                        {/* Language Selector */}
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-[200px] md:max-w-none">
                            {languages.map(lang => {
                                const hasContent = module.languages?.[lang.code]?.content?.length > 0 || (lang.code === 'en' && module.content?.length > 0);
                                if (!hasContent && lang.code !== 'en') return null;
                                return (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleLanguageToggle(lang.code)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                            studyLanguage === lang.code
                                                ? "bg-espresso text-white shadow-sm"
                                                : "text-espresso/60 hover:bg-espresso/5 hover:text-espresso"
                                        )}
                                    >
                                        {lang.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button onClick={() => setShowNotes(!showNotes)} className={cn("flex items-center justify-center gap-2 md:gap-3 px-3 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all shadow-xl active:scale-95", showNotes ? "bg-espresso text-white shadow-espresso/20" : "bg-white/40 text-espresso hover:bg-white border border-espresso/5 shadow-sm")}>
                        <span className="material-symbols-outlined text-[18px] md:text-[20px]">{showNotes ? 'book_2' : 'edit_note'}</span>
                        <span className="hidden sm:inline">{showNotes ? t('student.course_view.stow_ledger') : t('student.course_view.strategic_notes')}</span>
                        <span className="sm:hidden">NOTES</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full p-4 md:p-6 pb-28 md:pb-24 max-w-6xl mx-auto">
                {showQuiz ? (
                    (module.quizAllowedStudents && !isQuizAllowed) ? (
                        <div className="animate-fade-in flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 max-w-2xl mx-auto px-6">
                            <div className="w-24 h-24 bg-espresso/5 rounded-[2rem] flex items-center justify-center text-espresso/30 mb-4 animate-pulse">
                                <span className="material-symbols-outlined text-5xl">{quizRequested ? 'pending_actions' : 'lock_clock'}</span>
                            </div>
                            <h2 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white">{quizRequested ? 'Quiz Access Pending' : 'Assessment Protocol Locked'}</h2>
                            <p className="text-sm md:text-base font-medium text-espresso/60 dark:text-white/60 leading-relaxed">{quizRequested ? "Your request for assessment authorization is currently under review." : "Authorization has not been granted. You must request access."}</p>
                            {!quizRequested ? (
                                <button onClick={requestQuizAccess} className="px-10 py-4 bg-espresso text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-2xl active:scale-95 flex items-center gap-3">
                                    <span className="material-symbols-outlined">request_quote</span>Request Quiz Access
                                </button>
                            ) : (
                                <div className="px-8 py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl font-bold text-xs uppercase tracking-widest">Request Status: PENDING</div>
                            )}
                            <button onClick={() => setShowQuiz(false)} className="text-espresso/40 hover:text-espresso text-[10px] font-black uppercase tracking-widest transition-colors">Return to Narrative</button>
                        </div>
                    ) : (
                        <div className="animate-fade-in space-y-8">
                            {!quizResult ? (
                                !quizStarted ? (
                                    <div className="w-full bg-[#F5DEB3] dark:bg-white/5 p-6 md:p-12 rounded-[2rem] md:rounded-3xl border border-espresso/10 shadow-2xl text-left space-y-8 md:space-y-10 animate-scale-in relative overflow-hidden group">
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                        <div className="size-16 md:size-24 bg-espresso/5 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto text-espresso rotate-12 group-hover:rotate-0 transition-transform">
                                            <span className="material-symbols-outlined text-4xl md:text-5xl">quiz</span>
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h2 className="text-2xl md:text-4xl font-serif font-bold text-espresso dark:text-white mb-3 md:mb-4">{t('student.quiz.title')}</h2>
                                            <p className="text-[10px] md:text-sm font-medium text-espresso/40 dark:text-white/40 uppercase tracking-widest mb-6 md:mb-8">{t('student.quiz.subtitle')}</p>
                                            <div className="space-y-3 md:space-y-4 text-left">
                                                <div className="flex gap-4 md:gap-5 p-4 md:p-6 rounded-[1.5rem] bg-white/40 dark:bg-white/5 border border-espresso/5 shadow-sm">
                                                    <span className="material-symbols-outlined text-espresso shrink-0 text-xl md:text-2xl">timer_10_alt_1</span>
                                                    <div>
                                                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-espresso/40 mb-1">{t('student.quiz.rules.timer.title')}</p>
                                                        <p className="text-[12px] md:text-sm font-medium text-espresso dark:text-white">{t('student.quiz.rules.timer.desc')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4 md:gap-5 p-4 md:p-6 rounded-[1.5rem] bg-white/40 dark:bg-white/5 border border-espresso/5 shadow-sm">
                                                    <span className="material-symbols-outlined text-espresso shrink-0 text-xl md:text-2xl">workspace_premium</span>
                                                    <div>
                                                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-espresso/40 mb-1">{t('student.quiz.rules.pass_mark.title')}</p>
                                                        <p className="text-[12px] md:text-sm font-medium text-espresso dark:text-white" dangerouslySetInnerHTML={{ __html: t('student.quiz.rules.pass_mark.desc', { passMark: activeQuiz?.passMark || 70 }) }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={startQuiz} className="w-full py-4 md:py-5 bg-espresso text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl md:rounded-2xl shadow-2xl shadow-espresso/30 hover:shadow-espresso/40 transition-all active:scale-95">{t('student.quiz.start_btn')}</button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#F5DEB3]/80 dark:bg-[#2c2825]/80 p-4 md:p-5 rounded-2xl border border-espresso/10 shadow-xl sticky top-[4.5rem] md:top-28 z-20 backdrop-blur-md relative overflow-hidden group">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                            <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto overflow-x-hidden">
                                                <div className="text-[8px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.1em] md:tracking-[0.2em] shrink-0">{t('student.quiz.objective')}</div>
                                                <div className="flex gap-1 md:gap-1.5 flex-1 min-w-0">
                                                    {activeQuiz?.questions?.map((_, i) => (
                                                        <div key={i} className={cn("h-1.5 md:h-2 rounded-full transition-all duration-500 shadow-inner", i < currentQuestionIndex ? "bg-espresso w-4 md:w-8" : i === currentQuestionIndex ? "bg-espresso w-10 md:w-12 animate-pulse" : "bg-espresso/10 dark:bg-white/10 w-3 md:w-6")} />
                                                    ))}
                                                </div>
                                                <div className="text-xs md:text-sm font-black text-espresso tracking-tight shrink-0">{currentQuestionIndex + 1}/{activeQuiz?.questions?.length}</div>
                                            </div>
                                            <div className={cn("flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border-2 font-mono font-black text-base md:text-lg transition-all shadow-sm w-full md:w-auto justify-center", timeLeft < 10 ? "text-red-600 border-red-600/30 bg-red-600/5 animate-pulse" : "text-espresso dark:text-white border-espresso/10 bg-white/20")}>
                                                <span className="material-symbols-outlined text-lg md:text-xl">timer</span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                            </div>
                                        </div>

                                        <div className="bg-[#F5DEB3] dark:bg-white/5 p-6 md:p-10 rounded-[2rem] md:rounded-3xl border border-espresso/10 shadow-2xl animate-scale-in relative group overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                            <div className="mb-6 md:mb-10 relative z-10">
                                                <div className="flex items-center gap-3 mb-4 md:mb-6"><span className="px-3 md:px-4 py-1.5 bg-espresso text-white text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">{activeQuiz?.questions[currentQuestionIndex]?.type.replace('_', ' ')}</span></div>
                                                <h2 className="text-xl md:text-3xl font-serif font-bold text-espresso dark:text-white leading-snug">{activeQuiz?.questions[currentQuestionIndex]?.question}</h2>
                                            </div>

                                            <div className="space-y-4 md:space-y-5 relative z-10">
                                                {activeQuiz?.questions[currentQuestionIndex]?.type === 'multiple_choice' && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                                        {activeQuiz?.questions[currentQuestionIndex]?.options.map((opt, optIdx) => (
                                                            <button key={optIdx} onClick={() => handleAnswer(currentQuestionIndex, optIdx)} className={cn("p-4 md:p-6 rounded-xl md:rounded-2xl border-2 text-left transition-all active:scale-[0.98]", userAnswers[currentQuestionIndex] === optIdx ? "bg-espresso text-white border-espresso shadow-lg" : "bg-white/40 dark:bg-white/5 border-espresso/5 hover:border-espresso/30")}>
                                                                <div className="flex items-center gap-4 md:gap-5"><span className={cn("size-8 md:size-10 rounded-lg md:rounded-xl border-2 flex items-center justify-center font-black text-xs md:text-sm", userAnswers[currentQuestionIndex] === optIdx ? "border-white bg-white/20" : "border-espresso/10 bg-white/20 text-espresso/40")}>{String.fromCharCode(65 + optIdx)}</span><span className="font-bold tracking-tight text-sm md:text-base">{opt}</span></div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {activeQuiz?.questions[currentQuestionIndex]?.type === 'true_false' && (
                                                    <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                                                        {[true, false].map((val) => (
                                                            <button key={val ? 't' : 'f'} onClick={() => handleAnswer(currentQuestionIndex, val)} className={cn("flex-1 py-6 md:py-10 rounded-2xl md:rounded-3xl border-2 font-bold text-base md:text-xl transition-all flex items-center justify-center sm:flex-col gap-3 active:scale-[0.98]", userAnswers[currentQuestionIndex] === val ? (val ? "bg-green-600 text-white border-green-600 shadow-lg" : "bg-red-600 text-white border-red-600 shadow-lg") : "bg-white/40 dark:bg-white/5 border-espresso/5 opacity-60 hover:opacity-100")}>
                                                                <span className="material-symbols-outlined text-2xl md:text-4xl">{val ? 'check_circle' : 'cancel'}</span>{val ? 'TRUE' : 'FALSE'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {activeQuiz?.questions[currentQuestionIndex]?.type === 'fill_in' && (
                                                    <input autoFocus className="w-full p-4 md:p-6 bg-white/40 dark:bg-white/5 border-2 border-espresso/10 focus:border-espresso rounded-2xl md:rounded-3xl text-lg md:text-2xl font-bold text-center outline-none transition-all placeholder:text-espresso/10" placeholder={t('student.quiz.fill_in_placeholder')} value={userAnswers[currentQuestionIndex] || ''} onChange={(e) => handleAnswer(currentQuestionIndex, e.target.value)} />
                                                )}

                                                {activeQuiz?.questions[currentQuestionIndex]?.type === 'matching' && (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                                            <div className="space-y-2 md:space-y-3">
                                                                {activeQuiz?.questions[currentQuestionIndex]?.pairs.map((p, i) => (
                                                                    <div key={i} className="p-3 md:p-4 bg-white/30 dark:bg-white/5 border border-espresso/10 rounded-xl md:rounded-2xl font-bold text-sm md:text-base text-espresso/60 dark:text-white/60">{p.key}</div>
                                                                ))}
                                                            </div>
                                                            <div className="space-y-2">
                                                                {(matchingOrder || []).map((matchedIdx, i) => (
                                                                    <div key={i} className="flex gap-2">
                                                                        <div className="flex-1 p-3 md:p-4 bg-espresso/5 border-2 border-espresso/20 rounded-xl md:rounded-2xl flex items-center justify-between font-bold text-xs md:text-sm text-espresso uppercase tracking-widest">
                                                                            <span className="truncate">{activeQuiz?.questions[currentQuestionIndex]?.pairs[matchedIdx].value}</span>
                                                                            <div className="flex items-center gap-2">
                                                                                <button disabled={i === 0} onClick={() => moveMatching(currentQuestionIndex, i, i - 1)} className="hover:text-primary disabled:opacity-20"><span className="material-symbols-outlined text-lg">expand_less</span></button>
                                                                                <button disabled={i === matchingOrder.length - 1} onClick={() => moveMatching(currentQuestionIndex, i, i + 1)} className="hover:text-primary disabled:opacity-20"><span className="material-symbols-outlined text-lg">expand_more</span></button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-10 md:mt-16 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
                                                <p className="text-[9px] md:text-[10px] font-black text-espresso/20 dark:text-white/20 uppercase tracking-[0.2em]">{t('student.quiz.footer_note')}</p>
                                                <button onClick={handleNextQuestion} className="w-full sm:w-auto px-8 md:px-10 py-3.5 md:py-4 bg-espresso text-white font-black uppercase tracking-widest text-[9px] md:text-[10px] rounded-xl md:rounded-2xl shadow-xl hover:shadow-espresso/40 transition-all flex items-center justify-center gap-3 active:scale-95">
                                                    {currentQuestionIndex === (activeQuiz?.questions?.length || 0) - 1 ? t('student.quiz.finalize_btn') : t('student.quiz.next_btn')}<span className="material-symbols-outlined text-[18px] md:text-[20px]">arrow_forward</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="text-left py-10 md:py-16 animate-scale-in w-full bg-[#F5DEB3] dark:bg-white/5 p-6 md:p-12 rounded-[2rem] md:rounded-3xl border border-espresso/10 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                    <div className={cn("inline-flex items-center justify-center size-20 md:size-28 rounded-2xl md:rounded-3xl mb-6 md:mb-8 shadow-2xl text-4xl md:text-6xl", quizResult.passed ? "bg-green-500 text-white" : "bg-red-500 text-white")}>
                                        <span className="material-symbols-outlined text-4xl md:text-6xl">{quizResult.passed ? 'auto_awesome' : 'warning'}</span>
                                    </div>
                                    <h1 className="text-2xl md:text-4xl font-serif font-bold text-espresso dark:text-white mb-2 md:mb-3">{quizResult.passed ? t('student.quiz.results.passed.title') : t('student.quiz.results.failed.title')}</h1>
                                    <p className="text-lg md:text-xl font-medium text-espresso/40 dark:text-white/40 mb-8 md:mb-10">{t('student.quiz.results.score_label')} <span className={quizResult.passed ? "text-green-600 font-black" : "text-red-600 font-black"}>{quizResult.score.toFixed(0)}%</span></p>
                                    {quizResult.passed ? (
                                        <div className="space-y-6">
                                            <p className="text-[13px] md:text-sm font-medium text-espresso/60 dark:text-white/60 leading-relaxed">{t('student.quiz.results.passed.desc')}</p>
                                            <button onClick={() => navigate('/student/courses')} className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-green-600 text-white font-black uppercase tracking-widest text-[9px] md:text-[10px] rounded-xl md:rounded-2xl shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-3">{t('student.quiz.results.passed.btn')} <span className="material-symbols-outlined text-[18px]">map</span></button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <p className="text-[13px] md:text-sm font-medium text-espresso/60 dark:text-white/60 leading-relaxed">{t('student.quiz.results.failed.desc')}</p>
                                            <button onClick={retakeModule} className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-espresso text-white font-black uppercase tracking-widest text-[9px] md:text-[10px] rounded-xl md:rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3"><span className="material-symbols-outlined text-[18px]">refresh</span> {t('student.quiz.results.failed.btn')}</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    <div className="animate-fade-in max-w-6xl mx-auto w-full h-full flex flex-col">
                        {activeContent[currentSlide] ? (
                            <div className="flex-1 bg-white/40 dark:bg-[#2c2825] p-2 md:p-4 rounded-[2rem] border border-espresso/10 shadow-2xl flex flex-col overflow-hidden relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                <div className="flex-1 min-h-[60vh] md:min-h-[80vh] w-full rounded-2xl overflow-hidden bg-espresso/5 shadow-inner flex items-center justify-center relative">
                                    {activeContent[currentSlide].text ? (
                                        <div className="w-full h-full p-8 md:p-12 overflow-y-auto bg-white/80 dark:bg-black/40 custom-scrollbar">
                                            <div className="prose dark:prose-invert max-w-none">
                                                <div
                                                    className="text-espresso dark:text-white/90 text-lg leading-relaxed"
                                                    dangerouslySetInnerHTML={{ __html: activeContent[currentSlide].text }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        (() => {
                                            const cur = activeContent[currentSlide] || {};
                                            const slideUrl = cur.url || cur.image || (cur.media && cur.media[0]?.url);
                                            const isPdf = cur.type === 'pdf' ||
                                                (slideUrl && slideUrl.toLowerCase().split('?')[0].includes('.pdf')) ||
                                                (cur.fileName && cur.fileName.toLowerCase().endsWith('.pdf'));

                                            if (!slideUrl) return <div className="text-espresso/20 italic">Media Unavailable</div>;

                                            // Mobile Detection & Google Docs Viewer Fallback
                                            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                                            const finalUrl = isPdf && isMobile
                                                ? `https://docs.google.com/viewer?url=${encodeURIComponent(slideUrl)}&embedded=true`
                                                : isPdf ? `${slideUrl}#toolbar=0` : slideUrl;

                                            return isPdf ? (
                                                <div
                                                    className="w-full h-full relative"
                                                    onDoubleClick={() => window.open(slideUrl, '_blank')}
                                                >
                                                    <iframe
                                                        src={finalUrl}
                                                        className="w-full h-full border-none bg-white"
                                                        title={`Page ${currentSlide + 1}`}
                                                    />
                                                    {/* Interaction Layer */}
                                                    <div className="absolute top-4 left-4 flex gap-2 pointer-events-auto">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); window.open(slideUrl, '_blank'); }}
                                                            className="size-10 bg-espresso/60 hover:bg-espresso text-white rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg transition-all active:scale-90"
                                                            title="Open in Full Screen"
                                                        >
                                                            <span className="material-symbols-outlined text-xl">open_in_new</span>
                                                        </button>
                                                    </div>
                                                    {isMobile && (
                                                        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                                                            <p className="text-[7px] font-black text-espresso/30 dark:text-white/30 uppercase tracking-[0.2em] text-center">Double tap to view full screen</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <img
                                                    src={slideUrl}
                                                    alt={`Page ${currentSlide + 1}`}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            );
                                        })()
                                    )}
                                </div>
                                <div className="absolute top-4 right-4 bg-espresso text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg opacity-40 group-hover:opacity-100 transition-opacity">
                                    {studyMode === 'full' ? 'Page' : 'Point'} {currentSlide + 1} / {activeContent.length}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <p className="text-espresso/50 font-medium">{studyMode === 'full' ? t('student.course_view.empty_slides') : 'No summary points generated for this module core.'}</p>
                                <button onClick={() => setShowQuiz(true)} className="mt-6 px-8 py-3 bg-espresso/5 text-espresso rounded-xl font-bold hover:bg-espresso/10 transition-all">{t('student.course_view.skip_to_quiz')}</button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {
                !showQuiz && (
                    <footer className="fixed bottom-0 left-0 right-0 bg-[#F5DEB3]/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border-t border-espresso/10 p-4 md:p-6 z-30">
                        <div className="w-full max-w-6xl mx-auto flex justify-between items-center gap-4">
                            <button onClick={handlePrev} disabled={currentSlide === 0} className="h-10 md:h-12 px-4 md:px-8 rounded-xl md:rounded-2xl border border-espresso/10 bg-white/40 hover:bg-white text-espresso font-black uppercase tracking-widest text-[8px] md:text-[10px] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 shrink-0"><span className="hidden sm:inline">{t('student.course_view.prev_btn')}</span><span className="sm:hidden">PREV</span></button>
                            <div className="flex gap-1.5 md:gap-2 overflow-x-auto no-scrollbar py-2">
                                {activeContent.map((_, idx) => (
                                    <div key={idx} className={cn("h-1.5 md:h-2 rounded-full transition-all duration-500 shadow-inner shrink-0", idx === currentSlide ? "bg-espresso w-6 md:w-10 shadow-lg" : "bg-espresso/10 dark:bg-white/20 w-1.5 md:w-4")} />
                                ))}
                            </div>
                            <button onClick={handleNext} className="h-10 md:h-12 px-4 md:px-8 rounded-xl md:rounded-2xl bg-espresso text-white font-black uppercase tracking-widest text-[8px] md:text-[10px] hover:shadow-2xl transition-all shadow-xl flex items-center gap-2 md:gap-3 active:scale-95 shrink-0">
                                <span className="hidden sm:inline">{currentSlide === (activeContent.length || 0) - 1 ? t('student.course_view.begin_eval_btn') : t('student.course_view.next_btn')}</span>
                                <span className="sm:hidden">{currentSlide === (activeContent.length || 0) - 1 ? 'EVAL' : 'NEXT'}</span>
                                <span className="material-symbols-outlined text-[16px] md:text-[20px]">{currentSlide === (activeContent.length || 0) - 1 ? 'school' : 'arrow_forward'}</span>
                            </button>
                        </div>
                    </footer>
                )
            }

            <div className={cn("fixed inset-y-0 right-0 w-full max-w-xl bg-[#F5DEB3] dark:bg-[#1e1e1e] shadow-[0_0_50px_rgba(0,0,0,0.3)] z-[100] transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] border-l border-espresso/10 flex flex-col", showNotes ? "translate-x-0" : "translate-x-full")}>
                <div className="p-6 md:p-8 border-b border-espresso/10 flex items-center justify-between bg-white/20 shrink-0 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20"></div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-espresso text-white rounded-xl shadow-lg rotate-3"><span className="material-symbols-outlined">description</span></div>
                        <div><h2 className="font-serif font-bold text-xl text-espresso dark:text-white">{t('student.course_view.notes.title')}</h2><p className="text-[8px] font-black uppercase tracking-widest text-espresso/40">{t('student.course_view.notes.subtitle')}</p></div>
                    </div>
                    <button onClick={() => setShowNotes(false)} className="size-10 flex items-center justify-center rounded-xl hover:bg-white transition-all text-espresso/40 hover:text-espresso"><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="flex-1 overflow-hidden">{user && <NoteEditor userId={user.uid} noteKey={`notes_${courseId}_${moduleId}`} title={module?.title} className="h-full" />}</div>
            </div>
            {showNotes && <div className="fixed inset-0 bg-espresso/20 backdrop-blur-[2px] z-[90]" onClick={() => setShowNotes(false)} />}
        </div >
    );
}
