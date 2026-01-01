import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { GradientButton } from '../../../components/ui/GradientButton';

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
        <div className="container mx-auto max-w-6xl">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <Link
                        key={course.id}
                        to={`/admin/business/courses/${course.id}`}
                        className="group bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                        <div className="h-48 bg-gray-100 dark:bg-white/5 relative overflow-hidden">
                            {course.thumbnail ? (
                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-white/20">
                                    <span className="material-symbols-outlined text-6xl">menu_book</span>
                                </div>
                            )}
                            <div className="absolute top-2 right-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase backdrop-blur-md ${course.status === 'published'
                                        ? 'bg-green-500/80 text-white'
                                        : 'bg-yellow-500/80 text-white'
                                    }`}>
                                    {course.status}
                                </span>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="font-serif text-xl font-bold text-espresso dark:text-white mb-2 group-hover:text-primary transition-colors">
                                {course.title}
                            </h3>
                            <p className="text-espresso/70 dark:text-white/70 text-sm line-clamp-2">
                                {course.description}
                            </p>
                            <div className="mt-4 flex items-center text-sm text-primary font-medium">
                                Manage Content
                                <span className="material-symbols-outlined ml-1 text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </div>
                        </div>
                    </Link>
                ))}

                {courses.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                        <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-white/10 mb-4">library_books</span>
                        <h3 className="text-xl font-bold text-espresso dark:text-white mb-2">No Courses Yet</h3>
                        <p className="text-espresso/60 dark:text-white/60 mb-6">Start building your business curriculum today.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="text-primary font-bold hover:underline"
                        >
                            Create your first course
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
