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
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-serif font-bold text-espresso dark:text-white">E-Learning</h1>
            <p className="text-espresso/70 dark:text-white/70">Access your scheduled Zoom sessions and video tutorials from your instructor.</p>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'schedule' ? 'bg-primary text-white' : 'text-espresso/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                    <span className="material-symbols-outlined align-middle mr-1">schedule</span>
                    Schedule
                </button>
                <button
                    onClick={() => setActiveTab('videos')}
                    className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'videos' ? 'bg-primary text-white' : 'text-espresso/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                    <span className="material-symbols-outlined align-middle mr-1">video_library</span>
                    Videos
                </button>
            </div>

            {/* View Toggle for Schedule */}
            {activeTab === 'schedule' && !loading && schedules.length > 0 && (
                <div className="flex justify-end">
                    <div className="bg-white dark:bg-[#2c2825] p-1 rounded-lg border border-black/5 flex items-center shadow-sm">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                viewMode === 'list' ? "bg-primary text-white shadow-sm" : "text-espresso/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5"
                            )}
                            title="List View"
                        >
                            <span className="material-symbols-outlined text-[20px]">list</span>
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                viewMode === 'calendar' ? "bg-primary text-white shadow-sm" : "text-espresso/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5"
                            )}
                            title="Calendar View"
                        >
                            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
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
                    <p className="text-center py-12 text-espresso/60 dark:text-white/60">No scheduled sessions yet.</p>
                ) : viewMode === 'list' ? (
                    <div className="grid gap-4">
                        {schedules.map(s => (
                            <div key={s.id} className="bg-white dark:bg-[#2c2825] rounded-xl p-4 shadow-sm border border-black/5 flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1">
                                    <h3 className="font-bold text-espresso dark:text-white">{s.title || 'Zoom Session'}</h3>
                                    <p className="text-sm text-espresso/60 dark:text-white/60">
                                        {s.isRecurring ? (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">repeat</span>
                                                Every {s.repeatDays?.join(', ')} at {s.dateTime ? format(s.dateTime.toDate ? s.dateTime.toDate() : new Date(s.dateTime), 'HH:mm') : ''}
                                            </span>
                                        ) : (
                                            s.dateTime ? new Date(s.dateTime.seconds ? s.dateTime.toDate() : s.dateTime).toLocaleString() : 'Date TBD'
                                        )}
                                    </p>
                                </div>
                                {s.zoomLink && (
                                    <a
                                        href={s.zoomLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">videocam</span>
                                        Join Meeting
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    /* CALENDAR VIEW */
                    <div className="bg-white dark:bg-[#2c2825] rounded-xl shadow-sm border border-black/5 overflow-hidden animate-fade-in">
                        <div className="flex items-center justify-between p-4 border-b border-black/5">
                            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-black/5 rounded-full">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <h2 className="font-bold text-lg text-espresso dark:text-white">{format(currentMonth, 'MMMM yyyy')}</h2>
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-black/5 rounded-full">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-7 text-center py-2 bg-black/5 dark:bg-white/5 text-sm font-bold text-espresso/70 dark:text-white/70">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 auto-rows-fr">
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
                    <p className="text-center py-12 text-espresso/60 dark:text-white/60">No videos shared yet.</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {videos.map(v => (
                            <div key={v.id} className="bg-white dark:bg-[#2c2825] rounded-xl overflow-hidden shadow-sm border border-black/5">
                                {v.thumbnailUrl && (
                                    <img src={v.thumbnailUrl} alt={v.title} className="w-full h-40 object-cover" />
                                )}
                                <div className="p-4">
                                    <h3 className="font-bold text-espresso dark:text-white">{v.title || 'Video'}</h3>
                                    <p className="text-sm text-espresso/60 dark:text-white/60 mt-1 line-clamp-2">{v.description || ''}</p>
                                    {v.url && (
                                        <a
                                            href={v.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 mt-3 text-primary font-medium hover:underline"
                                        >
                                            <span className="material-symbols-outlined text-lg">play_circle</span>
                                            Watch Video
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
