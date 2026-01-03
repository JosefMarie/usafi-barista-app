import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, collectionGroup, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

export function Quizzes() {
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'results'
    const [loading, setLoading] = useState(true);

    // Editor State
    const [questions, setQuestions] = useState([
        { id: 1, text: 'What is the ideal extraction time for a standard espresso shot?', answer: '25-30 seconds', options: ['15-20 seconds', '25-30 seconds', '35-40 seconds'] },
        { id: 2, text: 'Which roast level is typically preferred for traditional espresso?', answer: 'Medium-Dark Roast', options: ['Light Roast', 'Medium-Dark Roast', 'Dark Roast'] },
        { id: 3, text: 'What is the correct tamping pressure?', answer: '30 lbs', options: ['10 lbs', '20 lbs', '30 lbs'] },
    ]);

    // Results State
    const [results, setResults] = useState([]);
    const [modules, setModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Students Map (for names)
                const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
                const userMap = {};
                usersSnap.docs.forEach(doc => {
                    userMap[doc.id] = doc.data().fullName || 'Unknown Student';
                });

                // 2. Fetch All Modules across all courses
                const coursesSnap = await getDocs(collection(db, 'courses'));
                const modulesList = [];
                for (const courseDoc of coursesSnap.docs) {
                    const modsSnap = await getDocs(collection(db, 'courses', courseDoc.id, 'modules'));
                    modsSnap.docs.forEach(modDoc => {
                        modulesList.push({
                            id: modDoc.id,
                            title: modDoc.data().title,
                            courseId: courseDoc.id
                        });
                    });
                }
                setModules(modulesList);

                // 3. Fetch All Progress (Quiz Results)
                // Note: This requires a collectionGroup index for 'progress' in Firebase if using where filters,
                // but since we want to show all and then filter locally (or via query), 
                // we'll fetch all progress docs that have a score.
                const progressSnap = await getDocs(collectionGroup(db, 'progress'));
                const quizResults = progressSnap.docs
                    .map(doc => {
                        const data = doc.data();
                        const studentId = doc.ref.parent.parent.id; // path is users/{uid}/progress/{mid}
                        if (data.score === undefined) return null;

                        const moduleInfo = modulesList.find(m => m.id === data.moduleId);

                        return {
                            id: doc.id,
                            studentId,
                            studentName: userMap[studentId] || 'Deleted Student',
                            moduleId: data.moduleId,
                            moduleName: moduleInfo?.title || 'Unknown Module',
                            score: data.score,
                            passed: data.passed,
                            date: data.completedAt?.toDate?.() || new Date(data.updatedAt?.toDate?.() || Date.now()),
                            status: data.status
                        };
                    })
                    .filter(r => r !== null)
                    .sort((a, b) => b.date - a.date);

                setResults(quizResults);
            } catch (err) {
                console.error("Error fetching quiz data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredResults = results.filter(r => {
        const matchesModule = selectedModule === 'all' || r.moduleId === selectedModule;
        const matchesSearch = r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.moduleName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesModule && matchesSearch;
    });

    if (loading) return <div className="h-screen flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-32">
            <div className=" w-full px-2 py-10 space-y-10">
                {/* Header Section */}
                <div className="flex flex-col gap-6 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-10"></div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Evaluation Matrix</h1>
                            <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-2">Knowledge Assessment & Proficiency Oversight</p>
                        </div>
                        <div className="flex bg-white/40 dark:bg-black/20 p-1.5 rounded-[1.5rem] shadow-sm border border-espresso/10 backdrop-blur-md">
                            <button
                                onClick={() => setActiveTab('editor')}
                                className={cn(
                                    "px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all",
                                    activeTab === 'editor' ? "bg-espresso text-white shadow-lg" : "text-espresso/40 hover:text-espresso"
                                )}
                            >
                                Schema Editor
                            </button>
                            <button
                                onClick={() => setActiveTab('results')}
                                className={cn(
                                    "px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all",
                                    activeTab === 'results' ? "bg-espresso text-white shadow-lg" : "text-espresso/40 hover:text-espresso"
                                )}
                            >
                                Proficiency Registry
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'editor' ? (
                    <div className="space-y-10 animate-fade-in">
                        {/* Featured Schema Card */}
                        <div className="bg-espresso dark:bg-black/40 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/10 transition-colors"></div>
                            <div className="flex items-start justify-between relative z-10">
                                <div className="space-y-4">
                                    <span className="inline-flex items-center bg-white/10 px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-[0.3em] backdrop-blur-md border border-white/10">
                                        Core Certification Schema
                                    </span>
                                    <h2 className="text-white text-4xl font-serif font-black leading-tight tracking-tight uppercase">Espresso Extraction Logic</h2>
                                    <p className="text-white/60 text-xs font-medium max-w-md leading-relaxed">Modify universal knowledge nodes. Changes propagate across all curriculum instances utilizing this assessment array.</p>
                                </div>
                                <div className="w-24 h-24 rounded-[2rem] bg-white/10 border-2 border-white/20 overflow-hidden shadow-2xl backdrop-blur-md flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-4xl opacity-40">psychology</span>
                                </div>
                            </div>
                            <div className="mt-10 pt-6 border-t border-white/10 flex items-center gap-6">
                                <div className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-widest">
                                    <span className="material-symbols-outlined text-[18px]">verified</span>
                                    Protocol Alpha Active
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-widest">
                                    <span className="material-symbols-outlined text-[18px]">account_tree</span>
                                    {questions.length} Logic Nodes
                                </div>
                            </div>
                        </div>

                        {/* Search & Collection Header */}
                        <div className="space-y-6">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-espresso/30">
                                    <span className="material-symbols-outlined">search</span>
                                </div>
                                <input
                                    className="w-full h-16 pl-16 pr-8 bg-white/40 dark:bg-black/20 border border-espresso/10 rounded-[1.5rem] text-espresso dark:text-white font-serif text-lg focus:outline-none focus:ring-2 focus:ring-espresso transition-all placeholder:text-espresso/20 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.4em] placeholder:text-[10px]"
                                    placeholder="Locate logic nodes..."
                                    type="text"
                                />
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.4em] flex items-center gap-3">
                                        <span className="w-8 h-px bg-espresso/20"></span>
                                        Logic Array Preview
                                    </h3>
                                </div>
                                {questions.map((q, idx) => (
                                    <div key={q.id} className="group bg-white/40 dark:bg-black/20 rounded-[2rem] p-8 border border-espresso/10 hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover:bg-espresso transition-colors"></div>
                                        <div className="flex gap-8">
                                            <div className="w-12 h-12 shrink-0 rounded-2xl bg-espresso/5 flex items-center justify-center text-espresso font-black font-serif text-xl border border-espresso/5 group-hover:bg-espresso group-hover:text-white transition-all shadow-inner">
                                                {String(idx + 1).padStart(2, '0')}
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <p className="text-xl font-serif font-black text-espresso dark:text-white leading-tight tracking-tight uppercase group-hover:text-espresso/80 transition-colors">{q.text}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-3 py-1 bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-green-100 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[14px]">task_alt</span>
                                                        Correct Response: {q.answer}
                                                    </span>
                                                    <span className="text-[9px] font-black text-espresso/20 uppercase tracking-widest italic font-medium">Node ID: {q.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-10 animate-fade-in">
                        {/* Analytics Summary */}
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 relative group">
                                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-espresso/30 group-focus-within:text-espresso transition-colors">search</span>
                                <input
                                    type="text"
                                    placeholder="IDENTIFY PARTICIPANT OR MODULE..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-14 pl-14 pr-6 rounded-2xl bg-white/40 dark:bg-black/20 border border-espresso/10 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-espresso focus:outline-none transition-all shadow-inner"
                                />
                            </div>
                            <div className="relative">
                                <select
                                    value={selectedModule}
                                    onChange={(e) => setSelectedModule(e.target.value)}
                                    className="h-14 pl-6 pr-12 rounded-2xl bg-white/40 dark:bg-black/20 border border-espresso/10 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-espresso focus:outline-none min-w-[240px] appearance-none cursor-pointer shadow-sm"
                                >
                                    <option value="all">Universal View</option>
                                    {modules.map(m => (
                                        <option key={m.id} value={m.id}>{m.title.toUpperCase()}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-espresso/40">expand_more</span>
                            </div>
                        </div>

                        {/* Registry Table */}
                        <div className="bg-white/40 dark:bg-black/20 rounded-[2.5rem] border border-espresso/10 overflow-hidden shadow-2xl relative">
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/10"></div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-espresso/5 border-b border-espresso/10">
                                            <th className="px-8 py-6 text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em]">Participant</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em]">Module Schema</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em] text-center">Score Matrix</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em]">Completion</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em] text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-espresso/5 font-medium">
                                        {filteredResults.length > 0 ? filteredResults.map((res) => (
                                            <tr key={res.id} className="hover:bg-white/40 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-base font-serif font-black text-espresso dark:text-white uppercase tracking-tight group-hover:text-espresso/70 transition-colors">{res.studentName}</span>
                                                        <span className="text-[9px] font-black text-espresso/40 uppercase tracking-widest mt-1">ID: {res.studentId.slice(0, 12)}...</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-[10px] font-black text-espresso/60 uppercase tracking-widest bg-espresso/5 px-3 py-1 rounded-lg border border-espresso/5 shadow-inner">{res.moduleName}</span>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className={cn(
                                                        "inline-flex items-center justify-center size-12 rounded-2xl font-serif font-black text-lg border shadow-xl group-hover:scale-110 transition-transform",
                                                        res.passed ? "bg-white text-green-600 border-green-100" : "bg-white text-red-600 border-red-100"
                                                    )}>
                                                        {Math.round(res.score)}%
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-espresso/40 uppercase tracking-widest">
                                                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                                        {res.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className={cn(
                                                        "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm",
                                                        res.passed ? "bg-green-600 text-white" : "bg-red-600 text-white"
                                                    )}>
                                                        {res.passed ? 'Verified' : 'Flagged'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="px-8 py-24 text-center">
                                                    <div className="flex flex-col items-center gap-4 opacity-20">
                                                        <span className="material-symbols-outlined text-6xl">database_off</span>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">No synchronization data found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Matrix Expansion Trigger */}
            {activeTab === 'editor' && (
                <div className="fixed bottom-12 right-12 z-50">
                    <button className="group flex items-center gap-4 bg-espresso hover:bg-espresso/90 text-white rounded-[2rem] shadow-2xl hover:shadow-espresso/40 transition-all p-2 pr-10 hover:scale-105 active:scale-95">
                        <div className="h-16 w-16 rounded-[1.75rem] border-2 border-white/20 flex items-center justify-center bg-white/10 group-hover:rotate-90 transition-transform duration-500">
                            <span className="material-symbols-outlined text-[32px]">add</span>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Assemble</span>
                            <span className="font-serif font-black text-xl uppercase tracking-tight">Logic Node</span>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}




