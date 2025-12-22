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
        <div className="max-w-2xl mx-auto min-h-screen bg-background-light dark:bg-background-dark shadow-sm md:shadow-none">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary/10">
                <h2 className="text-espresso dark:text-white text-2xl font-serif font-bold leading-tight">Activity Log</h2>
                <button className="text-primary hover:text-espresso dark:hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">filter_list</span>
                </button>
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="flex w-full items-stretch rounded-xl h-12 shadow-sm bg-white dark:bg-[#2c2825]">
                    <div className="text-primary/70 flex items-center justify-center pl-4 rounded-l-xl">
                        <span className="material-symbols-outlined text-xl">search</span>
                    </div>
                    <input
                        className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl bg-transparent text-espresso dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/20 border-none h-full placeholder:text-espresso/40 px-3 text-base font-normal leading-normal"
                        placeholder="Search logs..."
                    />
                </div>
            </div>

            {/* Logs */}
            <div className="flex flex-col">
                {Object.entries(logs).map(([date, entries]) => (
                    <div key={date} className="flex flex-col mt-2">
                        <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm px-4 py-2 border-b border-primary/5">
                            <h4 className="text-primary text-xs font-bold uppercase tracking-widest">{date}</h4>
                        </div>
                        {entries.map((log, idx) => (
                            <div key={idx} className="group flex gap-4 px-4 py-4 justify-between items-start border-b border-primary/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                                <div className="flex items-start gap-3 w-full">
                                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <span className="font-bold text-xs text-primary">{log.user.split(' ').map(n => n[0]).join('')}</span>
                                    </div>
                                    <div className="flex flex-col justify-start gap-1 w-full">
                                        <div className="flex justify-between items-start w-full">
                                            <p className="text-espresso dark:text-white text-sm font-medium leading-snug">
                                                {log.action}
                                            </p>
                                            <span className="text-espresso/50 dark:text-white/50 text-xs font-medium whitespace-nowrap ml-2">{log.time}</span>
                                        </div>
                                        <p className="text-primary text-xs font-semibold">{log.user}</p>
                                    </div>
                                </div>
                                <div className="shrink-0 pt-1">
                                    <div className={`rounded-full p-1 flex size-6 items-center justify-center ${log.color}`}>
                                        <span className="material-symbols-outlined text-sm font-bold">{log.icon}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
