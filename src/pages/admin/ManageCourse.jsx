import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

export function ManageCourse() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);

    // Editable fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('draft');

    useEffect(() => {
        const fetchCourse = async () => {
            const docRef = doc(db, 'courses', courseId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCourse({ id: docSnap.id, ...data });
                setTitle(data.title);
                setDescription(data.description);
                setStatus(data.status);
            } else {
                navigate('/admin/courses');
            }
            setLoading(false);
        };
        fetchCourse();

        // Fetch lessons
        const q = query(
            collection(db, 'courses', courseId, 'lessons'),
            orderBy('createdAt', 'asc') // or a 'order' field if we had one
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLessons(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => unsubscribe();
    }, [courseId, navigate]);

    const handleUpdate = async () => {
        try {
            await updateDoc(doc(db, 'courses', courseId), {
                title,
                description,
                status
            });
            setEditMode(false);
        } catch (error) {
            console.error("Error updating course:", error);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

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
                    <h1 className="text-xl font-serif font-bold text-espresso dark:text-white">Manage Course</h1>
                </div>
                <div className="flex gap-2">
                    {editMode ? (
                        <button
                            onClick={handleUpdate}
                            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow-md hover:bg-primary-dark transition-colors"
                        >
                            Save Changes
                        </button>
                    ) : (
                        <button
                            onClick={() => setEditMode(true)}
                            className="px-4 py-2 bg-white dark:bg-white/10 text-espresso dark:text-white text-sm font-bold rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 transition-colors"
                        >
                            Edit Details
                        </button>
                    )}
                </div>
            </header>

            <main className="p-6 max-w-4xl mx-auto w-full">
                {/* Course Details Card */}
                <div className="bg-white dark:bg-[#2c2825] rounded-xl p-6 shadow-sm border border-black/5 dark:border-white/5 mb-8">
                    <div className="flex gap-6">
                        <div className="h-32 w-48 bg-gray-100 dark:bg-white/5 rounded-lg shrink-0 overflow-hidden relative group">
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url('${course.thumbnail}')` }}
                            ></div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <span className="material-symbols-outlined text-white">edit</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-espresso/50 dark:text-white/50 mb-1">Title</label>
                                {editMode ? (
                                    <input
                                        className="w-full text-2xl font-serif font-bold bg-transparent border-b border-primary/20 focus:border-primary px-0 py-1"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                    />
                                ) : (
                                    <h2 className="text-2xl font-serif font-bold text-espresso dark:text-white">{title}</h2>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-espresso/50 dark:text-white/50 mb-1">Description</label>
                                {editMode ? (
                                    <textarea
                                        className="w-full text-sm bg-transparent border border-primary/20 rounded p-2 focus:border-primary h-20"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                ) : (
                                    <p className="text-sm text-espresso/70 dark:text-white/70">{description}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-espresso/50 dark:text-white/50">Status:</span>
                                    {editMode ? (
                                        <select
                                            value={status}
                                            onChange={e => setStatus(e.target.value)}
                                            className="text-sm bg-white dark:bg-white/5 border border-primary/20 rounded px-2 py-1"
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    ) : (
                                        <span className={cn(
                                            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                                            status === 'published' ? "bg-green-50 text-green-700 ring-green-600/10 dark:bg-green-900/20 dark:text-green-400" :
                                                "bg-gray-100 text-gray-600 ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400"
                                        )}>
                                            {status.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modules & Lessons */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-espresso dark:text-white">Course Content</h3>
                    <button
                        onClick={() => navigate(`/admin/courses/${courseId}/lessons/new`)}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-primary-dark transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Add Lesson
                    </button>
                </div>

                <div className="space-y-4">
                    {lessons.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-black/5 dark:border-white/5 rounded-xl">
                            <p className="text-espresso/50 dark:text-white/50">No lessons yet. Click "Add Lesson" to start.</p>
                        </div>
                    ) : (
                        lessons.map((lesson) => (
                            <div
                                key={lesson.id}
                                onClick={() => navigate(`/admin/courses/${courseId}/lessons/${lesson.id}`)}
                                className="bg-white dark:bg-[#2c2825] p-4 rounded-xl shadow-sm border border-black/5 dark:border-white/5 hover:border-primary/30 transition-all cursor-pointer group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">play_circle</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-espresso dark:text-white">{lesson.title || 'Untitled Lesson'}</h4>
                                        <p className="text-xs text-espresso/60 dark:text-white/60">{lesson.module} • {lesson.status}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-bold text-primary uppercase">Edit</span>
                                    <span className="material-symbols-outlined text-primary">chevron_right</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </main>
        </div>
    );
}
