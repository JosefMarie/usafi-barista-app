import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { RichTextEditor } from '../../components/common/RichTextEditor';

export function ManageModule() {
    const { courseId, moduleId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [module, setModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('content'); // content, quiz, assignments

    // Duration State
    const [duration, setDuration] = useState(0);

    // Progress State
    const [studentProgress, setStudentProgress] = useState({});

    // Content State
    const [slides, setSlides] = useState([]);

    // Quiz State
    const [quiz, setQuiz] = useState({ questions: [], passMark: 70 });

    // Assignments State
    const [students, setStudents] = useState([]);
    const [assignedStudents, setAssignedStudents] = useState([]);

    useEffect(() => {
        const fetchModuleData = async () => {
            if (!courseId || !moduleId) return;

            // Allow time for Firebase connection
            try {
                // Fetch Module
                const modRef = doc(db, 'courses', courseId, 'modules', moduleId);
                const modSnap = await getDoc(modRef);

                if (modSnap.exists()) {
                    const data = modSnap.data();
                    setModule({ id: modSnap.id, ...data });
                    setSlides(data.content || []);
                    setQuiz(data.quiz || { questions: [], passMark: 70 });
                    setAssignedStudents(data.assignedStudents || []);
                    setDuration(data.duration || 0);
                } else {
                    // Create if not exists (fallback) or redirect
                    console.log("Module not found, creating placeholder in memory");
                    setModule({ id: moduleId, title: 'Loading...', status: 'draft' });
                }

                // Fetch All Students
                const q = query(collection(db, 'users'), where('role', '==', 'student'));
                const studentSnaps = await getDocs(q);
                setStudents(studentSnaps.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
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

    // --- Content Handlers ---
    const addSlide = () => {
        setSlides([...slides, { title: '', text: '', image: '' }]);
    };

    const updateSlide = (index, field, value) => {
        const newSlides = [...slides];
        newSlides[index][field] = value;
        setSlides(newSlides);
    };

    const removeSlide = (index) => {
        setSlides(slides.filter((_, i) => i !== index));
    };

    // --- Quiz Handlers ---
    const addQuestion = (type = 'multiple_choice') => {
        const questionBase = {
            type,
            question: '',
            duration: 30, // Default 30 seconds
        };

        let specificData = {};
        if (type === 'multiple_choice') {
            specificData = { options: ['', '', '', ''], correctOption: 0 };
        } else if (type === 'true_false') {
            specificData = { correctAnswer: true };
        } else if (type === 'fill_in') {
            specificData = { correctAnswer: '' };
        } else if (type === 'matching') {
            specificData = { pairs: [{ key: '', value: '' }, { key: '', value: '' }] };
        }

        setQuiz(prev => ({
            ...prev,
            questions: [...prev.questions, { ...questionBase, ...specificData }]
        }));
    };

    const updateQuestion = (qIndex, field, value) => {
        const newQuestions = [...quiz.questions];
        newQuestions[qIndex][field] = value;
        setQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const updateOption = (qIndex, oIndex, value) => {
        const newQuestions = [...quiz.questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const updatePair = (qIndex, pIndex, field, value) => {
        const newQuestions = [...quiz.questions];
        newQuestions[qIndex].pairs[pIndex][field] = value;
        setQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const addPair = (qIndex) => {
        const newQuestions = [...quiz.questions];
        newQuestions[qIndex].pairs.push({ key: '', value: '' });
        setQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const removePair = (qIndex, pIndex) => {
        const newQuestions = [...quiz.questions];
        newQuestions[qIndex].pairs = newQuestions[qIndex].pairs.filter((_, i) => i !== pIndex);
        setQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const removeQuestion = (qIndex) => {
        setQuiz(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== qIndex)
        }));
    };

    // --- Assignment Handlers ---
    const toggleAssignment = (studentId) => {
        if (assignedStudents.includes(studentId)) {
            setAssignedStudents(prev => prev.filter(id => id !== studentId));
        } else {
            setAssignedStudents(prev => [...prev, studentId]);
        }
    };

    // --- Save Handler ---
    const handleSave = async () => {
        try {
            setLoading(true);
            const modRef = doc(db, 'courses', courseId, 'modules', moduleId);
            await updateDoc(modRef, {
                content: slides,
                quiz: quiz,
                assignedStudents: assignedStudents,
                duration: parseInt(duration),
                updatedAt: serverTimestamp()
            });
            alert('Changes saved successfully!');
        } catch (error) {
            console.error("Error saving module:", error);
            alert('Error saving changes.');
        } finally {
            setLoading(false);
        }
    };

    const togglePublish = async () => {
        const newStatus = module.status === 'published' ? 'draft' : 'published';
        try {
            await updateDoc(doc(db, 'courses', courseId, 'modules', moduleId), { status: newStatus });
            setModule(prev => ({ ...prev, status: newStatus }));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Module...</div>;

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-y-auto">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-primary/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/courses')}
                        className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <span className="material-symbols-outlined text-espresso dark:text-white">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-serif font-bold text-espresso dark:text-white">{module?.title}</h1>
                        <p className="text-xs text-espresso/60 dark:text-white/60">Module Management</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={togglePublish}
                        className={cn(
                            "px-4 py-2 font-bold text-sm rounded-lg transition-colors border",
                            module?.status === 'published'
                                ? "bg-white text-green-600 border-green-200 hover:bg-green-50"
                                : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50"
                        )}
                    >
                        {module?.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow-md hover:bg-primary-dark transition-colors"
                    >
                        Save All Changes
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-white/5 px-6 bg-white dark:bg-[#1e1e1e]">
                {['content', 'quiz', 'assignments'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-6 py-3 text-sm font-bold capitalize border-b-2 transition-colors",
                            activeTab === tab
                                ? "border-primary text-primary"
                                : "border-transparent text-espresso/60 dark:text-white/60 hover:text-espresso dark:hover:text-white"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <main className="p-6 max-w-5xl mx-auto w-full pb-20">

                {/* CONTENT TAB */}
                {activeTab === 'content' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/10">
                            <div>
                                <h2 className="text-lg font-bold text-espresso dark:text-white">Slide Content</h2>
                                <p className="text-xs text-espresso/60 dark:text-white/60">Manage the educational slides for this module.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-bold text-espresso/70 dark:text-white/70">Duration (mins):</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="w-20 p-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-center font-bold"
                                    />
                                </div>
                                <button onClick={addSlide} className="flex items-center gap-2 bg-white dark:bg-white/10 px-3 py-2 rounded-lg text-sm font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20 shadow-sm">
                                    <span className="material-symbols-outlined text-primary">add_circle</span> Add Slide
                                </button>
                            </div>
                        </div>

                        {slides.map((slide, index) => (
                            <div key={index} className="bg-white dark:bg-[#2c2825] p-6 rounded-xl border border-black/5 dark:border-white/5 relative group">
                                <button onClick={() => removeSlide(index)} className="absolute top-4 right-4 text-red-400 hover:text-red-500 p-1">
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                                <div className="space-y-4">
                                    <div className="flex gap-2 items-center">
                                        <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</span>
                                        <input
                                            className="flex-1 font-bold text-lg bg-transparent border-b border-transparent focus:border-primary/50 outline-none"
                                            placeholder="Slide Title..."
                                            value={slide.title}
                                            onChange={(e) => updateSlide(index, 'title', e.target.value)}
                                        />
                                    </div>
                                    <RichTextEditor
                                        value={slide.text}
                                        onChange={(val) => updateSlide(index, 'text', val)}
                                        placeholder="Slide Text / Content..."
                                        className="border-gray-200 dark:border-white/10"
                                        minHeight="150px"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 p-2 rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm"
                                            placeholder="Image URL (Optional)"
                                            value={slide.image}
                                            onChange={(e) => updateSlide(index, 'image', e.target.value)}
                                        />
                                        {slide.image && <img src={slide.image} alt="Preview" className="h-10 w-10 object-cover rounded-lg border border-gray-200" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {slides.length === 0 && <div className="text-center text-espresso/50 py-10 border-2 border-dashed border-gray-200 rounded-xl">No slides yet. Add one to get started.</div>}
                    </div>
                )}

                {/* QUIZ TAB */}
                {activeTab === 'quiz' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <div>
                                <h3 className="font-bold text-blue-800 dark:text-blue-200">Passing Score</h3>
                                <p className="text-xs text-blue-600 dark:text-blue-300">Minimum score required to unlock next module</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={quiz.passMark}
                                    onChange={(e) => setQuiz({ ...quiz, passMark: parseInt(e.target.value) })}
                                    className="w-20 p-2 text-center font-bold rounded-lg border border-blue-200 dark:border-blue-800 dark:bg-black/20"
                                />
                                <span className="font-bold text-blue-800 dark:text-blue-200">%</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-6">
                            <h2 className="text-lg font-bold text-espresso dark:text-white">Questions</h2>
                            <div className="flex gap-2">
                                <select
                                    onChange={(e) => addQuestion(e.target.value)}
                                    className="bg-white dark:bg-white/10 px-3 py-1.5 rounded-lg text-sm font-bold border border-gray-200 dark:border-white/10 outline-none"
                                    defaultValue=""
                                >
                                    <option value="" disabled>+ Add Question</option>
                                    <option value="multiple_choice">Multiple Choice</option>
                                    <option value="true_false">True / False</option>
                                    <option value="fill_in">Fill in the Blank</option>
                                    <option value="matching">Matching</option>
                                </select>
                            </div>
                        </div>

                        {quiz.questions.map((q, qIndex) => (
                            <div key={qIndex} className="bg-white dark:bg-[#2c2825] p-6 rounded-xl border border-black/5 dark:border-white/5 relative">
                                <button onClick={() => removeQuestion(qIndex)} className="absolute top-4 right-4 text-red-400 hover:text-red-500 p-1">
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold uppercase text-espresso/50 mb-1 block">Question {qIndex + 1}</label>
                                        <input
                                            className="w-full p-2 font-medium bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg"
                                            placeholder="Enter question text..."
                                            value={q.question}
                                            onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-espresso/50 mb-1 block">Duration (Secs)</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 font-medium bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg"
                                            value={q.duration}
                                            onChange={(e) => updateQuestion(qIndex, 'duration', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* QUESTION TYPE UI */}
                                {q.type === 'multiple_choice' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {q.options.map((opt, oIndex) => (
                                            <div key={oIndex} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name={`correct-${qIndex}`}
                                                    checked={q.correctOption === oIndex}
                                                    onChange={() => updateQuestion(qIndex, 'correctOption', oIndex)}
                                                    className="accent-primary"
                                                />
                                                <input
                                                    className="flex-1 p-2 text-sm bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg"
                                                    placeholder={`Option ${oIndex + 1}`}
                                                    value={opt}
                                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'true_false' && (
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => updateQuestion(qIndex, 'correctAnswer', true)}
                                            className={cn(
                                                "flex-1 py-3 rounded-xl border-2 font-bold transition-all",
                                                q.correctAnswer === true ? "bg-primary/10 border-primary text-primary" : "border-gray-100 dark:border-white/5 opacity-50"
                                            )}
                                        >
                                            True
                                        </button>
                                        <button
                                            onClick={() => updateQuestion(qIndex, 'correctAnswer', false)}
                                            className={cn(
                                                "flex-1 py-3 rounded-xl border-2 font-bold transition-all",
                                                q.correctAnswer === false ? "bg-red-50 border-red-200 text-red-600" : "border-gray-100 dark:border-white/5 opacity-50"
                                            )}
                                        >
                                            False
                                        </button>
                                    </div>
                                )}

                                {q.type === 'fill_in' && (
                                    <input
                                        className="w-full p-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl font-bold text-primary"
                                        placeholder="Correct Answer..."
                                        value={q.correctAnswer}
                                        onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                                    />
                                )}

                                {q.type === 'matching' && (
                                    <div className="space-y-3">
                                        {q.pairs.map((pair, pIndex) => (
                                            <div key={pIndex} className="flex gap-2">
                                                <input
                                                    className="flex-1 p-2 text-sm bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg"
                                                    placeholder="Item A"
                                                    value={pair.key}
                                                    onChange={(e) => updatePair(qIndex, pIndex, 'key', e.target.value)}
                                                />
                                                <span className="material-symbols-outlined text-espresso/20 self-center">link</span>
                                                <input
                                                    className="flex-1 p-2 text-sm bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg"
                                                    placeholder="Match with B"
                                                    value={pair.value}
                                                    onChange={(e) => updatePair(qIndex, pIndex, 'value', e.target.value)}
                                                />
                                                <button onClick={() => removePair(qIndex, pIndex)} className="text-red-400">
                                                    <span className="material-symbols-outlined text-sm">remove_circle</span>
                                                </button>
                                            </div>
                                        ))}
                                        <button onClick={() => addPair(qIndex)} className="text-xs font-bold text-primary flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">add</span> Add Pair
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ASSIGNMENTS TAB */}
                {activeTab === 'assignments' && (
                    <div className="space-y-6">
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 mb-4">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                <span className="font-bold">Note:</span> Logic dictates that students must complete Module 1 to see Module 2, etc.
                                However, assigning a user here manually grants them access regardless of progress in previous modules.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-[#2c2825] rounded-xl border border-black/5 dark:border-white/5 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                    <tr>
                                        <th className="p-4 text-xs font-bold uppercase text-espresso/50">Student</th>
                                        <th className="p-4 text-xs font-bold uppercase text-espresso/50">Email</th>
                                        <th className="p-4 text-xs font-bold uppercase text-espresso/50">Progress</th>
                                        <th className="p-4 text-xs font-bold uppercase text-espresso/50 text-right">Access</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {students.map(student => {
                                        const prog = studentProgress[student.id];
                                        return (
                                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                                                            <img src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName || 'S')}`} alt="" className="h-full w-full object-cover" />
                                                        </div>
                                                        <span className="font-medium text-espresso dark:text-white">{student.fullName}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-espresso/70 dark:text-white/70">{student.email}</td>
                                                <td className="p-4 text-sm">
                                                    {prog ? (
                                                        <span className={cn(
                                                            "px-2 py-1 rounded text-xs font-bold",
                                                            prog.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                        )}>
                                                            {prog.passed ? 'Completed' : 'Failed'} ({Math.round(prog.score)}%)
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <input
                                                        type="checkbox"
                                                        checked={assignedStudents.includes(student.id)}
                                                        onChange={() => toggleAssignment(student.id)}
                                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                                    />
                                                </td>
                                            </tr>
                                        )
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
