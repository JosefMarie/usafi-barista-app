import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export function Testimonials() {
    const [filter, setFilter] = useState('All');

    const testimonials = [
        {
            id: 1,
            name: 'Sarah Jenkins',
            course: 'Latte Art 101',
            time: '2 hrs ago',
            content: '"The latte art class was incredible! The instructor was very patient and I finally managed to pour a heart. Highly recommend for beginners."',
            status: 'Pending',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        },
        {
            id: 2,
            name: 'Michael Ross',
            course: 'Espresso Basics',
            time: '5 hrs ago',
            content: '"Great facility, but I wish the session was a bit longer. Felt a bit rushed towards the end."',
            status: 'Pending',
            avatar: null,
            initials: 'MR'
        },
        {
            id: 3,
            name: 'James Carter',
            course: 'Advanced Brewing',
            time: '1 day ago',
            content: '"Absolutely loved the deep dive into extraction ratios. It changed how I dial in my espresso every morning. Kudos to the Usafi team!"',
            status: 'Approved',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        },
        {
            id: 4,
            name: 'John Doe',
            course: 'Coffee Tasting',
            time: '2 days ago',
            content: '"I didn\'t like the coffee beans used. They tasted sour."',
            status: 'Rejected',
            avatar: null,
            initials: 'JD'
        }
    ];

    const filtered = filter === 'All' ? testimonials : testimonials.filter(t => t.status === filter);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-32">
            <div className=" w-full px-2 py-10 space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between relative gap-4">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-2 md:-ml-10"></div>
                    <div className="pl-4 md:pl-0">
                        <h1 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Client Experience</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-2">Participant Feedback & Experience Validation</p>
                    </div>
                </div>

                {/* Filter Matrix */}
                <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-white/40 dark:bg-black/20 rounded-xl md:rounded-[1.5rem] border border-espresso/10 backdrop-blur-md w-full md:w-fit shadow-sm">
                    {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={cn(
                                "h-10 md:h-11 px-6 md:px-8 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 whitespace-nowrap",
                                filter === status
                                    ? "bg-espresso text-white shadow-lg"
                                    : "text-espresso/40 hover:text-espresso"
                            )}
                        >
                            {status}
                            {status === 'Pending' && <span className="px-1.5 py-0.5 rounded-md bg-white/20 border border-white/20 text-[8px]">2</span>}
                        </button>
                    ))}
                </div>

                {/* Testimonials Stream */}
                <div className="grid gap-6">
                    {filtered.map(item => (
                        <div
                            key={item.id}
                            className={cn(
                                "group relative bg-white/40 dark:bg-black/20 rounded-[2.5rem] p-8 border border-espresso/10 shadow-xl transition-all hover:-translate-y-1 overflow-hidden",
                                item.status === 'Approved' && 'opacity-95',
                                item.status === 'Rejected' && 'opacity-75'
                            )}
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover:bg-espresso transition-colors"></div>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div className="flex items-center gap-4 md:gap-5">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-espresso/10 overflow-hidden relative border border-espresso/20 shadow-lg shrink-0">
                                        {item.avatar ? (
                                            <img src={item.avatar} alt={item.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-espresso font-black text-lg md:text-xl bg-gradient-to-br from-espresso/20 to-espresso/10">
                                                {item.initials}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">{item.name}</h3>
                                        <p className="text-[8px] md:text-[10px] font-black text-espresso/40 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[12px] md:text-[14px]">school</span>
                                            {item.course} • {item.time.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                                <span className={cn(
                                    "flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border",
                                    item.status === 'Pending' && 'bg-amber-600/10 text-amber-700 border-amber-200',
                                    item.status === 'Approved' && 'bg-green-600/10 text-green-700 border-green-200',
                                    item.status === 'Rejected' && 'bg-red-600/10 text-red-700 border-red-200'
                                )}>
                                    <div className={cn(
                                        "w-2 md:w-2.5 h-2 md:h-2.5 rounded-full",
                                        item.status === 'Pending' && 'bg-amber-600 animate-pulse',
                                        item.status === 'Approved' && 'bg-green-600',
                                        item.status === 'Rejected' && 'bg-red-600'
                                    )}></div>
                                    {item.status}
                                </span>
                            </div>

                            <div className="bg-white/60 dark:bg-black/40 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-espresso/5 shadow-inner relative mb-6">
                                <div className="absolute top-0 right-0 p-3 md:p-4 opacity-5">
                                    <span className="material-symbols-outlined text-4xl md:text-5xl">format_quote</span>
                                </div>
                                <p className="text-espresso/70 dark:text-white/70 text-sm md:text-base leading-relaxed font-medium italic relative z-10">
                                    {item.content}
                                </p>
                            </div>

                            {item.status === 'Pending' && (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button className="flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl bg-espresso text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-espresso/40 transition-all flex items-center justify-center gap-3 group/btn">
                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-white/10 flex items-center justify-center border border-white/10 group-hover/btn:rotate-12 transition-transform">
                                            <span className="material-symbols-outlined text-[18px] md:text-[20px]">verified</span>
                                        </div>
                                        AUTHORIZE PUBLICATION
                                    </button>
                                    <button className="h-12 md:h-14 w-full sm:w-14 rounded-xl md:rounded-2xl border-2 border-red-200 bg-white/60 text-red-600 shadow-sm hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[24px]">block</span>
                                        <span className="sm:hidden ml-2 text-[9px] font-black uppercase tracking-widest">Reject Feedback</span>
                                    </button>
                                </div>
                            )}

                            {item.status !== 'Pending' && (
                                <div className="flex flex-wrap justify-end gap-3">
                                    <button className="h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl bg-white/60 hover:bg-espresso text-espresso hover:text-white text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2 shadow-sm">
                                        <span className="material-symbols-outlined text-[16px] md:text-[18px]">{item.status === 'Rejected' ? 'restore' : 'edit'}</span>
                                        {item.status === 'Rejected' ? 'RESTORE' : 'MODIFY'}
                                    </button>
                                    <button className="h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl bg-white/60 hover:bg-red-600 text-red-400 hover:text-white text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2 shadow-sm">
                                        <span className="material-symbols-outlined text-[16px] md:text-[18px]">delete</span>
                                        PURGE
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}



