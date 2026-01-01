import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { GradientButton } from '../../../components/ui/GradientButton';

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
        order: 0
    });

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
                order: chapter.order || 0
            });
        } else {
            setEditingChapter(null);
            setChapterForm({
                title: '',
                content: '',
                imageUrl: '',
                status: 'draft',
                order: chapters.length + 1
            });
        }
        setIsChapterModalOpen(true);
    };

    const closeModal = () => {
        setIsChapterModalOpen(false);
        setEditingChapter(null);
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

                        <div className="flex-1 overflow-y-auto p-6 md:p-8">
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
                                    <textarea
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm leading-relaxed"
                                        rows="12"
                                        value={chapterForm.content}
                                        onChange={e => setChapterForm({ ...chapterForm, content: e.target.value })}
                                        placeholder="Write your chapter content here..."
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
