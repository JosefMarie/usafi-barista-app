import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function InstructorCourses() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            // Fetch all courses (instructors can view all courses in read-only mode)
            const snapshot = await getDocs(collection(db, 'courses'));
            const data = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setCourses(data);
        } catch (err) {
            console.error('Error fetching courses:', err);
        } finally {
            setLoading(false);
        }
    };

    const assignedCourseIds = user?.assignedCourseIds || [];
    const myCourses = courses.filter(c => assignedCourseIds.includes(c.id));
    const otherCourses = courses.filter(c => !assignedCourseIds.includes(c.id));

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-serif font-bold text-espresso dark:text-white">Courses</h1>
                <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">View your assigned courses and other available curriculum</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></span>
                </div>
            ) : courses.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-[#2c2825] rounded-xl border border-black/5">
                    <span className="material-symbols-outlined text-5xl text-espresso/30 dark:text-white/30 mb-3 block">menu_book</span>
                    <p className="text-espresso/60 dark:text-white/60">No courses available yet.</p>
                </div>
            ) : (
                <>
                    {/* Assigned Courses */}
                    {myCourses.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-espresso dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">verified_user</span>
                                My Assigned Courses
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {myCourses.map(course => <CourseCard key={course.id} course={course} isAssigned={true} />)}
                            </div>
                        </div>
                    )}

                    {/* Other Courses */}
                    {otherCourses.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-espresso dark:text-white flex items-center gap-2 opacity-80">
                                <span className="material-symbols-outlined">library_books</span>
                                Other Courses
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 opacity-80 hover:opacity-100 transition-opacity">
                                {otherCourses.map(course => <CourseCard key={course.id} course={course} isAssigned={false} />)}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function CourseCard({ course, isAssigned }) {
    return (
        <div className={cn(
            "bg-white dark:bg-[#2c2825] rounded-xl overflow-hidden shadow-sm border transition-shadow hover:shadow-md",
            isAssigned ? "border-primary/30 ring-1 ring-primary/10" : "border-black/5"
        )}>
            {course.thumbnail && (
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 overflow-hidden relative">
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    {isAssigned && (
                        <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                            Assigned
                        </div>
                    )}
                </div>
            )}
            <div className="p-5">
                <h3 className="font-bold text-lg text-espresso dark:text-white mb-2">{course.title || 'Untitled Course'}</h3>
                {course.description && (
                    <p className="text-sm text-espresso/60 dark:text-white/60 line-clamp-2 mb-3">{course.description}</p>
                )}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-espresso/70 dark:text-white/70">
                        {course.duration && (
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                {course.duration}
                            </span>
                        )}
                        {course.level && (
                            <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                                {course.level}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
