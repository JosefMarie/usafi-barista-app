import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function ActivityLog() {
    const [logs, setLogs] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const q = query(collection(db, 'activity'), orderBy('timestamp', 'desc'), limit(50));
                const snap = await getDocs(q);

                const grouped = {};
                snap.docs.forEach(docSnap => {
                    const data = docSnap.id ? { id: docSnap.id, ...docSnap.data() } : docSnap.data();
                    const date = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();

                    const dateKey = date.toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    if (!grouped[dateKey]) grouped[dateKey] = [];

                    // Format relative time
                    const diffMs = new Date() - date;
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHrs = Math.floor(diffMins / 60);

                    let timeStr = "";
                    if (diffMins < 1) timeStr = "Now";
                    else if (diffMins < 60) timeStr = `${diffMins}m ago`;
                    else if (diffHrs < 24) timeStr = `${diffHrs}h ago`;
                    else timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    grouped[dateKey].push({
                        user: data.userName || data.user || 'System',
                        action: data.action,
                        time: timeStr,
                        icon: data.icon || 'history',
                        color: data.type?.includes('admin') ? 'text-blue-600 bg-blue-50' : 'text-primary bg-primary/10'
                    });
                });

                setLogs(grouped);
            } catch (err) {
                console.error("Error fetching logs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-32">
            <div className=" w-full px-2 py-10 space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-4 md:-ml-10"></div>
                    <div>
                        <h1 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Operational Audit Log</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-1 md:mt-2">Historical Trace & System Event Ledger</p>
                    </div>
                    <button className="w-full md:w-12 h-12 rounded-xl md:rounded-2xl bg-white/40 hover:bg-espresso hover:text-white transition-all flex items-center justify-center shadow-sm group">
                        <span className="material-symbols-outlined text-[20px] md:text-[24px] group-hover:rotate-180 transition-transform duration-500">filter_list</span>
                        <span className="md:hidden ml-2 text-[10px] font-black uppercase tracking-[0.2em]">Filter Array</span>
                    </button>
                </div>

                {/* Audit Search Array */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-5 md:left-6 flex items-center pointer-events-none text-espresso/30 group-focus-within:text-espresso transition-colors">
                        <span className="material-symbols-outlined text-[20px] md:text-[24px]">analytics</span>
                    </div>
                    <input
                        className="w-full h-14 md:h-16 pl-12 md:pl-16 pr-6 md:pr-8 bg-white/40 dark:bg-black/20 border border-espresso/10 rounded-xl md:rounded-2xl text-espresso dark:text-white font-serif text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-espresso transition-all shadow-inner placeholder:text-espresso/20 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.4em] placeholder:text-[9px] md:placeholder:text-[10px]"
                        placeholder="Trace operational vectors..."
                        type="text"
                    />
                </div>

                {/* Audit Stream */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <span className="material-symbols-outlined animate-spin text-4xl text-espresso/20">progress_activity</span>
                    </div>
                ) : Object.keys(logs).length > 0 ? (
                    <div className="space-y-12">
                        {Object.entries(logs).map(([date, entries]) => (
                            <div key={date} className="space-y-6">
                                <div className="sticky top-0 z-20 bg-[#F5DEB3]/95 dark:bg-[#1c1916]/95 backdrop-blur-md py-3 md:py-4 border-b border-espresso/10">
                                    <h3 className="text-[9px] md:text-[10px] font-black text-espresso uppercase tracking-[0.4em] flex items-center gap-2 md:gap-3">
                                        <span className="w-6 md:w-8 h-px bg-espresso/20"></span>
                                        {date.toUpperCase()}
                                    </h3>
                                </div>

                                <div className="grid gap-4">
                                    {entries.map((log, idx) => (
                                        <div
                                            key={idx}
                                            className="group relative bg-white/40 dark:bg-black/20 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border border-espresso/10 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between overflow-hidden gap-4 md:gap-6"
                                        >
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-espresso/5 group-hover:bg-espresso transition-colors"></div>

                                            <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0 w-full">
                                                <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-espresso text-white flex items-center justify-center font-serif font-black text-base md:text-lg shadow-xl shrink-0 group-hover:scale-110 transition-transform">
                                                    {log.user.split(' ').map(n => n[0]).join('')}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1 gap-2">
                                                        <p className="text-[8px] md:text-[10px] font-black text-espresso/40 uppercase tracking-widest truncate">{log.user}</p>
                                                        <span className="text-[7px] md:text-[9px] font-black text-espresso/20 uppercase tracking-widest whitespace-nowrap">{log.time}</span>
                                                    </div>
                                                    <h4 className="text-base md:text-xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight truncate leading-tight group-hover:text-espresso/80 transition-colors">
                                                        {log.action}
                                                    </h4>
                                                </div>
                                            </div>

                                            <div className="sm:ml-8 shrink-0 self-end sm:self-auto">
                                                <div className={`w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center shadow-inner border border-espresso/5 ${log.color}`}>
                                                    <span className="material-symbols-outlined text-[16px] md:text-[20px] font-black">{log.icon}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center opacity-20">
                        <span className="material-symbols-outlined text-6xl block mb-4">history_toggle_off</span>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">No operational traces found</p>
                    </div>
                )}
            </div>
        </div>
    );
}



