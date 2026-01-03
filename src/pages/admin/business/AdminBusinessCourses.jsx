import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { GradientButton } from '../../../components/ui/GradientButton';
import { cn } from '../../../lib/utils';


export function AdminBusinessCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCourse, setNewCourse] = useState({
        title: '',
        description: '',
        thumbnail: ''
    });

    useEffect(() => {
        const q = query(collection(db, 'business_courses'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedCourses = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCourses(fetchedCourses);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'business_courses'), {
                ...newCourse,
                status: 'draft',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            setIsModalOpen(false);
            setNewCourse({ title: '', description: '', thumbnail: '' });
        } catch (error) {
            console.error("Error creating course:", error);
            alert("Failed to create course");
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="w-full px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-espresso dark:text-white">Manage Business Courses</h1>
                    <p className="text-espresso/60 dark:text-white/60 mt-1">Create and manage your exclusive business content</p>
                </div>
                <GradientButton onClick={() => setIsModalOpen(true)}>
                    <span className="material-symbols-outlined mr-2">add</span>
                    Create Course
                </GradientButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map(course => (
                    <Link
                        key={course.id}
                        to={`/admin/business/courses/${course.id}`}
                        className="group bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2rem] border border-espresso/10 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative"
                    >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/30 group-hover:bg-espresso transition-colors"></div>
                        <div className="h-52 bg-espresso/10 dark:bg-white/5 relative overflow-hidden">
                            {course.thumbnail ? (
                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-espresso/20 dark:text-white/20">
                                    <span className="material-symbols-outlined text-7xl">menu_book</span>
                                </div>
                            )}
                            <div className="absolute top-4 right-4">
                                <span className={cn(
                                    "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md",
                                    course.status === 'published'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-amber-500 text-white'
                                )}>
                                    {course.status}
                                </span>
                            </div>
                        </div>
                        <div className="p-7">
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-3 group-hover:text-primary transition-colors leading-tight">
                                {course.title}
                            </h3>
                            <p className="text-espresso/70 dark:text-white/70 text-sm line-clamp-2 font-medium leading-relaxed">
                                {course.description}
                            </p>
                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex items-center text-[10px] font-black text-espresso uppercase tracking-widest bg-white/40 px-3 py-2 rounded-xl border border-white/20">
                                    MANAGE CONTENT
                                    <span className="material-symbols-outlined ml-2 text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </div>
                                <div className="p-2 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-espresso">edit_note</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

                {courses.length === 0 && (
                    <div className="col-span-full py-24 text-center bg-[#F5DEB3]/50 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-espresso/10 dark:border-white/10">
                        <div className="w-20 h-20 bg-espresso/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-5xl text-espresso/40">library_books</span>
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-espresso dark:text-white mb-2">No Courses Yet</h3>
                        <p className="text-espresso/60 dark:text-white/60 mb-8 max-w-sm mx-auto font-medium">Start building your exclusive business curriculum and empower your students today.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-2 bg-espresso text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Create First Course
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-2xl font-serif font-bold text-espresso dark:text-white mb-6">Create New Course</h2>
                        <form onSubmit={handleCreateCourse} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-espresso/70 dark:text-white/70 mb-1">Course Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={newCourse.title}
                                    onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                                    placeholder="e.g., Business Planning 101"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-espresso/70 dark:text-white/70 mb-1">Description</label>
                                <textarea
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows="3"
                                    value={newCourse.description}
                                    onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                                    placeholder="Brief overview of the course..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-espresso/70 dark:text-white/70 mb-1">Thumbnail URL</label>
                                <input
                                    type="url"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={newCourse.thumbnail}
                                    onChange={e => setNewCourse({ ...newCourse, thumbnail: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 result pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-espresso/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-lg hover:shadow-primary/30 transition-all"
                                >
                                    Create Course
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

