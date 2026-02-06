import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, setDoc, getDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function AdminCourses() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        const initCourses = async () => {
            // 1. Ensure "Bean to Brew" exists (Legacy)
            const beanRef = doc(db, 'courses', 'bean-to-brew');
            const beanSnap = await getDoc(beanRef);
            if (!beanSnap.exists()) {
                await setDoc(beanRef, {
                    title: 'Bean to Brew: The Complete Barista Guide',
                    description: 'Master the art of coffee making from bean selection to perfect extraction and customer service.',
                    status: 'published',
                    thumbnail: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=1000',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }

            // 2. Ensure "Bar Tender" exists (New)
            const barRef = doc(db, 'courses', 'bar-tender-course');
            const barSnap = await getDoc(barRef);
            if (!barSnap.exists()) {
                await setDoc(barRef, {
                    title: 'Professional Bartender Course',
                    description: 'Master the art of mixology, cocktail crafting, and bar management.',
                    status: 'draft',
                    thumbnail: 'https://images.unsplash.com/photo-1514362545857-3bc16549766b?auto=format&fit=crop&q=80&w=1000',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }

            // 3. Listen to all courses
            const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc')); // Assuming createdAt exists, or just fetch all
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedCourses = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort manual preference if needed, or rely on query
                setCourses(fetchedCourses);
                setLoading(false);
            });

            return unsubscribe;
        };

        const cleanup = initCourses();
        return () => {
            // cleanup is a promise, can't be called directly as cleanup function in useEffect
            // but onSnapshot returns a function, which we return above.
            // The async initCourses returns the unsubscribe function.
        };
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center h-full bg-background-light dark:bg-background-dark">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in">
            {/* Header */}
            <div className="px-4 py-8 md:py-10 border-b border-espresso/10 bg-[#F5DEB3]/90 dark:bg-[#1c1916]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20"></div>
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif font-black text-espresso dark:text-white mb-2 md:mb-3 uppercase tracking-tight">
                            Course Administration
                        </h1>
                        <p className="text-espresso/60 dark:text-white/60 max-w-2xl text-[10px] md:text-xs font-black uppercase tracking-widest leading-relaxed">
                            Manage course catalog, content architecture, and publication status.
                        </p>
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            <main className="px-4 py-10 w-full pb-32">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="w-8 h-px bg-espresso/20"></span>
                        Available Curricula
                    </h2>
                    <p className="text-[10px] font-black text-espresso/20 uppercase tracking-widest">{courses.length} Courses Active</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            onClick={() => navigate(`/admin/courses/${course.id}`)}
                            className="bg-espresso p-0 rounded-[2rem] border border-white/10 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full"
                        >
                            {/* Course Thumbnail Area */}
                            <div className="h-48 relative overflow-hidden bg-black/50">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/50 to-transparent"></div>
                                <div className="absolute bottom-4 left-6 right-6">
                                    <h3 className="font-serif text-xl md:text-2xl font-black text-white leading-tight mb-2 shadow-sm">
                                        {course.title}
                                    </h3>
                                    <div className={cn(
                                        "inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md",
                                        course.status === 'published'
                                            ? "text-green-300 bg-green-900/40 border-green-500/30"
                                            : "text-amber-300 bg-amber-900/40 border-amber-500/30"
                                    )}>
                                        <span className="material-symbols-outlined text-[12px]">
                                            {course.status === 'published' ? 'verified' : 'pending'}
                                        </span>
                                        {course.status}
                                    </div>
                                </div>
                            </div>

                            {/* Info Area */}
                            <div className="p-6 pt-4 flex-1 flex flex-col justify-between gap-4 bg-espresso relative">
                                <p className="text-white/60 text-xs md:text-sm line-clamp-2 leading-relaxed">
                                    {course.description}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] group-hover:text-white/60 transition-colors">
                                        ID: {course.id}
                                    </span>
                                    <div className="flex items-center gap-2 text-white/80 group-hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">
                                        Manage
                                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}


