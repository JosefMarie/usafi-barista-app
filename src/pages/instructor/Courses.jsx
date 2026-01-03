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
                <h1 className="text-3xl font-serif font-bold text-espresso dark:text-white mb-2">Academic Curriculum</h1>
                <p className="text-espresso/60 dark:text-white/60 font-medium">Explore and view the complete curriculum and your specialized assignments</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></span>
                </div>
            ) : courses.length === 0 ? (
                <div className="text-center py-16 bg-[#F5DEB3] dark:bg-white/5 rounded-3xl border border-espresso/10 shadow-xl relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    <span className="material-symbols-outlined text-6xl text-espresso/20 dark:text-white/20 mb-4 block group-hover:scale-110 transition-transform">menu_book</span>
                    <p className="text-espresso/40 dark:text-white/40 font-black uppercase tracking-widest text-sm">Curriculum library is empty</p>
                </div>
            ) : (
                <>
                    {/* Assigned Courses */}
                    {myCourses.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="text-[10px] font-black text-espresso/50 dark:text-white/50 uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-espresso"></span>
                                Personalized Assignments
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {myCourses.map(course => <CourseCard key={course.id} course={course} isAssigned={true} />)}
                            </div>
                        </div>
                    )}

                    {/* Other Courses */}
                    {otherCourses.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="text-[10px] font-black text-espresso/30 dark:text-white/30 uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-espresso/30"></span>
                                General Curriculum
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
            "bg-[#F5DEB3] dark:bg-white/5 rounded-3xl overflow-hidden shadow-xl border border-espresso/10 transition-all hover:-translate-y-1 relative group",
            !isAssigned && "opacity-80 grayscale hover:grayscale-0 hover:opacity-100"
        )}>
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
            {course.thumbnail && (
                <div className="aspect-video bg-espresso/5 dark:bg-gray-800 overflow-hidden relative">
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    {isAssigned && (
                        <div className="absolute top-4 right-4 bg-espresso text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg border border-white/10">
                            Authorized
                        </div>
                    )}
                </div>
            )}
            <div className="p-6 relative z-10">
                <h3 className="font-serif font-bold text-xl text-espresso dark:text-white mb-3">{course.title || 'Untitled Course'}</h3>
                {course.description && (
                    <p className="text-sm text-espresso/60 dark:text-white/60 line-clamp-2 mb-4 leading-relaxed font-medium">{course.description}</p>
                )}
                <div className="flex items-center justify-between border-t border-espresso/5 pt-4">
                    <div className="flex items-center gap-4">
                        {course.duration && (
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-espresso/40">
                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                {course.duration}
                            </span>
                        )}
                        {course.level && (
                            <span className="px-3 py-1 rounded-full bg-espresso/5 border border-espresso/5 text-[10px] font-black uppercase tracking-widest text-espresso/60">
                                {course.level}
                            </span>
                        )}
                    </div>
                    <Link to={`/instructor/courses/${course.id}`} className="p-2 rounded-full bg-white/50 dark:bg-white/5 text-espresso/40 hover:text-espresso hover:bg-white transition-all">
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
