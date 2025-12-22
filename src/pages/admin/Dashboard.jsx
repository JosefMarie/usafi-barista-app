import React from 'react';

export function AdminDashboard() {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <p className="text-primary font-display font-medium text-sm mb-1">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                <h1 className="text-espresso dark:text-white text-3xl md:text-4xl font-bold font-serif leading-tight">
                    Dashboard & Analytics
                </h1>
            </div>

            {/* Top Stats Scrollable Row */}
            <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2 snap-x">
                <div className="flex min-w-[200px] flex-1 snap-center flex-col gap-3 rounded-2xl p-6 bg-white dark:bg-[#2c2825] shadow-sm border border-black/5">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">school</span>
                        <p className="text-espresso/70 dark:text-white/70 text-sm font-medium font-display">Students</p>
                    </div>
                    <div>
                        <p className="text-espresso dark:text-white text-4xl font-bold font-serif leading-none">124</p>
                        <div className="flex items-center gap-1 mt-2">
                            <span className="material-symbols-outlined text-green-600 text-sm">trending_up</span>
                            <p className="text-green-600 text-xs font-bold font-display">+12% this week</p>
                        </div>
                    </div>
                </div>

                <div className="flex min-w-[200px] flex-1 snap-center flex-col gap-3 rounded-2xl p-6 bg-white dark:bg-[#2c2825] shadow-sm border border-black/5">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">local_cafe</span>
                        <p className="text-espresso/70 dark:text-white/70 text-sm font-medium font-display">Active Courses</p>
                    </div>
                    <div>
                        <p className="text-espresso dark:text-white text-4xl font-bold font-serif leading-none">8</p>
                        <p className="text-espresso/40 dark:text-white/40 text-xs font-medium font-display mt-2">2 starting soon</p>
                    </div>
                </div>

                <div className="flex min-w-[200px] flex-1 snap-center flex-col gap-3 rounded-2xl p-6 bg-white dark:bg-[#2c2825] shadow-sm border border-black/5">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">approval_delegation</span>
                        <p className="text-espresso/70 dark:text-white/70 text-sm font-medium font-display">Pending</p>
                    </div>
                    <div>
                        <p className="text-espresso dark:text-white text-4xl font-bold font-serif leading-none">5</p>
                        <p className="text-espresso/40 dark:text-white/40 text-xs font-medium font-display mt-2">Approvals needed</p>
                    </div>
                </div>
            </div>

            {/* Revenue & Engagement Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 rounded-2xl p-6 bg-primary text-white shadow-lg shadow-primary/20">
                    <div className="flex justify-between items-start">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-white text-xl">payments</span>
                        </div>
                        <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">+8.5%</span>
                    </div>
                    <div className="mt-4">
                        <p className="text-white/80 text-sm font-medium font-display">Monthly Revenue</p>
                        <p className="text-white text-3xl font-bold font-serif leading-tight">$12,450</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 rounded-2xl p-6 bg-white dark:bg-[#2c2825] border border-black/5 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-primary text-xl">diversity_3</span>
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">+4.2%</span>
                    </div>
                    <div className="mt-4">
                        <p className="text-espresso/60 dark:text-white/60 text-sm font-medium font-display">Student Engagement</p>
                        <p className="text-espresso dark:text-white text-3xl font-bold font-serif leading-tight">94%</p>
                    </div>
                </div>
            </div>

            {/* Monthly Enrollments Chart */}
            <div className="rounded-2xl bg-white dark:bg-[#2c2825] border border-black/5 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-espresso dark:text-white text-lg font-bold font-serif">Monthly Enrollments</h3>
                    <button className="text-primary text-xs font-bold font-display uppercase tracking-wide">Year 2024</button>
                </div>
                <div className="w-full h-64 flex items-end justify-between gap-4 relative mt-8">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="border-t border-dashed border-espresso/5 dark:border-white/5 w-full h-0"></div>
                        ))}
                    </div>

                    {/* Bars */}
                    {[
                        { month: 'May', count: 18, height: '35%' },
                        { month: 'Jun', count: 24, height: '40%' },
                        { month: 'Jul', count: 32, height: '55%' },
                        { month: 'Aug', count: 18, height: '35%' },
                        { month: 'Sep', count: 45, height: '75%' },
                        { month: 'Oct', count: 54, height: '90%' },
                    ].map((item, index) => (
                        <div key={index} className="flex flex-col items-center gap-2 flex-1 z-10 group cursor-pointer h-full justify-end">
                            <div
                                className={`w-full max-w-[40px] rounded-t-lg relative transition-all duration-300 ${index === 5
                                        ? 'bg-primary shadow-lg shadow-primary/30'
                                        : 'bg-primary/30 dark:bg-primary/20 hover:bg-primary'
                                    }`}
                                style={{ height: item.height }}
                            >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-espresso text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                    {item.count} Students
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold uppercase font-display ${index === 5 ? 'text-primary' : 'text-espresso/40 dark:text-white/40'
                                }`}>
                                {item.month}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Course Completion Rates */}
                <div>
                    <h3 className="text-espresso dark:text-white text-lg font-bold font-serif mb-4 leading-tight">Course Completion Rates</h3>
                    <div className="flex flex-col gap-6 bg-white dark:bg-[#2c2825] p-6 rounded-2xl border border-black/5 shadow-sm">
                        {[
                            { name: 'Latte Art 101', students: 24, progress: 78, color: 'bg-primary' },
                            { name: 'Espresso Basics', students: 32, progress: 92, color: 'bg-green-600' },
                            { name: 'Bean Roasting', students: 15, progress: 45, color: 'bg-primary' },
                        ].map((course) => (
                            <div key={course.name}>
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <p className="text-espresso dark:text-white font-bold font-display text-sm">{course.name}</p>
                                        <p className="text-espresso/50 dark:text-white/50 text-xs font-display">{course.students} active students</p>
                                    </div>
                                    <p className={`font-bold text-sm ${course.progress > 90 ? 'text-green-600' : 'text-primary'}`}>{course.progress}%</p>
                                </div>
                                <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${course.color}`} style={{ width: `${course.progress}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Enrollments */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-espresso dark:text-white text-lg font-bold leading-tight font-serif">Recent Enrollments</h3>
                        <button className="text-primary text-sm font-semibold font-display hover:underline">View All</button>
                    </div>
                    <div className="flex flex-col bg-white dark:bg-[#2c2825] rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                        {[
                            { name: 'Sarah Mitchell', course: 'Latte Art 101', time: '2h ago', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
                            { name: 'David Kim', course: 'Espresso Basics', time: '5h ago', img: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
                            { name: 'Emily Chen', course: 'Bean Roasting', time: '1d ago', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
                        ].map((student, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 border-b border-black/5 last:border-0 hover:bg-black/5 transition-colors">
                                <img src={student.img} alt={student.name} className="w-10 h-10 rounded-full object-cover" />
                                <div className="flex flex-1 flex-col">
                                    <h4 className="text-espresso dark:text-white text-sm font-semibold font-display">{student.name}</h4>
                                    <p className="text-espresso/60 dark:text-white/60 text-xs font-display">Enrolled in <span className="text-primary font-medium">{student.course}</span></p>
                                </div>
                                <span className="text-espresso/40 dark:text-white/40 text-xs font-display whitespace-nowrap">{student.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
