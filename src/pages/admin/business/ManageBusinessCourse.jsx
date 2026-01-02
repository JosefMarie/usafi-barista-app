import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { GradientButton } from '../../../components/ui/GradientButton';
import { RichTextEditor } from '../../../components/common/RichTextEditor';
import { cn } from '../../../lib/utils';

export function ManageBusinessCourse() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);

    // Chapter Modal State
    const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
    const [editingChapter, setEditingChapter] = useState(null);
    const [chapterForm, setChapterForm] = useState({
        title: '',
        content: '',
        imageUrl: '',
        status: 'draft',
        order: 0,
        quiz: {
            enabled: false,
            passMark: 70,
            questions: []
        }
    });
    const [activeTab, setActiveTab] = useState('content'); // 'content' | 'quiz'

    // Fetch Course & Chapters
    useEffect(() => {
        if (!courseId) return;

        const courseRef = doc(db, 'business_courses', courseId);

        // Fetch Course Data
        getDoc(courseRef).then(snap => {
            if (snap.exists()) {
                setCourse({ id: snap.id, ...snap.data() });
            }
        });

        // Listen to Chapters
        const chaptersQ = query(collection(db, 'business_courses', courseId, 'chapters'), orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(chaptersQ, (snapshot) => {
            const fetchedChapters = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setChapters(fetchedChapters);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [courseId]);

    const handleSaveChapter = async (e) => {
        e.preventDefault();
        try {
            const chapterData = {
                ...chapterForm,
                order: Number(chapterForm.order),
                updatedAt: serverTimestamp()
            };

            if (editingChapter) {
                // Update existing
                await updateDoc(doc(db, 'business_courses', courseId, 'chapters', editingChapter.id), chapterData);
            } else {
                // Create new
                await addDoc(collection(db, 'business_courses', courseId, 'chapters'), {
                    ...chapterData,
                    createdAt: serverTimestamp()
                });
            }
            closeModal();
        } catch (error) {
            console.error("Error saving chapter:", error);
            alert("Failed to save chapter");
        }
    };

    const handleDeleteChapter = async (chapterId) => {
        if (!confirm("Are you sure you want to delete this chapter?")) return;
        try {
            await deleteDoc(doc(db, 'business_courses', courseId, 'chapters', chapterId));
        } catch (error) {
            console.error(error);
        }
    };

    const toggleCourseStatus = async () => {
        if (!course) return;
        const newStatus = course.status === 'published' ? 'draft' : 'published';
        try {
            await updateDoc(doc(db, 'business_courses', courseId), { status: newStatus });
            setCourse(prev => ({ ...prev, status: newStatus }));
        } catch (error) {
            console.error(error);
        }
    };

    const openModal = (chapter = null) => {
        if (chapter) {
            setEditingChapter(chapter);
            setChapterForm({
                title: chapter.title,
                content: chapter.content,
                imageUrl: chapter.imageUrl || '',
                status: chapter.status,
                order: chapter.order || 0,
                quiz: chapter.quiz || { enabled: false, passMark: 70, questions: [] }
            });
            setActiveTab('content');
        } else {
            setEditingChapter(null);
            setChapterForm({
                title: '',
                content: '',
                imageUrl: '',
                status: 'draft',
                order: chapters.length + 1,
                quiz: { enabled: false, passMark: 70, questions: [] }
            });
            setActiveTab('content');
        }
        setIsChapterModalOpen(true);
    };

    const closeModal = () => {
        setIsChapterModalOpen(false);
        setEditingChapter(null);
    };

    // --- QUIZ HANDLERS ---
    const addQuestion = (type = 'multiple_choice') => {
        const questionBase = { type, question: '', duration: 30 };
        let specificData = {};
        if (type === 'multiple_choice') specificData = { options: ['', '', '', ''], correctOption: 0 };
        else if (type === 'true_false') specificData = { correctAnswer: true };
        else if (type === 'fill_in') specificData = { correctAnswer: '' };
        else if (type === 'matching') specificData = { pairs: [{ key: '', value: '' }, { key: '', value: '' }] };

        setChapterForm(prev => ({
            ...prev,
            quiz: {
                ...prev.quiz,
                questions: [...prev.quiz.questions, { ...questionBase, ...specificData }]
            }
        }));
    };

    const updateQuestion = (index, field, value) => {
        const updated = [...chapterForm.quiz.questions];
        updated[index] = { ...updated[index], [field]: value };
        setChapterForm(prev => ({ ...prev, quiz: { ...prev.quiz, questions: updated } }));
    };

    const removeQuestion = (index) => {
        setChapterForm(prev => ({
            ...prev,
            quiz: { ...prev.quiz, questions: prev.quiz.questions.filter((_, i) => i !== index) }
        }));
    };

    const updateOption = (qIndex, oIndex, val) => {
        const updated = [...chapterForm.quiz.questions];
        const newOptions = [...updated[qIndex].options];
        newOptions[oIndex] = val;
        updated[qIndex] = { ...updated[qIndex], options: newOptions };
        setChapterForm(prev => ({ ...prev, quiz: { ...prev.quiz, questions: updated } }));
    };

    const updatePair = (qIndex, pIndex, field, val) => {
        const updated = [...chapterForm.quiz.questions];
        const newPairs = [...updated[qIndex].pairs];
        newPairs[pIndex] = { ...newPairs[pIndex], [field]: val };
        updated[qIndex] = { ...updated[qIndex], pairs: newPairs };
        setChapterForm(prev => ({ ...prev, quiz: { ...prev.quiz, questions: updated } }));
    };

    const addPair = (qIndex) => {
        const updated = [...chapterForm.quiz.questions];
        updated[qIndex].pairs.push({ key: '', value: '' });
        setChapterForm(prev => ({ ...prev, quiz: { ...prev.quiz, questions: updated } }));
    };

    const removePair = (qIndex, pIndex) => {
        const updated = [...chapterForm.quiz.questions];
        updated[qIndex].pairs = updated[qIndex].pairs.filter((_, i) => i !== pIndex);
        setChapterForm(prev => ({ ...prev, quiz: { ...prev.quiz, questions: updated } }));
    };


    if (loading) return <div className="p-8">Loading...</div>;
    if (!course) return <div className="p-8">Course not found</div>;

    return (
        <div className="container mx-auto max-w-5xl space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link to="/admin/business/courses" className="text-sm text-espresso/50 dark:text-white/50 hover:text-primary">
                            Courses
                        </Link>
                        <span className="text-espresso/30 dark:text-white/30">/</span>
                        <span className="text-sm font-medium text-espresso dark:text-white">{course.title}</span>
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-espresso dark:text-white">{course.title}</h1>
                    <p className="text-espresso/60 dark:text-white/60 mt-2 max-w-2xl">{course.description}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleCourseStatus}
                        className={`px-4 py-2 rounded-lg font-bold text-sm uppercase transition-colors ${course.status === 'published'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }`}
                    >
                        {course.status === 'published' ? 'Published' : 'Draft Mode'}
                    </button>
                    <GradientButton onClick={() => openModal()}>
                        <span className="material-symbols-outlined mr-2">add</span>
                        Add Chapter
                    </GradientButton>
                </div>
            </div>

            {/* Chapters List */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-espresso dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">list</span>
                    Chapters ({chapters.length})
                </h2>

                {chapters.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                        <p className="text-espresso/50 dark:text-white/50 mb-4">No chapters created yet.</p>
                        <button onClick={() => openModal()} className="text-primary font-bold hover:underline">Add your first chapter</button>
                    </div>
                ) : (
                    chapters.map((chapter) => (
                        <div key={chapter.id} className="bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="h-10 w-10 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center font-bold text-espresso/50 dark:text-white/50">
                                {chapter.order}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-espresso dark:text-white truncate">{chapter.title}</h3>
                                <p className="text-xs text-espresso/50 dark:text-white/50 truncate">
                                    {chapter.content?.substring(0, 60)}...
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${chapter.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {chapter.status}
                                </span>
                                <button
                                    onClick={() => openModal(chapter)}
                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <span className="material-symbols-outlined">edit</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteChapter(chapter.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit/Create Modal - Full Screen Style or Large Modal */}
            {isChapterModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-black/20">
                            <h2 className="text-lg font-bold text-espresso dark:text-white">
                                {editingChapter ? 'Edit Chapter' : 'New Chapter'}
                            </h2>
                            <button onClick={closeModal} className="text-espresso/50 dark:text-white/50 hover:text-red-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* TABS */}
                        <div className="flex border-b border-gray-200 dark:border-white/10 px-6">
                            <button
                                onClick={() => setActiveTab('content')}
                                className={cn(
                                    "px-6 py-3 font-bold text-sm border-b-2 transition-all",
                                    activeTab === 'content'
                                        ? "border-primary text-primary"
                                        : "border-transparent text-espresso/60 dark:text-white/60 hover:text-espresso"
                                )}
                            >
                                Content
                            </button>
                            <button
                                onClick={() => setActiveTab('quiz')}
                                className={cn(
                                    "px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
                                    activeTab === 'quiz'
                                        ? "border-primary text-primary"
                                        : "border-transparent text-espresso/60 dark:text-white/60 hover:text-espresso"
                                )}
                            >
                                Quiz Assessment
                                {chapterForm.quiz.enabled && <span className="size-2 rounded-full bg-green-500" />}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8">
                            {activeTab === 'content' ? (
                                <form id="chapterForm" onSubmit={handleSaveChapter} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-espresso dark:text-white mb-2">Chapter Title</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                                value={chapterForm.title}
                                                onChange={e => setChapterForm({ ...chapterForm, title: e.target.value })}
                                                placeholder="e.g., Introduction to Market Analysis"
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-sm font-bold text-espresso dark:text-white mb-2">Order</label>
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                                    value={chapterForm.order}
                                                    onChange={e => setChapterForm({ ...chapterForm, order: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-sm font-bold text-espresso dark:text-white mb-2">Status</label>
                                                <select
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                                    value={chapterForm.status}
                                                    onChange={e => setChapterForm({ ...chapterForm, status: e.target.value })}
                                                >
                                                    <option value="draft">Draft</option>
                                                    <option value="published">Published</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-espresso dark:text-white mb-2">
                                            Content
                                            <span className="ml-2 text-xs font-normal text-espresso/50 dark:text-white/50">(Accepts basic text. For images, add URL below)</span>
                                        </label>
                                        <RichTextEditor
                                            value={chapterForm.content}
                                            onChange={(val) => setChapterForm({ ...chapterForm, content: val })}
                                            placeholder="Write your chapter content here..."
                                            className="border-gray-200 dark:border-white/10 shadow-sm"
                                            minHeight="300px"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-espresso dark:text-white mb-2">Image URL (Optional)</label>
                                        <input
                                            type="url"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                            value={chapterForm.imageUrl}
                                            onChange={e => setChapterForm({ ...chapterForm, imageUrl: e.target.value })}
                                            placeholder="https://example.com/image.jpg"
                                        />
                                        {chapterForm.imageUrl && (
                                            <div className="mt-4 p-2 border border-gray-200 dark:border-white/10 rounded-xl inline-block bg-gray-50 dark:bg-black/20">
                                                <img src={chapterForm.imageUrl} alt="Preview" className="h-40 object-cover rounded-lg" />
                                            </div>
                                        )}
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                        <div>
                                            <h3 className="font-bold text-espresso dark:text-white">Enable Assessment?</h3>
                                            <p className="text-xs text-espresso/60 dark:text-white/60">Students must pass this to unlock the next chapter.</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold uppercase">Pass Mark:</span>
                                                <input
                                                    type="number"
                                                    className="w-16 p-1 text-center rounded border"
                                                    value={chapterForm.quiz.passMark}
                                                    onChange={e => setChapterForm(p => ({ ...p, quiz: { ...p.quiz, passMark: Number(e.target.value) } }))}
                                                />
                                                <span className="text-sm font-bold">%</span>
                                            </div>
                                            <button
                                                onClick={() => setChapterForm(p => ({ ...p, quiz: { ...p.quiz, enabled: !p.quiz.enabled } }))}
                                                className={cn("w-12 h-6 rounded-full transition-all relative", chapterForm.quiz.enabled ? "bg-primary" : "bg-gray-300")}
                                            >
                                                <span className={cn("absolute top-1 left-1 size-4 bg-white rounded-full transition-all", chapterForm.quiz.enabled ? "translate-x-6" : "")} />
                                            </button>
                                        </div>
                                    </div>

                                    {chapterForm.quiz.enabled && (
                                        <div className="space-y-6">
                                            {chapterForm.quiz.questions.map((q, qIndex) => (
                                                <div key={qIndex} className="p-6 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 relative group">
                                                    <button onClick={() => removeQuestion(qIndex)} className="absolute top-4 right-4 text-espresso/20 hover:text-red-500 transition-colors">
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>

                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                                                        <div className="md:col-span-8">
                                                            <label className="text-xs font-bold uppercase text-espresso/50 mb-1 block">Question</label>
                                                            <input
                                                                className="w-full p-2 font-bold bg-transparent border-b-2 border-gray-200 focus:border-primary focus:outline-none"
                                                                placeholder="Enter question text..."
                                                                value={q.question}
                                                                onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="text-xs font-bold uppercase text-espresso/50 mb-1 block">Type</label>
                                                            <select
                                                                className="w-full p-2 bg-gray-50 dark:bg-black/20 rounded-lg text-sm"
                                                                value={q.type}
                                                                onChange={(e) => {
                                                                    // Reset specific data when type changes
                                                                    const newType = e.target.value;
                                                                    const base = { type: newType, question: q.question, duration: q.duration };
                                                                    let extra = {};
                                                                    if (newType === 'multiple_choice') extra = { options: ['', '', '', ''], correctOption: 0 };
                                                                    else if (newType === 'true_false') extra = { correctAnswer: true };
                                                                    else if (newType === 'fill_in') extra = { correctAnswer: '' };
                                                                    else if (newType === 'matching') extra = { pairs: [{ key: '', value: '' }, { key: '', value: '' }] };

                                                                    const updated = [...chapterForm.quiz.questions];
                                                                    updated[qIndex] = { ...base, ...extra };
                                                                    setChapterForm(p => ({ ...p, quiz: { ...p.quiz, questions: updated } }));
                                                                }}
                                                            >
                                                                <option value="multiple_choice">Multiple Choice</option>
                                                                <option value="true_false">True / False</option>
                                                                <option value="fill_in">Fill in Blank</option>
                                                                <option value="matching">Matching</option>
                                                            </select>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="text-xs font-bold uppercase text-espresso/50 mb-1 block">Duration (s)</label>
                                                            <input
                                                                type="number"
                                                                className="w-full p-2 bg-gray-50 dark:bg-black/20 rounded-lg text-sm font-mono"
                                                                value={q.duration}
                                                                onChange={(e) => updateQuestion(qIndex, 'duration', Number(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* TYPE SPECIFIC UI */}
                                                    <div className="pl-4 border-l-2 border-primary/20">
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
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => addQuestion('multiple_choice')}
                                                className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl flex items-center justify-center gap-2 text-espresso/50 font-bold hover:border-primary hover:text-primary transition-all"
                                            >
                                                <span className="material-symbols-outlined">add_circle</span>
                                                Add Question
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-6 py-3 text-sm font-bold text-espresso/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="chapterForm"
                                className="px-8 py-3 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg hover:shadow-primary/30 transition-all"
                            >
                                Save Chapter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
