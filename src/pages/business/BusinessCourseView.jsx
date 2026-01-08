import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { GradientButton } from '../../components/ui/GradientButton';
import { NoteEditor } from '../../components/common/NoteEditor';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export function BusinessCourseView() {
    const { courseId } = useParams();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [activeChapter, setActiveChapter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showNotes, setShowNotes] = useState(false);
    const [isProgressLoaded, setIsProgressLoaded] = useState(false);

    // TTS State
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [selectedGender, setSelectedGender] = useState('female'); // 'male' or 'female'
    const [voices, setVoices] = useState([]);
    const synth = useRef(window.speechSynthesis);

    // Quiz States
    const [activeMode, setActiveMode] = useState('read'); // 'read' | 'quiz'
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const [matchingOrder, setMatchingOrder] = useState([]);

    useEffect(() => {
        // Load Voices
        const loadVoices = () => {
            const availableVoices = synth.current.getVoices();
            setVoices(availableVoices);
        };

        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }

        if (!courseId || !user) return;

        // Fetch Course
        getDoc(doc(db, 'business_courses', courseId)).then(snap => {
            if (snap.exists()) setCourse({ id: snap.id, ...snap.data() });
        });

        // Fetch Chapters & Progress
        const q = query(collection(db, 'business_courses', courseId, 'chapters'), orderBy('order', 'asc'));

        let unsubscribe;

        const loadEverything = async () => {
            try {
                // Get Chapters
                const chaptersSnap = await getDoc(doc(db, 'business_courses', courseId)); // Just to wait for course if needed

                // Fetch saved progress
                const progressRef = doc(db, 'users', user.uid, 'business_progress', courseId);
                const progressSnap = await getDoc(progressRef);
                const savedChapterId = progressSnap.exists() ? progressSnap.data().lastChapterId : null;

                unsubscribe = onSnapshot(q, (snapshot) => {
                    const fetchedChapters = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setChapters(fetchedChapters);

                    // Set chapter from progress if available, otherwise first chapter
                    if (fetchedChapters.length > 0) {
                        const resumeChapter = savedChapterId
                            ? fetchedChapters.find(c => c.id === savedChapterId) || fetchedChapters[0]
                            : fetchedChapters[0];
                        setActiveChapter(resumeChapter);
                    }
                    setIsProgressLoaded(true);
                    setLoading(false);
                });
            } catch (err) {
                console.error("Error loading business course data:", err);
                setLoading(false);
            }
        };

        loadEverything();

        return () => {
            if (unsubscribe) unsubscribe();
            synth.current.cancel(); // Stop speaking on unmount
        };
    }, [courseId, user]);

    // Save progress when chapter changes
    useEffect(() => {
        const saveProgress = async () => {
            if (!user || !courseId || !activeChapter) return;
            try {
                const activeIndex = chapters.findIndex(c => c.id === activeChapter.id);
                const progressPercent = chapters.length > 0
                    ? Math.round(((activeIndex + 1) / chapters.length) * 100)
                    : 0;

                await setDoc(doc(db, 'users', user.uid, 'business_progress', courseId), {
                    courseId,
                    lastChapterId: activeChapter.id,
                    progressPercent,
                    updatedAt: serverTimestamp(),
                    status: progressPercent === 100 ? 'completed' : 'in-progress'
                });
            } catch (error) {
                console.error("Error saving business progress:", error);
            }
        };

        if (activeChapter && chapters.length > 0 && isProgressLoaded) {
            saveProgress();
        }
    }, [activeChapter, user, courseId, chapters, isProgressLoaded]);

    // Anti-Cheat: Monitor for navigation
    useEffect(() => {
        if (activeMode === 'quiz' && quizStarted && !quizResult) {
            const handleBeforeUnload = (e) => {
                e.preventDefault();
                e.returnValue = '';
                return 'Leaving this page will automatically submit your quiz. Are you sure?';
            };
            const handlePopState = () => { if (!quizResult) submitQuiz(); };
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'hidden') {
                    submitQuiz();
                    alert("Anti-cheat warning: Quiz submitted automatically due to page switch.");
                }
            };

            window.addEventListener('beforeunload', handleBeforeUnload);
            window.addEventListener('popstate', handlePopState);
            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
                window.removeEventListener('popstate', handlePopState);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }
    }, [activeMode, quizStarted, quizResult]);

    // Timer Logic
    useEffect(() => {
        let timer;
        if (activeMode === 'quiz' && quizStarted && !quizResult && timeLeft > 0) {
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
    }, [activeMode, quizStarted, quizResult, timeLeft, currentQuestionIndex]);

    const handleSpeak = () => {
        if (isSpeaking) {
            synth.current.cancel();
            setIsSpeaking(false);
            return;
        }

        if (!activeChapter?.content) return;

        const utterance = new SpeechSynthesisUtterance(activeChapter.content.replace(/<[^>]*>/g, '')); // Strip HTML for TTS

        // Voice Selection Logic
        let voice = null;
        if (selectedGender === 'male') {
            voice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.includes('David') || v.name.includes('James'));
        } else {
            voice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google US English'));
        }

        // Fallback if no specific gender found, just use default but try to pick standard ones
        if (!voice && voices.length > 0) voice = voices[0];

        if (voice) utterance.voice = voice;

        utterance.rate = 1;

        utterance.onend = () => setIsSpeaking(false);

        synth.current.speak(utterance);
        setIsSpeaking(true);
    };

    const activeIndex = chapters.findIndex(c => c.id === activeChapter?.id);
    const progressPercent = chapters.length > 0
        ? Math.round(((activeIndex + 1) / chapters.length) * 100)
        : 0;

    // Progress Helper
    const isChapterCompleted = (chapterId) => {
        return true;
    };

    const startQuiz = () => {
        if (!activeChapter?.quiz?.enabled) return;
        setActiveMode('quiz');
        setQuizStarted(true);
        setCurrentQuestionIndex(0);
        const firstQ = activeChapter.quiz.questions[0];
        setTimeLeft(firstQ.duration || 30);
        if (firstQ.type === 'matching') {
            setMatchingOrder(firstQ.pairs.map((_, i) => i).sort(() => Math.random() - 0.5));
        }
        // Scroll to top
        window.scrollTo(0, 0);
    };

    const handleNextQuestion = () => {
        const nextIdx = currentQuestionIndex + 1;
        if (nextIdx < (activeChapter.quiz.questions.length || 0)) {
            setCurrentQuestionIndex(nextIdx);
            const nextQ = activeChapter.quiz.questions[nextIdx];
            setTimeLeft(nextQ.duration || 30);
            if (nextQ.type === 'matching') {
                setMatchingOrder(nextQ.pairs.map((_, i) => i).sort(() => Math.random() - 0.5));
            }
        } else {
            submitQuiz();
        }
    };

    const handleAnswer = (qIdx, ans) => {
        setUserAnswers(prev => ({ ...prev, [qIdx]: ans }));
    };

    const submitQuiz = async () => {
        if (!activeChapter?.quiz?.questions) return;

        let correctCount = 0;
        activeChapter.quiz.questions.forEach((q, idx) => {
            const ans = userAnswers[idx];
            if (q.type === 'multiple_choice' && ans === q.correctOption) correctCount++;
            else if (q.type === 'true_false' && ans === q.correctAnswer) correctCount++;
            else if (q.type === 'fill_in' && ans?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim()) correctCount++;
            else if (q.type === 'matching') {
                let isCorrect = true;
                q.pairs.forEach((p, pIdx) => {
                    if (ans?.[pIdx] !== pIdx) isCorrect = false;
                });
                if (isCorrect) correctCount++;
            }
        });

        const total = activeChapter.quiz.questions.length;
        const score = (correctCount / total) * 100;
        const passMark = activeChapter.quiz.passMark || 70;
        const passed = score >= passMark;

        setQuizResult({ score, passed });
        setQuizStarted(false);

        // --- UNLOCK NEXT CHAPTER ---
        if (passed) {
            try {
                // Find next chapter
                const currentIndex = chapters.findIndex(c => c.id === activeChapter.id);
                let nextChapterId = activeChapter.id;

                if (currentIndex !== -1 && currentIndex < chapters.length - 1) {
                    const nextChapter = chapters[currentIndex + 1];
                    nextChapterId = nextChapter.id; // Advance progress to next chapter ID
                }

                // Update Progress (Always update lastChapterId if advanced)
                // Logic: "lastChapterId" represents the FURTHEST unlocked chapter.
                // We only update if nextChapterId > current saved lastChapterId (simplified: just update for now)

                await setDoc(doc(db, 'users', user.uid, 'business_progress', courseId), {
                    courseId,
                    lastChapterId: nextChapterId,
                    updatedAt: serverTimestamp(),
                    status: currentIndex === chapters.length - 1 ? 'completed' : 'in-progress'
                }, { merge: true });

            } catch (err) {
                console.error("Error unlocking chapter:", err);
            }
        }
    };

    const retakeQuiz = () => {
        setQuizResult(null);
        setQuizStarted(false);
        setUserAnswers({});
        startQuiz();
    };

    const nextChapter = () => {
        const currentIndex = chapters.findIndex(c => c.id === activeChapter.id);
        if (currentIndex < chapters.length - 1) {
            const nextC = chapters[currentIndex + 1];
            setActiveChapter(nextC);
            setActiveMode('read');
            setQuizResult(null);
            setQuizStarted(false);
            setUserAnswers({});
            synth.current.cancel();
            setIsSpeaking(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;
    if (!course) return <div className="p-8">Course not found</div>;



    return (
        <div
            className="min-h-screen bg-[#FAF5E8] dark:bg-background-dark flex flex-col md:flex-row select-none overflow-hidden"
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Sidebar / Chapter List */}
            <aside className="w-full md:w-80 lg:w-96 bg-[#F5DEB3] dark:bg-[#1c1916] border-b md:border-b-0 md:border-r border-espresso/10 flex flex-col h-auto md:h-screen sticky top-0 shadow-xl z-20 shrink-0">
                <div className="p-6 md:p-8 border-b border-espresso/10 bg-white/20 backdrop-blur-sm">
                    <Link to="/business/dashboard" className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-1 hover:text-espresso transition-colors group">
                        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Back to Dashboard
                    </Link>
                    <h2 className="font-serif text-xl md:text-2xl font-black text-espresso dark:text-white leading-tight mb-6">
                        {course.title}
                    </h2>

                    {/* Progress Bar in Sidebar */}
                    <div className="space-y-2 p-4 bg-white/40 dark:bg-white/5 rounded-2xl border border-white/10 shadow-sm">
                        <div className="flex justify-between items-end">
                            <span className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest text-[8px]">Current Progress</span>
                            <span className="text-sm font-black text-espresso dark:text-white">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-espresso/5 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-espresso transition-all duration-700 ease-out shadow-[0_0_10px_rgba(44,38,34,0.3)]"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[40vh] md:max-h-none scrollbar-hide">
                    {chapters.map((chapter, index) => (
                        <button
                            key={chapter.id}
                            onClick={() => {
                                setActiveChapter(chapter);
                                setActiveMode('read');
                                synth.current.cancel();
                                setIsSpeaking(false);
                            }}
                            className={`w-full text-left p-4 rounded-2xl transition-all flex items-start gap-4 group ${activeChapter?.id === chapter.id
                                ? 'bg-espresso text-white shadow-xl shadow-espresso/20 scale-[1.02]'
                                : 'hover:bg-white/40 dark:hover:bg-white/5 text-espresso/80 dark:text-white/80 hover:translate-x-1'
                                }`}
                        >
                            <span className={`flex-shrink-0 size-8 rounded-xl flex items-center justify-center text-xs font-black ${activeChapter?.id === chapter.id ? 'bg-white/20 text-white' : 'bg-espresso/10 text-espresso/50'
                                }`}>
                                {(index + 1).toString().padStart(2, '0')}
                            </span>
                            <div className="flex-1 min-w-0">
                                <span className={`text-sm font-black line-clamp-2 leading-snug ${activeChapter?.id === chapter.id ? 'text-white' : 'text-espresso dark:text-white'}`}>{chapter.title}</span>
                                {chapter.quiz?.enabled && (
                                    <div className="flex items-center gap-1.5 mt-1 text-[8px] md:text-[10px] font-black opacity-40 uppercase tracking-widest text-espresso dark:text-white">
                                        <span className="material-symbols-outlined text-xs md:text-sm">timer</span>
                                        Quiz Assessment
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:h-screen overflow-y-auto scroll-smooth">
                {activeChapter ? (
                    <div className="p-6 md:p-12 lg:p-16 max-w-4xl mx-auto animate-fade-in">

                        {/* HEADER */}
                        <header className="mb-10 md:mb-16 border-b border-espresso/5 pb-8 md:pb-12">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.2em]">Chapter {(activeIndex + 1).toString().padStart(2, '0')}</span>
                                    <h1 className="font-serif text-3xl md:text-5xl font-black text-espresso dark:text-white leading-tight">
                                        {activeChapter.title}
                                    </h1>
                                </div>

                                {/* TTS & Tools */}
                                <div className="flex items-center gap-2 md:gap-3 bg-white/60 dark:bg-white/5 p-2 md:p-3 rounded-2xl shadow-xl border border-espresso/5 backdrop-blur-md self-start lg:self-center">
                                    {activeMode === 'read' && (
                                        <>
                                            <div className="flex bg-espresso/5 dark:bg-white/5 rounded-xl p-1 shrink-0">
                                                <button onClick={() => setSelectedGender('male')} className={`px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-black rounded-lg transition-all ${selectedGender === 'male' ? 'bg-white dark:bg-espresso text-espresso dark:text-white shadow-md' : 'text-espresso/40 dark:text-white/40'}`}>MALE</button>
                                                <button onClick={() => setSelectedGender('female')} className={`px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-black rounded-lg transition-all ${selectedGender === 'female' ? 'bg-white dark:bg-espresso text-espresso dark:text-white shadow-md' : 'text-espresso/40 dark:text-white/40'}`}>FEMALE</button>
                                            </div>
                                            <button onClick={handleSpeak} className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest text-white transition-all active:scale-95 shrink-0 ${isSpeaking ? 'bg-red-500 shadow-red-500/20' : 'bg-espresso shadow-espresso/20'}`}>
                                                <span className="material-symbols-outlined text-lg">{isSpeaking ? 'stop' : 'volume_up'}</span>
                                                {isSpeaking ? 'Stop' : 'Listen'}
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => setShowNotes(!showNotes)} className={cn("flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all active:scale-95 shrink-0", showNotes ? "bg-espresso text-white shadow-xl shadow-espresso/20" : "bg-espresso/5 text-espresso")}>
                                        <span className="material-symbols-outlined text-lg">{showNotes ? 'edit_note' : 'note_add'}</span>
                                        {showNotes ? 'Hide' : 'Notes'}
                                    </button>
                                </div>
                            </div>
                        </header>

                        {/* MODE SWITCHER: READ / QUIZ */}
                        {activeMode === 'read' ? (
                            <>
                                <article className="prose prose-stone dark:prose-invert max-w-none">
                                    {activeChapter.imageUrl && (
                                        <div className="relative group overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl mb-12 border-8 border-white/20">
                                            <img src={activeChapter.imageUrl} alt={activeChapter.title} className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    )}
                                    <div className="text-lg md:text-xl md:leading-relaxed text-espresso/80 dark:text-white/80 font-serif leading-relaxed" dangerouslySetInnerHTML={{ __html: activeChapter.content }} />
                                </article>

                                {/* NEXT / QUIZ ACTION */}
                                <div className="mt-16 md:mt-24 p-8 md:p-16 bg-white dark:bg-white/5 rounded-[2.5rem] md:rounded-[4rem] text-center border border-espresso/5 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-espresso/10 group-hover:bg-espresso transition-colors"></div>
                                    {activeChapter.quiz?.enabled ? (
                                        <div className="space-y-6 md:space-y-8">
                                            <div className="size-16 md:size-24 rounded-3xl bg-espresso/5 text-espresso flex items-center justify-center mx-auto mb-4">
                                                <span className="material-symbols-outlined text-3xl md:text-5xl">quiz</span>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-2xl md:text-4xl font-black font-serif text-espresso dark:text-white">Knowledge Check</h3>
                                                <p className="text-espresso/60 dark:text-white/40 max-w-md mx-auto text-sm md:text-base">
                                                    Complete this assessment to unlock the next chapter and validate your learning progress.
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-[9px] md:text-xs text-espresso/40 font-black uppercase tracking-[0.2em]">
                                                <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg text-espresso/20">timer</span> Timed Test</span>
                                                <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg text-espresso/20">checklist</span> {activeChapter.quiz.questions.length} Questions</span>
                                                <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg text-espresso/20">workspace_premium</span> {activeChapter.quiz.passMark}% Passing</span>
                                            </div>
                                            <button
                                                onClick={startQuiz}
                                                className="mt-4 px-10 md:px-16 py-4 md:py-6 bg-espresso text-white font-black text-xs md:text-sm uppercase tracking-widest rounded-2xl md:rounded-3xl shadow-2xl shadow-espresso/20 hover:shadow-espresso/40 hover:-translate-y-1 active:scale-95 transition-all"
                                            >
                                                Start Assessment
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 md:space-y-8">
                                            <div className="size-16 md:size-24 rounded-3xl bg-green-500/10 text-green-600 flex items-center justify-center mx-auto mb-4">
                                                <span className="material-symbols-outlined text-3xl md:text-5xl">check_circle</span>
                                            </div>
                                            <h3 className="text-2xl md:text-4xl font-black font-serif text-espresso dark:text-white">Chapter Completed</h3>
                                            <button
                                                onClick={() => {
                                                    const idx = chapters.findIndex(c => c.id === activeChapter.id);
                                                    if (idx < chapters.length - 1) setActiveChapter(chapters[idx + 1]);
                                                }}
                                                className="px-10 md:px-16 py-4 md:py-6 bg-espresso text-white font-black text-xs md:text-sm uppercase tracking-widest rounded-2xl md:rounded-3xl shadow-2xl shadow-espresso/20 hover:-translate-y-1 active:scale-95 transition-all"
                                            >
                                                Next Chapter &rarr;
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            // QUIZ MODE
                            <div className="animate-fade-in space-y-8 md:space-y-12">
                                {quizResult ? (
                                    // RESULT
                                    <div className="text-center py-16 md:py-24 animate-scale-in bg-white dark:bg-[#1c1916] rounded-[3rem] shadow-2xl border border-espresso/5 relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-full h-2 ${quizResult.passed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <div className={cn("inline-flex items-center justify-center size-24 md:size-32 rounded-[2.5rem] mb-8 shadow-2xl text-5xl", quizResult.passed ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600")}>
                                            <span className="material-symbols-outlined text-5xl md:text-7xl">{quizResult.passed ? 'emoji_events' : 'error'}</span>
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-serif font-black text-espresso dark:text-white mb-4 leading-tight">{quizResult.passed ? 'Excellent Work!' : 'Assessment Failed'}</h2>
                                        <div className="flex flex-col items-center gap-2 mb-12">
                                            <p className="text-[10px] md:text-xs font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em]">{quizResult.passed ? 'PASSED WITH SCORE' : 'FINAL SCORE'}</p>
                                            <span className={`text-4xl md:text-6xl font-black font-serif ${quizResult.passed ? 'text-green-600' : 'text-red-600'}`}>{quizResult.score.toFixed(0)}%</span>
                                        </div>

                                        {quizResult.passed ? (
                                            <button onClick={nextChapter} className="px-12 md:px-20 py-5 md:py-7 bg-espresso text-white font-black text-xs md:text-sm uppercase tracking-widest rounded-2xl md:rounded-3xl shadow-2xl shadow-espresso/20 hover:-translate-y-1 active:scale-95 transition-all">
                                                Continue Journey
                                            </button>
                                        ) : (
                                            <button onClick={retakeQuiz} className="px-12 md:px-20 py-5 md:py-7 bg-espresso text-white font-black text-xs md:text-sm uppercase tracking-widest rounded-2xl md:rounded-3xl shadow-2xl shadow-espresso/20 hover:-translate-y-1 active:scale-95 transition-all">
                                                Try Once More
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    // QUESTIONS
                                    <div className="space-y-6 md:space-y-10">
                                        <div className="flex items-center justify-between bg-white/80 dark:bg-[#1c1916]/80 p-5 md:p-8 rounded-[2rem] border border-espresso/10 sticky top-0 z-10 backdrop-blur-md shadow-lg">
                                            <div className="space-y-1">
                                                <p className="text-[9px] md:text-[10px] font-black text-espresso/40 uppercase tracking-widest">Question {currentQuestionIndex + 1}/{activeChapter.quiz.questions.length}</p>
                                                <div className="h-1.5 w-32 md:w-64 bg-espresso/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-espresso transition-all duration-500" style={{ width: `${((currentQuestionIndex + 1) / activeChapter.quiz.questions.length) * 100}%` }}></div>
                                                </div>
                                            </div>
                                            <div className={cn("flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-sm md:text-xl border transition-all", timeLeft < 10 ? "border-red-500 text-red-600 bg-red-50 animate-pulse" : "border-espresso/10 bg-white shadow-sm")}>
                                                <span className="material-symbols-outlined text-xl md:text-2xl">timer</span>
                                                {timeLeft}s
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-[#1c1916] p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] border border-espresso/5 shadow-2xl animate-scale-in">
                                            <h2 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white mb-10 md:mb-16 leading-tight">
                                                {activeChapter.quiz.questions[currentQuestionIndex].question}
                                            </h2>

                                            <div className="space-y-4 md:space-y-6">
                                                {/* RE-USE RENDERERS SIMPLIFIED */}
                                                {activeChapter.quiz.questions[currentQuestionIndex].type === 'multiple_choice' && (
                                                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                                                        {activeChapter.quiz.questions[currentQuestionIndex].options.map((opt, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => handleAnswer(currentQuestionIndex, i)}
                                                                className={cn(
                                                                    "p-5 md:p-8 rounded-2xl md:rounded-3xl border-2 text-left font-black transition-all flex items-center gap-4 group active:scale-[0.98]",
                                                                    userAnswers[currentQuestionIndex] === i
                                                                        ? "bg-espresso text-white border-espresso shadow-xl translate-x-1"
                                                                        : "bg-[#FAF5E8] dark:bg-black/20 border-transparent hover:border-espresso/30 hover:translate-x-1"
                                                                )}
                                                            >
                                                                <span className={cn("size-6 md:size-8 rounded-lg flex items-center justify-center text-[10px] md:text-xs font-black", userAnswers[currentQuestionIndex] === i ? "bg-white/20 text-white" : "bg-espresso text-white")}>
                                                                    {String.fromCharCode(65 + i)}
                                                                </span>
                                                                <span className="flex-1 md:text-lg">{opt}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {activeChapter.quiz.questions[currentQuestionIndex].type === 'true_false' && (
                                                    <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                                                        <button
                                                            onClick={() => handleAnswer(currentQuestionIndex, true)}
                                                            className={cn("flex-1 py-8 md:py-16 rounded-[2rem] md:rounded-[3rem] border-2 font-black text-2xl md:text-4xl transition-all shadow-lg active:scale-95", userAnswers[currentQuestionIndex] === true ? "bg-green-600 text-white border-green-600 translate-y-1" : "bg-[#FAF5E8] border-transparent")}
                                                        >
                                                            TRUE
                                                        </button>
                                                        <button
                                                            onClick={() => handleAnswer(currentQuestionIndex, false)}
                                                            className={cn("flex-1 py-8 md:py-16 rounded-[2rem] md:rounded-[3rem] border-2 font-black text-2xl md:text-4xl transition-all shadow-lg active:scale-95", userAnswers[currentQuestionIndex] === false ? "bg-red-600 text-white border-red-600 translate-y-1" : "bg-[#FAF5E8] border-transparent")}
                                                        >
                                                            FALSE
                                                        </button>
                                                    </div>
                                                )}
                                                {activeChapter.quiz.questions[currentQuestionIndex].type === 'fill_in' && (
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black text-espresso/40 uppercase tracking-widest block text-center">Type your answer below</label>
                                                        <input
                                                            autoFocus
                                                            className="w-full p-6 md:p-10 bg-[#FAF5E8] dark:bg-black/20 border-2 border-espresso/10 rounded-2xl md:rounded-[2.5rem] text-2xl md:text-5xl font-black text-center focus:border-espresso focus:outline-none transition-all placeholder:text-espresso/10 text-espresso dark:text-white uppercase tracking-widest shadow-inner"
                                                            value={userAnswers[currentQuestionIndex] || ''}
                                                            onChange={e => handleAnswer(currentQuestionIndex, e.target.value)}
                                                            placeholder="..."
                                                        />
                                                    </div>
                                                )}
                                                {activeChapter.quiz.questions[currentQuestionIndex].type === 'matching' && (
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                                                        <div className="space-y-3">
                                                            <p className="text-[10px] font-black text-espresso/40 uppercase tracking-widest mb-4">Static Column</p>
                                                            {activeChapter.quiz.questions[currentQuestionIndex].pairs.map((p, i) => (
                                                                <div key={i} className="p-4 md:p-6 bg-white dark:bg-black/40 border border-espresso/5 rounded-2xl font-black text-espresso dark:text-white shadow-sm flex items-center gap-4">
                                                                    <span className="size-6 bg-espresso text-white rounded-lg flex items-center justify-center text-[10px]">{i + 1}</span>
                                                                    {p.key}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="space-y-3">
                                                            <p className="text-[10px] font-black text-espresso/40 uppercase tracking-widest mb-4">Match the correct order</p>
                                                            {(matchingOrder || []).map((matchedIdx, i) => (
                                                                <div key={i} className="flex gap-2">
                                                                    <div className="flex-1 p-4 md:p-6 bg-espresso text-white rounded-2xl font-black shadow-xl flex items-center justify-between group/match">
                                                                        <span className="truncate">{activeChapter.quiz.questions[currentQuestionIndex].pairs[matchedIdx].value}</span>
                                                                        <div className="flex items-center gap-1 opacity-40 group-hover/match:opacity-100 transition-opacity">
                                                                            <button onClick={() => {
                                                                                if (i === 0) return;
                                                                                const newOrder = [...matchingOrder];
                                                                                [newOrder[i], newOrder[i - 1]] = [newOrder[i - 1], newOrder[i]];
                                                                                setMatchingOrder(newOrder);
                                                                                handleAnswer(currentQuestionIndex, newOrder);
                                                                            }} className="size-6 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors">▲</button>
                                                                            <button onClick={() => {
                                                                                if (i === matchingOrder.length - 1) return;
                                                                                const newOrder = [...matchingOrder];
                                                                                [newOrder[i], newOrder[i + 1]] = [newOrder[i + 1], newOrder[i]];
                                                                                setMatchingOrder(newOrder);
                                                                                handleAnswer(currentQuestionIndex, newOrder);
                                                                            }} className="size-6 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors">▼</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-12 md:mt-20 flex justify-center">
                                                <button onClick={handleNextQuestion} className="px-12 md:px-20 py-4 md:py-6 bg-espresso text-white font-black text-xs md:text-sm uppercase tracking-widest rounded-2xl md:rounded-3xl shadow-2xl shadow-espresso/20 hover:-translate-y-1 active:scale-95 transition-all">
                                                    {currentQuestionIndex === activeChapter.quiz.questions.length - 1 ? 'Finalize & Submit' : 'Next Question'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-espresso/20 dark:text-white/20 p-8 text-center">
                        <span className="material-symbols-outlined text-[80px] md:text-[120px] mb-8 animate-pulse">auto_stories</span>
                        <h2 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white mb-2">Ready to learn?</h2>
                        <p className="text-sm md:text-lg max-w-sm">Select a chapter from the sidebar to begin your premium brewing education.</p>
                    </div>
                )}
            </main>

            {/* Rich Text Notes Drawer */}
            <div className={cn(
                "fixed inset-y-0 right-0 w-full md:w-[400px] lg:w-[500px] bg-[#FAF5E8] dark:bg-[#1c1916] shadow-[0_0_100px_rgba(0,0,0,0.2)] z-[100] transform transition-transform duration-500 flex flex-col",
                showNotes ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="p-6 md:p-8 border-b border-espresso/10 flex items-center justify-between bg-white dark:bg-black/20">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-espresso text-white flex items-center justify-center shadow-lg shadow-espresso/20">
                            <span className="material-symbols-outlined">edit_note</span>
                        </div>
                        <div>
                            <h2 className="font-serif font-black text-espresso dark:text-white uppercase tracking-widest text-xs md:text-base leading-none mb-1">Learning Notes</h2>
                            <p className="text-[10px] text-espresso/40 uppercase tracking-widest leading-none">Your personal study guide</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowNotes(false)}
                        className="size-10 flex items-center justify-center hover:bg-black/5 rounded-xl text-espresso/40 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden p-6 md:p-8">
                    {user && activeChapter && (
                        <div className="h-full bg-white dark:bg-black/20 rounded-[2rem] shadow-inner overflow-hidden border border-espresso/5">
                            <NoteEditor
                                userId={user.uid}
                                noteKey={`notes_biz_${courseId}_${activeChapter.id}`}
                                title={activeChapter.title}
                                className="h-full"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Overlay for Notes */}
            {showNotes && (
                <div
                    className="fixed inset-0 bg-espresso/20 backdrop-blur-sm z-[90] transition-opacity duration-500 animate-fade-in"
                    onClick={() => setShowNotes(false)}
                />
            )}
        </div>
    );
}
