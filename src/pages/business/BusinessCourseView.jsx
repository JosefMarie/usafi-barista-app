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
            className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col md:flex-row select-none"
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Sidebar / Chapter List */}
            <aside className="w-full md:w-80 bg-[#F5DEB3] dark:bg-[#1c1916] border-r border-espresso/10 flex flex-col h-[40vh] md:h-screen sticky top-0 shadow-2xl z-20">
                <div className="p-8 border-b border-espresso/10 bg-white/20 backdrop-blur-sm">
                    <Link to="/business/dashboard" className="text-[10px] font-black text-espresso/50 dark:text-white/50 uppercase tracking-[0.2em] mb-4 block hover:text-espresso transition-colors">
                        &larr; Back to Dashboard
                    </Link>
                    <h2 className="font-serif text-2xl font-bold text-espresso dark:text-white leading-tight mb-6">
                        {course.title}
                    </h2>

                    {/* Progress Bar in Sidebar */}
                    <div className="space-y-2 p-4 bg-white/40 dark:bg-white/5 rounded-2xl border border-white/20">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-espresso/60 dark:text-white/60 uppercase tracking-widest">Your Progress</span>
                            <span className="text-sm font-black text-espresso dark:text-white">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-espresso/5 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-espresso transition-all duration-700 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {chapters.map((chapter, index) => (
                        <button
                            key={chapter.id}
                            onClick={() => {
                                setActiveChapter(chapter);
                                setActiveMode('read');
                                synth.current.cancel();
                                setIsSpeaking(false);
                            }}
                            className={`w-full text-left p-4 rounded-[1.25rem] transition-all flex items-start gap-4 group ${activeChapter?.id === chapter.id
                                ? 'bg-espresso text-white shadow-xl shadow-espresso/20 scale-[1.02]'
                                : 'hover:bg-white/40 dark:hover:bg-white/5 text-espresso/80 dark:text-white/80 hover:translate-x-1'
                                }`}
                        >
                            <span className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-black ${activeChapter?.id === chapter.id ? 'bg-white/20 text-white' : 'bg-espresso/10 text-espresso/50'
                                }`}>
                                {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <span className={`text-sm font-bold line-clamp-2 ${activeChapter?.id === chapter.id ? 'text-white' : 'text-espresso dark:text-white'}`}>{chapter.title}</span>
                                {chapter.quiz?.enabled && (
                                    <div className="flex items-center gap-1 mt-1 text-[10px] font-medium opacity-60 uppercase tracking-wide">
                                        <span className="material-symbols-outlined text-[10px]">timer</span>
                                        Quiz
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto h-screen">
                {activeChapter ? (
                    <div className="max-w-3xl mx-auto animate-fadeIn">

                        {/* HEADER */}
                        <header className="mb-8 border-b border-black/5 dark:border-white/5 pb-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h1 className="font-serif text-3xl font-bold text-espresso dark:text-white">
                                    {activeChapter.title}
                                </h1>

                                {/* TTS & Tools */}
                                <div className="flex items-center gap-3 bg-white dark:bg-white/5 p-2 rounded-xl shadow-sm border border-black/5 dark:border-white/5">
                                    {activeMode === 'read' && (
                                        <>
                                            <div className="flex bg-gray-100 dark:bg-white/10 rounded-lg p-1">
                                                <button onClick={() => setSelectedGender('male')} className={`px-3 py-1 text-xs font-bold rounded-md ${selectedGender === 'male' ? 'bg-white shadow' : 'opacity-50'}`}>Male</button>
                                                <button onClick={() => setSelectedGender('female')} className={`px-3 py-1 text-xs font-bold rounded-md ${selectedGender === 'female' ? 'bg-white shadow' : 'opacity-50'}`}>Female</button>
                                            </div>
                                            <button onClick={handleSpeak} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white ${isSpeaking ? 'bg-red-500' : 'bg-primary'}`}>
                                                <span className="material-symbols-outlined text-lg">{isSpeaking ? 'stop' : 'volume_up'}</span>
                                                {isSpeaking ? 'Stop' : 'Listen'}
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => setShowNotes(!showNotes)} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm", showNotes ? "bg-primary text-white" : "bg-primary/10 text-primary")}>
                                        <span className="material-symbols-outlined">{showNotes ? 'edit_note' : 'note_add'}</span>
                                        {showNotes ? 'Hide' : 'Notes'}
                                    </button>
                                </div>
                            </div>
                        </header>

                        {/* MODE SWITCHER: READ / QUIZ */}
                        {activeMode === 'read' ? (
                            <>
                                <div className="prose dark:prose-invert max-w-none">
                                    {activeChapter.imageUrl && (
                                        <img src={activeChapter.imageUrl} alt={activeChapter.title} className="w-full h-auto rounded-2xl shadow-lg mb-8" />
                                    )}
                                    <div className="text-lg leading-relaxed text-espresso/80 dark:text-white/80 font-serif" dangerouslySetInnerHTML={{ __html: activeChapter.content }} />
                                </div>

                                {/* NEXT / QUIZ ACTION */}
                                <div className="mt-12 p-8 bg-gray-50 dark:bg-white/5 rounded-3xl text-center border border-black/5 dark:border-white/5">
                                    {activeChapter.quiz?.enabled ? (
                                        <div className="space-y-4">
                                            <h3 className="text-2xl font-bold font-serif text-espresso dark:text-white">Knowledge Check</h3>
                                            <p className="text-espresso/60 dark:text-white/60 max-w-md mx-auto">
                                                To complete this chapter and unlock the next one, you must pass the assessment.
                                            </p>
                                            <div className="flex justify-center gap-4 text-sm text-espresso/50 font-bold uppercase tracking-wider">
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">timer</span> Timed</span>
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">checklist</span> {activeChapter.quiz.questions.length} Questions</span>
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">percent</span> {activeChapter.quiz.passMark}% Passing</span>
                                            </div>
                                            <button
                                                onClick={startQuiz}
                                                className="mt-4 px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-dark transition-all transform hover:-translate-y-1"
                                            >
                                                Start Assessment
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <h3 className="text-2xl font-bold font-serif text-espresso dark:text-white">Chapter Completed</h3>
                                            <button
                                                onClick={() => {
                                                    // Manually trigger unlock if no quiz
                                                    // For now, simpler: just let them click next if it exists
                                                    const idx = chapters.findIndex(c => c.id === activeChapter.id);
                                                    if (idx < chapters.length - 1) setActiveChapter(chapters[idx + 1]);
                                                }}
                                                className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-dark"
                                            >
                                                Next Chapter &rarr;
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            // QUIZ MODE
                            <div className="animate-fade-in space-y-8">
                                {quizResult ? (
                                    // RESULT
                                    <div className="text-center py-10 animate-scale-in">
                                        <div className={cn("inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 shadow-xl text-5xl", quizResult.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
                                            <span className="material-symbols-outlined text-6xl">{quizResult.passed ? 'emoji_events' : 'sentiment_dissatisfied'}</span>
                                        </div>
                                        <h2 className="text-3xl font-serif font-bold text-espresso dark:text-white mb-2">{quizResult.passed ? 'Assessment Passed!' : 'Assessment Failed'}</h2>
                                        <p className="text-xl text-espresso/60 mb-8">Score: <span className="font-bold">{quizResult.score.toFixed(0)}%</span></p>

                                        {quizResult.passed ? (
                                            <button onClick={nextChapter} className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700">Continue to Next Chapter</button>
                                        ) : (
                                            <button onClick={retakeQuiz} className="px-8 py-3 bg-espresso text-white font-bold rounded-xl shadow-lg">Try Again</button>
                                        )}
                                    </div>
                                ) : (
                                    // QUESTIONS
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between bg-white dark:bg-white/5 p-4 rounded-2xl border border-black/5 sticky top-0 z-10 backdrop-blur-md">
                                            <div className="text-sm font-bold text-primary">Question {currentQuestionIndex + 1}/{activeChapter.quiz.questions.length}</div>
                                            <div className={cn("flex items-center gap-2 px-3 py-1 rounded-lg font-mono font-bold border", timeLeft < 10 ? "border-red-500 text-red-500 bg-red-50" : "border-gray-200")}>
                                                <span className="material-symbols-outlined text-sm">timer</span>{timeLeft}s
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-black/5 shadow-xl animate-scale-in">
                                            <h2 className="text-2xl font-serif font-bold text-espresso dark:text-white mb-8">
                                                {activeChapter.quiz.questions[currentQuestionIndex].question}
                                            </h2>

                                            <div className="space-y-4">
                                                {/* RE-USE RENDERERS SIMPLIFIED */}
                                                {activeChapter.quiz.questions[currentQuestionIndex].type === 'multiple_choice' && (
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {activeChapter.quiz.questions[currentQuestionIndex].options.map((opt, i) => (
                                                            <button key={i} onClick={() => handleAnswer(currentQuestionIndex, i)} className={cn("p-4 rounded-xl border-2 text-left font-medium transition-all", userAnswers[currentQuestionIndex] === i ? "bg-primary text-white border-primary" : "bg-gray-50 dark:bg-white/5 border-transparent")}>
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {activeChapter.quiz.questions[currentQuestionIndex].type === 'true_false' && (
                                                    <div className="flex gap-4">
                                                        <button onClick={() => handleAnswer(currentQuestionIndex, true)} className={cn("flex-1 py-8 rounded-2xl border-2 font-bold text-xl", userAnswers[currentQuestionIndex] === true ? "bg-green-600 text-white border-green-600" : "bg-gray-50 border-transparent")}>TRUE</button>
                                                        <button onClick={() => handleAnswer(currentQuestionIndex, false)} className={cn("flex-1 py-8 rounded-2xl border-2 font-bold text-xl", userAnswers[currentQuestionIndex] === false ? "bg-red-600 text-white border-red-600" : "bg-gray-50 border-transparent")}>FALSE</button>
                                                    </div>
                                                )}
                                                {activeChapter.quiz.questions[currentQuestionIndex].type === 'fill_in' && (
                                                    <input
                                                        autoFocus
                                                        className="w-full p-4 bg-gray-50 dark:bg-white/5 border-2 border-primary/20 rounded-xl text-xl font-bold text-center focus:border-primary focus:outline-none"
                                                        value={userAnswers[currentQuestionIndex] || ''}
                                                        onChange={e => handleAnswer(currentQuestionIndex, e.target.value)}
                                                    />
                                                )}
                                                {activeChapter.quiz.questions[currentQuestionIndex].type === 'matching' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            {activeChapter.quiz.questions[currentQuestionIndex].pairs.map((p, i) => (
                                                                <div key={i} className="p-3 bg-gray-100 dark:bg-white/10 rounded-lg font-bold">{p.key}</div>
                                                            ))}
                                                        </div>
                                                        <div className="space-y-2">
                                                            {(matchingOrder || []).map((matchedIdx, i) => (
                                                                <div key={i} className="flex gap-2">
                                                                    <div className="flex-1 p-3 bg-primary/10 border border-primary/20 rounded-lg font-bold text-primary">
                                                                        {activeChapter.quiz.questions[currentQuestionIndex].pairs[matchedIdx].value}
                                                                    </div>
                                                                    <div className="flex flex-col gap-1">
                                                                        <button onClick={() => {
                                                                            if (i === 0) return;
                                                                            const newOrder = [...matchingOrder];
                                                                            [newOrder[i], newOrder[i - 1]] = [newOrder[i - 1], newOrder[i]];
                                                                            setMatchingOrder(newOrder);
                                                                            handleAnswer(currentQuestionIndex, newOrder);
                                                                        }} className="text-xs">▲</button>
                                                                        <button onClick={() => {
                                                                            if (i === matchingOrder.length - 1) return;
                                                                            const newOrder = [...matchingOrder];
                                                                            [newOrder[i], newOrder[i + 1]] = [newOrder[i + 1], newOrder[i]];
                                                                            setMatchingOrder(newOrder);
                                                                            handleAnswer(currentQuestionIndex, newOrder);
                                                                        }} className="text-xs">▼</button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-8 flex justify-end">
                                                <button onClick={handleNextQuestion} className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-dark">
                                                    {currentQuestionIndex === activeChapter.quiz.questions.length - 1 ? 'Submit' : 'Next'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-espresso/50 dark:text-white/50">
                        <span className="material-symbols-outlined text-6xl mb-4">menu_book</span>
                        <p className="text-xl">Select a chapter to begin reading</p>
                    </div>
                )}
            </main>


            {/* Rich Text Notes Drawer */}
            <div className={cn(
                "fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-[#1e1e1e] shadow-2xl z-[100] transform transition-transform duration-300 border-l border-black/5 dark:border-white/5 flex flex-col",
                showNotes ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-black/20">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">description</span>
                        <h2 className="font-serif font-bold text-espresso dark:text-white">Chapter Notes</h2>
                    </div>
                    <button
                        onClick={() => setShowNotes(false)}
                        className="p-2 hover:bg-black/10 rounded-full text-espresso/40 dark:text-white/40"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden">
                    {user && activeChapter && (
                        <NoteEditor
                            userId={user.uid}
                            noteKey={`notes_biz_${courseId}_${activeChapter.id}`}
                            title={activeChapter.title}
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
