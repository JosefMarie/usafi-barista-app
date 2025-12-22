import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

const BEAN_TO_BREW_ID = 'bean-to-brew';
const MODULES = [
    { id: 'module-1', title: '1. Introduction to Coffee', status: 'draft' },
    { id: 'module-2', title: '2. Barista Basics & Equipment', status: 'draft' },
    { id: 'module-3', title: '3. Espresso & Milk Science', status: 'draft' },
    { id: 'module-4', title: '4. Latte Art', status: 'draft' },
    { id: 'module-5', title: '5. Hygiene & Maintenance', status: 'draft' },
    { id: 'module-6', title: '6. Customer Service', status: 'draft' },
];

export function AdminCourses() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [courseStatus, setCourseStatus] = useState('draft');
    const [modules, setModules] = useState([]);

    useEffect(() => {
        const initCourse = async () => {
            const courseRef = doc(db, 'courses', BEAN_TO_BREW_ID);
            const courseSnap = await getDoc(courseRef);

            if (!courseSnap.exists()) {
                // Initialize the main course document if it doesn't exist
                await setDoc(courseRef, {
                    title: 'Bean to Brew: The Complete Barista Guide',
                    description: 'Master the art of coffee making from bean selection to perfect extraction and customer service.',
                    status: 'draft',
                    thumbnail: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=1000',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                // Initialize default modules
                for (const mod of MODULES) {
                    await setDoc(doc(db, 'courses', BEAN_TO_BREW_ID, 'modules', mod.id), {
                        title: mod.title,
                        status: 'draft',
                        content: [], // slides
                        quiz: null,
                        assignedStudents: [],
                        updatedAt: serverTimestamp()
                    });
                }
                setCourseStatus('draft');
            } else {
                setCourseStatus(courseSnap.data().status);
            }

            // Listen to modules
            const q = query(collection(db, 'courses', BEAN_TO_BREW_ID, 'modules'), orderBy('title'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedModules = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort by title to ensure correct order (1., 2., 3., etc)
                fetchedModules.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
                setModules(fetchedModules);
                setLoading(false);
            });

            return unsubscribe;
        };

        const cleanup = initCourse();
        return () => {
            // Cleanup if needed
        };
    }, []);

    const togglePublish = async () => {
        const newStatus = courseStatus === 'published' ? 'draft' : 'published';
        await setDoc(doc(db, 'courses', BEAN_TO_BREW_ID), { status: newStatus }, { merge: true });
        setCourseStatus(newStatus);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center h-full bg-background-light dark:bg-background-dark">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-6 border-b border-black/5 dark:border-white/5 bg-white dark:bg-[#2c2825] sticky top-0 z-10 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-espresso dark:text-white mb-2">
                            Bean to Brew: The Complete Barista Guide
                        </h1>
                        <p className="text-espresso/60 dark:text-white/60 max-w-2xl">
                            Manage your core curriculum. This is the single certificate course offered.
                            Students must progress through these 6 modules sequentially.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <button
                            onClick={togglePublish}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md",
                                courseStatus === 'published'
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-white/10 dark:text-white"
                            )}
                        >
                            <span className="material-symbols-outlined text-lg">
                                {courseStatus === 'published' ? 'public' : 'public_off'}
                            </span>
                            {courseStatus === 'published' ? 'Published (Live)' : 'Draft (Hidden)'}
                        </button>
                        <span className="text-xs text-espresso/40 dark:text-white/40">
                            Updates strictly controlled
                        </span>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <main className="p-8 max-w-5xl mx-auto w-full">
                <h2 className="text-xl font-bold text-espresso dark:text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">view_module</span>
                    Course Modules
                </h2>

                <div className="grid gap-4">
                    {modules.map((module) => (
                        <div
                            key={module.id}
                            onClick={() => navigate(`/admin/courses/${BEAN_TO_BREW_ID}/modules/${module.id}`)}
                            className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors"></div>

                            <div className="flex items-center justify-between pl-4">
                                <div>
                                    <h3 className="font-serif text-lg font-bold text-espresso dark:text-white mb-1 group-hover:text-primary transition-colors">
                                        {module.title}
                                    </h3>
                                    <div className="flex items-center gap-4 text-xs text-espresso/60 dark:text-white/60">
                                        <span className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded">
                                            <span className="material-symbols-outlined text-sm">slideshow</span>
                                            {module.content?.length || 0} Slides
                                        </span>
                                        <span className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded">
                                            <span className="material-symbols-outlined text-sm">group</span>
                                            {module.assignedStudents?.length || 0} Students
                                        </span>
                                        <span className={cn(
                                            "flex items-center gap-1 px-2 py-0.5 rounded font-bold uppercase",
                                            module.status === 'published' ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                                        )}>
                                            {module.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                                        Manage
                                    </span>
                                    <div className="h-10 w-10 rounded-full bg-primary/10 group-hover:bg-primary text-primary group-hover:text-white flex items-center justify-center transition-all">
                                        <span className="material-symbols-outlined">arrow_forward</span>
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
