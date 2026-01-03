import React from 'react';

export function ActivityLog() {
    const logs = {
        'Today': [
            { user: 'Sarah Jenkins', action: 'Approved testimonial from John Doe', time: '14m ago', icon: 'check', color: 'text-green-600 bg-green-50' },
            { user: 'Mike Ross', action: 'Uploaded video to Lesson 3: "The Grind"', time: '10:30 AM', icon: 'upload', color: 'text-primary bg-primary/10' }
        ],
        'Yesterday': [
            { user: 'Sarah Jenkins', action: 'Edited course "Espresso Masterclass"', time: '4:15 PM', icon: 'edit', color: 'text-blue-600 bg-blue-50' },
            { user: 'System Bot', action: 'Forced password reset for User #442', time: '09:00 AM', icon: 'lock_reset', color: 'text-orange-600 bg-orange-50' }
        ],
        'September 12, 2023': [
            { user: 'Alex Chen', action: 'Deleted comment on "Latte Art Basics"', time: '11:20 AM', icon: 'delete', color: 'text-red-600 bg-red-50' }
        ]
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-32">
            <div className=" w-full px-2 py-10 space-y-10">
                {/* Header Section */}
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-10"></div>
                    <div>
                        <h1 className="text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Operational Audit Log</h1>
                        <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-2">Historical Trace & System Event Ledger</p>
                    </div>
                    <button className="w-12 h-12 rounded-2xl bg-white/40 hover:bg-espresso hover:text-white transition-all flex items-center justify-center shadow-sm group">
                        <span className="material-symbols-outlined text-[24px] group-hover:rotate-180 transition-transform duration-500">filter_list</span>
                    </button>
                </div>

                {/* Audit Search Array */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-espresso/30">
                        <span className="material-symbols-outlined">analytics</span>
                    </div>
                    <input
                        className="w-full h-16 pl-16 pr-8 bg-white/40 dark:bg-black/20 border border-espresso/10 rounded-[1.5rem] text-espresso dark:text-white font-serif text-lg focus:outline-none focus:ring-2 focus:ring-espresso transition-all shadow-inner placeholder:text-espresso/20 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.4em] placeholder:text-[10px]"
                        placeholder="Trace operational vectors..."
                        type="text"
                    />
                </div>

                {/* Audit Stream */}
                <div className="space-y-12">
                    {Object.entries(logs).map(([date, entries]) => (
                        <div key={date} className="space-y-6">
                            <div className="sticky top-0 z-20 bg-[#F5DEB3]/95 dark:bg-[#1c1916]/95 backdrop-blur-md py-4 border-b border-espresso/10">
                                <h3 className="text-[10px] font-black text-espresso uppercase tracking-[0.4em] flex items-center gap-3">
                                    <span className="w-8 h-px bg-espresso/20"></span>
                                    {date.toUpperCase()}
                                </h3>
                            </div>

                            <div className="grid gap-4">
                                {entries.map((log, idx) => (
                                    <div
                                        key={idx}
                                        className="group relative bg-white/40 dark:bg-black/20 rounded-[2rem] p-6 border border-espresso/10 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-between overflow-hidden"
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover:bg-espresso transition-colors"></div>

                                        <div className="flex items-center gap-6 flex-1 min-w-0">
                                            <div className="h-14 w-14 rounded-2xl bg-espresso text-white flex items-center justify-center font-serif font-black text-lg shadow-xl shrink-0 group-hover:scale-110 transition-transform">
                                                {log.user.split(' ').map(n => n[0]).join('')}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-[10px] font-black text-espresso/40 uppercase tracking-widest">{log.user}</p>
                                                    <span className="text-[9px] font-black text-espresso/20 uppercase tracking-widest">{log.time}</span>
                                                </div>
                                                <h4 className="text-xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight truncate leading-tight group-hover:text-espresso/80 transition-colors">
                                                    {log.action}
                                                </h4>
                                            </div>
                                        </div>

                                        <div className="ml-8 shrink-0">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner border border-espresso/5 ${log.color}`}>
                                                <span className="material-symbols-outlined text-[20px] font-black">{log.icon}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}



