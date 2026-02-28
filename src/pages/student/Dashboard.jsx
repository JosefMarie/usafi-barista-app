import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const BEAN_TO_BREW_ID = 'bean-to-brew';

export function Dashboard() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // State for real data
    const [coursesData, setCoursesData] = useState([]);
    const enrolledCourses = (user?.enrolledCourses && user.enrolledCourses.length > 0)
        ? user.enrolledCourses
        : (user?.courseId ? [{ courseId: user.courseId, status: 'active' }] : [{ courseId: BEAN_TO_BREW_ID, status: 'active' }]);

    const [stats, setStats] = useState([
        { label: t('student.dashboard.stats.courses'), value: 0, icon: 'school', color: 'bg-blue-500' },
        { label: t('student.dashboard.stats.completed'), value: '0/0', icon: 'check_circle', color: 'bg-green-500' },
        { label: t('student.dashboard.stats.certificates'), value: 0, icon: 'workspace_premium', color: 'bg-yellow-500' },
    ]);
    const [nextModule, setNextModule] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                const fetchedCoursesData = [];
                let overallTotalModules = 0;
                let overallCompletedCount = 0;
                let bestNextModule = null;

                // Loop through enrolled courses
                for (const enrolled of enrolledCourses) {
                    if (enrolled.status !== 'active') continue; // Only process active courses for now

                    const cId = enrolled.courseId;
                    const courseDoc = await getDoc(doc(db, 'courses', cId));
                    if (!courseDoc.exists()) continue;

                    const courseInfo = { id: courseDoc.id, ...courseDoc.data() };

                    // Fetch modules
                    const modQ = query(collection(db, 'courses', cId, 'modules'), orderBy('title'));
                    const modSnap = await getDocs(modQ);
                    const modules = modSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                    // Fetch Progress
                    const progQ = collection(db, 'users', user.uid, 'progress');
                    const progSnap = await getDocs(progQ);
                    const progressMap = {};
                    progSnap.forEach(d => {
                        const data = d.data();
                        if (data.courseId === cId) {
                            progressMap[data.moduleId] = data;
                        }
                    });

                    // Local stats
                    const totalModules = modules.length;
                    const completedCount = Object.values(progressMap).filter(p => p.passed).length;

                    overallTotalModules += totalModules;
                    overallCompletedCount += completedCount;

                    // Upcoming module logic
                    let upcoming = null;
                    for (const mod of modules) {
                        if (mod.assignedStudents?.includes(user.uid) || true) { // We can default true if they're enrolled
                            if (!progressMap[mod.id]?.passed) {
                                upcoming = mod;
                                break;
                            }
                        }
                    }

                    if (upcoming && !bestNextModule) {
                        bestNextModule = { ...upcoming, courseId: cId }; // Pick the first incomplete one we find
                    }

                    fetchedCoursesData.push(courseInfo);
                }

                setCoursesData(fetchedCoursesData);

                // Update Stats
                setStats([
                    { label: t('student.dashboard.stats.courses'), value: fetchedCoursesData.length, icon: 'school', color: 'bg-blue-500' },
                    { label: t('student.dashboard.stats.completed'), value: `${overallCompletedCount}/${overallTotalModules}`, icon: 'check_circle', color: 'bg-green-500' },
                    { label: t('student.dashboard.stats.certificates'), value: overallCompletedCount, icon: 'workspace_premium', color: 'bg-yellow-500' },
                ]);

                setNextModule(bestNextModule);

                // 6. Fetch Recent Activity
                const activityQ = query(
                    collection(db, 'activity'),
                    where('userId', '==', user.uid),
                    limit(20) // Get more to sort in-memory
                );
                const activitySnap = await getDocs(activityQ);
                const activityData = activitySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // In-memory sort to avoid index requirement
                activityData.sort((a, b) => {
                    const timeA = a.timestamp?.toMillis?.() || 0;
                    const timeB = b.timestamp?.toMillis?.() || 0;
                    return timeB - timeA;
                });

                setRecentActivity(activityData.slice(0, 3));

                setLoading(false);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) return <div className="h-screen flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;

    return (
        <div className="space-y-8 animate-fade-in w-full">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-espresso dark:text-white">
                        {t('student.dashboard.welcome', { name: (user?.name || user?.fullName || user?.email || 'Student').split(' ')[0] })}
                    </h1>
                    <p className="text-espresso/60 dark:text-white/60 font-medium mt-1 text-sm md:text-base">
                        {t('student.dashboard.subtitle')}
                    </p>
                </div>
                <div className="bg-espresso dark:bg-white/5 px-4 py-3 md:px-6 md:py-3 rounded-2xl shadow-xl border border-espresso/10 relative overflow-hidden group self-start md:self-auto">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 group-hover:bg-white transition-colors"></div>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40">{t('student.dashboard.current_expedition')}</p>
                    <p className="text-xs md:text-sm font-serif font-bold text-white">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-espresso dark:bg-white/5 p-4 md:p-6 rounded-3xl shadow-xl border border-espresso/10 flex items-center gap-4 md:gap-5 transition-all hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/20 group-hover:bg-white transition-colors"></div>
                        <div className={cn("h-12 w-12 md:h-14 md:w-14 rounded-2xl flex items-center justify-center text-white shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform", stat.color.replace('bg-', 'bg-espresso/80 '))}>
                            <span className="material-symbols-outlined text-xl md:text-2xl">{stat.icon}</span>
                        </div>
                        <div className="relative z-10">
                            <p className="text-xl md:text-2xl font-black text-white tracking-tight">{stat.value}</p>
                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/60">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                {/* Left Column: Featured Course */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[9px] md:text-[10px] font-black text-espresso/50 dark:text-white/50 uppercase tracking-[0.2em] flex items-center gap-2 md:gap-3">
                            <span className="h-2 w-2 rounded-full bg-espresso"></span>
                            {t('student.dashboard.curriculum.title')}
                        </h2>
                        <Link to="/student/courses" className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-espresso/40 hover:text-espresso transition-colors">
                            {t('student.dashboard.curriculum.view_map')}
                        </Link>
                    </div>

                    {coursesData.length > 0 ? (
                        <div className="space-y-4">
                            {coursesData.map(c => (
                                <div key={c.id} className="bg-espresso dark:bg-white/5 rounded-3xl shadow-xl border border-espresso/10 overflow-hidden flex flex-col md:flex-row group cursor-pointer hover:shadow-2xl transition-all relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/20 group-hover:bg-white transition-colors"></div>
                                    <div className="md:w-2/5 h-56 md:h-auto overflow-hidden relative">
                                        <div
                                            className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                                            style={{ backgroundImage: `url('${c.thumbnail}')` }}
                                        ></div>
                                        <div className="absolute inset-0 bg-espresso/20 group-hover:bg-transparent transition-colors" />
                                    </div>
                                    <div className="p-8 md:w-3/5 flex flex-col justify-between relative z-10">
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[10px] font-black text-espresso bg-white px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                                    {t('student.dashboard.curriculum.status_active')}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-serif font-bold text-white mb-3 group-hover:translate-x-1 transition-transform">
                                                {c.title}
                                            </h3>
                                            <p className="text-sm font-medium text-white/60 line-clamp-2 mb-6 leading-relaxed">
                                                {c.description || 'Master the art of coffee with this comprehensive guide.'}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => navigate('/student/courses')}
                                            className="w-full py-4 bg-white text-espresso rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-2xl transition-all shadow-xl active:scale-95"
                                        >
                                            {t('student.dashboard.curriculum.resume_btn')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl shadow-xl border border-espresso/10 p-12 text-center relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <p className="text-espresso/40 dark:text-white/40 font-black uppercase tracking-widest text-sm">
                                {t('student.dashboard.curriculum.empty')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column: Up Next & Activity */}
                <div className="space-y-8">
                    {/* Up Next */}
                    <div className="space-y-6">
                        <h2 className="text-[10px] font-black text-espresso/50 dark:text-white/50 uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-espresso"></span>
                            {t('student.dashboard.next_step.title')}
                        </h2>

                        {nextModule ? (
                            <div className="bg-espresso dark:bg-white/5 rounded-3xl shadow-xl border border-espresso/10 overflow-hidden animate-slide-in relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/20 group-hover:bg-white transition-colors"></div>
                                <div className="relative h-40 overflow-hidden">
                                    <img
                                        src={nextModule.content?.[0]?.image || 'https://images.unsplash.com/photo-1447933601400-b8a90d437166?q=80&w=2555&auto=format&fit=crop'}
                                        alt="Module"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/20 to-transparent flex items-end p-6">
                                        <div className="text-white">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                                                {t('student.dashboard.next_step.upcoming')}
                                            </p>
                                            <h3 className="font-serif font-bold text-xl leading-tight line-clamp-1">{nextModule.title}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 space-y-5 relative z-10">
                                    <div className="flex items-center justify-between py-1">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/5 p-2 rounded-xl text-white/40">
                                                <span className="material-symbols-outlined text-xl">timer</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                                    {t('student.dashboard.next_step.duration')}
                                                </p>
                                                <p className="text-sm font-black text-white">{nextModule.duration || '30'} {t('student.dashboard.stats.mins', 'mins')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/5 p-2 rounded-xl text-white/40">
                                                <span className="material-symbols-outlined text-xl">layers</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                                    {t('student.dashboard.next_step.units')}
                                                </p>
                                                <p className="text-sm font-black text-white">
                                                    {nextModule.content?.length || 0} {t('student.dashboard.next_step.slides')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/student/courses/${nextModule.courseId}?module=${nextModule.id}`)}
                                        className="w-full py-4 bg-white/40 hover:bg-white text-espresso font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 border border-espresso/5 active:scale-95"
                                    >
                                        {t('student.dashboard.next_step.initiate_btn')} <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-espresso/5 dark:bg-white/5 p-8 rounded-3xl border border-espresso/10 dark:border-white/10 text-center relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                <span className="material-symbols-outlined text-5xl text-espresso/20 dark:text-white/20 mb-4 block group-hover:scale-110 transition-transform">auto_awesome</span>
                                <h3 className="font-serif font-bold text-espresso dark:text-white text-lg">
                                    {t('student.dashboard.next_step.completed_title')}
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 dark:text-white/40 mt-2">
                                    {t('student.dashboard.next_step.completed_subtitle')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-6">
                        <h2 className="text-[10px] font-black text-espresso/50 dark:text-white/50 uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-espresso"></span>
                            Recent Activity
                        </h2>
                        <div className="bg-espresso dark:bg-white/5 rounded-3xl shadow-xl border border-espresso/10 overflow-hidden p-6 relative group">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/20 group-hover:bg-white transition-colors"></div>
                            {recentActivity.length > 0 ? (
                                <div className="space-y-5">
                                    {recentActivity.map((act) => (
                                        <div key={act.id} className="flex items-center gap-4 group/item">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover/item:bg-white group-hover/item:text-espresso transition-all shadow-sm">
                                                <span className="material-symbols-outlined text-xl">{act.icon || 'history'}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{act.action}</p>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40">
                                                    {act.timestamp?.toDate ? act.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center opacity-30 text-white">
                                    <p className="text-[10px] font-black uppercase tracking-widest">No activity logged yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Share Story CTA */}
                    <div className="bg-[#F5DEB3] dark:bg-primary/10 p-8 rounded-3xl border border-espresso/10 text-center relative overflow-hidden group hover:shadow-2xl transition-all cursor-pointer" onClick={() => navigate('/testimonials')}>
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-primary transition-colors"></div>
                        <span className="material-symbols-outlined text-4xl text-espresso mb-4 group-hover:scale-110 transition-transform">chat_bubble</span>
                        <h3 className="font-serif font-bold text-espresso dark:text-white text-lg">Share Your USAFFI Story</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-espresso/60 dark:text-white/60 mt-2 leading-relaxed">Your journey can inspire others. Submit a testimonial for the public site.</p>
                        <button className="mt-6 w-full py-3 bg-espresso text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all">Submit Feedback</button>
                    </div>
                </div>

            </div>
        </div>
    );
}
