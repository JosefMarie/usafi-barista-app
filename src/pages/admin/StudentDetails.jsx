import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, orderBy, limit, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export function StudentDetails() {
    const { user: authUser } = useAuth();
    const isAdmin = authUser?.role === 'admin';
    const backPath = isAdmin ? '/admin/students' : '/instructor/students';
    const { id } = useParams();
    const navigate = useNavigate();

    // State
    const [student, setStudent] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [progressStats, setProgressStats] = useState({ percent: 0, completed: 0, total: 0 });
    const [interactions, setInteractions] = useState([]);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        fullName: '',
        phone: '',
        status: '',
        course: '',
        courseId: '',
        totalFee: 0,
        amountPaid: 0
    });

    // Fetch Student Data & Courses
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Student Core Data
                const docRef = doc(db, 'users', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.id ? { id: docSnap.id, ...docSnap.data() } : docSnap.data();
                    setStudent(data);
                    setEditForm({
                        fullName: data.fullName || data.name || '',
                        phone: data.phone || '',
                        status: data.status || 'pending',
                        course: data.course || '',
                        courseId: data.courseId || 'bean-to-brew',
                        totalFee: data.totalFee || ((data.courseId === 'bean-to-brew' || (data.enrolledCourses && data.enrolledCourses.some(c => c.courseId === 'bean-to-brew'))) ? 200000 : 0),
                        amountPaid: data.amountPaid || 0
                    });

                    // 2. Fetch All Courses (for transfer)
                    const coursesSnap = await getDocs(collection(db, 'courses'));
                    const coursesList = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setCourses(coursesList);

                    // 3. Fetch Progress and Calculate Deployment Matrix (Real-time)
                    // We now calculate progress across ALL enrolled courses
                    const enrolledCourses = data.enrolledCourses || (data.courseId ? [{ courseId: data.courseId, status: data.status || 'active' }] : [{ courseId: 'bean-to-brew', status: 'active' }]);

                    let totalModulesCombined = 0;
                    let completedModulesCombined = 0;

                    // Fetch progress documents once
                    const progressRef = collection(db, 'users', id, 'progress');
                    getDocs(progressRef).then(async pSnap => {
                        const allProgress = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                        const completedIds = new Set(allProgress.filter(p => p.passed).map(p => p.moduleId || p.id));

                        for (const enrolled of enrolledCourses) {
                            if (enrolled.status !== 'active') continue;
                            const modulesRef = collection(db, 'courses', enrolled.courseId, 'modules');
                            const mSnap = await getDocs(modulesRef);
                            totalModulesCombined += mSnap.size;

                            // Check which of these specific modules are completed
                            mSnap.forEach(mDoc => {
                                if (completedIds.has(mDoc.id)) {
                                    completedModulesCombined++;
                                }
                            });
                        }

                        setProgressStats({
                            percent: totalModulesCombined > 0 ? Math.round((completedModulesCombined / totalModulesCombined) * 100) : 0,
                            completed: completedModulesCombined,
                            total: totalModulesCombined
                        });
                    });

                    // 4. Fetch Recent Interactions (Logs for this specific student)
                    const interactionsRef = collection(db, 'activity');
                    const qInteractions = query(
                        interactionsRef,
                        where('userId', '==', id),
                        limit(50)
                    );
                    const intSnap = await getDocs(qInteractions);
                    const logData = intSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                    logData.sort((a, b) => {
                        const timeA = a.timestamp?.toMillis?.() || 0;
                        const timeB = b.timestamp?.toMillis?.() || 0;
                        return timeB - timeA;
                    });

                    setInteractions(logData.slice(0, 5));

                } else {
                    setError('Student not found in registry');
                }
            } catch (err) {
                console.error("Error fetching student details:", err);
                setError(`Portal Data Failure: ${err.message || 'Unknown protocol error'}`);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    // Update Handler
    const handleUpdate = async () => {
        try {
            setLoading(true);
            const docRef = doc(db, 'users', id);

            // In edit mode we just update the global status and phone for now
            // Detailed course status is handled individually below.

            // To maintain backward compatibility with old course/courseId field we just update them if needed, but primarily rely on enrolledCourses

            await updateDoc(docRef, {
                fullName: editForm.fullName,
                phone: editForm.phone,
                status: editForm.status,
                totalFee: Number(editForm.totalFee) || 0,
                amountPaid: Number(editForm.amountPaid) || 0,
                updatedAt: serverTimestamp()
            });

            // Log activity
            await addDoc(collection(db, 'activity'), {
                userId: id,
                userName: student.fullName || student.name || student.email,
                adminId: authUser?.uid || 'current-admin',
                action: `Updated profile schema for ${student.fullName}`,
                type: 'admin_edit',
                icon: 'edit_note',
                timestamp: serverTimestamp()
            });

            // Update local state
            setStudent(prev => ({ ...prev, ...editForm }));
            setIsEditing(false);

        } catch (err) {
            console.error("Error updating student:", err);
            setError("Failed to update student");
        } finally {
            setLoading(false);
        }
    };

    const handleCourseStatusChange = async (courseId, newStatus) => {
        try {
            const currentEnrolled = student.enrolledCourses || [];
            const updatedEnrolled = currentEnrolled.map(c =>
                c.courseId === courseId ? { ...c, status: newStatus } : c
            );

            await updateDoc(doc(db, 'users', id), {
                enrolledCourses: updatedEnrolled
            });

            setStudent(prev => ({ ...prev, enrolledCourses: updatedEnrolled }));

            // Log interaction
            const courseTitle = courses.find(c => c.id === courseId)?.title || courseId;
            await addDoc(collection(db, 'activity'), {
                userId: id,
                userName: student.fullName || student.name,
                adminId: authUser?.uid || 'admin',
                action: `Program status changed: ${courseTitle} -> ${newStatus.toUpperCase()}`,
                type: 'enrollment_update',
                icon: 'auto_stories',
                timestamp: serverTimestamp()
            });

        } catch (err) {
            console.error("Error updating course status:", err);
            alert("Failed to update course status.");
        }
    };

    // Delete Handler
    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this student? They can re-enroll with the same email later.")) return;

        try {
            setLoading(true);
            // Soft delete: Set status to 'deleted' instead of removing the document
            await updateDoc(doc(db, 'users', id), {
                status: 'deleted',
                deletedAt: serverTimestamp()
            });
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
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-20">
            <div className=" w-full px-2 py-10">
                {/* Header / Back Navigation */}
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-6 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-4 md:-ml-10"></div>
                    <div className="flex items-center gap-4 md:gap-6">
                        <button
                            onClick={() => navigate(backPath)}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/40 hover:bg-espresso hover:text-white transition-all flex items-center justify-center active:scale-95 shadow-sm group shrink-0"
                        >
                            <span className="material-symbols-outlined text-[20px] md:text-[24px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Participant Dossier</h1>
                            <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-1 md:mt-2">Node: {student.id.slice(0, 8)} // SECURITY PROTOCOL ALPHA</p>
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-4">
                            {isEditing ? (
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-white/40 text-espresso text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl border border-espresso/10 hover:bg-espresso hover:text-white transition-all active:scale-95 shadow-sm"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        className="flex-1 md:flex-none px-6 md:px-8 py-2.5 md:py-3 bg-espresso text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        Commit Changes
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleDelete}
                                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center active:scale-95 shadow-sm group ml-auto md:ml-0"
                                    title="Decommission Node"
                                >
                                    <span className="material-symbols-outlined text-[20px] md:text-[24px]">delete</span>
                                </button>
                            )}
                        </div>
                    )}
                </header>

                <main className="space-y-10">
                    {/* Profile Card */}
                    <div className="bg-white/40 dark:bg-black/20 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-2xl border border-espresso/10 relative overflow-hidden group/main">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-espresso/5 group-hover/main:bg-espresso transition-colors"></div>

                        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center gap-4 md:gap-6 shrink-0">
                                <div className="relative group/avatar">
                                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-4 border-white/60 shadow-2xl relative">
                                        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110" />
                                        {loading && (
                                            <div className="absolute inset-0 bg-espresso/40 backdrop-blur-sm flex items-center justify-center">
                                                <span className="material-symbols-outlined animate-spin text-3xl md:text-4xl text-white">progress_activity</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 rounded-full border-2 md:border-4 border-[#F5DEB3] dark:border-[#1c1916] shadow-xl ${student.status === 'active' ? 'bg-green-500' :
                                        student.status === 'graduated' ? 'bg-indigo-500' :
                                            student.status === 'suspended' ? 'bg-red-500' :
                                                'bg-amber-400'
                                        }`}></div>
                                </div>
                                <span className="text-[8px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.4em]">Integrated Registry Entry</span>
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 space-y-10">
                                {isEditing ? (
                                    <div className="space-y-6 md:space-y-8">
                                        <div>
                                            <label className="block text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-2 md:mb-3 ml-1">Identity Tag</label>
                                            <input
                                                className="w-full text-xl md:text-3xl font-serif font-black bg-white/40 border border-espresso/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 focus:outline-none focus:ring-2 focus:ring-espresso transition-all shadow-inner text-espresso"
                                                value={editForm.fullName}
                                                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                                            <div>
                                                <label className="block text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-2 md:mb-3 ml-1">Operational Status</label>
                                                <select
                                                    className="w-full p-3 md:p-4 bg-white/40 border border-espresso/10 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-espresso text-espresso font-black uppercase tracking-widest text-[9px] md:text-[10px]"
                                                    value={editForm.status}
                                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                                >
                                                    <option value="pending">PENDING PROTOCOL</option>
                                                    <option value="active">ACTIVE OPERATION</option>
                                                    <option value="suspended">SUSPENDED (BILLING)</option>
                                                    <option value="graduated">VALIDATED ALUMNUS</option>
                                                </select>
                                            </div>
                                            {/* Course assignment moved to separate section below */}
                                            <div>
                                                <label className="block text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-2 md:mb-3 ml-1">Comms Frequency</label>
                                                <input
                                                    className="w-full p-3 md:p-4 bg-white/40 border border-espresso/10 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-espresso text-espresso font-black uppercase tracking-widest text-[9px] md:text-[10px]"
                                                    value={editForm.phone}
                                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-2 md:mb-3 ml-1">Total Course Fee (RWF)</label>
                                                <input
                                                    type="number"
                                                    className="w-full p-3 md:p-4 bg-white/40 border border-espresso/10 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-espresso text-espresso font-black uppercase tracking-widest text-[9px] md:text-[10px]"
                                                    value={editForm.totalFee}
                                                    onChange={(e) => setEditForm({ ...editForm, totalFee: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-2 md:mb-3 ml-1">Amount Paid (RWF)</label>
                                                <input
                                                    type="number"
                                                    className="w-full p-3 md:p-4 bg-white/40 border border-espresso/10 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-espresso text-espresso font-black uppercase tracking-widest text-[9px] md:text-[10px]"
                                                    value={editForm.amountPaid}
                                                    onChange={(e) => setEditForm({ ...editForm, amountPaid: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8 md:space-y-10">
                                        <div className="text-center lg:text-left">
                                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-black text-espresso dark:text-white leading-tight tracking-tight break-words">
                                                {displayName}
                                            </h2>
                                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-4">
                                                <span className="bg-espresso text-white text-[8px] md:text-[9px] font-black px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg uppercase tracking-[0.2em]">{student.role || 'PARTICIPANT'}</span>
                                                <span className="text-espresso/20 font-black tracking-widest text-[9px] md:text-[10px] uppercase">OPERATIONAL NODE ALPHA</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                                            <div className="space-y-4 md:space-y-6">
                                                <h4 className="text-[8px] md:text-[10px] font-black text-espresso/40 uppercase tracking-[0.4em] flex items-center gap-3">
                                                    <span className="w-6 md:w-8 h-px bg-espresso/20"></span>
                                                    Transmission Array
                                                </h4>
                                                <div className="space-y-3 md:space-y-4">
                                                    <div className="flex items-center gap-3 md:gap-4 group/info">
                                                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-espresso/5 flex items-center justify-center text-espresso/40 group-hover/info:bg-espresso group-hover/info:text-white transition-all shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px] md:text-[20px]">mail</span>
                                                        </div>
                                                        <a href={`mailto:${student.email}`} className="text-xs md:text-sm font-black text-espresso/80 hover:text-espresso transition-colors font-serif truncate min-w-0">{student.email}</a>
                                                    </div>
                                                    <div className="flex items-center gap-3 md:gap-4 group/info">
                                                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-espresso/5 flex items-center justify-center text-espresso/40 group-hover/info:bg-espresso group-hover/info:text-white transition-all shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px] md:text-[20px]">call</span>
                                                        </div>
                                                        <span className="text-xs md:text-sm font-black text-espresso/80 font-serif">{student.phone || 'DATA MISSING'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 md:gap-4 group/info">
                                                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-espresso/5 flex items-center justify-center text-espresso/40 group-hover/info:bg-espresso group-hover/info:text-white transition-all shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px] md:text-[20px]">location_on</span>
                                                        </div>
                                                        <span className="text-xs md:text-sm font-black text-espresso/80 font-serif break-words">{student.residence || 'UNLOCATED NODE'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4 md:space-y-6">
                                                <h4 className="text-[8px] md:text-[10px] font-black text-espresso/40 uppercase tracking-[0.4em] flex items-center gap-3">
                                                    <span className="w-6 md:w-8 h-px bg-espresso/20"></span>
                                                    Structural Schema
                                                </h4>
                                                <div className="space-y-3 md:space-y-4">
                                                    <div className="flex items-center gap-3 md:gap-4 group/info">
                                                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-espresso/5 flex items-center justify-center text-espresso/40 group-hover/info:bg-espresso group-hover/info:text-white transition-all shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px] md:text-[20px]">school</span>
                                                        </div>
                                                        <span className="text-xs md:text-sm font-black text-espresso uppercase tracking-widest break-words">
                                                            {student.enrolledCourses ? `${student.enrolledCourses.length} Programs` : (student.course || 'FLUID SELECTION')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 md:gap-4 group/info">
                                                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-espresso/5 flex items-center justify-center text-espresso/40 group-hover/info:bg-espresso group-hover/info:text-white transition-all shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px] md:text-[20px]">hub</span>
                                                        </div>
                                                        <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${student.studyMethod === 'online' ? 'text-blue-600' : 'text-amber-600'}`}>
                                                            {student.studyMethod === 'online' ? 'PROTOCOL: DIGITAL' : 'PROTOCOL: ANALOG'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 md:gap-4 group/info">
                                                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-espresso/5 flex items-center justify-center text-espresso/40 group-hover/info:bg-espresso group-hover/info:text-white transition-all shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px] md:text-[20px]">event</span>
                                                        </div>
                                                        <span className="text-[9px] md:text-[10px] font-black text-espresso/60 uppercase tracking-widest">
                                                            {student.studyMethod === 'onsite' ? (student.shift || 'NO SHIFT MATRIX').toUpperCase() : `DEPLOYED: ${student.startDate || 'TBD'}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Hub */}
                    {!isEditing && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            <button
                                onClick={() => window.location.href = `mailto:${student.email}`}
                                className="flex flex-col items-center gap-3 md:gap-4 p-6 md:p-8 bg-espresso text-white rounded-[1.5rem] md:rounded-[2rem] shadow-2xl hover:-translate-y-1 transition-all active:scale-95 group/btn"
                            >
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-espresso transition-all">
                                    <span className="material-symbols-outlined text-2xl md:text-3xl">chat</span>
                                </div>
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">Initialize Comms</span>
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex flex-col items-center gap-3 md:gap-4 p-6 md:p-8 bg-white/40 dark:bg-black/20 border border-espresso/10 text-espresso dark:text-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl hover:-translate-y-1 transition-all active:scale-95 group/btn"
                                >
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-espresso flex items-center justify-center text-white transition-all group-hover/btn:scale-110">
                                        <span className="material-symbols-outlined text-2xl md:text-3xl">edit_note</span>
                                    </div>
                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">Modify Schema</span>
                                </button>
                            )}
                            <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
                                {isAdmin && (
                                    student.status === 'suspended' ? (
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Resume this student? They will regain access.')) {
                                                    await updateDoc(doc(db, 'users', id), { status: 'active' });
                                                    setStudent(prev => ({ ...prev, status: 'active' }));

                                                    await addDoc(collection(db, 'activity'), {
                                                        userId: id,
                                                        userName: student.fullName || student.name || student.email,
                                                        action: `Resumed operational node: ${student.fullName}`,
                                                        type: 'admin_resume',
                                                        icon: 'play_circle',
                                                        timestamp: serverTimestamp()
                                                    });
                                                }
                                            }}
                                            className="h-full flex items-center justify-center gap-4 p-4 bg-green-500 text-white rounded-xl md:rounded-[2rem] shadow-xl hover:bg-green-600 active:scale-95 transition-all group/btn min-h-[5rem]"
                                        >
                                            <span className="material-symbols-outlined text-3xl">play_circle</span>
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Resume Node</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Suspend this student for non-payment? They will lose dashboard access.')) {
                                                    await updateDoc(doc(db, 'users', id), { status: 'suspended' });
                                                    setStudent(prev => ({ ...prev, status: 'suspended' }));

                                                    await addDoc(collection(db, 'activity'), {
                                                        userId: id,
                                                        userName: student.fullName || student.name || student.email,
                                                        action: `Suspended operational node: ${student.fullName}`,
                                                        type: 'admin_suspend',
                                                        icon: 'pause_circle',
                                                        timestamp: serverTimestamp()
                                                    });
                                                }
                                            }}
                                            className="h-full flex items-center justify-center gap-4 p-4 bg-amber-500 text-white rounded-xl md:rounded-[2rem] shadow-xl hover:bg-amber-600 active:scale-95 transition-all group/btn min-h-[5rem]"
                                        >
                                            <span className="material-symbols-outlined text-3xl">pause_circle</span>
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Suspend Node</span>
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* Financial Status Section */}
                    {isAdmin && !isEditing && (
                        <div className="bg-white/40 dark:bg-black/20 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-espresso/10 relative overflow-hidden group/finance">
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover/finance:bg-espresso transition-colors"></div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                <div>
                                    <h3 className="text-xl md:text-2xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight">Financial Status</h3>
                                    <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-1">Tuition & Operations Billing Schema</p>
                                </div>
                                <div className={cn(
                                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm",
                                    (student.amountPaid || 0) >= (student.totalFee || 0) && student.totalFee > 0 ? "bg-green-100 text-green-700 border border-green-200" :
                                        (student.amountPaid || 0) > 0 ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-red-100 text-red-700 border border-red-200"
                                )}>
                                    {(student.amountPaid || 0) >= (student.totalFee || 0) && student.totalFee > 0 ? 'Fully Cleared' :
                                        (student.amountPaid || 0) > 0 ? 'Partial Payment (Half Pay)' : 'Pending Payment'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="bg-espresso p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group/card/finance">
                                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover/card/finance:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-4xl">payments</span>
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-3">Total Program Fee</p>
                                    <p className="text-2xl md:text-3xl font-serif font-black">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'RWF' }).format(student.totalFee || 0)}
                                    </p>
                                </div>

                                <div className="bg-green-600 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group/card/finance">
                                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover/card/finance:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-3">Total Amount Paid</p>
                                    <p className="text-2xl md:text-3xl font-serif font-black">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'RWF' }).format(student.amountPaid || 0)}
                                    </p>
                                </div>

                                <div className={cn(
                                    "p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group/card/finance",
                                    (Number(student.totalFee || 0) - Number(student.amountPaid || 0)) <= 0 ? "bg-blue-600" : "bg-amber-600"
                                )}>
                                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover/card/finance:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-4xl">account_balance_wallet</span>
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-3">Outstanding Balance</p>
                                    <p className="text-2xl md:text-3xl font-serif font-black">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'RWF' }).format(Math.max(0, Number(student.totalFee || 0) - Number(student.amountPaid || 0)))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Progress Analytics Layer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                        {/* Deployment Matrix */}
                        <div className="bg-white/40 dark:bg-black/20 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-espresso/10 space-y-4 md:space-y-6 relative overflow-hidden group/matrix">
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover/matrix:bg-espresso transition-colors"></div>
                            <div className="flex justify-between items-end">
                                <h3 className="text-lg md:text-xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight">Deployment Matrix</h3>
                                <div className="text-right">
                                    <p className="text-2xl md:text-3xl font-serif font-black text-espresso dark:text-white leading-none">{progressStats.percent}%</p>
                                    <p className="text-[8px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest mt-1">Operational Capacity</p>
                                </div>
                            </div>
                            <div className="h-4 w-full bg-espresso/10 dark:bg-black/40 rounded-full overflow-hidden border border-espresso/5 shadow-inner">
                                <div
                                    className="h-full bg-espresso shadow-lg transition-all duration-1000 ease-out"
                                    style={{ width: `${progressStats.percent}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center text-[8px] md:text-[9px] font-black uppercase tracking-widest text-espresso/40 dark:text-white/40">
                                <span>{progressStats.completed} / {progressStats.total} Modules Validated</span>
                                <span>System Sync: OK</span>
                            </div>
                        </div>

                        {/* Recent Interactions */}
                        <div className="bg-white/40 dark:bg-black/20 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-espresso/10 space-y-4 md:space-y-6 relative overflow-hidden group/interactions">
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover/interactions:bg-espresso transition-colors"></div>
                            <h3 className="text-lg md:text-xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight">Recent Interactions</h3>
                            <div className="space-y-4">
                                {interactions.length > 0 ? interactions.map((log, i) => (
                                    <div key={log.id} className="flex items-start gap-4 group/item">
                                        <div className="w-8 h-8 rounded-lg bg-espresso/5 flex items-center justify-center text-espresso/40 group-hover/item:bg-espresso group-hover/item:text-white transition-all">
                                            <span className="material-symbols-outlined text-sm">{log.icon || 'history'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] md:text-xs font-serif font-bold text-espresso dark:text-white truncate">{log.action}</p>
                                            <p className="text-[8px] font-black text-espresso/20 uppercase tracking-widest">
                                                {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString() : 'Just now'}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="space-y-3 opacity-20">
                                        <div className="h-3 bg-espresso/10 rounded-full w-3/4"></div>
                                        <div className="h-3 bg-espresso/10 rounded-full w-1/2"></div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-center mt-4">Awaiting Signal Trace...</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-espresso/40 dark:text-white/40">Temporal activity sequence log</p>
                        </div>
                    </div>

                    {/* Course Enrollments Section */}
                    <div className="bg-white/40 dark:bg-black/20 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-espresso/10 relative overflow-hidden group/courses">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover/courses:bg-espresso transition-colors"></div>
                        <h3 className="text-lg md:text-xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight mb-6">Program Enrollments</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(student.enrolledCourses || (student.courseId ? [{ courseId: student.courseId, status: student.status || 'active' }] : [])).map((enrollment, idx) => {
                                const courseData = courses.find(c => c.id === enrollment.courseId) || { title: enrollment.courseId };
                                return (
                                    <div key={idx} className="bg-white/80 dark:bg-black/40 p-5 rounded-2xl border border-espresso/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <h4 className="font-serif font-bold text-espresso dark:text-white">{courseData.title}</h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${enrollment.status === 'active' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                    enrollment.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                        'bg-red-500/10 text-red-600 border-red-500/20'
                                                    }`}>
                                                    {enrollment.status}
                                                </span>
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                                {enrollment.status !== 'active' && (
                                                    <button onClick={() => handleCourseStatusChange(enrollment.courseId, 'active')} className="flex-1 md:flex-none px-3 py-2 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase transition-all hover:bg-green-600 shadow-sm">
                                                        Approve
                                                    </button>
                                                )}
                                                {enrollment.status === 'active' && (
                                                    <button onClick={() => handleCourseStatusChange(enrollment.courseId, 'suspended')} className="flex-1 md:flex-none px-3 py-2 bg-white text-red-500 border border-red-200 rounded-xl text-[9px] font-black uppercase transition-all hover:bg-red-50 shadow-sm">
                                                        Suspend
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {(!student.enrolledCourses || student.enrolledCourses.length === 0) && !student.courseId && (
                                <div className="col-span-1 md:col-span-2 text-center p-8 opacity-40">
                                    <span className="material-symbols-outlined text-3xl mb-2">school</span>
                                    <p className="text-[10px] font-black uppercase tracking-widest">No Active Enrollments Found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div >
        </div >
    );
}



