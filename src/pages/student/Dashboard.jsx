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
                    { label: 'Certificates Earned', value: 0, icon: 'workspace_premium', color: 'bg-yellow-500' }, // Placeholder
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
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-espresso dark:text-white">
                        Welcome back, {(user?.name || user?.fullName || user?.email || 'Student').split(' ')[0]}!
                    </h1>
                    <p className="text-espresso/70 dark:text-white/70 mt-1">
                        Ready to brew some excellence today?
                    </p>
                </div>
                <div className="text-sm text-espresso/60 dark:text-white/60 bg-white dark:bg-[#2c2825] px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-white/5">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-[#2c2825] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center gap-4 transition-transform hover:scale-[1.02]">
                        <div className={cn("h-12 w-12 rounded-full flex items-center justify-center text-white shadow-md", stat.color)}>
                            <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-espresso dark:text-white">{stat.value}</p>
                            <p className="text-sm font-medium text-espresso/60 dark:text-white/60">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Featured Course */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-espresso dark:text-white">Your Main Course</h2>
                        <Link to="/student/courses" className="text-sm font-medium text-primary hover:underline">View Map</Link>
                    </div>

                    {course ? (
                        <div className="bg-white dark:bg-[#2c2825] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col md:flex-row group cursor-pointer hover:shadow-md transition-all">
                            <div className="md:w-1/3 h-48 md:h-auto overflow-hidden relative">
                                <div
                                    className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                                    style={{ backgroundImage: `url('${course.thumbnail}')` }}
                                ></div>
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                            </div>
                            <div className="p-6 md:w-2/3 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full uppercase tracking-wider">Active</span>
                                        <span className="text-xs text-espresso/50 dark:text-white/50">
                                            Updated: {course.updatedAt?.toDate ? new Date(course.updatedAt.toDate()).toLocaleDateString() : 'Recently'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-espresso dark:text-white mb-2 group-hover:text-primary transition-colors">
                                        {course.title}
                                    </h3>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 line-clamp-2 mb-4">
                                        {course.description || 'Master the art of coffee with this comprehensive guide.'}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {/* Progress Bar placeholder if needed */}
                                    <button
                                        onClick={() => navigate('/student/courses')}
                                        className="w-full mt-2 text-center py-2 rounded-lg bg-espresso text-white text-sm font-medium hover:bg-espresso/90 dark:bg-white dark:text-espresso dark:hover:bg-white/90 transition-colors"
                                    >
                                        Continue Learning
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#2c2825] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 p-8 text-center">
                            <p className="text-espresso/60">No active course found.</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Up Next */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-espresso dark:text-white">Up Next</h2>

                    {nextModule ? (
                        <div className="bg-white dark:bg-[#2c2825] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden animate-slide-in">
                            <div className="relative h-32">
                                <img
                                    src={nextModule.content?.[0]?.image || 'https://images.unsplash.com/photo-1447933601400-b8a90d437166?q=80&w=2555&auto=format&fit=crop'}
                                    alt="Module"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                    <div className="text-white">
                                        <p className="text-xs font-medium opacity-90">Next Module</p>
                                        <h3 className="font-bold text-lg leading-tight line-clamp-1">{nextModule.title}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <span className="material-symbols-outlined text-xl">timer</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-espresso dark:text-white">{nextModule.duration || '30'} mins</p>
                                        <p className="text-xs text-espresso/60 dark:text-white/60">Estimated Time</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <span className="material-symbols-outlined text-xl">topic</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-espresso dark:text-white">{nextModule.content?.length || 0} Slides</p>
                                        <p className="text-xs text-espresso/60 dark:text-white/60">Content & Quiz</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate(`/student/courses/${BEAN_TO_BREW_ID}?module=${nextModule.id}`)}
                                    className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                                >
                                    Start Module <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-xl border border-green-100 dark:border-green-900/30 text-center">
                            <span className="material-symbols-outlined text-4xl text-green-600 mb-2">check_circle</span>
                            <h3 className="font-bold text-green-800 dark:text-green-200">All Caught Up!</h3>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                You have completed all assigned modules. Great job!
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
