import React, { useState } from 'react';

export function Announcements() {
    const [activeTab, setActiveTab] = useState('All');

    const announcements = [
        { id: 1, title: 'New Barista Machine Maintenance', summary: 'Scheduled maintenance for the Marzocco machines will take place this Sunday.', date: 'Oct 24, 2023', audience: 'All Instructors', status: 'Published', icon: 'campaign' },
        { id: 2, title: 'Holiday Schedule Updates', summary: 'Drafting the new shift rotations for the December holiday season.', date: 'Last edited yesterday', audience: '', status: 'Draft', icon: 'edit_document' },
        { id: 3, title: 'Q3 Curriculum Review', summary: 'Summary of Q3 training outcomes and adjustments.', date: 'Sep 15, 2023', audience: '', status: 'Archived', icon: 'archive' },
        { id: 4, title: 'Upcoming Latte Art Workshop', summary: 'Guest instructor arriving next week. Slots are limited.', date: 'Oct 20, 2023', audience: 'All Students', status: 'Published', icon: 'campaign' }
    ];

    const filtered = activeTab === 'All' ? announcements : announcements.filter(a => a.status === activeTab);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-32">
            <div className=" w-full px-2 py-10 space-y-10">
                {/* Header Section */}
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-10"></div>
                    <div>
                        <h1 className="text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Operational Broadcasts</h1>
                        <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-2">Global Comms & Directive Management</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="w-12 h-12 rounded-2xl bg-white/40 hover:bg-espresso hover:text-white transition-all flex items-center justify-center shadow-sm group">
                            <span className="material-symbols-outlined text-[24px]">search</span>
                        </button>
                        <button className="w-12 h-12 rounded-2xl bg-white/40 hover:bg-espresso hover:text-white transition-all flex items-center justify-center shadow-sm group">
                            <span className="material-symbols-outlined text-[24px]">filter_list</span>
                        </button>
                    </div>
                </div>

                {/* Tabs Array */}
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    {['All', 'Published', 'Draft', 'Archived'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex h-12 shrink-0 items-center justify-center gap-x-3 rounded-2xl px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm ${activeTab === tab
                                ? 'bg-espresso text-white'
                                : 'bg-white/40 dark:bg-black/20 border border-espresso/10 text-espresso/60 hover:bg-white/60'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {tab === 'All' ? 'grid_view' : tab === 'Published' ? 'verified' : tab === 'Draft' ? 'edit_square' : 'archive'}
                            </span>
                            {tab === 'All' ? 'Universal' : tab}
                        </button>
                    ))}
                </div>

                {/* Content Stream */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.4em] flex items-center gap-3">
                            <span className="w-8 h-px bg-espresso/20"></span>
                            Transmission History
                        </h3>
                        <p className="text-[10px] font-black text-espresso/20 uppercase tracking-widest">{filtered.length} Dispatches Active</p>
                    </div>

                    <div className="grid gap-6">
                        {filtered.map(item => (
                            <div
                                key={item.id}
                                className={`group relative bg-white/40 dark:bg-black/20 rounded-[2.5rem] p-8 border border-espresso/10 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden ${item.status === 'Archived' ? 'opacity-60' : ''
                                    }`}
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover:bg-espresso transition-colors"></div>

                                <div className="flex justify-between items-start mb-6">
                                    <div className={`flex items-center gap-3 px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${item.status === 'Published'
                                        ? 'bg-green-50 border-green-100 text-green-700'
                                        : item.status === 'Draft'
                                            ? 'bg-amber-50 border-amber-100 text-amber-700'
                                            : 'bg-gray-50 border-gray-100 text-gray-700'
                                        }`}>
                                        <span className="material-symbols-outlined text-[14px]">
                                            {item.status === 'Published' ? 'sensors' : item.status === 'Draft' ? 'draw' : 'history'}
                                        </span>
                                        {item.status} Status
                                    </div>
                                    <button className="w-10 h-10 rounded-xl bg-white/60 hover:bg-espresso hover:text-white transition-all flex items-center justify-center shadow-sm">
                                        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                                    </button>
                                </div>

                                <div className="flex items-start gap-8">
                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${item.status === 'Draft' ? 'bg-black/5 text-espresso/40' : 'bg-espresso/5 text-espresso'
                                        }`}>
                                        <span className="material-symbols-outlined text-[32px]">{item.icon}</span>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <h3 className="text-2xl font-serif font-black text-espresso dark:text-white leading-tight tracking-tight uppercase group-hover:text-espresso/80 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-espresso/60 dark:text-white/60 text-sm leading-relaxed font-medium line-clamp-2 italic">
                                            "{item.summary}"
                                        </p>
                                        <div className="flex items-center gap-4 pt-4 border-t border-espresso/5">
                                            <div className="flex items-center gap-2 text-[9px] font-black text-espresso/40 uppercase tracking-widest">
                                                <span className="material-symbols-outlined text-[16px]">event</span>
                                                {item.date}
                                            </div>
                                            {item.audience && (
                                                <div className="flex items-center gap-2 text-[9px] font-black text-espresso uppercase tracking-widest bg-espresso/5 px-3 py-1 rounded-lg">
                                                    <span className="material-symbols-outlined text-[16px]">hub</span>
                                                    {item.audience} Access
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Action Trigger */}
            <div className="fixed bottom-12 right-12 z-50">
                <button className="group flex items-center gap-4 bg-espresso hover:bg-espresso/90 text-white rounded-[2rem] shadow-2xl hover:shadow-espresso/40 transition-all p-2 pr-10 hover:scale-105 active:scale-95">
                    <div className="h-16 w-16 rounded-[1.75rem] border-2 border-white/20 flex items-center justify-center bg-white/10 group-hover:rotate-90 transition-transform duration-500">
                        <span className="material-symbols-outlined text-[32px]">add</span>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Initialize</span>
                        <span className="font-serif font-black text-xl uppercase tracking-tight">New Broadcast</span>
                    </div>
                </button>
            </div>
        </div>
    );
}



