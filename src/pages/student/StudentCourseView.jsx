import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { NoteEditor } from '../../components/common/NoteEditor';

export function StudentCourseView() {
    const { courseId } = useParams();
    const [searchParams] = useSearchParams();
    const moduleId = searchParams.get('module');
    const navigate = useNavigate();
    const { user } = useAuth();

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
                        alert("You are not assigned to this module.");
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
                return 'Leaving this page will automatically submit your quiz. Are you sure?';
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
                    alert("Anti-cheat warning: Quiz submitted automatically due to page switch.");
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
                        alert(`Congratulations! You've unlocked: ${nextModule.title}`);
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
        window.scrollTo(0, 0);
    };

    const progressPercent = module?.content?.length
        ? Math.round(((currentSlide + 1) / module.content.length) * 100)
        : 0;

    if (loading) return <div className="h-screen flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;

    if (!module) return null;

    return (
        <div
            className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col select-none"
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Header */}
            <header className="bg-white dark:bg-[#1e1e1e] border-b border-black/5 dark:border-white/5 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/student/courses')} className="p-2 hover:bg-black/5 rounded-full dark:text-white">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="font-serif font-bold text-espresso dark:text-white text-lg">{module.title}</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${showQuiz ? 100 : progressPercent}%` }}
                                />
                            </div>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                {showQuiz ? '100% (Assessment)' : `${progressPercent}% Complete`}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowNotes(!showNotes)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all",
                            showNotes
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {showNotes ? 'edit_note' : 'note_add'}
                        </span>
                        {showNotes ? 'Hide Notes' : 'My Notes'}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-4xl mx-auto w-full p-6 pb-24">

                {/* QUIZ MODE */}
                {showQuiz ? (
                    <div className="animate-fade-in space-y-8">
                        {!quizResult ? (
                            !quizStarted ? (
                                // QUIZ INTRO / GUIDELINES
                                <div className="max-w-2xl mx-auto bg-white dark:bg-[#2c2825] p-10 rounded-3xl border border-black/5 dark:border-white/5 shadow-xl text-center space-y-8 animate-scale-in">
                                    <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                                        <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-serif font-bold text-espresso dark:text-white mb-4">Quiz Instructions</h2>
                                        <div className="space-y-4 text-left text-espresso/70 dark:text-white/70">
                                            <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                                <span className="material-symbols-outlined text-amber-500">timer</span>
                                                <p className="text-sm">Each question has a <strong>limited time</strong>. It will auto-submit when the countdown hits zero.</p>
                                            </div>
                                            <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                                <span className="material-symbols-outlined text-red-500">security_update_warning</span>
                                                <p className="text-sm"><strong>Anti-Cheat</strong>: Navigating away, switching tabs, or refreshing will cause the quiz to <strong>submit immediately</strong>.</p>
                                            </div>
                                            <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                                <span className="material-symbols-outlined text-green-500">task_alt</span>
                                                <p className="text-sm">You need at least <strong>{module.quiz?.passMark || 70}%</strong> to pass this module.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={startQuiz}
                                        className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all transform hover:-translate-y-1"
                                    >
                                        I Understand, Start Quiz
                                    </button>
                                </div>
                            ) : (
                                // QUIZ IN-PROGRESS
                                <div className="space-y-6">
                                    {/* Question Progress & Timer */}
                                    <div className="flex items-center justify-between bg-white dark:bg-[#2c2825] p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm sticky top-24 z-10 backdrop-blur-md bg-white/80 dark:bg-[#2c2825]/80">
                                        <div className="flex items-center gap-4">
                                            <div className="text-xs font-bold text-espresso/40 dark:text-white/40 uppercase tracking-widest">Question</div>
                                            <div className="flex gap-1">
                                                {module.quiz?.questions?.map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            "h-1.5 w-6 rounded-full transition-all",
                                                            i < currentQuestionIndex ? "bg-primary" : i === currentQuestionIndex ? "bg-primary w-10" : "bg-gray-200 dark:bg-white/10"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <div className="text-sm font-bold text-primary">{currentQuestionIndex + 1}/{module.quiz?.questions?.length}</div>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-mono font-bold transition-all",
                                            timeLeft < 10 ? "text-red-500 border-red-500/20 bg-red-50 animate-pulse" : "text-espresso dark:text-white border-black/5 dark:border-white/5"
                                        )}>
                                            <span className="material-symbols-outlined text-sm">timer</span>
                                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                        </div>
                                    </div>

                                    {/* Question Card */}
                                    <div className="bg-white dark:bg-[#2c2825] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-xl animate-scale-in">
                                        <div className="mb-8">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full">
                                                    {module.quiz?.questions[currentQuestionIndex].type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h2 className="text-2xl font-serif font-bold text-espresso dark:text-white">
                                                {module.quiz?.questions[currentQuestionIndex].question}
                                            </h2>
                                        </div>

                                        {/* QUESTION RENDERERS */}
                                        <div className="space-y-4">
                                            {/* 1. Multiple Choice */}
                                            {module.quiz?.questions[currentQuestionIndex].type === 'multiple_choice' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {module.quiz?.questions[currentQuestionIndex].options.map((opt, optIdx) => (
                                                        <button
                                                            key={optIdx}
                                                            onClick={() => handleAnswer(currentQuestionIndex, optIdx)}
                                                            className={cn(
                                                                "p-5 rounded-2xl border-2 text-left transition-all group relative overflow-hidden",
                                                                userAnswers[currentQuestionIndex] === optIdx
                                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                                    : "bg-gray-50 dark:bg-white/5 border-transparent hover:border-primary/30"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <span className={cn(
                                                                    "size-8 rounded-full border-2 flex items-center justify-center font-bold text-sm",
                                                                    userAnswers[currentQuestionIndex] === optIdx ? "border-white bg-white/20" : "border-black/5 dark:border-white/10"
                                                                )}>
                                                                    {String.fromCharCode(65 + optIdx)}
                                                                </span>
                                                                <span className="font-medium">{opt}</span>
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
                                                    placeholder="Type your answer here..."
                                                    value={userAnswers[currentQuestionIndex] || ''}
                                                    onChange={(e) => handleAnswer(currentQuestionIndex, e.target.value)}
                                                />
                                            )}

                                            {/* 4. Matching */}
                                            {module.quiz?.questions[currentQuestionIndex].type === 'matching' && (
                                                <div className="space-y-4">
                                                    <p className="text-xs font-bold text-espresso/40 dark:text-white/40 uppercase tracking-widest mb-4">Rearrange the items on the right to match the left</p>
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

                                        <div className="mt-12 flex justify-between items-center">
                                            <p className="text-xs font-bold text-espresso/30 dark:text-white/30 uppercase tracking-widest">
                                                Note: Time runs out fast!
                                            </p>
                                            <button
                                                onClick={handleNextQuestion}
                                                className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2"
                                            >
                                                {currentQuestionIndex === (module.quiz?.questions?.length || 0) - 1 ? 'Finish Assessment' : 'Next Question'}
                                                <span className="material-symbols-outlined">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        ) : (
                            // QUIZ RESULTS
                            <div className="text-center py-10 animate-scale-in">
                                <div className={cn(
                                    "inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 shadow-xl text-5xl",
                                    quizResult.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                )}>
                                    <span className="material-symbols-outlined text-6xl">
                                        {quizResult.passed ? 'emoji_events' : 'sentiment_dissatisfied'}
                                    </span>
                                </div>
                                <h1 className="text-4xl font-serif font-bold text-espresso dark:text-white mb-2">
                                    {quizResult.passed ? 'Module Completed!' : 'Assessment Failed'}
                                </h1>
                                <p className="text-xl text-espresso/60 dark:text-white/60 mb-8">
                                    You scored <span className={quizResult.passed ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{quizResult.score.toFixed(0)}%</span>
                                </p>

                                {quizResult.passed ? (
                                    <div className="space-y-4">
                                        <p className="max-w-md mx-auto text-espresso/70 dark:text-white/70">
                                            Congratulations! You have successfully mastered this module.
                                            You can now proceed to the next stage of your training.
                                        </p>
                                        <button
                                            onClick={() => navigate('/student/courses')}
                                            className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-all flex items-center gap-2 mx-auto"
                                        >
                                            Return to Course Map <span className="material-symbols-outlined">arrow_forward</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="max-w-md mx-auto text-espresso/70 dark:text-white/70">
                                            Don't worry! Review the material and try again.
                                            Mastery takes practice.
                                        </p>
                                        <button
                                            onClick={retakeModule}
                                            className="px-8 py-3 bg-espresso text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all flex items-center gap-2 mx-auto"
                                        >
                                            <span className="material-symbols-outlined">replay</span> Retake Module
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    // SLIDE CONTENT MODE
                    <div className="animate-fade-in">
                        {module.content && module.content[currentSlide] ? (
                            <div className="space-y-6">
                                {/* Slide Image */}
                                {module.content[currentSlide].image && (
                                    <div className="w-full aspect-video bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden shadow-lg">
                                        <img
                                            src={module.content[currentSlide].image}
                                            alt="Slide visual"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Slide Text */}
                                <div className="bg-white dark:bg-[#2c2825] p-8 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm min-h-[300px] flex flex-col justify-center text-center">
                                    <h2 className="text-3xl font-serif font-bold text-espresso dark:text-white mb-6">
                                        {module.content[currentSlide].title}
                                    </h2>
                                    <div
                                        className="text-lg leading-relaxed text-espresso/80 dark:text-white/80 prose prose-espresso dark:prose-invert max-w-none text-left"
                                        dangerouslySetInnerHTML={{ __html: module.content[currentSlide].text }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <p className="text-espresso/50">This module has no content slides yet.</p>
                                <button onClick={() => setShowQuiz(true)} className="mt-4 text-primary font-bold hover:underline">
                                    Skip to Quiz
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
                    <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1e1e1e] border-t border-black/5 dark:border-white/5 p-4 z-20">
                        <div className="max-w-4xl mx-auto flex justify-between items-center">
                            <button
                                onClick={handlePrev}
                                disabled={currentSlide === 0}
                                className="px-6 py-2 rounded-lg border border-black/10 dark:border-white/10 font-bold hover:bg-black/5 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>

                            <div className="flex gap-1">
                                {module.content?.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "w-2 h-2 rounded-full transition-all",
                                            idx === currentSlide ? "bg-primary w-4" : "bg-gray-300 dark:bg-white/20"
                                        )}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark shadow-md transition-colors flex items-center gap-2"
                            >
                                {currentSlide === (module.content?.length || 0) - 1 ? 'Take Quiz' : 'Next'}
                                <span className="material-symbols-outlined text-lg">
                                    {currentSlide === (module.content?.length || 0) - 1 ? 'school' : 'arrow_forward'}
                                </span>
                            </button>
                        </div>
                    </footer>
                )
            }
            {/* Rich Text Notes Drawer */}
            <div className={cn(
                "fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-[#1e1e1e] shadow-2xl z-[100] transform transition-transform duration-300 border-l border-black/5 dark:border-white/5 flex flex-col",
                showNotes ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-black/20">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">description</span>
                        <h2 className="font-serif font-bold text-espresso dark:text-white">Module Notes</h2>
                    </div>
                    <button
                        onClick={() => setShowNotes(false)}
                        className="p-2 hover:bg-black/10 rounded-full text-espresso/40 dark:text-white/40"
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
        </div>
    );
}
