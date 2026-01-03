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
        <div className="flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#F5DEB3]/90 dark:bg-[#1c1916]/90 backdrop-blur-md border-b border-espresso/10 px-8 py-6 flex items-center justify-between">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20"></div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/admin/courses')}
                        className="w-12 h-12 rounded-2xl bg-white/40 hover:bg-espresso hover:text-white transition-all flex items-center justify-center active:scale-95 shadow-sm group"
                    >
                        <span className="material-symbols-outlined text-[24px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Management Console</h1>
                        <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-2">Architecture Control Module</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    {editMode ? (
                        <button
                            onClick={handleUpdate}
                            className="px-8 py-3.5 bg-espresso text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">verified</span>
                            Commit Changes
                        </button>
                    ) : (
                        <button
                            onClick={() => setEditMode(true)}
                            className="px-8 py-3.5 bg-white/40 text-espresso text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-espresso/10 hover:bg-espresso hover:text-white transition-all active:scale-95 shadow-sm flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">edit_note</span>
                            Modify Schema
                        </button>
                    )}
                </div>
            </header>

            <main className="p-10  w-full pb-32">
                {/* Course Details Card */}
                <div className="bg-white/40 dark:bg-black/20 rounded-[2.5rem] p-10 shadow-2xl border border-espresso/10 mb-10 relative overflow-hidden group/details">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover/details:bg-espresso transition-colors"></div>
                    <div className="flex flex-col md:flex-row gap-10">
                        <div className="h-48 w-full md:w-72 rounded-[2rem] bg-black/5 dark:bg-white/5 shrink-0 overflow-hidden relative group/img shadow-inner border border-espresso/5">
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/img:scale-110"
                                style={{ backgroundImage: `url('${course.thumbnail}')` }}
                            ></div>
                            <div className="absolute inset-0 bg-espresso/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                                <span className="material-symbols-outlined text-white text-3xl">image_search</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-8">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 dark:text-white/40 mb-3 ml-1">Asset Title</label>
                                {editMode ? (
                                    <input
                                        className="w-full text-3xl font-serif font-black bg-white/20 dark:bg-black/20 border border-espresso/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-espresso transition-all shadow-inner text-espresso dark:text-white"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                    />
                                ) : (
                                    <h2 className="text-3xl font-serif font-black text-espresso dark:text-white leading-tight">{title}</h2>
                                )}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 dark:text-white/40 mb-3 ml-1">Structural Description</label>
                                {editMode ? (
                                    <textarea
                                        className="w-full text-sm font-medium bg-white/20 dark:bg-black/20 border border-espresso/10 rounded-2xl p-6 focus:outline-none focus:ring-2 focus:ring-espresso h-32 resize-none transition-all shadow-inner text-espresso dark:text-white"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                ) : (
                                    <p className="text-sm font-medium text-espresso/80 dark:text-white/70 leading-relaxed bg-white/20 dark:bg-black/20 p-6 rounded-2xl border border-espresso/5 shadow-inner">{description}</p>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-6 pt-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-espresso/40">Status:</span>
                                    {editMode ? (
                                        <select
                                            value={status}
                                            onChange={e => setStatus(e.target.value)}
                                            className="text-[10px] font-black uppercase tracking-widest bg-white dark:bg-black p-3 rounded-xl border border-espresso/10 outline-none focus:ring-2 focus:ring-espresso transition-all text-espresso dark:text-white"
                                        >
                                            <option value="draft">Draft Protocol</option>
                                            <option value="published">Production Live</option>
                                            <option value="archived">Archived State</option>
                                        </select>
                                    ) : (
                                        <span className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border",
                                            status === 'published' ? "bg-green-50 text-green-700 border-green-200" :
                                                "bg-amber-50 text-amber-600 border-amber-200"
                                        )}>
                                            <span className="material-symbols-outlined text-[14px]">{status === 'published' ? 'verified' : 'pending'}</span>
                                            {status.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modules & Lessons */}
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="w-8 h-px bg-espresso/20"></span>
                        Instructional Node Matrix
                    </h3>
                    <button
                        onClick={() => navigate(`/admin/courses/${courseId}/lessons/new`)}
                        className="flex items-center gap-3 bg-espresso text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-espresso/40 hover:-translate-y-1 transition-all active:scale-95 group"
                    >
                        <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform">add</span>
                        Insert New Node
                    </button>
                </div>

                <div className="space-y-4">
                    {lessons.length === 0 ? (
                        <div className="text-center py-20 bg-white/20 dark:bg-black/10 border-2 border-dashed border-espresso/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4">
                            <span className="material-symbols-outlined text-5xl text-espresso/20">terminal</span>
                            <p className="text-[10px] font-black uppercase tracking-widest text-espresso/30 italic">No instructional data detected. Initialize first node.</p>
                        </div>
                    ) : (
                        lessons.map((lesson) => (
                            <div
                                key={lesson.id}
                                onClick={() => navigate(`/admin/courses/${courseId}/lessons/${lesson.id}`)}
                                className="bg-white/40 dark:bg-black/20 p-6 rounded-3xl shadow-lg border border-espresso/10 hover:shadow-xl hover:border-espresso transition-all cursor-pointer group flex items-center justify-between relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/5 group-hover:bg-espresso transition-colors"></div>
                                <div className="flex items-center gap-6 pl-2">
                                    <div className="w-14 h-14 rounded-2xl bg-espresso/5 flex items-center justify-center text-espresso group-hover:bg-espresso group-hover:text-white transition-all shadow-inner border border-espresso/5">
                                        <span className="material-symbols-outlined text-3xl">play_circle</span>
                                    </div>
                                    <div>
                                        <h4 className="font-serif text-xl font-black text-espresso dark:text-white tracking-tight">{lesson.title || 'Untitled Node'}</h4>
                                        <div className="flex items-center gap-4 mt-1.5">
                                            <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest">Module: {lesson.module || 'Root'}</p>
                                            <span className="w-1 h-1 rounded-full bg-espresso/20"></span>
                                            <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest">Status: {lesson.status || 'Active'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 pr-4">
                                    <span className="text-[10px] font-black text-espresso uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        ACCESS DATA
                                    </span>
                                    <span className="material-symbols-outlined text-espresso/40 group-hover:text-espresso transition-colors">chevron_right</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </main>
        </div>
    );
}


