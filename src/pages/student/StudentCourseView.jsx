import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
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
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [module, setModule] = useState(null);

    // Playback State
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showQuiz, setShowQuiz] = useState(false);

    // Quiz State
    const [userAnswers, setUserAnswers] = useState({}); // { 0: 1, 1: 3 }
    const [quizResult, setQuizResult] = useState(null); // { score: 85, passed: true }
    const [showNotes, setShowNotes] = useState(false);
    const [isProgressLoaded, setIsProgressLoaded] = useState(false);

    // Advanced Quiz State
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [matchingOrder, setMatchingOrder] = useState([]); // For matching questions

    // Study Mode State
    const [studyType, setStudyType] = useState(null); // full, summary
    const [showTypeSelection, setShowTypeSelection] = useState(false);

    useEffect(() => {
        const fetchModule = async () => {
            if (!courseId || !moduleId || !user) return;

            try {
                // Fetch module content
                const docRef = doc(db, 'courses', courseId, 'modules', moduleId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (!data.assignedStudents?.includes(user.uid)) {
                        alert(t('student.course_view.not_assigned'));
                        navigate('/student/courses');
                        return;
                    }
                    setModule({ id: docSnap.id, ...data });

                    // Fetch saved progress
                    const progressRef = doc(db, 'users', user.uid, 'progress', moduleId);
                    const progressSnap = await getDoc(progressRef);
                    if (progressSnap.exists()) {
                        const progressData = progressSnap.data();
                        if (progressData.lastSlideIndex !== undefined) {
                            setCurrentSlide(progressData.lastSlideIndex);
                        }
                        if (progressData.studyType) {
                            setStudyType(progressData.studyType);
                        } else {
                            setShowTypeSelection(true);
                        }
                    } else {
                        setShowTypeSelection(true);
                    }
                    setIsProgressLoaded(true);
                } else {
                    navigate('/student/courses');
                }
            } catch (error) {
                console.error("Error fetching module:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchModule();
    }, [courseId, moduleId, user, navigate]);

    // Save progress when slide changes
    useEffect(() => {
        const saveProgress = async () => {
            if (!user || !moduleId || !module) return;
            try {
                await setDoc(doc(db, 'users', user.uid, 'progress', moduleId), {
                    courseId,
                    moduleId,
                    lastSlideIndex: currentSlide,
                    studyType: studyType,
                    updatedAt: serverTimestamp(),
                    status: 'in-progress'
                }, { merge: true });
            } catch (error) {
                console.error("Error saving slide progress:", error);
            }
        };

        if (module && !showQuiz && isProgressLoaded) {
            saveProgress();
        }
    }, [currentSlide, user, moduleId, module, showQuiz, courseId, isProgressLoaded]);

    // Anti-Cheat: Monitor for navigation
    useEffect(() => {
        if (showQuiz && quizStarted && !quizResult) {
            const handleBeforeUnload = (e) => {
                e.preventDefault();
                e.returnValue = '';
                // Since we can't reliably wait for Firestore here, we rely on the 
                // popup deterrent, or simple auto-submit on component unmount
                return t('student.course_view.anti_cheat.unload_warning');
            };

            const handlePopState = () => {
                // Auto-submit on back button
                if (!quizResult) submitQuiz();
            };

            window.addEventListener('beforeunload', handleBeforeUnload);
            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [showQuiz, quizStarted, quizResult]);

    // Anti-Cheat: Auto-submit on visibility change (Tab switching)
    useEffect(() => {
        if (showQuiz && quizStarted && !quizResult) {
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'hidden') {
                    console.log("Anti-cheat: Tab switched detected. Submitting quiz.");
                    submitQuiz();
                    alert(t('student.course_view.anti_cheat.visibility_warning'));
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    }, [showQuiz, quizStarted, quizResult]);

    // Quiz Timer Logic
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
        const firstQ = module.quiz?.questions[0];
        setTimeLeft(firstQ?.duration || 30);
        if (firstQ?.type === 'matching') {
            setMatchingOrder(firstQ.pairs.map((_, i) => i).sort(() => Math.random() - 0.5));
        }
    };

    const handleNextQuestion = () => {
        const nextIdx = currentQuestionIndex + 1;
        if (nextIdx < (module.quiz?.questions?.length || 0)) {
            setCurrentQuestionIndex(nextIdx);
            const nextQ = module.quiz.questions[nextIdx];
            setTimeLeft(nextQ.duration || 30);
            if (nextQ.type === 'matching') {
                setMatchingOrder(nextQ.pairs.map((_, i) => i).sort(() => Math.random() - 0.5));
            }
        } else {
            submitQuiz();
        }
    };

    const handleNext = () => {
        if (currentSlide < (module?.content?.length || 0) - 1) {
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
        if (!module?.quiz?.questions) return;

        let correctCount = 0;
        module.quiz.questions.forEach((q, idx) => {
            const answer = userAnswers[idx];
            if (q.type === 'multiple_choice') {
                if (answer === q.correctOption) correctCount++;
            } else if (q.type === 'true_false') {
                if (answer === q.correctAnswer) correctCount++;
            } else if (q.type === 'fill_in') {
                if (answer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim()) correctCount++;
            } else if (q.type === 'matching') {
                // For matching, we compare the order
                // ... logic for matching ...
                // Let's assume userAnswers[idx] is an array of matched indices
                let isCorrect = true;
                q.pairs.forEach((p, pIdx) => {
                    if (userAnswers[idx]?.[pIdx] !== pIdx) isCorrect = false;
                });
                if (isCorrect) correctCount++;
            }
        });

        const total = module.quiz.questions.length;
        const score = (correctCount / total) * 100;
        const passMark = module.quiz.passMark || 70;
        const passed = score >= passMark;

        setQuizResult({ score, passed });
        setQuizStarted(false); // Stop timer

        // Save Progress
        try {
            await setDoc(doc(db, 'users', user.uid, 'progress', moduleId), {
                courseId,
                moduleId,
                score,
                passed,
                studyType: studyType,
                completedAt: serverTimestamp(),
                status: passed ? 'completed' : 'failed'
            }, { merge: true });

            // AUTO-UNLOCK NEXT MODULE
            if (passed) {
                try {
                    // 1. Fetch all modules to find the next one
                    const modulesRef = collection(db, 'courses', courseId, 'modules');
                    const modulesSnap = await getDocs(modulesRef);
                    const modules = modulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                    // 2. Sort modules matches the MyCourses logic (by Title numeric)
                    modules.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));

                    // 3. Find current index and next module
                    const currentIndex = modules.findIndex(m => m.id === moduleId);
                    if (currentIndex !== -1 && currentIndex < modules.length - 1) {
                        const nextModule = modules[currentIndex + 1];

                        // 4. Assign student to next module
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

    const retakeModule = () => {
        setShowQuiz(false);
        setQuizStarted(false);
        setCurrentQuestionIndex(0);
        setTimeLeft(0);
        setCurrentSlide(0);
        setUserAnswers({});
        setQuizResult(null);
        setStudyType(null);
        setShowTypeSelection(true);
        window.scrollTo(0, 0);
    };

    const content = studyType === 'summary' ? (module?.summaryContent || []) : (module?.content || []);

    const progressPercent = content.length
        ? Math.round(((currentSlide + 1) / content.length) * 100)
        : 0;

    if (loading) return <div className="h-screen flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;

    if (!module) return null;

    return (
        <div
            className="min-h-screen bg-[#F5DEB3] dark:bg-background-dark flex flex-col select-none"
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Header */}
            <header className="bg-[#F5DEB3]/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border-b border-espresso/10 sticky top-0 z-30 px-6 py-5 flex items-center justify-between transition-colors">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/student/courses')}
                        className="h-12 w-12 flex items-center justify-center bg-white/40 hover:bg-white text-espresso rounded-2xl transition-all shadow-sm active:scale-95"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="font-serif font-bold text-espresso dark:text-white text-xl leading-tight">{module.title}</h1>
                        <div className="flex items-center gap-4 mt-1">
                            <div className="w-32 h-2 bg-espresso/10 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-espresso transition-all duration-1000 ease-out"
                                    style={{ width: `${showQuiz ? 100 : progressPercent}%` }}
                                />
                            </div>
                            <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.2em]">
                                {showQuiz ? t('student.course_view.assessment_phase') : (studyType === 'summary' ? t('student.course_view.refining_summary') : t('student.course_view.extraction', { percent: progressPercent }))}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowNotes(!showNotes)}
                        className={cn(
                            "flex items-center gap-3 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95",
                            showNotes
                                ? "bg-espresso text-white shadow-espresso/20"
                                : "bg-white/40 text-espresso hover:bg-white border border-espresso/5 shadow-sm"
                        )}
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {showNotes ? 'book_2' : 'edit_note'}
                        </span>
                        {showNotes ? t('student.course_view.stow_ledger') : t('student.course_view.strategic_notes')}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full p-6 pb-24">

                {/* QUIZ MODE */}
                {showQuiz ? (
                    <div className="animate-fade-in space-y-8">
                        {!quizResult ? (
                            !quizStarted ? (
                                // QUIZ INTRO / GUIDELINES
                                <div className="w-full bg-[#F5DEB3] dark:bg-white/5 p-12 rounded-3xl border border-espresso/10 shadow-2xl text-left space-y-10 animate-scale-in relative overflow-hidden group">
                                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                    <div className="size-24 bg-espresso/5 rounded-3xl flex items-center justify-center mx-auto text-espresso rotate-12 group-hover:rotate-0 transition-transform">
                                        <span className="material-symbols-outlined text-5xl">quiz</span>
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-serif font-bold text-espresso dark:text-white mb-4">{t('student.quiz.title')}</h2>
                                        <p className="text-sm font-medium text-espresso/40 dark:text-white/40 uppercase tracking-widest mb-8">{t('student.quiz.subtitle')}</p>
                                        <div className="space-y-4 text-left">
                                            <div className="flex gap-5 p-6 rounded-2xl bg-white/40 dark:bg-white/5 border border-espresso/5 shadow-sm transform transition-all hover:scale-[1.02]">
                                                <span className="material-symbols-outlined text-espresso shrink-0">timer_10_alt_1</span>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-espresso/40 mb-1">{t('student.quiz.rules.timer.title')}</p>
                                                    <p className="text-sm font-medium text-espresso dark:text-white">{t('student.quiz.rules.timer.desc')}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-5 p-6 rounded-2xl bg-white/40 dark:bg-white/5 border border-espresso/5 shadow-sm transform transition-all hover:scale-[1.02]">
                                                <span className="material-symbols-outlined text-espresso shrink-0">workspace_premium</span>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-espresso/40 mb-1">{t('student.quiz.rules.pass_mark.title')}</p>
                                                    <p className="text-sm font-medium text-espresso dark:text-white" dangerouslySetInnerHTML={{ __html: t('student.quiz.rules.pass_mark.desc', { passMark: module.quiz?.passMark || 70 }) }} />
                                                </div>
                                            </div>
                                            <div className="flex gap-5 p-6 rounded-2xl bg-white/40 dark:bg-white/5 border border-espresso/5 shadow-sm transform transition-all hover:scale-[1.02]">
                                                <span className="material-symbols-outlined text-red-500 shrink-0">lock_reset</span>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500/40 mb-1">{t('student.quiz.rules.anti_cheat.title')}</p>
                                                    <p className="text-sm font-medium text-espresso dark:text-white">{t('student.quiz.rules.anti_cheat.desc')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={startQuiz}
                                        className="w-full py-5 bg-espresso text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-2xl shadow-espresso/30 hover:shadow-espresso/40 transition-all active:scale-95"
                                    >
                                        {t('student.quiz.start_btn')}
                                    </button>
                                </div>
                            ) : (
                                // QUIZ IN-PROGRESS
                                <div className="space-y-6">
                                    {/* Question Progress & Timer */}
                                    <div className="flex items-center justify-between bg-[#F5DEB3]/80 dark:bg-[#2c2825]/80 p-5 rounded-2xl border border-espresso/10 shadow-xl sticky top-28 z-20 backdrop-blur-md relative overflow-hidden group">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.2em]">{t('student.quiz.objective')}</div>
                                            <div className="flex gap-1.5">
                                                {module.quiz?.questions?.map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            "h-2 rounded-full transition-all duration-500 shadow-inner",
                                                            i < currentQuestionIndex ? "bg-espresso w-8" : i === currentQuestionIndex ? "bg-espresso w-12 animate-pulse" : "bg-espresso/10 dark:bg-white/10 w-6"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <div className="text-sm font-black text-espresso tracking-tight">{currentQuestionIndex + 1}/{module.quiz?.questions?.length}</div>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-3 px-6 py-3 rounded-2xl border-2 font-mono font-black text-lg transition-all shadow-sm",
                                            timeLeft < 10 ? "text-red-600 border-red-600/30 bg-red-600/5 animate-pulse" : "text-espresso dark:text-white border-espresso/10 bg-white/20"
                                        )}>
                                            <span className="material-symbols-outlined text-xl">timer</span>
                                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                        </div>
                                    </div>

                                    {/* Question Card */}
                                    <div className="bg-[#F5DEB3] dark:bg-white/5 p-10 rounded-3xl border border-espresso/10 shadow-2xl animate-scale-in relative group overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                        <div className="mb-10 relative z-10">
                                            <div className="flex items-center gap-3 mb-6">
                                                <span className="px-4 py-1.5 bg-espresso text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                                                    {module.quiz?.questions[currentQuestionIndex].type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h2 className="text-3xl font-serif font-bold text-espresso dark:text-white leading-tight">
                                                {module.quiz?.questions[currentQuestionIndex].question}
                                            </h2>
                                        </div>

                                        {/* QUESTION RENDERERS */}
                                        <div className="space-y-5 relative z-10">
                                            {/* 1. Multiple Choice */}
                                            {module.quiz?.questions[currentQuestionIndex].type === 'multiple_choice' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    {module.quiz?.questions[currentQuestionIndex].options.map((opt, optIdx) => (
                                                        <button
                                                            key={optIdx}
                                                            onClick={() => handleAnswer(currentQuestionIndex, optIdx)}
                                                            className={cn(
                                                                "p-6 rounded-2xl border-2 text-left transition-all group relative overflow-hidden shadow-sm active:scale-95",
                                                                userAnswers[currentQuestionIndex] === optIdx
                                                                    ? "bg-espresso text-white border-espresso shadow-2xl shadow-espresso/20"
                                                                    : "bg-white/40 dark:bg-white/5 border-espresso/5 hover:border-espresso/30"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-5">
                                                                <span className={cn(
                                                                    "size-10 rounded-xl border-2 flex items-center justify-center font-black text-sm transition-colors",
                                                                    userAnswers[currentQuestionIndex] === optIdx ? "border-white bg-white/20" : "border-espresso/10 bg-white/20 text-espresso/40"
                                                                )}>
                                                                    {String.fromCharCode(65 + optIdx)}
                                                                </span>
                                                                <span className="font-bold tracking-tight">{opt}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* 2. True / False */}
                                            {module.quiz?.questions[currentQuestionIndex].type === 'true_false' && (
                                                <div className="flex gap-6">
                                                    {[true, false].map((val) => (
                                                        <button
                                                            key={val ? 't' : 'f'}
                                                            onClick={() => handleAnswer(currentQuestionIndex, val)}
                                                            className={cn(
                                                                "flex-1 py-10 rounded-3xl border-2 font-bold text-xl transition-all flex flex-col items-center gap-3",
                                                                userAnswers[currentQuestionIndex] === val
                                                                    ? (val ? "bg-green-600 text-white border-green-600 shadow-xl shadow-green-600/20" : "bg-red-600 text-white border-red-600 shadow-xl shadow-red-600/20")
                                                                    : "bg-gray-50 dark:bg-white/5 border-transparent opacity-60 hover:opacity-100"
                                                            )}
                                                        >
                                                            <span className="material-symbols-outlined text-4xl">
                                                                {val ? 'check_circle' : 'cancel'}
                                                            </span>
                                                            {val ? 'TRUE' : 'FALSE'}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* 3. Fill in the blanks */}
                                            {module.quiz?.questions[currentQuestionIndex].type === 'fill_in' && (
                                                <input
                                                    autoFocus
                                                    className="w-full p-6 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary rounded-3xl text-2xl font-bold text-center outline-none transition-all placeholder:text-espresso/10"
                                                    placeholder={t('student.quiz.fill_in_placeholder')}
                                                    value={userAnswers[currentQuestionIndex] || ''}
                                                    onChange={(e) => handleAnswer(currentQuestionIndex, e.target.value)}
                                                />
                                            )}

                                            {/* 4. Matching */}
                                            {module.quiz?.questions[currentQuestionIndex].type === 'matching' && (
                                                <div className="space-y-4">
                                                    <p className="text-xs font-bold text-espresso/40 dark:text-white/40 uppercase tracking-widest mb-4">{t('student.quiz.matching_instruction')}</p>
                                                    <div className="grid grid-cols-2 gap-8">
                                                        <div className="space-y-3">
                                                            {module.quiz?.questions[currentQuestionIndex].pairs.map((p, i) => (
                                                                <div key={i} className="p-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-espresso/60 dark:text-white/60">
                                                                    {p.key}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="space-y-2">
                                                            {(matchingOrder || []).map((matchedIdx, i) => (
                                                                <div key={i} className="flex gap-2">
                                                                    <div className="flex-1 p-4 bg-primary/5 border-2 border-primary/20 rounded-2xl flex items-center justify-between font-bold text-primary">
                                                                        <span>{module.quiz?.questions[currentQuestionIndex].pairs[matchedIdx].value}</span>
                                                                        <div className="flex flex-col gap-1">
                                                                            <button
                                                                                disabled={i === 0}
                                                                                onClick={() => {
                                                                                    const newOrder = [...matchingOrder];
                                                                                    [newOrder[i], newOrder[i - 1]] = [newOrder[i - 1], newOrder[i]];
                                                                                    setMatchingOrder(newOrder);
                                                                                    handleAnswer(currentQuestionIndex, newOrder);
                                                                                }}
                                                                                className="hover:text-primary-dark disabled:opacity-20"
                                                                            >
                                                                                <span className="material-symbols-outlined text-sm">expand_less</span>
                                                                            </button>
                                                                            <button
                                                                                disabled={i === matchingOrder.length - 1}
                                                                                onClick={() => {
                                                                                    const newOrder = [...matchingOrder];
                                                                                    [newOrder[i], newOrder[i + 1]] = [newOrder[i + 1], newOrder[i]];
                                                                                    setMatchingOrder(newOrder);
                                                                                    handleAnswer(currentQuestionIndex, newOrder);
                                                                                }}
                                                                                className="hover:text-primary-dark disabled:opacity-20"
                                                                            >
                                                                                <span className="material-symbols-outlined text-sm">expand_more</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-16 flex justify-between items-center relative z-10">
                                            <p className="text-[10px] font-black text-espresso/20 dark:text-white/20 uppercase tracking-[0.2em]">
                                                {t('student.quiz.footer_note')}
                                            </p>
                                            <button
                                                onClick={handleNextQuestion}
                                                className="px-10 py-4 bg-espresso text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl hover:shadow-espresso/40 transition-all flex items-center gap-3 active:scale-95"
                                            >
                                                {currentQuestionIndex === (module.quiz?.questions?.length || 0) - 1 ? t('student.quiz.finalize_btn') : t('student.quiz.next_btn')}
                                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        ) : (
                            // QUIZ RESULTS
                            <div className="text-left py-16 animate-scale-in w-full bg-[#F5DEB3] dark:bg-white/5 p-12 rounded-3xl border border-espresso/10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                <div className={cn(
                                    "inline-flex items-center justify-center w-28 h-28 rounded-3xl mb-8 shadow-2xl text-6xl rotate-3 group-hover:rotate-0 transition-transform",
                                    quizResult.passed ? "bg-green-500 text-white" : "bg-red-500 text-white"
                                )}>
                                    <span className="material-symbols-outlined text-6xl">
                                        {quizResult.passed ? 'auto_awesome' : 'warning'}
                                    </span>
                                </div>
                                <h1 className="text-4xl font-serif font-bold text-espresso dark:text-white mb-3">
                                    {quizResult.passed ? t('student.quiz.results.passed.title') : t('student.quiz.results.failed.title')}
                                </h1>
                                <p className="text-xl font-medium text-espresso/40 dark:text-white/40 mb-10">
                                    {t('student.quiz.results.score_label')} <span className={quizResult.passed ? "text-green-600 font-black" : "text-red-600 font-black"}>{quizResult.score.toFixed(0)}%</span>
                                </p>

                                {quizResult.passed ? (
                                    <div className="space-y-6 relative z-10">
                                        <p className="text-sm font-medium text-espresso/60 dark:text-white/60 leading-relaxed">
                                            {t('student.quiz.results.passed.desc')}
                                        </p>
                                        <button
                                            onClick={() => navigate('/student/courses')}
                                            className="px-10 py-5 bg-green-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl hover:bg-green-700 transition-all flex items-center gap-3 active:scale-95"
                                        >
                                            {t('student.quiz.results.passed.btn')} <span className="material-symbols-outlined text-[20px]">map</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6 relative z-10">
                                        <p className="text-sm font-medium text-espresso/60 dark:text-white/60 leading-relaxed">
                                            {t('student.quiz.results.failed.desc')}
                                        </p>
                                        <button
                                            onClick={retakeModule}
                                            className="px-10 py-5 bg-espresso text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl hover:bg-black transition-all flex items-center gap-3 active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">refresh</span> {t('student.quiz.results.failed.btn')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    // SLIDE CONTENT MODE
                    <div className="animate-fade-in">
                        {content && content[currentSlide] ? (
                            <div className="space-y-6">
                                {/* Slide Image */}
                                {content[currentSlide].image && (
                                    <div className="w-full aspect-video bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden shadow-lg">
                                        <img
                                            src={content[currentSlide].image}
                                            alt="Slide visual"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Slide Text */}
                                <div className="bg-[#F5DEB3] dark:bg-[#2c2825] p-12 rounded-3xl border border-espresso/10 shadow-2xl min-h-[400px] flex flex-col justify-center text-center relative overflow-hidden group">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                    <h2 className="text-4xl font-serif font-bold text-espresso dark:text-white mb-8 group-hover:translate-y-[-4px] transition-transform">
                                        {content[currentSlide].title}
                                    </h2>
                                    <div
                                        className="text-lg leading-relaxed text-espresso/70 dark:text-white/70 prose prose-espresso dark:prose-invert max-w-none text-left font-medium"
                                        dangerouslySetInnerHTML={{ __html: content[currentSlide].text }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <p className="text-espresso/50">{t('student.course_view.empty_slides')}</p>
                                <button onClick={() => setShowQuiz(true)} className="mt-4 text-primary font-bold hover:underline">
                                    {t('student.course_view.skip_to_quiz')}
                                </button>
                            </div>
                        )}
                    </div>
                )
                }
            </main >

            {/* Sticky Navigation Footer (Only in Slide Mode) */}
            {
                !showQuiz && (
                    <footer className="fixed bottom-0 left-0 right-0 bg-[#F5DEB3]/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border-t border-espresso/10 p-6 z-30 transition-colors">
                        <div className="w-full flex justify-between items-center px-6">
                            <button
                                onClick={handlePrev}
                                disabled={currentSlide === 0}
                                className="h-12 px-8 rounded-2xl border border-espresso/10 bg-white/40 hover:bg-white text-espresso font-black uppercase tracking-widest text-[10px] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                            >
                                {t('student.course_view.prev_btn')}
                            </button>

                            <div className="flex gap-2">
                                {module.content?.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "h-2 rounded-full transition-all duration-500 shadow-inner",
                                            idx === currentSlide ? "bg-espresso w-10 shadow-lg" : "bg-espresso/10 dark:bg-white/20 w-4"
                                        )}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className="h-12 px-8 rounded-2xl bg-espresso text-white font-black uppercase tracking-widest text-[10px] hover:shadow-2xl transition-all shadow-xl flex items-center gap-3 active:scale-95"
                            >
                                {currentSlide === (content.length || 0) - 1 ? t('student.course_view.begin_eval_btn') : t('student.course_view.next_btn')}
                                <span className="material-symbols-outlined text-[20px]">
                                    {currentSlide === (content.length || 0) - 1 ? 'school' : 'arrow_forward'}
                                </span>
                            </button>
                        </div>
                    </footer>
                )
            }
            {/* Rich Text Notes Drawer */}
            <div className={cn(
                "fixed inset-y-0 right-0 w-full max-w-xl bg-[#F5DEB3] dark:bg-[#1e1e1e] shadow-2xl z-[100] transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] border-l border-espresso/10 flex flex-col",
                showNotes ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="p-8 border-b border-espresso/10 flex items-center justify-between bg-white/20 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-espresso text-white rounded-2xl shadow-lg rotate-3">
                            <span className="material-symbols-outlined text-[24px]">description</span>
                        </div>
                        <div>
                            <h2 className="font-serif font-bold text-2xl text-espresso dark:text-white">{t('student.course_view.notes.title')}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{t('student.course_view.notes.subtitle')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowNotes(false)}
                        className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white transition-all text-espresso/40 hover:text-espresso"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden">
                    {user && (
                        <NoteEditor
                            userId={user.uid}
                            noteKey={`notes_${courseId}_${moduleId}`}
                            title={module?.title}
                            className="h-full"
                        />
                    )}
                </div>
            </div>

            {/* Overlay for Notes */}
            {showNotes && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[90] transition-opacity"
                    onClick={() => setShowNotes(false)}
                />
            )}

            {/* Selection Modal */}
            {showTypeSelection && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-espresso/40 backdrop-blur-xl animate-fade-in">
                    <div className="w-full max-w-2xl bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[3rem] border border-white/20 shadow-2xl overflow-hidden relative group/modal">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/10 group-hover/modal:bg-espresso transition-colors"></div>
                        <div className="p-12 text-center space-y-10">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.4em]">{t('student.course_view.curriculum_selection')}</h3>
                                <h2 className="text-4xl font-serif font-black text-espresso dark:text-white">{t('student.course_view.choose_path')}</h2>
                                <p className="text-sm font-medium text-espresso/60 dark:text-white/60 max-w-md mx-auto">
                                    {t('student.course_view.study_path_desc')}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button
                                    onClick={() => { setStudyType('full'); setShowTypeSelection(false); }}
                                    className="p-8 bg-white/40 dark:bg-black/20 rounded-[2rem] border border-espresso/10 hover:border-espresso hover:shadow-2xl hover:-translate-y-1 transition-all group/opt text-left"
                                >
                                    <span className="material-symbols-outlined text-4xl text-espresso mb-4 group-hover/opt:scale-110 transition-transform">menu_book</span>
                                    <h4 className="text-lg font-serif font-black text-espresso dark:text-white mb-2">{t('student.course_view.full_notes')}</h4>
                                    <p className="text-[10px] font-medium text-espresso/40 dark:text-white/40 leading-relaxed">{t('student.course_view.full_notes_desc')}</p>
                                </button>
                                <button
                                    onClick={() => { setStudyType('summary'); setShowTypeSelection(false); }}
                                    className="p-8 bg-white/40 dark:bg-black/20 rounded-[2rem] border border-espresso/10 hover:border-espresso hover:shadow-2xl hover:-translate-y-1 transition-all group/opt text-left"
                                >
                                    <span className="material-symbols-outlined text-4xl text-espresso mb-4 group-hover/opt:scale-110 transition-transform">summarize</span>
                                    <h4 className="text-lg font-serif font-black text-espresso dark:text-white mb-2">{t('student.course_view.summary_notes')}</h4>
                                    <p className="text-[10px] font-medium text-espresso/40 dark:text-white/40 leading-relaxed">{t('student.course_view.summary_notes_desc')}</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
