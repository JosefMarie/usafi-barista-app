import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, getDocs, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { StudentProgressReport } from '../../components/student/StudentProgressReport';

const BEAN_TO_BREW_ID = 'bean-to-brew';

export function MyCourses() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Support either the new array format or fallback to the old activeCourseId for legacy
    const enrolledCourses = user?.enrolledCourses || (user?.courseId ? [{ courseId: user.courseId, status: 'active' }] : [{ courseId: BEAN_TO_BREW_ID, status: 'active' }]);

    const [coursesData, setCoursesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // Fetch progress first
                const progressSnapshot = await getDocs(collection(db, 'users', user.uid, 'progress'));
                const progressMap = {};
                progressSnapshot.docs.forEach(doc => {
                    progressMap[doc.id] = doc.data();
                });
                setProgress(progressMap);

                // Fetch details for all enrolled courses
                const fetchedCourses = [];
                for (const enrolled of enrolledCourses) {
                    const cId = enrolled.courseId;
                    const courseDoc = await getDoc(doc(db, 'courses', cId));
                    if (courseDoc.exists()) {

                        // Fetch modules for this course
                        const q = query(collection(db, 'courses', cId, 'modules'), where('status', '==', 'published'));
                        const querySnapshot = await getDocs(q);
                        const courseModules = querySnapshot.docs.map(modDoc => ({
                            id: modDoc.id,
                            ...modDoc.data()
                        }));
                        courseModules.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));

                        fetchedCourses.push({
                            id: courseDoc.id,
                            ...courseDoc.data(),
                            enrollmentStatus: enrolled.status,
                            modules: courseModules
                        });
                    }
                }

                setCoursesData(fetchedCourses);
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

    if (!coursesData || coursesData.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-espresso/60">{t('student.courses.not_found')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-16 animate-fade-in w-full">
            {coursesData.map((courseItem) => (
                <div key={courseItem.id} className="space-y-8">
                    {/* Header / Hero */}
                    <div className="bg-espresso dark:bg-white/5 rounded-3xl p-6 md:p-10 shadow-xl border border-espresso/10 flex flex-col md:flex-row gap-8 md:gap-10 items-start relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 md:w-1.5 bg-white/20 group-hover:bg-white transition-colors"></div>
                        <div className="w-full md:w-2/5 aspect-video rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative z-10 rotate-1 group-hover:rotate-0 transition-transform duration-500">
                            <img
                                src={courseItem.thumbnail}
                                alt={courseItem.title}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-white/10 hover:bg-transparent transition-colors" />
                        </div>
                        <div className="flex-1 space-y-4 md:space-y-6 text-left relative z-10">
                            <h1 className="text-2xl md:text-4xl font-serif font-bold text-white leading-tight">{courseItem.title}</h1>
                            <p className="text-xs md:text-sm font-medium text-white/60 leading-relaxed">{courseItem.description}</p>

                            <div className="flex flex-wrap gap-2 md:gap-4 justify-start pt-2">
                                <div className="flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 bg-white text-espresso rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg">
                                    <span className="material-symbols-outlined text-base md:text-lg">verified</span>
                                    {t('student.courses.academic_standard')}
                                </div>
                                <div className="flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 bg-white/10 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-sm border border-white/5">
                                    <span className="material-symbols-outlined text-base md:text-lg">view_module</span>
                                    {t('student.courses.units_count', { count: courseItem.modules?.length || 0 })}
                                </div>
                                {courseItem.enrollmentStatus === 'pending' && (
                                    <div className="flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 bg-amber-500 text-black rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-sm">
                                        <span className="material-symbols-outlined text-base md:text-lg">pending</span>
                                        Pending Approval
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Modules List */}
                    {courseItem.enrollmentStatus === 'active' ? (
                        <div>
                            <h2 className="text-[10px] font-black text-espresso/50 dark:text-white/50 uppercase tracking-[0.2em] flex items-center gap-3 mb-6 md:mb-8">
                                <span className="h-2 w-2 rounded-full bg-espresso"></span>
                                {t('student.courses.curriculum_map')} - {courseItem.title}
                            </h2>

                            <div className="space-y-4">
                                {courseItem.modules?.filter(m => !m.isFinalAssessment).map((module, index, filteredArray) => {
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
                                            {index !== filteredArray.length - 1 && (
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
                                                        onClick={() => navigate(`/student/courses/${courseItem.id}?module=${module.id}`)}
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

                                {/* Final Assessment Section */}
                                {courseItem.modules?.filter(m => m.isFinalAssessment).map((module) => {
                                    const allOtherModules = courseItem.modules.filter(m => !m.isFinalAssessment);
                                    const allCompleted = allOtherModules.every(m => {
                                        const p = progress[m.id];
                                        return p?.status === 'completed' || p?.passed === true;
                                    });

                                    const moduleProgress = progress[module.id];
                                    const isRequested = moduleProgress?.quizRequested;
                                    const isGranted = module.quizAllowedStudents?.includes(user?.uid) || false;
                                    const isPassed = moduleProgress?.passed === true;

                                    return (
                                        <div
                                            key={module.id}
                                            className={cn(
                                                "relative bg-[#1c1916] p-5 md:p-8 rounded-[1.5rem] md:rounded-3xl border-2 transition-all duration-300 group overflow-hidden shadow-2xl mt-8",
                                                allCompleted ? "border-amber-500/50 hover:border-amber-500" : "border-white/5 opacity-80"
                                            )}
                                        >
                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                                            <div className="absolute left-0 top-0 bottom-0 w-1 md:w-1.5 transition-colors bg-amber-500/30 group-hover:bg-amber-500"></div>

                                            <div className="flex flex-col sm:flex-row items-center gap-5 md:gap-8 relative z-10 text-center sm:text-left">
                                                <div className={cn(
                                                    "size-16 md:size-20 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 text-2xl md:text-3xl shadow-xl border border-white/5 rotate-3 group-hover:rotate-0 transition-transform",
                                                    isPassed ? "bg-green-600 text-white" : "bg-amber-600 text-white"
                                                )}>
                                                    <span className="material-symbols-outlined">
                                                        {!allCompleted ? 'lock' : (isPassed ? 'workspace_premium' : 'school')}
                                                    </span>
                                                </div>

                                                <div className="flex-1 w-full">
                                                    <div className="mb-2">
                                                        <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                                                            Final Assessment
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl md:text-2xl font-serif font-bold text-white mb-1">
                                                        {module.title}
                                                    </h3>
                                                    <p className="text-xs text-white/40 font-medium">
                                                        {!allCompleted
                                                            ? "Complete all previous modules to unlock this assessment."
                                                            : "Demonstrate your mastery to earn your certification."}
                                                    </p>
                                                </div>

                                                <div className="w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-none border-white/5">
                                                    {!allCompleted ? (
                                                        <button disabled className="w-full sm:w-auto px-6 md:px-8 py-3 bg-white/5 text-white/40 font-black uppercase tracking-widest text-[9px] md:text-[10px] rounded-xl md:rounded-2xl cursor-not-allowed flex items-center justify-center gap-2">
                                                            <span className="material-symbols-outlined text-[16px]">lock</span>
                                                            Locked
                                                        </button>
                                                    ) : (
                                                        isGranted ? (
                                                            <button
                                                                onClick={() => navigate(`/student/courses/${courseItem.id}?module=${module.id}`)}
                                                                className="w-full sm:w-auto px-6 md:px-8 py-3 bg-amber-500 text-black font-black uppercase tracking-widest text-[9px] md:text-[10px] rounded-xl md:rounded-2xl hover:bg-amber-400 hover:shadow-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                                                                Start Exam
                                                            </button>
                                                        ) : (
                                                            <button
                                                                disabled={isRequested}
                                                                onClick={async () => {
                                                                    if (isRequested) return;
                                                                    try {
                                                                        await updateDoc(doc(db, 'users', user.uid, 'progress', module.id), {
                                                                            quizRequested: true,
                                                                            requestedAt: serverTimestamp()
                                                                        });
                                                                        // Optimistic update
                                                                        setProgress(prev => ({
                                                                            ...prev,
                                                                            [module.id]: { ...prev[module.id], quizRequested: true }
                                                                        }));
                                                                        alert("Access requested. Please wait for admin approval.");
                                                                    } catch (e) {
                                                                        console.error(e);
                                                                        // If doc doesn't exist yet
                                                                        try {
                                                                            await import('firebase/firestore').then(mod => mod.setDoc(doc(db, 'users', user.uid, 'progress', module.id), {
                                                                                quizRequested: true,
                                                                                requestedAt: serverTimestamp()
                                                                            }));
                                                                            setProgress(prev => ({
                                                                                ...prev,
                                                                                [module.id]: { ...prev[module.id], quizRequested: true }
                                                                            }));
                                                                            alert("Access requested. Please wait for admin approval.");
                                                                        } catch (err) {
                                                                            console.error(err);
                                                                            alert("Error requesting access.");
                                                                        }
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "w-full sm:w-auto px-6 md:px-8 py-3 font-black uppercase tracking-widest text-[9px] md:text-[10px] rounded-xl md:rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2",
                                                                    isRequested ? "bg-white/10 text-white/60 cursor-default" : "bg-white text-espresso hover:bg-amber-50"
                                                                )}
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">{isRequested ? 'pending' : 'vpn_key'}</span>
                                                                {isRequested ? "Request Pending" : "Request Access"}
                                                            </button>
                                                        )
                                                    )}

                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl p-8 text-center opacity-80 border border-espresso/10">
                            <span className="material-symbols-outlined text-4xl mb-2">hourglass_empty</span>
                            <p className="text-sm font-bold">Awaiting Admin Approval</p>
                            <p className="text-xs mt-1">You will gain access to modules once your enrollment for this course is approved.</p>
                        </div>
                    )}

                    {/* Student Progress Report */}
                    {courseItem.enrollmentStatus === 'active' && <StudentProgressReport courseId={courseItem.id} />}
                </div>
            ))}
        </div >
    );
}
