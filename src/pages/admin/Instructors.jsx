import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

export function Instructors() {
    const [activeTab, setActiveTab] = useState('all');
    const [instructors, setInstructors] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showCourseAssignModal, setShowCourseAssignModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState(null);

    // Form states
    const [formData, setFormData] = useState({ name: '', email: '', password: '', status: 'active', tags: '' });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch instructors
            const instructorQuery = query(collection(db, 'users'), where('role', '==', 'instructor'));
            const instructorSnap = await getDocs(instructorQuery);
            const instructorData = instructorSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setInstructors(instructorData);

            // Fetch students for assignment
            const studentQuery = query(collection(db, 'users'), where('role', '==', 'student'));
            const studentSnap = await getDocs(studentQuery);
            const studentData = studentSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setStudents(studentData);

            // Fetch available courses
            const coursesSnap = await getDocs(collection(db, 'courses'));
            const coursesData = coursesSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setCourses(coursesData);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddInstructor = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');
        try {
            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const uid = userCredential.user.uid;

            // Create user document with instructor role
            const { setDoc } = await import('firebase/firestore');
            await setDoc(doc(db, 'users', uid), {
                name: formData.name,
                email: formData.email,
                role: 'instructor',
                status: formData.status,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                assignedStudentIds: [],
                assignedCourseIds: [],
                createdAt: serverTimestamp()
            });

            setShowAddModal(false);
            setFormData({ name: '', email: '', password: '', status: 'active', tags: '' });
            fetchData();
        } catch (err) {
            console.error('Error adding instructor:', err);
            setFormError(err.message || 'Failed to add instructor');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditInstructor = async (e) => {
        e.preventDefault();
        if (!selectedInstructor) return;
        setFormLoading(true);
        setFormError('');
        try {
            await updateDoc(doc(db, 'users', selectedInstructor.id), {
                name: formData.name,
                status: formData.status,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
            });
            setShowEditModal(false);
            setSelectedInstructor(null);
            fetchData();
        } catch (err) {
            console.error('Error updating instructor:', err);
            setFormError(err.message || 'Failed to update instructor');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteInstructor = async () => {
        if (!selectedInstructor) return;
        setFormLoading(true);
        try {
            await deleteDoc(doc(db, 'users', selectedInstructor.id));
            setShowDeleteConfirm(false);
            setSelectedInstructor(null);
            fetchData();
        } catch (err) {
            console.error('Error deleting instructor:', err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleAssignStudents = async (studentIds) => {
        if (!selectedInstructor) return;
        setFormLoading(true);
        try {
            await updateDoc(doc(db, 'users', selectedInstructor.id), {
                assignedStudentIds: studentIds
            });
            // Also update each student with instructorId
            // Note: This simple approach overwrites previous instructor. 
            // For a more complex system where students have multiple instructors, this would need logic change.
            for (const sid of studentIds) {
                await updateDoc(doc(db, 'users', sid), { instructorId: selectedInstructor.id });
            }
            setShowAssignModal(false);
            setSelectedInstructor(null);
            fetchData();
        } catch (err) {
            console.error('Error assigning students:', err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleAssignCourses = async (courseIds) => {
        if (!selectedInstructor) return;
        setFormLoading(true);
        try {
            await updateDoc(doc(db, 'users', selectedInstructor.id), {
                assignedCourseIds: courseIds
            });
            setShowCourseAssignModal(false);
            setSelectedInstructor(null);
            fetchData();
        } catch (err) {
            console.error('Error assigning courses:', err);
        } finally {
            setFormLoading(false);
        }
    };

    const openEditModal = (instructor) => {
        setSelectedInstructor(instructor);
        setFormData({
            name: instructor.name || '',
            email: instructor.email || '',
            password: '',
            status: instructor.status || 'active',
            tags: (instructor.tags || []).join(', ')
        });
        setShowEditModal(true);
    };

    const openAssignModal = (instructor) => {
        setSelectedInstructor(instructor);
        setShowAssignModal(true);
    };

    const openCourseAssignModal = (instructor) => {
        setSelectedInstructor(instructor);
        setShowCourseAssignModal(true);
    };

    const openDeleteConfirm = (instructor) => {
        setSelectedInstructor(instructor);
        setShowDeleteConfirm(true);
    };

    const filteredInstructors = instructors.filter(i => {
        const matchesTab = activeTab === 'all' || i.status === activeTab;
        const matchesSearch =
            (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (i.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-espresso dark:text-white text-2xl font-serif font-bold">Instructors</h2>
                <button
                    onClick={() => { setFormData({ name: '', email: '', password: '', status: 'active', tags: '' }); setShowAddModal(true); }}
                    className="flex items-center justify-center rounded-full bg-primary text-white h-10 w-10 shadow-sm hover:bg-primary/90 transition-colors"
                >
                    <span className="material-symbols-outlined text-[24px]">add</span>
                </button>
            </div>

            {/* Search & Filters */}
            <div className="space-y-4">
                <div className="flex gap-3">
                    <div className="flex w-full flex-1 items-stretch rounded-xl h-12 shadow-sm bg-white dark:bg-[#2c2825] border border-black/5">
                        <div className="text-primary/60 flex items-center justify-center pl-4">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input
                            className="flex w-full min-w-0 flex-1 bg-transparent text-espresso dark:text-white focus:outline-0 border-none h-full placeholder:text-espresso/50 dark:placeholder:text-white/50 px-3 text-base"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {['all', 'active', 'on_leave'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 shadow-sm transition-colors",
                                activeTab === tab ? 'bg-primary text-white' : 'bg-white dark:bg-[#2c2825] border border-primary/20 text-espresso dark:text-white'
                            )}
                        >
                            <span className="text-sm font-medium capitalize">{tab === 'all' ? 'All Instructors' : tab.replace('_', ' ')}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading / Empty / List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></span>
                </div>
            ) : filteredInstructors.length === 0 ? (
                <div className="text-center py-12 text-espresso/60 dark:text-white/60">No instructors found.</div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredInstructors.map((instructor) => (
                        <div key={instructor.id} className={cn("bg-white dark:bg-[#2c2825] rounded-xl p-4 shadow-sm border border-primary/5", instructor.status === 'on_leave' && 'opacity-80')}>
                            <div className="flex items-start gap-4">
                                <div className="relative shrink-0">
                                    <div
                                        className={cn("bg-center bg-no-repeat bg-cover rounded-full h-16 w-16 border-2 border-background-light shadow-sm", instructor.status === 'on_leave' && 'grayscale')}
                                        style={{ backgroundImage: `url("${instructor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name || 'I')}&background=random`}")` }}
                                    />
                                    <div className={cn("absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white", instructor.status === 'active' ? 'bg-green-500' : 'bg-amber-400')} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-espresso dark:text-white text-lg font-serif font-bold">{instructor.name || instructor.email}</h3>
                                            <p className="text-espresso/70 dark:text-white/70 text-sm">{instructor.email}</p>
                                            <div className="flex gap-3 text-xs text-espresso/50 dark:text-white/50 mt-1">
                                                <span>{(instructor.assignedStudentIds || []).length} student(s)</span>
                                                <span>•</span>
                                                <span>{(instructor.assignedCourseIds || []).length} course(s)</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => openCourseAssignModal(instructor)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-primary" title="Assign Courses">
                                                <span className="material-symbols-outlined text-[20px]">menu_book</span>
                                            </button>
                                            <button onClick={() => openAssignModal(instructor)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-primary" title="Assign Students">
                                                <span className="material-symbols-outlined text-[20px]">group_add</span>
                                            </button>
                                            <button onClick={() => openEditModal(instructor)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-espresso/60 dark:text-white/60" title="Edit">
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            <button onClick={() => openDeleteConfirm(instructor)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-red-500" title="Delete">
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {(instructor.tags || []).map(tag => (
                                            <span key={tag} className="inline-flex items-center rounded-md bg-background-light dark:bg-white/5 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/10">{tag}</span>
                                        ))}
                                        {instructor.status === 'on_leave' && (
                                            <span className="inline-flex items-center rounded-md bg-amber-100 text-amber-800 px-2 py-1 text-xs font-medium">On Leave</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white dark:bg-[#2c2825] rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-espresso dark:text-white mb-4">Add Instructor</h3>
                        <form onSubmit={handleAddInstructor} className="space-y-4">
                            <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white" />
                            <input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white" />
                            <input type="password" placeholder="Password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white" />
                            <input type="text" placeholder="Tags (comma separated)" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white" />
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white">
                                <option value="active">Active</option>
                                <option value="on_leave">On Leave</option>
                            </select>
                            {formError && <p className="text-red-500 text-sm">{formError}</p>}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 rounded-full border border-black/10 dark:border-white/10 text-espresso dark:text-white">Cancel</button>
                                <button type="submit" disabled={formLoading} className="flex-1 py-2 rounded-full bg-primary text-white font-medium disabled:opacity-50">{formLoading ? 'Adding...' : 'Add Instructor'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedInstructor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white dark:bg-[#2c2825] rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-espresso dark:text-white mb-4">Edit Instructor</h3>
                        <form onSubmit={handleEditInstructor} className="space-y-4">
                            <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white" />
                            <input type="text" placeholder="Tags (comma separated)" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white" />
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white">
                                <option value="active">Active</option>
                                <option value="on_leave">On Leave</option>
                            </select>
                            {formError && <p className="text-red-500 text-sm">{formError}</p>}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 rounded-full border border-black/10 dark:border-white/10 text-espresso dark:text-white">Cancel</button>
                                <button type="submit" disabled={formLoading} className="flex-1 py-2 rounded-full bg-primary text-white font-medium disabled:opacity-50">{formLoading ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Students Modal */}
            {showAssignModal && selectedInstructor && (
                <AssignStudentsModal
                    instructor={selectedInstructor}
                    students={students}
                    onClose={() => setShowAssignModal(false)}
                    onAssign={handleAssignStudents}
                    loading={formLoading}
                />
            )}

            {/* Assign Courses Modal */}
            {showCourseAssignModal && selectedInstructor && (
                <AssignCoursesModal
                    instructor={selectedInstructor}
                    courses={courses}
                    onClose={() => setShowCourseAssignModal(false)}
                    onAssign={handleAssignCourses}
                    loading={formLoading}
                />
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && selectedInstructor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white dark:bg-[#2c2825] rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-espresso dark:text-white mb-2">Delete Instructor?</h3>
                        <p className="text-espresso/70 dark:text-white/70 mb-4">Are you sure you want to delete {selectedInstructor.name || selectedInstructor.email}? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 rounded-full border border-black/10 dark:border-white/10 text-espresso dark:text-white">Cancel</button>
                            <button onClick={handleDeleteInstructor} disabled={formLoading} className="flex-1 py-2 rounded-full bg-red-500 text-white font-medium disabled:opacity-50">{formLoading ? 'Deleting...' : 'Delete'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Assign Students Modal Component
function AssignStudentsModal({ instructor, students, onClose, onAssign, loading }) {
    const [selected, setSelected] = useState(instructor.assignedStudentIds || []);
    const [filter, setFilter] = useState('');

    const toggleStudent = (sid) => {
        setSelected(prev => prev.includes(sid) ? prev.filter(id => id !== sid) : [...prev, sid]);
    };

    const filteredStudents = students.filter(s =>
        (s.name || '').toLowerCase().includes(filter.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white dark:bg-[#2c2825] rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-espresso dark:text-white mb-4">Assign Students</h3>
                <input
                    type="text"
                    placeholder="Filter students..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full px-4 py-2 mb-4 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white text-sm"
                />
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                    {filteredStudents.length === 0 ? (
                        <p className="text-espresso/60 dark:text-white/60">No students found.</p>
                    ) : (
                        filteredStudents.map(student => (
                            <label key={student.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(student.id)}
                                    onChange={() => toggleStudent(student.id)}
                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <div>
                                    <p className="font-medium text-espresso dark:text-white">{student.name || student.email}</p>
                                    <p className="text-xs text-espresso/60 dark:text-white/60">{student.email}</p>
                                </div>
                            </label>
                        ))
                    )}
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 rounded-full border border-black/10 dark:border-white/10 text-espresso dark:text-white">Cancel</button>
                    <button onClick={() => onAssign(selected)} disabled={loading} className="flex-1 py-2 rounded-full bg-primary text-white font-medium disabled:opacity-50">{loading ? 'Saving...' : `Assign ${selected.length} Student(s)`}</button>
                </div>
            </div>
        </div>
    );
}

// Assign Courses Modal Component
function AssignCoursesModal({ instructor, courses, onClose, onAssign, loading }) {
    const [selected, setSelected] = useState(instructor.assignedCourseIds || []);

    const toggleCourse = (cid) => {
        setSelected(prev => prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white dark:bg-[#2c2825] rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-espresso dark:text-white mb-4">Assign Courses</h3>
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                    {courses.length === 0 ? (
                        <p className="text-espresso/60 dark:text-white/60">No courses available.</p>
                    ) : (
                        courses.map(course => (
                            <label key={course.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(course.id)}
                                    onChange={() => toggleCourse(course.id)}
                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <div className="flex items-center gap-3">
                                    {course.thumbnail && (
                                        <img src={course.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
                                    )}
                                    <div>
                                        <p className="font-medium text-espresso dark:text-white">{course.title || 'Untitled Course'}</p>
                                        <p className="text-xs text-espresso/60 dark:text-white/60">{course.status}</p>
                                    </div>
                                </div>
                            </label>
                        ))
                    )}
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 rounded-full border border-black/10 dark:border-white/10 text-espresso dark:text-white">Cancel</button>
                    <button onClick={() => onAssign(selected)} disabled={loading} className="flex-1 py-2 rounded-full bg-primary text-white font-medium disabled:opacity-50">{loading ? 'Saving...' : `Assign ${selected.length} Course(s)`}</button>
                </div>
            </div>
        </div>
    );
}
