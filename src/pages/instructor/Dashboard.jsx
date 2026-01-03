import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

export function InstructorDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalStudents: 0,
        assignedCourses: 0,
        upcomingSessions: 0,
        averageRating: 4.8
    });
    const [loading, setLoading] = useState(true);

    // Mock data for charts since we don't have real historical quiz data yet
    const studentProgressData = [
        { name: 'Module 1', value: 85 },
        { name: 'Module 2', value: 72 },
        { name: 'Module 3', value: 64 },
        { name: 'Module 4', value: 45 },
        { name: 'Module 5', value: 20 },
        { name: 'Module 6', value: 10 },
    ];

    const recentActivity = [
        { id: 1, student: 'Alice Johnson', action: 'Completed Quiz: Espresso Basics', time: '2 hours ago', score: '92%' },
        { id: 2, student: 'Bob Smith', action: 'Joined Session: Latte Art 101', time: '5 hours ago', score: null },
        { id: 3, student: 'Charlie Brown', action: 'Uploaded Assignment: Pour Over', time: '1 day ago', score: 'Pending' },
        { id: 4, student: 'Diana Prince', action: 'Completed Module: Introduction', time: '2 days ago', score: '100%' },
    ];

    useEffect(() => {
        if (user) fetchStats();
    }, [user]);

    const fetchStats = async () => {
        try {
            // Students count
            const studentsQuery = query(collection(db, 'users'), where('instructorId', '==', user.uid));
            const studentsSnap = await getDocs(studentsQuery);

            // Upcoming sessions
            const sessionsQuery = query(collection(db, 'schedules'), where('instructorId', '==', user.uid));
            const sessionsSnap = await getDocs(sessionsQuery);
            const now = new Date();
            const upcoming = sessionsSnap.docs.filter(doc => new Date(doc.data().dateTime?.toDate?.() || doc.data().dateTime) > now).length;

            setStats({
                totalStudents: studentsSnap.size,
                assignedCourses: (user.assignedCourseIds || []).length,
                upcomingSessions: upcoming,
                averageRating: 4.8 // Mock rating
            });
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-serif font-bold text-espresso dark:text-white">Welcome back, {user?.name?.split(' ')[0] || 'Instructor'}!</h1>
                <p className="text-espresso/70 dark:text-white/70 mt-1">Here's what's happening with your students today.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></span>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon="group" label="Assigned Students" value={stats.totalStudents} color="bg-espresso" />
                        <StatCard icon="menu_book" label="Active Courses" value={stats.assignedCourses} color="bg-espresso" />
                        <StatCard icon="videocam" label="Upcoming Sessions" value={stats.upcomingSessions} color="bg-espresso" />
                        <StatCard icon="star" label="Avg. Student Rating" value={stats.averageRating} color="bg-espresso" />
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Chart Section */}
                        <div className="lg:col-span-2 bg-[#F5DEB3] dark:bg-white/5 p-8 rounded-3xl border border-espresso/10 shadow-xl relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <h2 className="text-[10px] font-black text-espresso/50 dark:text-white/50 mb-8 uppercase tracking-[0.2em] relative z-10">Course Completion Performance</h2>
                            <div className="h-64 flex items-end justify-between gap-4 px-2 relative z-10">
                                {studentProgressData.map((item, index) => (
                                    <div key={index} className="flex flex-col items-center gap-3 flex-1 group/bar">
                                        <div className="text-[10px] font-black text-espresso dark:text-white opacity-0 group-hover/bar:opacity-100 transition-all mb-1 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded shadow-sm">{item.value}%</div>
                                        <div className="w-full bg-white/40 dark:bg-white/5 rounded-t-2xl relative h-48 overflow-hidden border border-espresso/5">
                                            <div
                                                className="absolute bottom-0 left-0 w-full bg-espresso transition-all duration-1000 ease-out group-hover/bar:bg-espresso/80"
                                                style={{ height: `${item.value}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-black text-espresso/40 dark:text-white/40 text-center truncate w-full uppercase tracking-tighter">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-[#F5DEB3] dark:bg-white/5 p-8 rounded-3xl border border-espresso/10 shadow-xl relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <h2 className="text-[10px] font-black text-espresso/50 dark:text-white/50 mb-8 uppercase tracking-[0.2em] relative z-10">Live Student Pulse</h2>
                            <div className="space-y-5 relative z-10">
                                {recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-4 pb-5 border-b border-espresso/5 dark:border-white/5 last:border-0 last:pb-0 group/activity">
                                        <div className="h-10 w-10 rounded-2xl bg-espresso flex items-center justify-center text-white shadow-lg shrink-0 group-hover/activity:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-[18px]">
                                                {activity.action.includes('Quiz') ? 'quiz' : activity.action.includes('Session') ? 'videocam' : 'upload_file'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-espresso dark:text-white">{activity.student}</p>
                                            <p className="text-xs font-bold text-espresso/60 dark:text-white/60 mb-2">{activity.action}</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-black text-espresso/30 dark:text-white/30 uppercase tracking-[0.2em]">{activity.time}</span>
                                                {activity.score && (
                                                    <span className={cn(
                                                        "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm",
                                                        activity.score === 'Pending' ? "bg-white/40 text-espresso/50" : "bg-espresso text-white"
                                                    )}>
                                                        {activity.score}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link to="/instructor/students" className="flex items-center justify-center gap-2 mt-8 py-3 bg-white/40 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-espresso/60 hover:bg-white/60 dark:hover:bg-white/10 rounded-xl transition-all relative z-10 active:scale-95 shadow-sm">
                                Explore All Students
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    return (
        <div className="bg-[#F5DEB3] dark:bg-white/5 p-6 rounded-3xl border border-espresso/10 shadow-xl flex items-center gap-5 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform relative z-10", color)}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-serif font-bold text-espresso dark:text-white leading-none">{value}</p>
            </div>
        </div>
    );
}
