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
                const q = query(collection(db, 'courses', BEAN_TO_BREW_ID, 'modules'), orderBy('title'));
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
            <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl p-10 shadow-xl border border-espresso/10 flex flex-col md:flex-row gap-10 items-start relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                <div className="w-full md:w-2/5 aspect-video rounded-3xl overflow-hidden shadow-2xl relative z-10 rotate-1 group-hover:rotate-0 transition-transform duration-500">
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-espresso/10 hover:bg-transparent transition-colors" />
                </div>
                <div className="flex-1 space-y-6 text-left relative z-10">
                    <h1 className="text-4xl font-serif font-bold text-espresso dark:text-white leading-tight">{course.title}</h1>
                    <p className="text-sm font-medium text-espresso/60 dark:text-white/60 leading-relaxed">{course.description}</p>

                    <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                        <div className="flex items-center gap-3 px-5 py-2 bg-espresso text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                            <span className="material-symbols-outlined text-lg">verified</span>
                            {t('student.courses.academic_standard')}
                        </div>
                        <div className="flex items-center gap-3 px-5 py-2 bg-white/40 dark:bg-white/10 text-espresso dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-espresso/5">
                            <span className="material-symbols-outlined text-lg">view_module</span>
                            {t('student.courses.units_count', { count: modules.length })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modules List */}
            <div>
                <h2 className="text-[10px] font-black text-espresso/50 dark:text-white/50 uppercase tracking-[0.2em] flex items-center gap-3 mb-8">
                    <span className="h-2 w-2 rounded-full bg-espresso"></span>
                    {t('student.courses.curriculum_map')}
                </h2>

                <div className="space-y-4">
                    {modules.map((module, index) => {
                        const isAssigned = module.assignedStudents?.includes(user?.uid);
                        const moduleProgress = progress[module.id];
                        const isCompleted = moduleProgress?.status === 'completed' || moduleProgress?.passed === true;

                        let status = 'locked';
                        if (isAssigned) {
                            status = isCompleted ? 'completed' : 'unlocked';
                        }

                        return (
                            <div
                                key={module.id}
                                className={cn(
                                    "relative bg-[#F5DEB3] dark:bg-white/5 p-8 rounded-3xl border transition-all duration-300 group overflow-hidden",
                                    status === 'locked'
                                        ? "opacity-60 grayscale border-transparent"
                                        : "border-espresso/10 dark:border-white/5 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                                )}
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>

                                {/* Connector Line (except for last item) */}
                                {index !== modules.length - 1 && (
                                    <div className="absolute left-[47px] bottom-[-20px] w-0.5 h-[20px] bg-espresso/10 z-0"></div>
                                )}

                                <div className="flex items-center gap-8 relative z-10">
                                    {/* Status Icon */}
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-xl shadow-xl border border-espresso/5 rotate-3 group-hover:rotate-0 transition-transform",
                                        status === 'completed' ? "bg-green-500 text-white" :
                                            status === 'unlocked' ? "bg-espresso text-white shadow-espresso/20" :
                                                "bg-espresso/5 text-espresso/20 border-espresso/10"
                                    )}>
                                        <span className="material-symbols-outlined">
                                            {status === 'completed' ? 'verified' :
                                                status === 'unlocked' ? 'play_circle' : 'lock_open'}
                                        </span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-espresso/40 dark:text-white/40">
                                                {t('student.courses.unit_label')} {index + 1}
                                            </span>
                                            {!isAssigned && (
                                                <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                                    {t('student.courses.auth_required')}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-serif font-bold text-espresso dark:text-white group-hover:translate-x-1 transition-transform">
                                            {module.title}
                                        </h3>
                                        {status === 'locked' && (
                                            <div className="text-[10px] font-black uppercase tracking-widest text-espresso/40 flex items-center gap-2 mt-2">
                                                <span className="material-symbols-outlined text-sm">notification_important</span>
                                                {t('student.courses.locked_note')}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        {status !== 'locked' && (
                                            <button
                                                onClick={() => navigate(`/student/courses/${BEAN_TO_BREW_ID}?module=${module.id}`)}
                                                className="px-8 py-3 bg-espresso text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:shadow-2xl transition-all shadow-xl active:scale-95"
                                            >
                                                {status === 'completed' ? t('student.courses.reexamine') : t('student.courses.commence')}
                                            </button>
                                        )}
                                        {status === 'locked' && (
                                            <button disabled className="px-8 py-3 bg-espresso/5 text-espresso/20 font-black uppercase tracking-widest text-[10px] rounded-2xl cursor-not-allowed border border-espresso/10">
                                                {t('student.courses.locked_btn')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
