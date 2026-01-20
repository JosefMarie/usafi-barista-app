import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

const BEAN_TO_BREW_ID = 'bean-to-brew';

export function MyCourses() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // 1. Fetch Main Course Info
                const courseDoc = await getDoc(doc(db, 'courses', BEAN_TO_BREW_ID));
                if (courseDoc.exists()) {
                    setCourse({ id: courseDoc.id, ...courseDoc.data() });
                }

                // 2. Fetch Modules
                const q = query(collection(db, 'courses', BEAN_TO_BREW_ID, 'modules'), where('status', '==', 'published'));
                const querySnapshot = await getDocs(q);
                const fetchedModules = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                fetchedModules.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
                setModules(fetchedModules);

                // 3. Fetch User Progress
                const progressSnapshot = await getDocs(collection(db, 'users', user.uid, 'progress'));
                const progressMap = {};
                progressSnapshot.docs.forEach(doc => {
                    progressMap[doc.id] = doc.data();
                });
                setProgress(progressMap);

                setLoading(false);
            } catch (error) {
                console.error("Error loading course data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="text-center py-20">
                <p className="text-espresso/60">{t('student.courses.not_found')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in w-full">
            {/* Header / Hero */}
            <div className="bg-espresso dark:bg-white/5 rounded-3xl p-6 md:p-10 shadow-xl border border-espresso/10 flex flex-col md:flex-row gap-8 md:gap-10 items-start relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 md:w-1.5 bg-white/20 group-hover:bg-white transition-colors"></div>
                <div className="w-full md:w-2/5 aspect-video rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative z-10 rotate-1 group-hover:rotate-0 transition-transform duration-500">
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-white/10 hover:bg-transparent transition-colors" />
                </div>
                <div className="flex-1 space-y-4 md:space-y-6 text-left relative z-10">
                    <h1 className="text-2xl md:text-4xl font-serif font-bold text-white leading-tight">{course.title}</h1>
                    <p className="text-xs md:text-sm font-medium text-white/60 leading-relaxed">{course.description}</p>

                    <div className="flex flex-wrap gap-2 md:gap-4 justify-start pt-2">
                        <div className="flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 bg-white text-espresso rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg">
                            <span className="material-symbols-outlined text-base md:text-lg">verified</span>
                            {t('student.courses.academic_standard')}
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 bg-white/10 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-sm border border-white/5">
                            <span className="material-symbols-outlined text-base md:text-lg">view_module</span>
                            {t('student.courses.units_count', { count: modules.length })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modules List */}
            <div>
                <h2 className="text-[10px] font-black text-espresso/50 dark:text-white/50 uppercase tracking-[0.2em] flex items-center gap-3 mb-6 md:mb-8">
                    <span className="h-2 w-2 rounded-full bg-espresso"></span>
                    {t('student.courses.curriculum_map')}
                </h2>

                <div className="space-y-4">
                    {modules.map((module, index) => {
                        const moduleProgress = progress[module.id];
                        const isCompleted = moduleProgress?.status === 'completed' || moduleProgress?.passed === true;
                        const isInProgress = !isCompleted && moduleProgress?.status === 'in-progress';

                        let status = isCompleted ? 'completed' : (isInProgress ? 'in-progress' : 'not-started');

                        return (
                            <div
                                key={module.id}
                                className={cn(
                                    "relative bg-espresso p-5 md:p-8 rounded-[1.5rem] md:rounded-3xl border transition-all duration-300 group overflow-hidden border-white/10 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                                )}
                            >
                                <div className={cn(
                                    "absolute left-0 top-0 bottom-0 w-1 md:w-1.5 transition-colors",
                                    status === 'completed' ? "bg-green-500/30 group-hover:bg-green-500" :
                                        status === 'in-progress' ? "bg-yellow-500/30 group-hover:bg-yellow-500" :
                                            "bg-red-500/30 group-hover:bg-red-500"
                                )}></div>

                                {/* Connector Line (except for last item) */}
                                {index !== modules.length - 1 && (
                                    <div className="absolute left-[39px] md:left-[47px] bottom-[-20px] w-0.5 h-[20px] bg-white/10 z-0"></div>
                                )}

                                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 md:gap-8 relative z-10 text-center sm:text-left">
                                    {/* Status Icon */}
                                    <div className={cn(
                                        "size-12 md:size-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 text-lg md:text-xl shadow-xl border border-white/5 rotate-3 group-hover:rotate-0 transition-transform",
                                        status === 'completed' ? "bg-green-500 text-white" :
                                            status === 'in-progress' ? "bg-yellow-500 text-white" :
                                                "bg-red-500 text-white"
                                    )}>
                                        <span className="material-symbols-outlined">
                                            {status === 'completed' ? 'verified' : 'play_circle'}
                                        </span>
                                    </div>

                                    <div className="flex-1 w-full">
                                        <div className="mb-1.5">
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40">
                                                {t('student.courses.unit_label')} {index + 1}
                                            </span>
                                        </div>
                                        <h3 className="text-lg md:text-xl font-serif font-bold text-white group-hover:translate-x-1 transition-transform">
                                            {module.title}
                                        </h3>
                                    </div>

                                    <div className="w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-none border-white/5">
                                        <button
                                            onClick={() => navigate(`/student/courses/${BEAN_TO_BREW_ID}?module=${module.id}`)}
                                            className="w-full sm:w-auto px-6 md:px-8 py-3 bg-white text-espresso font-black uppercase tracking-widest text-[9px] md:text-[10px] rounded-xl md:rounded-2xl hover:shadow-2xl transition-all shadow-xl active:scale-95"
                                        >
                                            {status === 'completed' ? t('student.courses.reexamine') :
                                                status === 'in-progress' ? t('student.courses.continue') :
                                                    t('student.courses.commence')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div >
    );
}
