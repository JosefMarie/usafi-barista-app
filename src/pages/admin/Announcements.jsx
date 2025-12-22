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
        <div className="max-w-3xl mx-auto space-y-4 pb-24">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-espresso dark:text-white">Announcements</h1>
                <div className="flex gap-2">
                    <button className="flex items-center justify-center w-10 h-10 rounded-full text-espresso dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">search</span>
                    </button>
                    <button className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        <span className="material-symbols-outlined">filter_list</span>
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 pb-1 overflow-x-auto hide-scrollbar">
                {['All', 'Published', 'Draft', 'Archived'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium shrink-0 transition-all ${activeTab === tab
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-white dark:bg-[#2c2825] border border-primary/20 text-espresso dark:text-white hover:bg-primary/5'
                            }`}
                    >
                        {tab === 'All' && <span className="material-symbols-outlined text-[18px]">view_list</span>}
                        {tab === 'Published' && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                        {tab === 'Draft' && <span className="material-symbols-outlined text-[18px]">edit_note</span>}
                        {tab === 'Archived' && <span className="material-symbols-outlined text-[18px]">archive</span>}
                        {tab}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-4">
                {filtered.map(item => (
                    <div key={item.id} className={`group relative bg-white dark:bg-[#2c2825] rounded-xl p-4 shadow-sm border border-primary/10 transition-all duration-200 ${item.status === 'Archived' ? 'opacity-75' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'Published' ? 'bg-green-100 text-green-800' :
                                    item.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                                        'bg-primary/10 text-primary'
                                }`}>
                                {item.status}
                            </span>
                            <button className="text-gray-400 hover:text-espresso dark:hover:text-white p-1 -mr-2 -mt-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                                <span className="material-symbols-outlined text-[20px]">more_vert</span>
                            </button>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className={`hidden sm:flex shrink-0 w-12 h-12 rounded-lg items-center justify-center ${item.status === 'Draft' ? 'bg-gray-100 text-gray-500' : 'bg-primary/10 text-primary'}`}>
                                <span className="material-symbols-outlined">{item.icon}</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-espresso dark:text-white leading-tight mb-1">{item.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-white/60 mb-2 line-clamp-2">{item.summary}</p>
                                <div className="flex items-center gap-3 text-xs font-medium text-gray-500 dark:text-white/50">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">calendar_today</span> {item.date}
                                    </span>
                                    {item.audience && (
                                        <span className="flex items-center gap-1 text-primary">
                                            <span className="material-symbols-outlined text-[14px]">group</span> {item.audience}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-6 right-4 z-30">
                <button className="group flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all h-14 w-14 sm:w-auto sm:px-6">
                    <span className="material-symbols-outlined text-[28px]">add</span>
                    <span className="hidden sm:inline font-bold text-lg">New Announcement</span>
                </button>
            </div>
        </div>
    );
}
