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
                        <StatCard icon="group" label="Assigned Students" value={stats.totalStudents} color="bg-blue-500" />
                        <StatCard icon="menu_book" label="Active Courses" value={stats.assignedCourses} color="bg-purple-500" />
                        <StatCard icon="videocam" label="Upcoming Sessions" value={stats.upcomingSessions} color="bg-green-500" />
                        <StatCard icon="star" label="Avg. Student Rating" value={stats.averageRating} color="bg-amber-500" />
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Chart Section */}
                        <div className="lg:col-span-2 bg-white dark:bg-[#2c2825] p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
                            <h2 className="text-lg font-bold text-espresso dark:text-white mb-6">Course Completion Rates</h2>
                            <div className="h-64 flex items-end justify-between gap-4 px-2">
                                {studentProgressData.map((item, index) => (
                                    <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                                        <div className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity mb-1">{item.value}%</div>
                                        <div className="w-full bg-gray-100 dark:bg-white/5 rounded-t-lg relative h-48 overflow-hidden">
                                            <div
                                                className="absolute bottom-0 left-0 w-full bg-primary transition-all duration-1000 ease-out hover:bg-primary/90"
                                                style={{ height: `${item.value}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-espresso/60 dark:text-white/60 text-center truncate w-full">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white dark:bg-[#2c2825] p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
                            <h2 className="text-lg font-bold text-espresso dark:text-white mb-4">Recent Student Activity</h2>
                            <div className="space-y-4">
                                {recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-black/5 dark:border-white/5 last:border-0 last:pb-0">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-1 shrink-0">
                                            <span className="material-symbols-outlined text-[16px]">
                                                {activity.action.includes('Quiz') ? 'quiz' : activity.action.includes('Session') ? 'videocam' : 'upload_file'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-espresso dark:text-white">{activity.student}</p>
                                            <p className="text-xs text-espresso/70 dark:text-white/70">{activity.action}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-espresso/40 dark:text-white/40 uppercase tracking-wider">{activity.time}</span>
                                                {activity.score && (
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                                        activity.score === 'Pending' ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"
                                                    )}>
                                                        {activity.score}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link to="/instructor/students" className="block text-center mt-4 text-sm text-primary font-bold hover:underline">
                                View All Students
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
        <div className="bg-white dark:bg-[#2c2825] p-5 rounded-xl border border-black/5 dark:border-white/5 shadow-sm flex items-center gap-4">
            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center text-white shadow-md", color)}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div>
                <p className="text-2xl font-serif font-bold text-espresso dark:text-white">{value}</p>
                <p className="text-xs uppercase tracking-wider font-bold text-espresso/40 dark:text-white/40">{label}</p>
            </div>
        </div>
    );
}
