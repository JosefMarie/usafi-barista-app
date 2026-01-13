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
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in">
            {/* Header */}
            <div className="px-4 py-8 md:py-10 border-b border-espresso/10 bg-[#F5DEB3]/90 dark:bg-[#1c1916]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20"></div>
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif font-black text-espresso dark:text-white mb-2 md:mb-3 uppercase tracking-tight">
                            Curriculum Director
                        </h1>
                        <p className="text-espresso/60 dark:text-white/60 max-w-2xl text-[10px] md:text-xs font-black uppercase tracking-widest leading-relaxed">
                            Oversee the core "Bean to Brew" certification architecture. Ensure sequential integrity of all modules.
                        </p>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
                        <button
                            onClick={togglePublish}
                            className={cn(
                                "w-full md:w-auto flex items-center justify-center md:justify-start gap-3 px-6 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 group",
                                courseStatus === 'published'
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : "bg-espresso text-white hover:shadow-espresso/40"
                            )}
                        >
                            <span className="material-symbols-outlined text-[16px] md:text-[18px] group-hover:rotate-12 transition-transform">
                                {courseStatus === 'published' ? 'verified' : 'domain_verification'}
                            </span>
                            {courseStatus === 'published' ? 'LIVE ARCHITECTURE' : 'DRAFT STATE'}
                        </button>
                        <span className="text-[9px] md:text-[10px] text-espresso/30 dark:text-white/30 font-bold italic ml-1 md:ml-0">
                            Protocol 1.0 Updated
                        </span>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <main className="px-4 py-10 w-full pb-32">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="w-8 h-px bg-espresso/20"></span>
                        Sequential Module Matrix
                    </h2>
                    <p className="text-[10px] font-black text-espresso/20 uppercase tracking-widest">{modules.length} Nodes Online</p>
                </div>

                <div className="grid gap-4 md:gap-6">
                    {modules.map((module) => (
                        <div
                            key={module.id}
                            onClick={() => navigate(`/admin/courses/${BEAN_TO_BREW_ID}/modules/${module.id}`)}
                            className="bg-espresso p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 bottom-0 w-2 bg-white/20 group-hover:bg-white transition-colors"></div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pl-2 md:pl-6">
                                <div className="flex-1">
                                    <h3 className="font-serif text-xl md:text-2xl font-black text-white mb-3 tracking-tight group-hover:text-white/90 transition-colors">
                                        {module.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                                        <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-white/70 font-black uppercase tracking-widest bg-white/10 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-white/5 shadow-inner">
                                            <span className="material-symbols-outlined text-[14px] md:text-[16px]">layers</span>
                                            {module.content?.length || 0} Assets
                                        </div>
                                        <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-white/70 font-black uppercase tracking-widest bg-white/10 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-white/5 shadow-inner">
                                            <span className="material-symbols-outlined text-[14px] md:text-[16px]">groups_2</span>
                                            {module.assignedStudents?.length || 0} Participants
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                            module.status === 'published'
                                                ? "text-green-400 bg-green-400/10 border-green-400/20"
                                                : "text-amber-400 bg-amber-400/10 border-amber-400/20"
                                        )}>
                                            <span className="material-symbols-outlined text-[12px] md:text-[14px]">
                                                {module.status === 'published' ? 'verified' : 'pending'}
                                            </span>
                                            {module.status}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6">
                                    <span className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.3em] group-hover:opacity-100 transition-all sm:translate-x-4 sm:group-hover:translate-x-0">
                                        CONFIGURE NODE
                                    </span>
                                    <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-white text-espresso flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95 group-hover:shadow-white/20">
                                        <span className="material-symbols-outlined text-[20px] md:text-[24px]">settings_input_component</span>
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


