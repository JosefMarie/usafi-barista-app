import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function StudentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    // State
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        fullName: '',
        phone: '',
        status: '',
        course: ''
    });

    // Fetch Student Data
    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const docRef = doc(db, 'users', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setStudent({ id: docSnap.id, ...data });
                    setEditForm({
                        fullName: data.fullName || data.name || '',
                        phone: data.phone || '',
                        status: data.status || 'pending',
                        course: data.course || ''
                    });
                } else {
                    setError('Student not found');
                }
            } catch (err) {
                console.error("Error fetching student:", err);
                setError('Failed to load student data');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchStudent();
    }, [id]);

    // Update Handler
    const handleUpdate = async () => {
        try {
            setLoading(true);
            const docRef = doc(db, 'users', id);
            await updateDoc(docRef, {
                fullName: editForm.fullName,
                phone: editForm.phone,
                status: editForm.status,
                course: editForm.course,
                updatedAt: serverTimestamp()
            });

            // Update local state
            setStudent(prev => ({ ...prev, ...editForm }));
            setIsEditing(false);
            // Optional: Add toast success here
        } catch (err) {
            console.error("Error updating student:", err);
            setError("Failed to update student");
        } finally {
            setLoading(false);
        }
    };

    // Delete Handler
    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) return;

        try {
            setLoading(true);
            await deleteDoc(doc(db, 'users', id));
            navigate('/admin/students');
        } catch (err) {
            console.error("Error deleting student:", err);
            setError("Failed to delete student");
            setLoading(false);
        }
    };

    if (loading && !student) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!student) return <div className="p-8 text-center">Student not found</div>;

    const displayName = student.fullName || student.name || student.email;
    const avatarUrl = student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

    return (
        <div className="max-w-3xl mx-auto bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl overflow-hidden min-h-screen md:min-h-0 animate-fade-in relative">

            {/* Loading Overlay for Actions */}
            {loading && student && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-50 flex items-center justify-center">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                </div>
            )}

            {/* Top Bar / Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5">
                <Link to="/admin/students" className="flex items-center gap-2 text-primary hover:underline">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back to Students
                </Link>
                {isEditing ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdate}
                            className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm"
                        >
                            Save Changes
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleDelete}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full"
                            title="Delete Student"
                        >
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Profile Header */}
            <div className="flex flex-col items-center pt-8 pb-6 px-4">
                <div className="relative group">
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-32 w-32 shadow-lg border-4 border-white dark:border-[#2c2825] bg-gray-200"
                        style={{ backgroundImage: `url("${avatarUrl}")` }}>
                    </div>
                    <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white dark:border-[#1e1e1e] ${student.status === 'active' ? 'bg-green-500' :
                        student.status === 'graduated' ? 'bg-indigo-500' :
                            student.status === 'suspended' ? 'bg-red-500' :
                                'bg-yellow-500'
                        }`}
                        title={student.status}>
                    </div>
                </div>

                {isEditing ? (
                    <div className="mt-6 w-full max-w-sm space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                            <input
                                type="text"
                                value={editForm.fullName}
                                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                            <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-white"
                            >
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended (Payment)</option>
                                <option value="graduated">Graduated</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                            <input
                                type="text"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-white"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 flex flex-col items-center justify-center text-center w-full">
                        <h1 className="text-espresso dark:text-white text-2xl font-bold leading-tight font-serif">
                            {displayName}
                        </h1>
                        <p className="text-primary font-medium text-sm mt-1 uppercase tracking-wider">{student.role || 'Student'}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 w-full max-w-lg text-left bg-gray-50 dark:bg-white/5 p-6 rounded-xl border border-gray-100 dark:border-white/5">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Contact Info</h4>
                                <div className="space-y-2 text-sm text-espresso/80 dark:text-white/80">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base opacity-70">mail</span>
                                        <a href={`mailto:${student.email}`} className="hover:text-primary transition-colors truncate">{student.email}</a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base opacity-70">call</span>
                                        <a href={`tel:${student.phone}`} className="hover:text-primary transition-colors">{student.phone || 'N/A'}</a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base opacity-70">location_on</span>
                                        <span>{student.residence || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Enrollment Details</h4>
                                <div className="space-y-2 text-sm text-espresso/80 dark:text-white/80">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base opacity-70">school</span>
                                        <span className="font-medium capitalize">{student.course || 'No Course'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base opacity-70">menu_book</span>
                                        <span className={`capitalize ${student.studyMethod === 'online' ? 'text-blue-500' : 'text-amber-600'} font-medium`}>
                                            {student.studyMethod === 'online' ? 'E-Learning (Online)' : 'Onsite (In-Person)'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base opacity-70">event</span>
                                        {student.studyMethod === 'onsite' ? (
                                            <span className="font-mono bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded text-xs">
                                                {student.shift ? student.shift.replace('-', ' ').toUpperCase() : 'NO SHIFT'}
                                            </span>
                                        ) : (
                                            <span>Start: {student.startDate || 'Not set'}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs opacity-70">
                                        <span className="material-symbols-outlined text-base">campaign</span>
                                        <span>Heard via: {student.referral || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${student.status === 'active' ? 'bg-green-100 text-green-700' :
                                student.status === 'graduated' ? 'bg-indigo-100 text-indigo-700' :
                                    student.status === 'suspended' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                }`}>
                                {student.status}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            {!isEditing && (
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 space-y-3">
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={() => window.location.href = `mailto:${student.email}`}
                            className="flex-1 flex items-center justify-center gap-2 h-11 px-4 bg-primary text-white text-sm font-bold rounded-lg shadow-md hover:bg-primary/90 transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">chat</span>
                            Message
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex-1 flex items-center justify-center gap-2 h-11 px-4 bg-white dark:bg-white/10 border border-primary/30 text-primary dark:text-white text-sm font-bold rounded-lg shadow-sm hover:bg-primary/5 transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                            Edit Info
                        </button>
                    </div>

                    {/* Status Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Suspend / Resume (Payment) */}
                        {student.status === 'suspended' ? (
                            <button
                                onClick={async () => {
                                    if (window.confirm('Resume this student? They will regain access.')) {
                                        setEditForm(prev => ({ ...prev, status: 'active' }));
                                        // Quick inline update
                                        await updateDoc(doc(db, 'users', id), { status: 'active' });
                                        setStudent(prev => ({ ...prev, status: 'active' }));
                                    }
                                }}
                                className="col-span-1 flex items-center justify-center gap-2 h-10 px-4 bg-green-100 text-green-700 hover:bg-green-200 text-xs font-bold rounded-lg transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                                Resume Course
                            </button>
                        ) : (
                            <button
                                onClick={async () => {
                                    if (window.confirm('Suspend this student for non-payment? They will lose dashboard access.')) {
                                        setEditForm(prev => ({ ...prev, status: 'suspended' }));
                                        await updateDoc(doc(db, 'users', id), { status: 'suspended' });
                                        setStudent(prev => ({ ...prev, status: 'suspended' }));
                                    }
                                }}
                                className="col-span-1 flex items-center justify-center gap-2 h-10 px-4 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 text-xs font-bold rounded-lg transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">pause</span>
                                Suspend (Payment)
                            </button>
                        )}

                        {/* Graduate / Reactivate */}
                        {student.status === 'graduated' ? (
                            <button
                                onClick={async () => {
                                    if (window.confirm('Reactivate this graduated student? They will show as Active.')) {
                                        setEditForm(prev => ({ ...prev, status: 'active' }));
                                        await updateDoc(doc(db, 'users', id), { status: 'active' });
                                        setStudent(prev => ({ ...prev, status: 'active' }));
                                    }
                                }}
                                className="col-span-1 flex items-center justify-center gap-2 h-10 px-4 bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs font-bold rounded-lg transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">replay</span>
                                Reactivate
                            </button>
                        ) : (
                            <button
                                onClick={async () => {
                                    if (window.confirm('Mark this student as Graduated? This indicates course completion.')) {
                                        setEditForm(prev => ({ ...prev, status: 'graduated' }));
                                        await updateDoc(doc(db, 'users', id), { status: 'graduated' });
                                        setStudent(prev => ({ ...prev, status: 'graduated' }));
                                    }
                                }}
                                className="col-span-1 flex items-center justify-center gap-2 h-10 px-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs font-bold rounded-lg transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">school</span>
                                Mark Graduated
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Data Grids (Placeholders for Future Data) */}
            <div className="px-6 py-6 space-y-6 opacity-60 pointer-events-none filter grayscale">
                <div>
                    <h3 className="text-espresso dark:text-white text-lg font-bold font-serif mb-3">Enrolled Courses (Coming Soon)</h3>
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 text-center text-sm">
                        No active course data available.
                    </div>
                </div>
                <div>
                    <h3 className="text-espresso dark:text-white text-lg font-bold font-serif mb-3">Recent Activity (Coming Soon)</h3>
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 text-center text-sm">
                        No activity logs available.
                    </div>
                </div>
            </div>

        </div>
    );
}
