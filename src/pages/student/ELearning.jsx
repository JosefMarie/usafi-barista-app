import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

export function ELearning() {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('schedule');
    const [viewMode, setViewMode] = useState('calendar'); // Default to calendar for better visibility
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch schedules where the student is assigned
            const scheduleQuery = query(
                collection(db, 'schedules'),
                orderBy('dateTime', 'asc')
            );
            const scheduleSnap = await getDocs(scheduleQuery);
            const scheduleData = scheduleSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSchedules(scheduleData);

            // Fetch videos
            const videoQuery = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
            const videoSnap = await getDocs(videoQuery);
            const videoData = videoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVideos(videoData);
        } catch (err) {
            console.error('Error fetching e-learning data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Calendar Generation Logic
    const calendarDays = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: startDate, end: endDate });
    };

    // Project recurring events for a specific day
    const getSchedulesForDay = (day) => {
        const dayName = format(day, 'EEEE');
        const occurrences = [];

        schedules.forEach(s => {
            const sDate = s.dateTime?.toDate ? s.dateTime.toDate() : new Date(s.dateTime);

            if (s.isRecurring) {
                const endDate = s.recurringEndDate?.toDate ? s.recurringEndDate.toDate() : (s.recurringEndDate ? new Date(s.recurringEndDate) : null);

                const startOfSDate = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate());
                const startOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());

                if (startOfDay >= startOfSDate && (!endDate || startOfDay <= endDate)) {
                    if (s.repeatDays?.includes(dayName)) {
                        occurrences.push({ ...s, dateTime: sDate, isProjected: true });
                    }
                }
            } else {
                if (isSameDay(sDate, day)) {
                    occurrences.push(s);
                }
            }
        });

        return occurrences.sort((a, b) => {
            const timeA = (a.dateTime?.toDate ? a.dateTime.toDate() : new Date(a.dateTime)).getHours() * 60 + (a.dateTime?.toDate ? a.dateTime.toDate() : new Date(a.dateTime)).getMinutes();
            const timeB = (b.dateTime?.toDate ? b.dateTime.toDate() : new Date(b.dateTime)).getHours() * 60 + (b.dateTime?.toDate ? b.dateTime.toDate() : new Date(b.dateTime)).getMinutes();
            return timeA - timeB;
        });
    };

    return (
        <div className="w-full space-y-8">
            <div>
                <h1 className="text-3xl font-serif font-bold text-espresso dark:text-white">Active Learning Sphere</h1>
                <p className="text-espresso/60 dark:text-white/60 font-medium mt-1">Engage with live masterclasses and curated instructional media</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-espresso/10 pb-4">
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
                        activeTab === 'schedule' ? "bg-espresso text-white shadow-xl" : "text-espresso/40 dark:text-white/40 hover:bg-white/40 dark:hover:bg-white/5"
                    )}
                >
                    <span className="material-symbols-outlined text-[20px]">event_repeat</span>
                    Live Sessions
                </button>
                <button
                    onClick={() => setActiveTab('videos')}
                    className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
                        activeTab === 'videos' ? "bg-espresso text-white shadow-xl" : "text-espresso/40 dark:text-white/40 hover:bg-white/40 dark:hover:bg-white/5"
                    )}
                >
                    <span className="material-symbols-outlined text-[20px]">broadcast_on_personal</span>
                    On-Demand Media
                </button>
            </div>

            {/* View Toggle for Schedule */}
            {activeTab === 'schedule' && !loading && schedules.length > 0 && (
                <div className="flex justify-end">
                    <div className="bg-[#F5DEB3] dark:bg-white/5 p-1 rounded-2xl border border-espresso/10 flex items-center shadow-lg relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/10"></div>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2.5 rounded-xl transition-all",
                                viewMode === 'list' ? "bg-espresso text-white shadow-md rotate-3" : "text-espresso/40 dark:text-white/40 hover:bg-white/40 dark:hover:bg-white/5"
                            )}
                            title="List View"
                        >
                            <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={cn(
                                "p-2.5 rounded-xl transition-all",
                                viewMode === 'calendar' ? "bg-espresso text-white shadow-md -rotate-3" : "text-espresso/40 dark:text-white/40 hover:bg-white/40 dark:hover:bg-white/5"
                            )}
                            title="Calendar View"
                        >
                            <span className="material-symbols-outlined text-[20px]">calendar_apps_script</span>
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></span>
                </div>
            ) : activeTab === 'schedule' ? (
                /* Schedules */
                schedules.length === 0 ? (
                    <div className="text-center py-20 bg-[#F5DEB3] dark:bg-white/5 rounded-3xl border border-espresso/10 shadow-xl relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                        <span className="material-symbols-outlined text-6xl text-espresso/20 dark:text-white/20 mb-4 block group-hover:scale-110 transition-transform">event_busy</span>
                        <p className="text-espresso/40 dark:text-white/40 font-black uppercase tracking-widest text-sm">Silence in the schedule. No masterclasses pending.</p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="grid gap-6">
                        {schedules.map(s => (
                            <div key={s.id} className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl p-6 shadow-xl border border-espresso/10 flex flex-col md:flex-row md:items-center gap-6 group hover:-translate-y-1 transition-all relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                <div className="flex-1 relative z-10">
                                    <h3 className="font-serif font-bold text-xl text-espresso dark:text-white mb-2">{s.title || 'Zoom Masterclass'}</h3>
                                    <div className="flex flex-wrap gap-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-espresso/40 dark:text-white/40 flex items-center gap-2">
                                            {s.isRecurring ? (
                                                <>
                                                    <span className="material-symbols-outlined text-[16px]">sync</span>
                                                    Spectral Frequency: Every {s.repeatDays?.join(', ')}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-[16px]">event</span>
                                                    Extraction Date: {s.dateTime ? new Date(s.dateTime.seconds ? s.dateTime.toDate() : s.dateTime).toLocaleDateString() : 'Pending'}
                                                </>
                                            )}
                                        </p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-espresso/40 dark:text-white/40 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                                            Operational Time: {s.dateTime ? format(s.dateTime.toDate ? s.dateTime.toDate() : new Date(s.dateTime), 'HH:mm') : 'TBD'}
                                        </p>
                                    </div>
                                </div>
                                {s.zoomLink && (
                                    <a
                                        href={s.zoomLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 px-8 py-4 bg-espresso text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-2xl transition-all shadow-xl active:scale-95 group-hover:scale-105"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">videocam</span>
                                        Commence Uplink
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    /* CALENDAR VIEW */
                    <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl shadow-2xl border border-espresso/10 overflow-hidden animate-fade-in relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                        <div className="flex items-center justify-between p-6 border-b border-espresso/10 relative z-10">
                            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/40 hover:bg-white text-espresso transition-all shadow-sm active:scale-90">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <h2 className="font-serif font-bold text-xl text-espresso dark:text-white">{format(currentMonth, 'MMMM yyyy')}</h2>
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/40 hover:bg-white text-espresso transition-all shadow-sm active:scale-90">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-7 text-center py-4 bg-white/20 dark:bg-black/20 text-[10px] font-black uppercase tracking-[0.2em] text-espresso/50 dark:text-white/50 relative z-10">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 relative z-10">
                            {calendarDays().map((day, idx) => {
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const daySchedules = getSchedulesForDay(day);

                                return (
                                    <div key={day.toString()} className={cn(
                                        "min-h-[100px] p-2 border-b border-r border-black/5 dark:border-white/5 relative group cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                                        !isCurrentMonth && "bg-black/[0.02] dark:bg-white/[0.02] text-opacity-30"
                                    )}>
                                        <span className={cn(
                                            "text-sm font-medium block mb-1",
                                            isSameDay(day, new Date()) ? "bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center" : "text-espresso dark:text-white"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                        <div className="space-y-1">
                                            {daySchedules.map((s, i) => (
                                                <div
                                                    key={s.id + i}
                                                    className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded truncate font-medium hover:bg-primary hover:text-white transition-colors cursor-pointer"
                                                    title={s.title}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (s.zoomLink) window.open(s.zoomLink, '_blank');
                                                    }}
                                                >
                                                    {format(s.dateTime?.toDate ? s.dateTime.toDate() : new Date(s.dateTime), 'HH:mm')} {s.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            ) : (
                /* Videos */
                videos.length === 0 ? (
                    <div className="text-center py-20 bg-[#F5DEB3] dark:bg-white/5 rounded-3xl border border-espresso/10 shadow-xl relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                        <span className="material-symbols-outlined text-6xl text-espresso/20 dark:text-white/20 mb-4 block group-hover:scale-110 transition-transform">video_library</span>
                        <p className="text-espresso/40 dark:text-white/40 font-black uppercase tracking-widest text-sm">Strategic media vault is empty.</p>
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2">
                        {videos.map(v => (
                            <div key={v.id} className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl overflow-hidden shadow-xl border border-espresso/10 group hover:shadow-2xl transition-all relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                <div className="relative z-10">
                                    {v.thumbnailUrl && (
                                        <div className="relative aspect-video overflow-hidden">
                                            <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-espresso/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                <span className="material-symbols-outlined text-white text-6xl animate-pulse">play_circle</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-8">
                                        <h3 className="font-serif font-bold text-xl text-espresso dark:text-white mb-2 leading-tight">{v.title || 'Instructional Media'}</h3>
                                        <p className="text-sm font-medium text-espresso/60 dark:text-white/60 line-clamp-2 leading-relaxed">{v.description || ''}</p>
                                        {v.url && (
                                            <a
                                                href={v.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-3 mt-6 px-8 py-3 bg-espresso text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-2xl transition-all shadow-xl active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">play_circle</span>
                                                Engage Content
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
