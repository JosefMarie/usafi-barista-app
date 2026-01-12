import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

export function ManageCourse() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [items, setItems] = useState([]);
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

        // Fetch modules AND lessons to ensure everything is visible
        const fetchContent = () => {
            // We'll use onSnapshot for both and merge them locally. 
            // Since onSnapshot is async and continuous, managing merged state is tricky.
            // Simplified approach: Fetch both collections once on load + real-time listener for just 'modules' (preferred) or both.
            // Let's use independent listeners.

            const modulesQ = query(collection(db, 'courses', courseId, 'modules'));
            const lessonsQ = query(collection(db, 'courses', courseId, 'lessons'));

            let modulesData = [];
            let lessonsData = [];

            const unsubModules = onSnapshot(modulesQ, (snap) => {
                modulesData = snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'module' }));
                updateItems();
            });

            const unsubLessons = onSnapshot(lessonsQ, (snap) => {
                lessonsData = snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'lesson' }));
                updateItems();
            });

            const updateItems = () => {
                // Merge and sort? For now just concat or sort by createdAt if available.
                // We'll assume modules are "newer" but we can mix them.
                const all = [...modulesData, ...lessonsData].sort((a, b) => {
                    const tA = a.createdAt?.toMillis() || 0;
                    const tB = b.createdAt?.toMillis() || 0;
                    return tA - tB;
                });
                setItems(all);
            };

            return () => {
                unsubModules();
                unsubLessons();
            };
        };

        const cleanup = fetchContent();
        return () => cleanup();
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
            <header className="sticky top-0 z-50 bg-[#F5DEB3]/90 dark:bg-[#1c1916]/90 backdrop-blur-md border-b border-espresso/10 px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20"></div>
                <div className="flex items-center gap-4 md:gap-6">
                    <button
                        onClick={() => navigate('/admin/courses')}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/40 hover:bg-espresso hover:text-white transition-all flex items-center justify-center active:scale-95 shadow-sm group"
                    >
                        <span className="material-symbols-outlined text-[20px] md:text-[24px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl md:text-3xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Management Console</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-1 md:mt-2">Architecture Control Module</p>
                    </div>
                </div>
                <div className="flex gap-3 md:gap-4 w-full md:w-auto">
                    {editMode ? (
                        <button
                            onClick={handleUpdate}
                            className="flex-1 md:flex-none px-6 md:px-8 py-3 md:py-3.5 bg-espresso text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[16px] md:text-[18px]">verified</span>
                            Commit Changes
                        </button>
                    ) : (
                        <button
                            onClick={() => setEditMode(true)}
                            className="flex-1 md:flex-none px-6 md:px-8 py-3 md:py-3.5 bg-white/40 text-espresso text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl border border-espresso/10 hover:bg-espresso hover:text-white transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[16px] md:text-[18px]">edit_note</span>
                            Modify Schema
                        </button>
                    )}
                </div>
            </header>

            <main className="p-4 md:p-10 w-full pb-32">
                {/* Course Details Card */}
                <div className="bg-white/40 dark:bg-black/20 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-espresso/10 mb-8 md:mb-10 relative overflow-hidden group/details">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover/details:bg-espresso transition-colors"></div>
                    <div className="flex flex-col xl:flex-row gap-8 md:gap-10">
                        <div className="h-48 md:h-64 xl:h-auto w-full xl:w-72 min-h-[200px] rounded-[1.5rem] md:rounded-[2rem] bg-black/5 dark:bg-white/5 shrink-0 overflow-hidden relative group/img shadow-inner border border-espresso/5">
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/img:scale-110"
                                style={{ backgroundImage: `url('${course.thumbnail}')` }}
                            ></div>
                            <div className="absolute inset-0 bg-espresso/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                                <span className="material-symbols-outlined text-white text-3xl">image_search</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-6 md:space-y-8">
                            <div>
                                <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 dark:text-white/40 mb-2 md:mb-3 ml-1">Asset Title</label>
                                {editMode ? (
                                    <input
                                        className="w-full text-xl md:text-3xl font-serif font-black bg-white/20 dark:bg-black/20 border border-espresso/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 focus:outline-none focus:ring-2 focus:ring-espresso transition-all shadow-inner text-espresso dark:text-white"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                    />
                                ) : (
                                    <h2 className="text-xl md:text-3xl font-serif font-black text-espresso dark:text-white leading-tight">{title}</h2>
                                )}
                            </div>
                            <div>
                                <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 dark:text-white/40 mb-2 md:mb-3 ml-1">Structural Description</label>
                                {editMode ? (
                                    <textarea
                                        className="w-full text-xs md:text-sm font-medium bg-white/20 dark:bg-black/20 border border-espresso/10 rounded-xl md:rounded-2xl p-4 md:p-6 focus:outline-none focus:ring-2 focus:ring-espresso h-32 md:h-40 resize-none transition-all shadow-inner text-espresso dark:text-white"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                ) : (
                                    <p className="text-xs md:text-sm font-medium text-espresso/80 dark:text-white/70 leading-relaxed bg-white/20 dark:bg-black/20 p-4 md:p-6 rounded-xl md:rounded-2xl border border-espresso/5 shadow-inner">{description}</p>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-2 md:pt-4">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-espresso/40">Status:</span>
                                    {editMode ? (
                                        <select
                                            value={status}
                                            onChange={e => setStatus(e.target.value)}
                                            className="text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-white dark:bg-black p-2 md:p-3 rounded-lg md:rounded-xl border border-espresso/10 outline-none focus:ring-2 focus:ring-espresso transition-all text-espresso dark:text-white"
                                        >
                                            <option value="draft">Draft Protocol</option>
                                            <option value="published">Production Live</option>
                                            <option value="archived">Archived State</option>
                                        </select>
                                    ) : (
                                        <span className={cn(
                                            "flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-sm border",
                                            status === 'published' ? "bg-green-50 text-green-700 border-green-200" :
                                                "bg-amber-50 text-amber-600 border-amber-200"
                                        )}>
                                            <span className="material-symbols-outlined text-[12px] md:text-[14px]">{status === 'published' ? 'verified' : 'pending'}</span>
                                            {status.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modules List */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <h3 className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="w-8 h-px bg-espresso/20"></span>
                        Instructional Node Matrix
                    </h3>
                    <button
                        onClick={() => navigate(`/admin/courses/${courseId}/modules/new`)}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 bg-espresso text-white px-6 py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-espresso/40 hover:-translate-y-1 transition-all active:scale-95 group"
                    >
                        <span className="material-symbols-outlined text-[18px] md:text-[20px] group-hover:rotate-90 transition-transform">add</span>
                        Insert New Node
                    </button>
                </div>

                <div className="space-y-4">
                    {items.length === 0 ? (
                        <div className="text-center py-20 bg-white/20 dark:bg-black/10 border-2 border-dashed border-espresso/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4">
                            <span className="material-symbols-outlined text-5xl text-espresso/20">terminal</span>
                            <p className="text-[10px] font-black uppercase tracking-widest text-espresso/30 italic">No instructional data detected. Initialize first node.</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => navigate(`/admin/courses/${courseId}/${item.type === 'lesson' ? 'lessons' : 'modules'}/${item.id}`)}
                                className="bg-white/40 dark:bg-black/20 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-lg border border-espresso/10 hover:shadow-xl hover:border-espresso transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/5 group-hover:bg-espresso transition-colors"></div>
                                <div className="flex items-center gap-4 md:gap-6 pl-2">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-espresso/5 flex items-center justify-center text-espresso group-hover:bg-espresso group-hover:text-white transition-all shadow-inner border border-espresso/5 shrink-0">
                                        <span className="material-symbols-outlined text-2xl md:text-3xl">play_circle</span>
                                    </div>
                                    <div>
                                        <h4 className="font-serif text-lg md:text-xl font-black text-espresso dark:text-white tracking-tight leading-none">
                                            {item.title || 'Untitled Node'}
                                            {item.type === 'lesson' && <span className="ml-2 text-xs bg-espresso/10 px-2 py-0.5 rounded text-espresso/60">LEGACY</span>}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 md:mt-3">
                                            {/* MODULE INDICATORS */}
                                            {item.type === 'module' && (
                                                <>
                                                    <div className="flex items-center gap-2" title="Content Slides">
                                                        <span className="material-symbols-outlined text-[14px] text-espresso/40 dark:text-white/40">auto_stories</span>
                                                        <span className="text-[9px] font-black text-espresso/60 dark:text-white/60 uppercase tracking-wider">
                                                            {item.content?.length || 0} Slides
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2" title="Quiz Questions">
                                                        <span className={cn(
                                                            "material-symbols-outlined text-[14px]",
                                                            (item.quiz?.questions?.length > 0) ? "text-espresso/40 dark:text-white/40" : "text-espresso/20"
                                                        )}>
                                                            quiz
                                                        </span>
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase tracking-wider",
                                                            (item.quiz?.questions?.length > 0) ? "text-espresso/60 dark:text-white/60" : "text-espresso/30"
                                                        )}>
                                                            {item.quiz?.questions?.length || 0} Qs
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2" title="Summary Points">
                                                        <span className={cn(
                                                            "material-symbols-outlined text-[14px]",
                                                            (item.summaryContent?.length > 0) ? "text-espresso/40 dark:text-white/40" : "text-espresso/20"
                                                        )}>
                                                            summarize
                                                        </span>
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase tracking-wider",
                                                            (item.summaryContent?.length > 0) ? "text-espresso/60 dark:text-white/60" : "text-espresso/30"
                                                        )}>
                                                            {item.summaryContent?.length || 0} Sum
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2" title="Assigned Students">
                                                        <span className={cn(
                                                            "material-symbols-outlined text-[14px]",
                                                            (item.assignedStudents?.length > 0) ? "text-espresso/40 dark:text-white/40" : "text-espresso/20"
                                                        )}>
                                                            group
                                                        </span>
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase tracking-wider",
                                                            (item.assignedStudents?.length > 0) ? "text-espresso/60 dark:text-white/60" : "text-espresso/30"
                                                        )}>
                                                            {item.assignedStudents?.length || 0} Assigned
                                                        </span>
                                                    </div>
                                                </>
                                            )}

                                            {/* LESSON INDICATORS (Legacy) */}
                                            {item.type === 'lesson' && (
                                                <>
                                                    <div className="flex items-center gap-2" title="Video Content">
                                                        <span className={cn("material-symbols-outlined text-[14px]", item.videoUrl ? "text-espresso" : "text-espresso/20")}>play_circle</span>
                                                        <span className="text-[9px] font-black text-espresso/60 uppercase tracking-wider">{item.videoUrl ? 'Video' : 'No Video'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2" title="PDF Files">
                                                        <span className={cn("material-symbols-outlined text-[14px]", item.pdfFiles?.length ? "text-espresso" : "text-espresso/20")}>description</span>
                                                        <span className="text-[9px] font-black text-espresso/60 uppercase tracking-wider">{item.pdfFiles?.length || 0} PDFs</span>
                                                    </div>
                                                </>
                                            )}

                                            <span className="hidden sm:inline w-1 h-1 rounded-full bg-espresso/20"></span>
                                            <p className="text-[9px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest whitespace-nowrap">Status: {item.status || 'Active'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-6 sm:pr-4 pl-16 sm:pl-0">
                                    <span className="text-[8px] md:text-[10px] font-black text-espresso uppercase tracking-[0.3em] group-hover:opacity-100 transition-all sm:translate-x-4 sm:group-hover:translate-x-0">
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


