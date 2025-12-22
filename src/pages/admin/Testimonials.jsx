import React, { useState } from 'react';

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
        <div className="max-w-3xl mx-auto space-y-6 pb-24">
            <header className="flex items-center justify-between">
                <h2 className="text-espresso dark:text-white text-2xl font-bold leading-tight tracking-tight">Testimonials</h2>
                <div className="flex gap-2">
                    <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-espresso dark:text-white">
                        <span className="material-symbols-outlined">search</span>
                    </button>
                    <button className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm">
                        <span className="material-symbols-outlined">filter_list</span>
                    </button>
                </div>
            </header>

            {/* Filter Chips */}
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`flex h-9 shrink-0 items-center justify-center px-4 rounded-full shadow-sm transition-transform active:scale-95 border border-primary/20 ${filter === status
                                ? 'bg-espresso text-white'
                                : 'bg-white dark:bg-[#2c2825] text-espresso dark:text-white hover:bg-primary/5'
                            }`}
                    >
                        <span className="text-sm font-medium">{status}</span>
                        {status === 'Pending' && <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">2</span>}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex flex-col gap-4">
                {filtered.map(item => (
                    <div key={item.id} className={`group relative flex flex-col gap-3 rounded-xl bg-white dark:bg-[#2c2825] p-5 shadow-sm border border-primary/10 ${item.status === 'Approved' ? 'opacity-90' : item.status === 'Rejected' ? 'opacity-75' : ''}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/20 overflow-hidden relative">
                                    {item.avatar ? (
                                        <img src={item.avatar} alt={item.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-primary font-bold text-sm bg-primary/10">{item.initials}</div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-espresso dark:text-white text-base font-bold leading-tight font-serif">{item.name}</h3>
                                    <p className="text-primary/80 dark:text-white/60 text-xs font-medium">{item.course} • {item.time}</p>
                                </div>
                            </div>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                                    item.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                }`}>
                                {item.status}
                            </span>
                        </div>
                        <p className="text-espresso/80 dark:text-white/80 text-sm leading-relaxed font-display italic">
                            {item.content}
                        </p>

                        {item.status === 'Pending' && (
                            <>
                                <div className="h-px w-full bg-primary/10 my-1"></div>
                                <div className="flex gap-3 pt-1">
                                    <button className="flex-1 h-10 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">check</span>
                                        Approve
                                    </button>
                                    <button className="h-10 w-10 rounded-lg border border-red-200 bg-white dark:bg-transparent text-red-600 shadow-sm hover:bg-red-50 flex items-center justify-center transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">close</span>
                                    </button>
                                    <button className="h-10 w-10 rounded-lg border border-primary/20 bg-white dark:bg-transparent text-espresso dark:text-white shadow-sm hover:bg-primary/5 flex items-center justify-center transition-colors ml-auto">
                                        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                                    </button>
                                </div>
                            </>
                        )}
                        {item.status !== 'Pending' && (
                            <div className="flex justify-end pt-2">
                                <button className="text-primary hover:text-primary-dark text-sm font-semibold flex items-center gap-1 px-2 py-1 rounded hover:bg-primary/5 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">{item.status === 'Rejected' ? 'restore' : 'edit'}</span>
                                    {item.status === 'Rejected' ? 'Restore' : 'Edit'}
                                </button>
                                <button className="text-gray-400 hover:text-red-600 text-sm font-semibold flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors ml-2">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
