import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

const BEAN_TO_BREW_ID = 'bean-to-brew';

export function MyCourses() {
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
                <p className="text-espresso/60">Course not found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            {/* Header / Hero */}
            <div className="bg-white dark:bg-[#2c2825] rounded-2xl p-8 shadow-sm border border-black/5 dark:border-white/5 flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden shadow-lg relative">
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <h1 className="text-3xl font-serif font-bold text-espresso dark:text-white">{course.title}</h1>
                    <p className="text-espresso/70 dark:text-white/70">{course.description}</p>

                    <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold">
                            <span className="material-symbols-outlined text-lg">verified</span>
                            Certificate Course
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-white/10 text-espresso/70 dark:text-white/70 rounded-full text-sm font-bold">
                            <span className="material-symbols-outlined text-lg">view_module</span>
                            {modules.length} Modules
                        </div>
                    </div>
                </div>
            </div>

            {/* Modules List */}
            <div>
                <h2 className="text-xl font-bold text-espresso dark:text-white mb-6 pl-2 border-l-4 border-primary">
                    Your Learning Path
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
                                    "relative bg-white dark:bg-[#2c2825] p-6 rounded-xl border transition-all duration-300",
                                    status === 'locked'
                                        ? "opacity-60 grayscale border-transparent"
                                        : "border-black/5 dark:border-white/5 shadow-sm hover:shadow-md hover:border-primary/30"
                                )}
                            >
                                {/* Connector Line (except for last item) */}
                                {index !== modules.length - 1 && (
                                    <div className="absolute left-[39px] bottom-[-20px] w-0.5 h-[20px] bg-gray-200 dark:bg-white/10 z-0"></div>
                                )}

                                <div className="flex items-center gap-6 relative z-10">
                                    {/* Status Icon */}
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-xl shadow-sm border-2",
                                        status === 'completed' ? "bg-green-100 text-green-600 border-green-200" :
                                            status === 'unlocked' ? "bg-primary text-white border-primary" :
                                                "bg-gray-100 text-gray-400 border-gray-200 dark:bg-white/5 dark:border-white/10"
                                    )}>
                                        <span className="material-symbols-outlined">
                                            {status === 'completed' ? 'check' :
                                                status === 'unlocked' ? 'play_arrow' : 'lock'}
                                        </span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-espresso/40 dark:text-white/40">
                                                Module {index + 1}
                                            </span>
                                            {!isAssigned && (
                                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                                                    Not Assigned
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-espresso dark:text-white">
                                            {module.title}
                                        </h3>
                                        {status === 'locked' && (
                                            <div className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                                                <span className="material-symbols-outlined text-sm">info</span>
                                                Ask instructor for access
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        {status !== 'locked' && (
                                            <button
                                                onClick={() => navigate(`/student/courses/${BEAN_TO_BREW_ID}?module=${module.id}`)}
                                                className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
                                            >
                                                {status === 'completed' ? 'Review' : 'Start'}
                                            </button>
                                        )}
                                        {status === 'locked' && (
                                            <button disabled className="px-6 py-2 bg-gray-100 dark:bg-white/10 text-gray-400 font-bold rounded-lg cursor-not-allowed">
                                                Locked
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
