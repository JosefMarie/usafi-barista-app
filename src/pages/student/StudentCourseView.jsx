import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

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

    useEffect(() => {
        const fetchModule = async () => {
            if (!courseId || !moduleId || !user) return;

            try {
                // Verify Access (Optional: Check assignments again or trust MyCourses)
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
            if (userAnswers[idx] === q.correctOption) {
                correctCount++;
            }
        });

        const total = module.quiz.questions.length;
        const score = (correctCount / total) * 100;
        const passMark = module.quiz.passMark || 70;
        const passed = score >= passMark;

        setQuizResult({ score, passed });

        // Save Progress
        try {
            await setDoc(doc(db, 'users', user.uid, 'progress', moduleId), {
                courseId,
                moduleId,
                score,
                passed,
                completedAt: serverTimestamp(),
                status: passed ? 'completed' : 'failed'
            });
        } catch (error) {
            console.error("Error saving progress:", error);
        }
    };

    const retakeModule = () => {
        setShowQuiz(false);
        setCurrentSlide(0);
        setUserAnswers({});
        setQuizResult(null);
        window.scrollTo(0, 0);
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;

    if (!module) return null;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-[#1e1e1e] border-b border-black/5 dark:border-white/5 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/student/courses')} className="p-2 hover:bg-black/5 rounded-full dark:text-white">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="font-serif font-bold text-espresso dark:text-white text-lg">{module.title}</h1>
                        <p className="text-xs text-espresso/60 dark:text-white/60">Module Progress: {showQuiz ? 'Assessment' : `${currentSlide + 1} / ${module.content?.length || 0}`}</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-4xl mx-auto w-full p-6 pb-24">

                {/* QUIZ MODE */}
                {showQuiz ? (
                    <div className="animate-fade-in space-y-8">
                        {!quizResult ? (
                            <>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 text-center">
                                    <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">Module Assessment</h2>
                                    <p className="text-blue-700 dark:text-blue-300">
                                        Answer the following questions to complete this module.
                                        You need <span className="font-bold">{module.quiz?.passMark || 70}%</span> to pass.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {module.quiz?.questions?.map((q, idx) => (
                                        <div key={idx} className="bg-white dark:bg-[#2c2825] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                                            <p className="font-bold text-lg text-espresso dark:text-white mb-4">
                                                <span className="text-primary mr-2">{idx + 1}.</span>
                                                {q.question}
                                            </p>
                                            <div className="space-y-3">
                                                {q.options.map((opt, optIdx) => (
                                                    <label
                                                        key={optIdx}
                                                        className={cn(
                                                            "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                                                            userAnswers[idx] === optIdx
                                                                ? "bg-primary/5 border-primary"
                                                                : "bg-gray-50 dark:bg-white/5 border-transparent hover:bg-gray-100"
                                                        )}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`question-${idx}`}
                                                            checked={userAnswers[idx] === optIdx}
                                                            onChange={() => handleAnswer(idx, optIdx)}
                                                            className="w-5 h-5 accent-primary"
                                                        />
                                                        <span className="text-espresso dark:text-white">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-6">
                                    <button
                                        onClick={submitQuiz}
                                        disabled={Object.keys(userAnswers).length < (module.quiz?.questions?.length || 0)}
                                        className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Submit Assessment
                                    </button>
                                </div>
                            </>
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
                                    <p className="text-lg leading-relaxed text-espresso/80 dark:text-white/80 whitespace-pre-wrap">
                                        {module.content[currentSlide].text}
                                    </p>
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
                )}
            </main>

            {/* Sticky Navigation Footer (Only in Slide Mode) */}
            {!showQuiz && (
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
            )}
        </div>
    );
}
