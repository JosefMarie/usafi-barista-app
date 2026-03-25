import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { cn } from '../../../lib/utils';
import { Link } from 'react-router-dom';

export function BusinessAnalytics() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalCourses: 0,
        completions: 0,
        averageScore: 0
    });
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Business Courses
                const coursesSnap = await getDocs(collection(db, 'business_courses'));
                const courses = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // 2. Fetch Business Students
                const studentsQ = query(collection(db, 'users'), where('role', '==', 'business_student'));
                const studentsSnap = await getDocs(studentsQ);
                const studentsList = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // 3. Fetch All Progress for Business Students
                // For simplicity, we'll fetch progress per student
                const enrichedStudents = await Promise.all(studentsList.map(async (student) => {
                    const progressSnap = await getDocs(collection(db, 'users', student.id, 'business_progress'));
                    const progress = progressSnap.docs.reduce((acc, doc) => {
                        acc[doc.id] = doc.data();
                        return acc;
                    }, {});

                    let completedCount = 0;
                    let totalScore = 0;
                    let quizCount = 0;

                    Object.values(progress).forEach(p => {
                        if (p.status === 'completed') completedCount++;
                        if (p.quizScore !== undefined) {
                            totalScore += p.quizScore;
                            quizCount++;
                        }
                    });

                    return {
                        ...student,
                        progress,
                        completedCount,
                        avgScore: quizCount > 0 ? totalScore / quizCount : 0
                    };
                }));

                setStudents(enrichedStudents);

                // Calculate Global Stats
                const totalCompletions = enrichedStudents.reduce((acc, s) => acc + s.completedCount, 0);
                const globalAvgScore = enrichedStudents.reduce((acc, s) => acc + s.avgScore, 0) / (enrichedStudents.filter(s => s.avgScore > 0).length || 1);

                setStats({
                    totalStudents: studentsList.length,
                    totalCourses: courses.length,
                    completions: totalCompletions,
                    averageScore: globalAvgScore
                });

            } catch (error) {
                console.error("Error fetching business analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#FAF5E8] dark:bg-[#1c1916] p-8 min-h-screen">
            <span className="material-symbols-outlined animate-spin text-espresso text-4xl">progress_activity</span>
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-espresso/40">Aggregating Intelligence...</p>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-[#FAF5E8] dark:bg-[#1c1916] overflow-y-auto p-4 md:p-8 pb-32">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight mb-2">Business Insights</h1>
                    <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em]">Operational performance & Student metrics</p>
                </div>
                <div className="flex gap-4">
                    <Link to="/admin/business/courses" className="px-6 py-3 bg-white/40 border border-espresso/10 text-espresso rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-espresso hover:text-white transition-all">
                        Manage Courses
                    </Link>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total Students', value: stats.totalStudents, icon: 'groups', color: 'bg-blue-500' },
                    { label: 'Courses Active', value: stats.totalCourses, icon: 'auto_stories', color: 'bg-amber-500' },
                    { label: 'Total Completions', value: stats.completions, icon: 'verified_user', color: 'bg-green-500' },
                    { label: 'Cohort Avg Score', value: `${stats.averageScore.toFixed(1)}%`, icon: 'analytics', color: 'bg-purple-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-espresso/5 shadow-xl relative overflow-hidden group">
                        <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-bl-[4rem] opacity-10 transition-transform group-hover:scale-110", stat.color)}></div>
                        <span className="material-symbols-outlined text-espresso/20 text-4xl mb-4">{stat.icon}</span>
                        <h3 className="text-3xl font-black text-espresso dark:text-white leading-none mb-1">{stat.value}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Student Performance Table */}
            <div className="bg-white/40 dark:bg-white/5 rounded-[2.5rem] border border-espresso/10 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-espresso/5 flex items-center justify-between bg-white/60">
                    <h2 className="font-serif text-xl font-bold text-espresso dark:text-white uppercase tracking-wider">Student Performance Registry</h2>
                    <span className="bg-espresso text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Active Cohort</span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-espresso/5 text-[10px] font-black uppercase tracking-widest text-espresso/40">
                                <th className="px-8 py-4">Student Identity</th>
                                <th className="px-8 py-4">Completions</th>
                                <th className="px-8 py-4">Knowledge Index (Avg %)</th>
                                <th className="px-8 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-espresso/5">
                            {students.map(student => (
                                <tr key={student.id} className="hover:bg-white/40 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-espresso/5">
                                                <img src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName || 'S')}&background=random`} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-espresso dark:text-white capitalize">{student.fullName || student.name || 'Anonymous'}</p>
                                                <p className="text-[10px] text-espresso/40">{student.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-espresso/5 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-green-500 h-full transition-all" style={{ width: `${(student.completedCount / (stats.totalCourses || 1)) * 100}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-espresso">{student.completedCount} / {stats.totalCourses}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "text-sm font-black tracking-tight",
                                            student.avgScore >= 80 ? "text-green-600" : student.avgScore >= 60 ? "text-amber-600" : "text-red-600"
                                        )}>
                                            {student.avgScore.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest",
                                            student.approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                        )}>
                                            {student.approved ? 'Verified' : 'Pending Approval'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {students.length === 0 && (
                    <div className="p-20 text-center text-espresso/20 italic">
                        No students registered in the business course protocol.
                    </div>
                )}
            </div>
        </div>
    );
}
