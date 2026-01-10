import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';


export function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'onsite', 'online'

    useEffect(() => {
        // Query users where role is 'student'
        const q = query(
            collection(db, 'users'),
            where('role', '==', 'student')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const studentsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setStudents(studentsList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (e, studentId) => {
        e.preventDefault(); // Prevent Link navigation
        try {
            await updateDoc(doc(db, 'users', studentId), {
                status: 'active'
            });
            // Toast or notification could go here
        } catch (error) {
            console.error("Error approving student:", error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-espresso dark:text-white">Loading students...</div>;
    }

    const onsiteCount = students.filter(s => s.studyMethod === 'onsite').length;
    const onlineCount = students.filter(s => s.studyMethod === 'online').length;
    const allCount = students.length;

    const filteredStudents = students.filter(student => {
        const matchesSearch =
            student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTab = activeTab === 'all' || student.studyMethod === activeTab;

        return matchesSearch && matchesTab;
    });

    const pendingStudents = students.filter(s => s.status === 'pending');
    const filteredPending = pendingStudents.filter(s =>
        s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-20">
            <div className=" w-full px-2 py-10 space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between relative gap-6">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-4 md:-ml-10"></div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Global Registry</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-2">Participant Verification & Management</p>
                    </div>
                    <div className="flex gap-3 md:gap-4">
                        <button className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/40 hover:bg-espresso hover:text-white transition-all flex items-center justify-center active:scale-95 shadow-sm group">
                            <span className="material-symbols-outlined text-[20px] md:text-[24px]">filter_list</span>
                        </button>
                        <button className="flex-1 md:flex-none px-6 md:px-8 py-3 md:py-3.5 bg-espresso text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all flex items-center justify-center md:justify-start gap-2">
                            <span className="material-symbols-outlined text-[16px] md:text-[18px]">person_add</span>
                            Admit Node
                        </button>
                    </div>
                </div>

                {/* Search & Tabs */}
                <div className="space-y-6">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 md:left-6 flex items-center pointer-events-none text-espresso/30 group-focus-within:text-espresso transition-colors">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input
                            className="w-full h-14 md:h-16 pl-12 md:pl-16 pr-6 md:pr-8 bg-white/40 dark:bg-black/20 border border-espresso/10 rounded-xl md:rounded-2xl text-espresso dark:text-white font-serif text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-espresso transition-all placeholder:text-espresso/20 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.4em] placeholder:text-[9px] md:text-[10px] shadow-inner"
                            placeholder="Search Registry..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-4 p-1.5 bg-white/30 dark:bg-black/20 rounded-2xl border border-espresso/5 backdrop-blur-sm self-start">
                        {[
                            { id: 'all', label: 'All Clusters', icon: 'groups', count: allCount },
                            { id: 'onsite', label: 'Onsite Operational', icon: 'location_on', count: onsiteCount },
                            { id: 'online', label: 'Digital Venture', icon: 'language', count: onlineCount },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-3 transition-all active:scale-95 group/tab",
                                    activeTab === tab.id
                                        ? "bg-espresso text-white shadow-xl shadow-espresso/20 scale-105 z-10"
                                        : "bg-transparent text-espresso/40 hover:bg-white/40 hover:text-espresso"
                                )}
                            >
                                <span className="material-symbols-outlined text-[18px] md:text-[20px]">{tab.icon}</span>
                                <div className="text-left">
                                    <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest leading-none">{tab.label}</p>
                                    <p className={cn(
                                        "text-[10px] md:text-[12px] font-black mt-1",
                                        activeTab === tab.id ? "text-white" : "text-espresso/20"
                                    )}>{tab.count.toString().padStart(2, '0')}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pending Approvals Notification */}
                {filteredPending.length > 0 && (
                    <div className="bg-amber-500 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group/pending">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 group-hover/pending:bg-espresso transition-colors"></div>
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <div className="flex items-center gap-3 md:gap-4 text-espresso font-black">
                                <span className="material-symbols-outlined text-2xl md:text-3xl">emergency_home</span>
                                <div>
                                    <h3 className="font-serif text-xl md:text-2xl uppercase tracking-tight leading-none">Queue Alert</h3>
                                    <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] mt-1 opacity-60">{filteredPending.length} Participants Awaiting Protocol Verification</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-3 md:gap-4">
                            {filteredPending.map(student => (
                                <div key={student.id} className="bg-white/20 backdrop-blur-sm p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/20 hover:bg-white/30 transition-all group/card">
                                    <Link to={`/admin/students/${student.id}`} className="flex items-center gap-4 md:gap-6">
                                        <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl border-2 border-espresso/10 overflow-hidden shadow-lg group-hover/card:scale-105 transition-transform shrink-0">
                                            <img src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName || 'Student')}&background=random`} alt="" className="h-full w-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-serif text-lg md:text-xl font-black text-espresso">{student.fullName}</p>
                                            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-espresso/60 mt-1">
                                                {student.studyMethod === 'online' ? 'METHOD: DIGITAL VENTURE' : 'METHOD: ONSITE OPERATIONAL'} • {student.shift || student.startDate}
                                            </p>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={(e) => handleApprove(e, student.id)}
                                        className="w-full sm:w-auto px-6 md:px-8 py-2.5 md:py-3 bg-espresso text-white text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl hover:shadow-xl active:scale-95 transition-all shadow-lg"
                                    >
                                        Execute Approval
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.4em] flex items-center gap-3">
                            <span className="w-8 h-px bg-espresso/20"></span>
                            Validated Participants
                        </h3>
                        <p className="text-[10px] font-black text-espresso/20 uppercase tracking-widest">{students.length} Nodes Online</p>
                    </div>

                    <div className="grid gap-6">
                        {filteredStudents.length === 0 ? (
                            <div className="text-center py-20 md:py-24 bg-white/20 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-espresso/10 flex flex-col items-center gap-4 md:gap-6 opacity-40">
                                <span className="material-symbols-outlined text-4xl md:text-5xl">person_off</span>
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] px-4">No nodes match your inquiry</p>
                            </div>
                        ) : (
                            filteredStudents.map(student => (
                                <Link to={`/admin/students/${student.id}`} key={student.id} className="bg-white/40 dark:bg-black/20 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-espresso/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover:bg-espresso transition-colors"></div>
                                    <div className="flex items-center gap-4 md:gap-8">
                                        <div className="relative shrink-0">
                                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] overflow-hidden border-2 border-espresso/10 shadow-lg group-hover:scale-105 transition-transform">
                                                <img
                                                    src={student.avatar || `https://ui-avatars.com/api/?name=${student.fullName}&background=random`}
                                                    alt={student.fullName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full border-2 md:border-4 border-[#F5DEB3] dark:border-[#1c1916] shadow-sm",
                                                student.status === 'active' ? "bg-green-500" : "bg-amber-400"
                                            )}></div>
                                        </div>
                                        <div className="space-y-0.5 md:space-y-1">
                                            <h3 className="font-serif font-black text-xl md:text-2xl text-espresso dark:text-white tracking-tight">
                                                {student.fullName}
                                            </h3>
                                            <p className="text-[8px] md:text-[10px] font-black text-espresso/60 dark:text-white/40 uppercase tracking-widest break-all">
                                                {student.email} <span className="hidden sm:inline">//</span> <br className="sm:hidden" /> {student.phone}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3 md:gap-4 pl-16 sm:pl-0">
                                        <div className="flex flex-wrap items-center justify-end gap-2 md:gap-4">
                                            <div className="flex items-center gap-2 bg-white/60 dark:bg-black/30 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-espresso/5 shadow-inner">
                                                <span className="material-symbols-outlined text-[14px] md:text-[16px] text-espresso/60">hub</span>
                                                <span className="text-[8px] md:text-[9px] font-black text-espresso/60 uppercase tracking-widest">{student.course}</span>
                                            </div>
                                            <span className={cn(
                                                "px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] shadow-sm border",
                                                student.status === 'active'
                                                    ? 'bg-green-50/50 border-green-200 text-green-600'
                                                    : 'bg-amber-50/50 border-amber-200 text-amber-600'
                                            )}>
                                                {student.status}
                                            </span>
                                        </div>

                                        {/* Quick Approve Action for Pending Students */}
                                        {student.status === 'pending' && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleApprove(e, student.id);
                                                }}
                                                className="w-full sm:w-auto px-4 md:px-6 py-2 bg-espresso text-white text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] rounded-lg md:rounded-xl hover:shadow-lg active:scale-95 transition-all z-10"
                                            >
                                                Protocol Execute
                                            </button>
                                        )}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}



