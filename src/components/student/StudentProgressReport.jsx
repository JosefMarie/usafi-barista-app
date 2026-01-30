import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

export function StudentProgressReport({ courseId }) {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [modules, setModules] = useState([]);
    const [progress, setProgress] = useState({});
    const [loading, setLoading] = useState(true);
    const [expandedModule, setExpandedModule] = useState(null);

    useEffect(() => {
        if (!user || !courseId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Modules
                const modulesQ = query(collection(db, 'courses', courseId, 'modules'));
                const modulesSnap = await getDocs(modulesQ);
                const modulesData = modulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                // Sort by creation or title if needed
                modulesData.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
                setModules(modulesData);

                // 2. Fetch Progress
                const progressQ = query(collection(db, 'users', user.uid, 'progress'));
                const progressSnap = await getDocs(progressQ);
                const progressMap = {};
                progressSnap.docs.forEach(d => {
                    progressMap[d.id] = d.data();
                });
                setProgress(progressMap);

            } catch (error) {
                console.error("Error fetching report data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, courseId]);

    const toggleExpand = (moduleId) => {
        setExpandedModule(expandedModule === moduleId ? null : moduleId);
    };

    if (loading) {
        return <div className="p-8 text-center"><span className="material-symbols-outlined animate-spin text-espresso">progress_activity</span></div>;
    }

    return (
        <div className="space-y-8 animate-fade-in w-full mt-12 mb-20">
            <h2 className="text-[10px] font-black text-espresso/50 dark:text-white/50 uppercase tracking-[0.2em] flex items-center gap-3 mb-6">
                <span className="h-2 w-2 rounded-full bg-espresso"></span>
                Official Academic Transcripts
            </h2>

            {/* Profile Header */}
            <div className="bg-white/40 dark:bg-white/5 rounded-[2rem] p-6 md:p-8 border border-espresso/10 shadow-xl flex flex-col md:flex-row items-center gap-6 md:gap-10">
                <div className="relative">
                    <div className="size-24 md:size-32 rounded-full p-1 bg-gradient-to-br from-espresso to-amber-600 shadow-2xl">
                        <img
                            src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.fullName || 'Student'}&background=random`}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover border-4 border-white dark:border-black"
                        />
                    </div>
                    <div className="absolute bottom-0 right-0 bg-espresso text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-black">
                        <span className="material-symbols-outlined text-sm md:text-base">verified</span>
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-espresso dark:text-white">{user?.fullName || user?.name || 'Student Candidate'}</h3>
                    <p className="text-sm font-medium text-espresso/60 dark:text-white/60">{user?.email}</p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
                        <span className="px-4 py-1.5 bg-espresso/5 rounded-full text-[9px] font-black uppercase tracking-widest text-espresso border border-espresso/10">
                            Student ID: {user?.uid?.slice(0, 8)}
                        </span>
                        <span className="px-4 py-1.5 bg-green-500/10 rounded-full text-[9px] font-black uppercase tracking-widest text-green-600 border border-green-500/10">
                            Active Enrollee
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full md:w-auto text-center">
                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-espresso/5">
                        <div className="text-2xl font-black text-espresso dark:text-white">{modules.length}</div>
                        <div className="text-[7px] font-black uppercase tracking-widest text-espresso/40">Total Modules</div>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-espresso/5">
                        <div className="text-2xl font-black text-green-600">
                            {Object.values(progress).filter(p => p.passed).length}
                        </div>
                        <div className="text-[7px] font-black uppercase tracking-widest text-espresso/40">Completed</div>
                    </div>
                </div>
            </div>

            {/* Performance Matrix */}
            <div className="bg-white/40 dark:bg-white/5 rounded-[2rem] overflow-hidden border border-espresso/10 shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-espresso/5 text-espresso/40 border-b border-espresso/10">
                                <th className="p-4 md:p-6 text-[8px] font-black uppercase tracking-widest text-left">Module / Unit</th>
                                <th className="p-4 md:p-6 text-[8px] font-black uppercase tracking-widest text-center">Status</th>
                                <th className="p-4 md:p-6 text-[8px] font-black uppercase tracking-widest text-center">Best Score</th>
                                <th className="p-4 md:p-6 text-[8px] font-black uppercase tracking-widest text-center">Attempts</th>
                                <th className="p-4 md:p-6 text-[8px] font-black uppercase tracking-widest text-right">History</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-espresso/5">
                            {modules.filter(m => !m.isFinalAssessment).map((module) => {
                                const prog = progress[module.id] || {};
                                const isExpanded = expandedModule === module.id;
                                const hasHistory = prog.attemptsHistory && prog.attemptsHistory.length > 0;

                                return (
                                    <React.Fragment key={module.id}>
                                        <tr className="group hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                                            <td className="p-4 md:p-6">
                                                <div className="font-bold text-espresso dark:text-white text-sm md:text-base">{module.title}</div>
                                            </td>
                                            <td className="p-4 md:p-6 text-center">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                                    prog.passed ? "bg-green-100 text-green-700 border-green-200" :
                                                        (prog.attempts > 0 ? "bg-red-100 text-red-700 border-red-200" : "bg-gray-100 text-gray-500 border-gray-200")
                                                )}>
                                                    {prog.passed ? 'PASSED' : (prog.attempts > 0 ? 'FAILED' : 'PENDING')}
                                                </span>
                                            </td>
                                            <td className="p-4 md:p-6 text-center font-mono font-bold text-espresso dark:text-white">
                                                {prog.score !== undefined ? `${prog.score.toFixed(0)}%` : '-'}
                                            </td>
                                            <td className="p-4 md:p-6 text-center text-espresso/60 font-medium">
                                                {prog.attempts || 0}
                                            </td>
                                            <td className="p-4 md:p-6 text-right">
                                                <button
                                                    onClick={() => toggleExpand(module.id)}
                                                    disabled={!hasHistory}
                                                    className={cn(
                                                        "size-8 flex items-center justify-center rounded-lg transition-all ml-auto",
                                                        hasHistory ? "bg-espresso/10 text-espresso hover:bg-espresso hover:text-white cursor-pointer" : "text-espresso/20 cursor-default"
                                                    )}
                                                >
                                                    <span className="material-symbols-outlined text-lg">
                                                        {isExpanded ? 'expand_less' : 'expand_more'}
                                                    </span>
                                                </button>
                                            </td>
                                        </tr>
                                        {/* EXPANDED HISTORY ROW */}
                                        {isExpanded && hasHistory && (
                                            <tr className="bg-espresso/5 shadow-inner">
                                                <td colSpan={5} className="p-4 md:p-6">
                                                    <div className="space-y-3 pl-4 md:pl-10 border-l-2 border-espresso/20">
                                                        <h4 className="text-[9px] font-black uppercase tracking-widest text-espresso/40 mb-2">Detailed Assessment History</h4>
                                                        <div className="grid gap-2">
                                                            {prog.attemptsHistory.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)).map((attempt, idx) => (
                                                                <div key={idx} className="flex items-center justify-between p-3 bg-white/60 dark:bg-black/20 rounded-xl border border-espresso/5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={cn("size-2 rounded-full", attempt.passed ? "bg-green-500" : "bg-red-500")}></div>
                                                                        <span className="text-xs font-bold text-espresso dark:text-white">
                                                                            Attempt #{attempt.attemptNumber || '?'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs text-espresso/60 font-mono">
                                                                        {attempt.completedAt ? format(new Date(attempt.completedAt), 'MMM d, yyyy HH:mm') : '-'}
                                                                    </div>
                                                                    <div className={cn("font-black text-sm", attempt.passed ? "text-green-600" : "text-red-500")}>
                                                                        {attempt.score.toFixed(0)}%
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
