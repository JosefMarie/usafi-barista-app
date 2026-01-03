import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

export function InstructorSchedule() {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        dateTime: '',
        zoomLink: '',
        description: '',
        isRecurring: false,
        repeatDays: [],
        recurringEndDate: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (user) fetchSchedules();
    }, [user]);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'schedules'),
                where('instructorId', '==', user.uid)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs
                .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
                .sort((a, b) => {
                    const dateA = a.dateTime?.toDate?.() || new Date(a.dateTime);
                    const dateB = b.dateTime?.toDate?.() || new Date(b.dateTime);
                    return dateB - dateA; // Sort descending
                });
            setSchedules(data);
        } catch (err) {
            console.error('Error fetching schedules:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const scheduleData = {
                ...formData,
                dateTime: new Date(formData.dateTime),
                recurringEndDate: formData.recurringEndDate ? new Date(formData.recurringEndDate) : null,
                instructorId: user.uid,
                instructorName: user.name || user.email,
                updatedAt: serverTimestamp()
            };

            if (editingId) {
                await updateDoc(doc(db, 'schedules', editingId), scheduleData);
            } else {
                await addDoc(collection(db, 'schedules'), {
                    ...scheduleData,
                    createdAt: serverTimestamp()
                });

                // Trigger notifications for assigned students
                if (user.assignedStudentIds?.length > 0) {
                    for (const studentId of user.assignedStudentIds) {
                        try {
                            await addDoc(collection(db, 'notifications'), {
                                recipientId: studentId,
                                title: scheduleData.isRecurring ? 'New Recurring Session' : 'New E-Learning Session',
                                desc: `Instructor ${user.name || 'your instructor'} added a ${scheduleData.isRecurring ? 'recurring ' : ''}session: ${formData.title}`,
                                type: 'course',
                                read: false,
                                timestamp: serverTimestamp()
                            });
                        } catch (nErr) {
                            console.error("Failed to send notification:", nErr);
                        }
                    }
                }
            }

            setShowAddModal(false);
            setEditingId(null);
            setFormData({
                title: '',
                dateTime: '',
                zoomLink: '',
                description: '',
                isRecurring: false,
                repeatDays: [],
                recurringEndDate: ''
            });
            fetchSchedules();
        } catch (err) {
            console.error('Error saving schedule:', err);
            alert('Failed to save schedule: ' + err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = (schedule) => {
        setEditingId(schedule.id);
        const dateValue = schedule.dateTime?.toDate ? schedule.dateTime.toDate() : new Date(schedule.dateTime);
        const isoString = new Date(dateValue.getTime() - (dateValue.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

        let endIso = '';
        if (schedule.recurringEndDate) {
            const endDateValue = schedule.recurringEndDate?.toDate ? schedule.recurringEndDate.toDate() : new Date(schedule.recurringEndDate);
            endIso = new Date(endDateValue.getTime() - (endDateValue.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
        }

        setFormData({
            title: schedule.title || '',
            dateTime: isoString,
            zoomLink: schedule.zoomLink || '',
            description: schedule.description || '',
            isRecurring: schedule.isRecurring || false,
            repeatDays: schedule.repeatDays || [],
            recurringEndDate: endIso
        });
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;
        try {
            await deleteDoc(doc(db, 'schedules', id));
            fetchSchedules();
        } catch (err) {
            console.error('Error deleting schedule:', err);
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
        const dayName = format(day, 'EEEE'); // 'Monday', etc.
        const occurrences = [];

        schedules.forEach(s => {
            const sDate = s.dateTime?.toDate ? s.dateTime.toDate() : new Date(s.dateTime);

            if (s.isRecurring) {
                const endDate = s.recurringEndDate?.toDate ? s.recurringEndDate.toDate() : (s.recurringEndDate ? new Date(s.recurringEndDate) : null);

                // Check if the day is within range and is one of the repeat days
                const startOfSDate = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate());
                const startOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());

                if (startOfDay >= startOfSDate && (!endDate || startOfDay <= endDate)) {
                    if (s.repeatDays?.includes(dayName)) {
                        occurrences.push({ ...s, dateTime: sDate }); // Keep original time
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-espresso dark:text-white">Live Learning Hub</h1>
                    <p className="text-espresso/60 dark:text-white/60 font-medium mt-1">Orchestrate your Zoom sessions and interactive schedules</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-[#F5DEB3] dark:bg-white/5 p-1 rounded-xl border border-espresso/10 flex items-center shadow-lg relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/10"></div>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2.5 rounded-lg transition-all relative z-10",
                                viewMode === 'list' ? "bg-espresso text-white shadow-xl" : "text-espresso/40 dark:text-white/40 hover:bg-white/40 dark:hover:bg-white/5"
                            )}
                            title="Analytical List"
                        >
                            <span className="material-symbols-outlined text-[20px]">list</span>
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={cn(
                                "p-2.5 rounded-lg transition-all relative z-10",
                                viewMode === 'calendar' ? "bg-espresso text-white shadow-xl" : "text-espresso/40 dark:text-white/40 hover:bg-white/40 dark:hover:bg-white/5"
                            )}
                            title="Interactive Grid"
                        >
                            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                title: '',
                                dateTime: '',
                                zoomLink: '',
                                description: '',
                                isRecurring: false,
                                repeatDays: [],
                                recurringEndDate: ''
                            });
                            setShowAddModal(true);
                        }}
                        className="flex items-center gap-3 px-6 py-3 bg-espresso text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-2xl transition-all shadow-xl active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        <span className="hidden sm:inline">Launch Session</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></span>
                </div>
            ) : schedules.length === 0 ? (
                <div className="text-center py-20 bg-[#F5DEB3] dark:bg-white/5 rounded-3xl border border-espresso/10 shadow-xl relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    <span className="material-symbols-outlined text-6xl text-espresso/20 dark:text-white/20 mb-4 block group-hover:scale-110 transition-transform">event_busy</span>
                    <p className="text-espresso/40 dark:text-white/40 font-black uppercase tracking-widest text-sm">Silence in the schedule. Launch something new.</p>
                </div>
            ) : viewMode === 'list' ? (
                /* LIST VIEW */
                <div className="grid gap-4">
                    {schedules.map(schedule => {
                        const dateObj = schedule.dateTime?.toDate ? schedule.dateTime.toDate() : new Date(schedule.dateTime);
                        const isPast = dateObj < new Date();
                        return (
                            <div key={schedule.id} className={cn("bg-[#F5DEB3] dark:bg-white/5 rounded-3xl p-6 shadow-xl border border-espresso/10 relative overflow-hidden group transition-all hover:-translate-y-1", isPast && 'opacity-60 grayscale')}>
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 relative z-10">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3">
                                            <span className="h-10 w-10 rounded-2xl bg-espresso flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-[20px]">videocam</span>
                                            </span>
                                            <div className="flex-1">
                                                <h3 className="font-serif font-bold text-xl text-espresso dark:text-white mb-1">{schedule.title}</h3>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-espresso/50 dark:text-white/50 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                                    {dateObj.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </p>
                                                {schedule.description && (
                                                    <p className="text-sm font-medium text-espresso/60 dark:text-white/60 mt-3 leading-relaxed">{schedule.description}</p>
                                                )}
                                                {schedule.zoomLink && (
                                                    <a
                                                        href={schedule.zoomLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/50 dark:bg-white/5 rounded-xl text-espresso dark:text-white font-black uppercase tracking-widest text-[9px] hover:bg-white transition-all shadow-sm group/link"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px] group-hover/link:rotate-12 transition-transform">link</span>
                                                        Strategic Gateway
                                                    </a>
                                                )}
                                                {schedule.isRecurring && (
                                                    <div className="mt-4 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-widest">
                                                        <span className="text-white bg-espresso px-2.5 py-1 rounded-full shadow-sm">Recurring Chain</span>
                                                        {schedule.repeatDays?.map(d => (
                                                            <span key={d} className="text-espresso/50 dark:text-white/50 bg-white/40 dark:bg-white/5 px-2.5 py-1 rounded-full border border-espresso/5">{d.slice(0, 3)}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(schedule)} className="p-3 bg-white/40 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-2xl text-espresso/40 hover:text-espresso transition-all shadow-sm active:scale-95">
                                            <span className="material-symbols-outlined text-[20px]">edit_note</span>
                                        </button>
                                        <button onClick={() => handleDelete(schedule.id)} className="p-3 bg-red-500/5 hover:bg-red-500 hover:text-white rounded-2xl text-red-500 transition-all shadow-sm active:scale-95">
                                            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* CALENDAR VIEW */
                <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl shadow-2xl border border-espresso/10 overflow-hidden relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    <div className="flex items-center justify-between p-6 border-b border-espresso/10 relative z-10">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white/50 dark:hover:bg-white/5 rounded-full text-espresso/40 hover:text-espresso transition-all">
                            <span className="material-symbols-outlined">west</span>
                        </button>
                        <h2 className="font-serif font-bold text-2xl text-espresso dark:text-white">{format(currentMonth, 'MMMM yyyy')}</h2>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white/50 dark:hover:bg-white/5 rounded-full text-espresso/40 hover:text-espresso transition-all">
                            <span className="material-symbols-outlined">east</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-7 text-center py-4 bg-white/20 dark:bg-black/20 text-[10px] font-black uppercase tracking-[0.2em] text-espresso/50 dark:text-white/50 relative z-10">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 auto-rows-fr">
                        {calendarDays().map((day, idx) => {
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const daySchedules = getSchedulesForDay(day);

                            return (
                                <div key={day.toString()} className={cn(
                                    "min-h-[120px] p-3 border-b border-r border-espresso/5 dark:border-white/5 relative group cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 transition-all z-10",
                                    !isCurrentMonth && "opacity-20 pointer-events-none grayscale"
                                )}>
                                    <span className={cn(
                                        "text-xs font-black block mb-3 uppercase tracking-tighter",
                                        isSameDay(day, new Date()) ? "text-primary scale-110 drop-shadow-sm" : "text-espresso dark:text-white"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    <div className="space-y-1">
                                        {daySchedules.map(s => (
                                            <div
                                                key={s.id}
                                                onClick={() => handleEdit(s)}
                                                className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded truncate font-medium hover:bg-primary hover:text-white transition-colors"
                                                title={s.title}
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
            )}

            {/* Add/Edit Modal (Reused) */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white dark:bg-[#2c2825] rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-espresso dark:text-white mb-4">
                            {editingId ? 'Edit Session' : 'Add New Session'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Session Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.dateTime}
                                    onChange={e => setFormData({ ...formData, dateTime: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Zoom Link *</label>
                                <input
                                    type="url"
                                    required
                                    value={formData.zoomLink}
                                    onChange={e => setFormData({ ...formData, zoomLink: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white resize-none"
                                />
                            </div>

                            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isRecurring"
                                        checked={formData.isRecurring}
                                        onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="isRecurring" className="text-sm font-medium text-espresso dark:text-white">Repeat weekly</label>
                                </div>

                                {formData.isRecurring && (
                                    <>
                                        <div>
                                            <p className="text-xs font-bold text-espresso/50 dark:text-white/50 uppercase mb-2">Repeat On</p>
                                            <div className="flex flex-wrap gap-2">
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => {
                                                            const newDays = formData.repeatDays.includes(day)
                                                                ? formData.repeatDays.filter(d => d !== day)
                                                                : [...formData.repeatDays, day];
                                                            setFormData({ ...formData, repeatDays: newDays });
                                                        }}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                                            formData.repeatDays.includes(day)
                                                                ? "bg-primary text-white"
                                                                : "bg-white dark:bg-[#1c1916] border border-black/5 text-espresso/60 dark:text-white/60"
                                                        )}
                                                    >
                                                        {day.slice(0, 3)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-espresso/50 dark:text-white/50 uppercase mb-2">Ends On (optional)</label>
                                            <input
                                                type="date"
                                                value={formData.recurringEndDate}
                                                onChange={e => setFormData({ ...formData, recurringEndDate: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white text-sm"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-full border border-black/10 dark:border-white/10 text-espresso dark:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Cancel</button>
                                <button type="submit" disabled={formLoading} className="flex-1 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">{formLoading ? 'Saving...' : editingId ? 'Update Session' : 'Create Session'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
