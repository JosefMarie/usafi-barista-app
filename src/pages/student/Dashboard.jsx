import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const BEAN_TO_BREW_ID = 'bean-to-brew';

export function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // State for real data
    const [course, setCourse] = useState(null);
    const [stats, setStats] = useState([
        { label: 'Courses Available', value: 0, icon: 'school', color: 'bg-blue-500' },
        { label: 'Completed Modules', value: '0/0', icon: 'check_circle', color: 'bg-green-500' },
        { label: 'Certificates Earned', value: 0, icon: 'workspace_premium', color: 'bg-yellow-500' },
    ]);
    const [nextModule, setNextModule] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // 1. Fetch Course Details
                const courseDoc = await getDoc(doc(db, 'courses', BEAN_TO_BREW_ID));
                let courseData = null;
                if (courseDoc.exists()) {
                    courseData = { id: courseDoc.id, ...courseDoc.data() };
                    setCourse(courseData);
                }

                // 2. Fetch Modules
                const modQ = query(collection(db, 'courses', BEAN_TO_BREW_ID, 'modules'), orderBy('title')); // Ideally order by an index field
                const modSnap = await getDocs(modQ);
                const modules = modSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                // Sort by title numeric prefix if possible, or assume simple sort for now
                modules.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));

                // 3. Fetch User Progress
                // We fetch all progress docs for this user to check completion
                // Since progress is stored in a subcollection under user, we can try to fetch all or loop
                // Optimally: fetch all progress for this course? user -> progress collection
                const progQ = collection(db, 'users', user.uid, 'progress');
                // We might want to filter by courseId if we stored it in progress doc, which we did!
                const progSnap = await getDocs(progQ);
                const progressMap = {};
                progSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.courseId === BEAN_TO_BREW_ID) {
                        progressMap[data.moduleId] = data;
                    }
                });

                // 4. Calculate Stats
                const totalModules = modules.length;
                const completedCount = Object.values(progressMap).filter(p => p.passed).length;

                // 5. Determine Up Next
                let upcoming = null;
                for (const mod of modules) {
                    // Check if assigned
                    if (mod.assignedStudents?.includes(user.uid)) {
                        // Check if completed
                        if (!progressMap[mod.id]?.passed) {
                            upcoming = mod;
                            break; // Found the first incomplete assigned module
                        }
                    }
                }

                // Update State
                setStats([
                    { label: 'Courses Available', value: courseData ? 1 : 0, icon: 'school', color: 'bg-blue-500' },
                    { label: 'Completed Modules', value: `${completedCount}/${totalModules}`, icon: 'check_circle', color: 'bg-green-500' },
                    { label: 'Certificates Earned', value: completedCount, icon: 'workspace_premium', color: 'bg-yellow-500' },
                ]);

                setNextModule(upcoming);
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
                    <h1 className="text-3xl font-serif font-bold text-espresso dark:text-white">
                        Welcome back, {(user?.name || user?.fullName || user?.email || 'Student').split(' ')[0]}!
                    </h1>
                    <p className="text-espresso/60 dark:text-white/60 font-medium mt-1">
                        Ready to brew some excellence today?
                    </p>
                </div>
                <div className="bg-[#F5DEB3] dark:bg-white/5 px-6 py-3 rounded-2xl shadow-xl border border-espresso/10 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-espresso/40 dark:text-white/40">Current Expedition</p>
                    <p className="text-sm font-serif font-bold text-espresso dark:text-white">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-[#F5DEB3] dark:bg-white/5 p-6 rounded-3xl shadow-xl border border-espresso/10 flex items-center gap-5 transition-all hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform", stat.color.replace('bg-', 'bg-espresso/80 '))}>
                            <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                        </div>
                        <div className="relative z-10">
                            <p className="text-2xl font-black text-espresso dark:text-white tracking-tight">{stat.value}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-espresso/40 dark:text-white/40">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Featured Course */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[10px] font-black text-espresso/50 dark:text-white/50 uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-espresso"></span>
                            Primary Curriculum
                        </h2>
                        <Link to="/student/courses" className="text-[10px] font-black uppercase tracking-widest text-espresso/40 hover:text-espresso transition-colors">View Learning Map</Link>
                    </div>

                    {course ? (
                        <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl shadow-xl border border-espresso/10 overflow-hidden flex flex-col md:flex-row group cursor-pointer hover:shadow-2xl transition-all relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <div className="md:w-2/5 h-56 md:h-auto overflow-hidden relative">
                                <div
                                    className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                                    style={{ backgroundImage: `url('${course.thumbnail}')` }}
                                ></div>
                                <div className="absolute inset-0 bg-espresso/20 group-hover:bg-transparent transition-colors" />
                            </div>
                            <div className="p-8 md:w-3/5 flex flex-col justify-between relative z-10">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black text-white bg-espresso px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">In Extraction</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-espresso/40 dark:text-white/40">
                                            Sync: {course.updatedAt?.toDate ? new Date(course.updatedAt.toDate()).toLocaleDateString() : 'Active'}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-serif font-bold text-espresso dark:text-white mb-3 group-hover:translate-x-1 transition-transform">
                                        {course.title}
                                    </h3>
                                    <p className="text-sm font-medium text-espresso/60 dark:text-white/60 line-clamp-2 mb-6 leading-relaxed">
                                        {course.description || 'Master the art of coffee with this comprehensive guide.'}
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigate('/student/courses')}
                                    className="w-full py-4 bg-espresso text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-2xl transition-all shadow-xl active:scale-95"
                                >
                                    Resume Professional Journey
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl shadow-xl border border-espresso/10 p-12 text-center relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <p className="text-espresso/40 dark:text-white/40 font-black uppercase tracking-widest text-sm">No active curriculum detected.</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Up Next */}
                <div className="space-y-6">
                    <h2 className="text-[10px] font-black text-espresso/50 dark:text-white/50 uppercase tracking-[0.2em] flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-espresso"></span>
                        Strategic Next Step
                    </h2>

                    {nextModule ? (
                        <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl shadow-xl border border-espresso/10 overflow-hidden animate-slide-in relative group">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <div className="relative h-40 overflow-hidden">
                                <img
                                    src={nextModule.content?.[0]?.image || 'https://images.unsplash.com/photo-1447933601400-b8a90d437166?q=80&w=2555&auto=format&fit=crop'}
                                    alt="Module"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/20 to-transparent flex items-end p-6">
                                    <div className="text-white">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Upcoming Module</p>
                                        <h3 className="font-serif font-bold text-xl leading-tight line-clamp-1">{nextModule.title}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-5 relative z-10">
                                <div className="flex items-center justify-between py-1">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-espresso/5 p-2 rounded-xl text-espresso/40">
                                            <span className="material-symbols-outlined text-xl">timer</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-espresso/40 dark:text-white/40">Duration</p>
                                            <p className="text-sm font-black text-espresso dark:text-white">{nextModule.duration || '30'} mins</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-espresso/5 p-2 rounded-xl text-espresso/40">
                                            <span className="material-symbols-outlined text-xl">layers</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-espresso/40 dark:text-white/40">Units</p>
                                            <p className="text-sm font-black text-espresso dark:text-white">{nextModule.content?.length || 0} Slides</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate(`/student/courses/${BEAN_TO_BREW_ID}?module=${nextModule.id}`)}
                                    className="w-full py-4 bg-white/40 hover:bg-white text-espresso font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 border border-espresso/5 active:scale-95"
                                >
                                    Initiate Module <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-espresso/5 dark:bg-white/5 p-8 rounded-3xl border border-espresso/10 dark:border-white/10 text-center relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <span className="material-symbols-outlined text-5xl text-espresso/20 dark:text-white/20 mb-4 block group-hover:scale-110 transition-transform">auto_awesome</span>
                            <h3 className="font-serif font-bold text-espresso dark:text-white text-lg">Peak Excellence Achieved</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 dark:text-white/40 mt-2">
                                All objectives successfully extracted.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
