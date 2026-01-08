import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { GradientButton } from '../../../components/ui/GradientButton';
import { RichTextEditor } from '../../../components/common/RichTextEditor';
import { cn } from '../../../lib/utils';

export function ManageBusinessCourse() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [businessStudents, setBusinessStudents] = useState([]);
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
        },
        assignedStudents: []
    });
    const [activeTab, setActiveTab] = useState('content'); // 'content' | 'quiz' | 'assignments'

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

        // Fetch Business Students
        const fetchStudents = async () => {
            const q = query(collection(db, 'users'), where('role', '==', 'business_student'));
            const snap = await getDocs(q);
            setBusinessStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchStudents();

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

    const toggleAssignment = (studentId) => {
        setChapterForm(prev => {
            const current = prev.assignedStudents || [];
            if (current.includes(studentId)) {
                return { ...prev, assignedStudents: current.filter(id => id !== studentId) };
            } else {
                return { ...prev, assignedStudents: [...current, studentId] };
            }
        });
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
                quiz: chapter.quiz || { enabled: false, passMark: 70, questions: [] },
                assignedStudents: chapter.assignedStudents || []
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
                quiz: { enabled: false, passMark: 70, questions: [] },
                assignedStudents: []
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
        <div className="w-full px-4 space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 bg-[#F5DEB3] dark:bg-[#1c1916] p-6 md:p-8 rounded-[2rem] border border-espresso/10 relative overflow-hidden shadow-lg">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso"></div>
                <div className="pl-2 md:pl-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Link to="/admin/business/courses" className="text-xs md:text-sm text-espresso/50 dark:text-white/50 hover:text-primary">
                            Courses
                        </Link>
                        <span className="text-espresso/30 dark:text-white/30">/</span>
                        <span className="text-xs md:text-sm font-medium text-espresso dark:text-white truncate max-w-[150px] md:max-w-none">{course.title}</span>
                    </div>
                    <h1 className="font-serif text-2xl md:text-3xl font-bold text-espresso dark:text-white leading-tight">{course.title}</h1>
                    <p className="text-espresso/60 dark:text-white/60 mt-2 max-w-2xl text-xs md:text-sm leading-relaxed">{course.description}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <button
                        onClick={toggleCourseStatus}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-[10px] md:text-[11px] uppercase transition-all tracking-widest border border-espresso/5 shadow-sm ${course.status === 'published'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }`}
                    >
                        {course.status === 'published' ? 'Published' : 'Draft Mode'}
                    </button>
                    <GradientButton onClick={() => openModal()} className="w-full sm:w-auto h-12 md:h-14 rounded-xl md:rounded-2xl px-6 md:px-8 text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-xl">
                        <span className="material-symbols-outlined mr-2 text-[20px] md:text-[24px]">add</span>
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
                    <div className="text-center py-16 bg-white/40 dark:bg-white/5 rounded-[2rem] border border-dashed border-espresso/10 dark:border-white/10 px-6">
                        <div className="w-16 h-16 bg-espresso/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-4xl text-espresso/20">auto_stories</span>
                        </div>
                        <p className="text-espresso/50 dark:text-white/50 mb-6 font-medium">No chapters created yet.</p>
                        <button onClick={() => openModal()} className="text-primary font-black uppercase tracking-widest text-xs hover:underline">Add your first chapter</button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {chapters.map((chapter) => (
                            <div key={chapter.id} className="bg-white/50 dark:bg-white/5 p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] border border-espresso/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center gap-4 group hover:shadow-xl hover:bg-white/80 transition-all">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="h-10 w-10 shrink-0 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-center font-black text-espresso/50 dark:text-white/50 text-sm">
                                        {chapter.order}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-espresso dark:text-white truncate text-sm md:text-base">{chapter.title}</h3>
                                        <p className="text-[10px] md:text-xs text-espresso/50 dark:text-white/50 truncate font-medium">
                                            {chapter.content?.replace(/<[^>]*>/g, '').substring(0, 60)}...
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-espresso/5 sm:border-none">
                                    <span className={`px-2.5 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] shadow-sm ${chapter.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {chapter.status}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => openModal(chapter)}
                                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors active:scale-95"
                                            title="Edit"
                                        >
                                            <span className="material-symbols-outlined text-[20px] md:text-[24px]">edit_note</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteChapter(chapter.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors active:scale-95"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-[20px] md:text-[24px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit/Create Modal - Full Screen Style or Large Modal */}
            {isChapterModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
                    <div className="bg-[#FAF5E8] dark:bg-[#1e1e1e] w-full h-full sm:h-[90vh] sm:max-w-4xl sm:rounded-[2rem] flex flex-col shadow-2xl overflow-hidden border-0 sm:border border-espresso/10">
                        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-black/20 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-espresso dark:text-white leading-none">
                                    {editingChapter ? 'Modify Chapter' : 'Initialize Chapter'}
                                </h2>
                                <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest mt-1">Schema management operational</p>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 rounded-xl bg-white/40 flex items-center justify-center text-espresso/50 hover:text-red-500 transition-all active:scale-95 shadow-sm">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* TABS */}
                        <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto no-scrollbar shrink-0 px-2 sm:px-4">
                            <button
                                onClick={() => setActiveTab('content')}
                                className={cn(
                                    "px-4 sm:px-8 py-4 font-black text-[10px] sm:text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap",
                                    activeTab === 'content'
                                        ? "border-primary text-primary"
                                        : "border-transparent text-espresso/40 dark:text-white/40 hover:text-espresso"
                                )}
                            >
                                Core Content
                            </button>
                            <button
                                onClick={() => setActiveTab('quiz')}
                                className={cn(
                                    "px-4 sm:px-8 py-4 font-black text-[10px] sm:text-xs uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
                                    activeTab === 'quiz'
                                        ? "border-primary text-primary"
                                        : "border-transparent text-espresso/40 dark:text-white/40 hover:text-espresso"
                                )}
                            >
                                Quiz Assessment
                                {chapterForm.quiz.enabled && <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('assignments')}
                                className={cn(
                                    "px-4 sm:px-8 py-4 font-black text-[10px] sm:text-xs uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
                                    activeTab === 'assignments'
                                        ? "border-primary text-primary"
                                        : "border-transparent text-espresso/40 dark:text-white/40 hover:text-espresso"
                                )}
                            >
                                Assignments
                                {(chapterForm.assignedStudents?.length > 0) && (
                                    <span className="bg-espresso/5 text-espresso text-[9px] px-1.5 py-0.5 rounded-md">
                                        {chapterForm.assignedStudents.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                            {activeTab === 'content' ? (
                                <form id="chapterForm" onSubmit={handleSaveChapter} className="space-y-6 max-w-3xl mx-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-8">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-espresso/40 mb-2 ml-1">Chapter Title</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl border border-espresso/10 bg-white/40 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-espresso transition-all shadow-sm text-sm"
                                                value={chapterForm.title}
                                                onChange={e => setChapterForm({ ...chapterForm, title: e.target.value })}
                                                placeholder="e.g., Introduction to Market Analysis"
                                            />
                                        </div>
                                        <div className="md:col-span-4 flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-espresso/40 mb-2 ml-1">Order</label>
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl border border-espresso/10 bg-white/40 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-espresso transition-all shadow-sm text-sm"
                                                    value={chapterForm.order}
                                                    onChange={e => setChapterForm({ ...chapterForm, order: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-espresso/40 mb-2 ml-1">Status</label>
                                                <select
                                                    className="w-full px-3 py-3 md:py-4 rounded-xl md:rounded-2xl border border-espresso/10 bg-white/40 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-espresso transition-all shadow-sm text-[10px] font-black uppercase tracking-widest"
                                                    value={chapterForm.status}
                                                    onChange={e => setChapterForm({ ...chapterForm, status: e.target.value })}
                                                >
                                                    <option value="draft">DRAFT</option>
                                                    <option value="published">PUBLISHED</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-espresso/40 mb-2 ml-1">
                                            Core Content
                                            <span className="ml-2 lowercase font-medium opacity-60">(supports rich text formatting)</span>
                                        </label>
                                        <div className="rounded-2xl overflow-hidden border border-espresso/10 bg-white/20">
                                            <RichTextEditor
                                                value={chapterForm.content}
                                                onChange={(val) => setChapterForm({ ...chapterForm, content: val })}
                                                placeholder="Write your chapter content here..."
                                                className="border-none"
                                                minHeight="300px"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-espresso/40 mb-2 ml-1">Visual Asset URL (Optional)</label>
                                        <input
                                            type="url"
                                            className="w-full px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl border border-espresso/10 bg-white/40 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-espresso transition-all shadow-sm text-sm"
                                            value={chapterForm.imageUrl}
                                            onChange={e => setChapterForm({ ...chapterForm, imageUrl: e.target.value })}
                                            placeholder="https://example.com/asset.jpg"
                                        />
                                        {chapterForm.imageUrl && (
                                            <div className="mt-4 p-2 border border-espresso/10 rounded-2xl inline-block bg-white/40 shadow-xl max-w-full">
                                                <img src={chapterForm.imageUrl} alt="Asset Preview" className="h-32 sm:h-40 object-cover rounded-xl" />
                                            </div>
                                        )}
                                    </div>
                                </form>
                            ) : activeTab === 'quiz' ? (
                                <div className="space-y-6 max-w-4xl mx-auto">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 bg-espresso/5 dark:bg-white/5 rounded-2xl border border-espresso/10 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-espresso flex items-center justify-center text-white shrink-0">
                                                <span className="material-symbols-outlined text-2xl">fact_check</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-espresso dark:text-white leading-none">Enable Assessment?</h3>
                                                <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest mt-1">Gating protocol for next module</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-2 bg-white/40 px-3 py-1.5 rounded-lg border border-espresso/10">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Pass %:</span>
                                                <input
                                                    type="number"
                                                    className="w-12 p-1 text-center bg-transparent font-bold focus:outline-none"
                                                    value={chapterForm.quiz.passMark}
                                                    onChange={e => setChapterForm(p => ({ ...p, quiz: { ...p.quiz, passMark: Number(e.target.value) } }))}
                                                />
                                            </div>
                                            <button
                                                onClick={() => setChapterForm(p => ({ ...p, quiz: { ...p.quiz, enabled: !p.quiz.enabled } }))}
                                                className={cn("w-14 h-7 rounded-full transition-all relative shrink-0", chapterForm.quiz.enabled ? "bg-espresso shadow-lg shadow-espresso/20" : "bg-gray-300")}
                                            >
                                                <span className={cn("absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all", chapterForm.quiz.enabled ? "translate-x-7" : "")} />
                                            </button>
                                        </div>
                                    </div>

                                    {chapterForm.quiz.enabled && (
                                        <div className="space-y-6">
                                            {chapterForm.quiz.questions.map((q, qIndex) => (
                                                <div key={qIndex} className="p-4 md:p-8 bg-white/40 dark:bg-white/5 rounded-[2rem] border border-espresso/10 relative group/q shadow-sm hover:shadow-xl transition-all">
                                                    <button onClick={() => removeQuestion(qIndex)} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90">
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>

                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                                                        <div className="lg:col-span-12 xl:col-span-8">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40 mb-2 block ml-1">Question {qIndex + 1}</label>
                                                            <input
                                                                className="w-full p-4 font-serif font-black bg-white/40 border border-espresso/10 rounded-2xl focus:ring-2 focus:ring-espresso focus:outline-none transition-all placeholder:text-espresso/20 text-lg md:text-xl"
                                                                placeholder="Enter prompt text..."
                                                                value={q.question}
                                                                onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="lg:col-span-6 xl:col-span-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40 mb-2 block ml-1">Node Type</label>
                                                            <select
                                                                className="w-full p-4 bg-white/40 dark:bg-black/20 rounded-2xl border border-espresso/10 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-espresso focus:outline-none transition-all"
                                                                value={q.type}
                                                                onChange={(e) => {
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
                                                                <option value="multiple_choice">MULTI-CHOICE</option>
                                                                <option value="true_false">BOOLEAN</option>
                                                                <option value="fill_in">TEXT INPUT</option>
                                                                <option value="matching">MATCHING</option>
                                                            </select>
                                                        </div>
                                                        <div className="lg:col-span-6 xl:col-span-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40 mb-2 block ml-1">Limit (s)</label>
                                                            <input
                                                                type="number"
                                                                className="w-full p-4 bg-white/40 dark:bg-black/20 rounded-2xl border border-espresso/10 text-sm font-bold focus:ring-2 focus:ring-espresso focus:outline-none transition-all"
                                                                value={q.duration}
                                                                onChange={(e) => updateQuestion(qIndex, 'duration', Number(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* TYPE SPECIFIC UI */}
                                                    <div className="pl-6 border-l-2 border-espresso/10 space-y-6">
                                                        {q.type === 'multiple_choice' && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {q.options.map((opt, oIndex) => (
                                                                    <div key={oIndex} className={cn(
                                                                        "flex items-center gap-4 p-3 rounded-2xl border transition-all",
                                                                        q.correctOption === oIndex ? "bg-espresso/5 border-espresso/20 shadow-sm" : "bg-transparent border-espresso/5 opacity-60"
                                                                    )}>
                                                                        <div className="relative flex items-center cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name={`correct-${qIndex}`}
                                                                                checked={q.correctOption === oIndex}
                                                                                onChange={() => updateQuestion(qIndex, 'correctOption', oIndex)}
                                                                                className="appearance-none w-5 h-5 rounded-full border-2 border-espresso/20 checked:border-espresso checked:bg-espresso transition-all ring-offset-2 focus:ring-2 focus:ring-espresso"
                                                                            />
                                                                            {q.correctOption === oIndex && <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] pointer-events-none">✓</span>}
                                                                        </div>
                                                                        <input
                                                                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold placeholder:text-espresso/20"
                                                                            placeholder={`Vector ${String.fromCharCode(65 + oIndex)}`}
                                                                            value={opt}
                                                                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {q.type === 'true_false' && (
                                                            <div className="flex flex-col sm:flex-row gap-4">
                                                                <button
                                                                    onClick={() => updateQuestion(qIndex, 'correctAnswer', true)}
                                                                    className={cn(
                                                                        "flex-1 py-4 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] transition-all",
                                                                        q.correctAnswer === true ? "bg-espresso text-white border-espresso shadow-lg" : "border-espresso/5 text-espresso/40"
                                                                    )}
                                                                >
                                                                    Logic: True
                                                                </button>
                                                                <button
                                                                    onClick={() => updateQuestion(qIndex, 'correctAnswer', false)}
                                                                    className={cn(
                                                                        "flex-1 py-4 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] transition-all",
                                                                        q.correctAnswer === false ? "bg-red-600 text-white border-red-600 shadow-lg" : "border-espresso/5 text-espresso/40"
                                                                    )}
                                                                >
                                                                    Logic: False
                                                                </button>
                                                            </div>
                                                        )}

                                                        {q.type === 'fill_in' && (
                                                            <div className="relative group">
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-espresso/40">
                                                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                                                </div>
                                                                <input
                                                                    className="w-full p-4 pl-12 bg-white/40 border border-espresso/10 rounded-2xl font-serif font-black text-espresso focus:ring-2 focus:ring-espresso focus:outline-none transition-all placeholder:text-espresso/20 text-lg"
                                                                    placeholder="Key value for verification..."
                                                                    value={q.correctAnswer}
                                                                    onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                                                                />
                                                            </div>
                                                        )}

                                                        {q.type === 'matching' && (
                                                            <div className="space-y-4">
                                                                {q.pairs.map((pair, pIndex) => (
                                                                    <div key={pIndex} className="flex flex-col sm:flex-row gap-2 bg-white/30 p-2 rounded-2xl border border-espresso/5 shadow-inner">
                                                                        <input
                                                                            className="flex-1 p-3 bg-transparent border-none text-xs font-bold placeholder:text-espresso/20 focus:ring-0"
                                                                            placeholder="Anchor A"
                                                                            value={pair.key}
                                                                            onChange={(e) => updatePair(qIndex, pIndex, 'key', e.target.value)}
                                                                        />
                                                                        <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-espresso/5 text-espresso/20 shrink-0 self-center">
                                                                            <span className="material-symbols-outlined text-sm">link</span>
                                                                        </div>
                                                                        <input
                                                                            className="flex-1 p-3 bg-transparent border-none text-xs font-bold placeholder:text-espresso/20 focus:ring-0"
                                                                            placeholder="Pair with B"
                                                                            value={pair.value}
                                                                            onChange={(e) => updatePair(qIndex, pIndex, 'value', e.target.value)}
                                                                        />
                                                                        <button onClick={() => removePair(qIndex, pIndex)} className="p-2 text-red-400 hover:text-red-600 transition-colors shrink-0">
                                                                            <span className="material-symbols-outlined text-lg">remove_circle</span>
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button onClick={() => addPair(qIndex)} className="w-full py-4 rounded-2xl border-2 border-dashed border-espresso/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-espresso/40 hover:border-espresso hover:text-espresso transition-all bg-white/20">
                                                                    <span className="material-symbols-outlined text-lg">add_link</span> Add Logic Pair
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => addQuestion('multiple_choice')}
                                                className="w-full py-6 md:py-10 border-4 border-dashed border-espresso/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 text-espresso/30 font-black uppercase tracking-widest text-[10px] hover:border-espresso/20 hover:text-espresso/60 transition-all group/add"
                                            >
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-espresso/5 flex items-center justify-center group-hover/add:scale-110 transition-transform">
                                                    <span className="material-symbols-outlined text-4xl">add_circle</span>
                                                </div>
                                                Inject Assessment Node
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // ASSIGNMENTS TAB
                                <div className="space-y-6 max-w-4xl mx-auto">
                                    <div className="bg-espresso text-white p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                                        <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start">
                                            <div className="p-3 bg-white/10 rounded-xl">
                                                <span className="material-symbols-outlined text-3xl">verified_user</span>
                                            </div>
                                            <div>
                                                <h3 className="font-serif font-black text-xl mb-1">Access Control</h3>
                                                <p className="text-white/60 text-xs font-medium max-w-lg leading-relaxed">
                                                    By default, business chapters are available to all enrolled business students.
                                                    Use the protocol below to restrict access to specific individuals if necessary.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/40 dark:bg-black/20 rounded-[2rem] border border-espresso/10 overflow-hidden shadow-lg">
                                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-left">
                                                <thead className="bg-white/40 dark:bg-black/40 border-b border-espresso/10 sticky top-0 z-10 backdrop-blur-sm">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-espresso/40">Business Partner</th>
                                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-espresso/40">Contact Point</th>
                                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-espresso/40 text-center">Permit</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-espresso/5">
                                                    {businessStudents.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="3" className="p-8 text-center text-espresso/40 italic text-sm">No business students enrolled.</td>
                                                        </tr>
                                                    ) : businessStudents.map(student => (
                                                        <tr key={student.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => toggleAssignment(student.id)}>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-espresso/5 flex items-center justify-center font-bold text-espresso text-xs">
                                                                        {student.name?.charAt(0) || student.email?.charAt(0)}
                                                                    </div>
                                                                    <span className="font-bold text-espresso dark:text-white text-sm">{student.name || 'Unknown'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-medium text-espresso/60">{student.email}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <div className={cn(
                                                                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all mx-auto",
                                                                    (chapterForm.assignedStudents?.includes(student.id))
                                                                        ? "bg-espresso border-espresso text-white scale-110"
                                                                        : "border-espresso/20 text-transparent"
                                                                )}>
                                                                    <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 md:p-8 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="w-full sm:w-auto px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-espresso/40 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl md:rounded-2xl transition-all"
                            >
                                Cancel Abort
                            </button>
                            <button
                                type="submit"
                                form="chapterForm"
                                className="w-full sm:w-auto px-10 py-3.5 text-[10px] font-black uppercase tracking-widest text-white bg-espresso hover:bg-espresso/90 rounded-xl md:rounded-2xl shadow-xl hover:shadow-espresso/40 transition-all active:scale-95"
                            >
                                Commit Chapter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

