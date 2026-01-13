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
    const [showPassword, setShowPassword] = useState(false);
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

            // Fetch students for assignment (both regular and business)
            const studentQuery = query(collection(db, 'users'), where('role', 'in', ['student', 'business_student']));
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
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-32">
            <div className=" w-full px-2 py-10 space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-4 md:-ml-10"></div>
                    <div>
                        <h1 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Directorate of Instruction</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-1 md:mt-2">Faculty Management & Operational Oversight</p>
                    </div>
                    <button
                        onClick={() => { setFormData({ name: '', email: '', password: '', status: 'active', tags: '' }); setShowAddModal(true); }}
                        className="w-full md:w-auto px-6 md:px-8 py-3 md:py-3.5 bg-espresso text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[16px] md:text-[18px]">person_add</span>
                        Appoint Node
                    </button>
                </div>

                {/* Search & Filters Array */}
                <div className="space-y-6">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-5 md:left-6 flex items-center pointer-events-none text-espresso/30 group-focus-within:text-espresso transition-colors">
                            <span className="material-symbols-outlined text-[20px] md:text-[24px]">search</span>
                        </div>
                        <input
                            className="w-full h-14 md:h-16 pl-12 md:pl-16 pr-6 md:pr-8 bg-white/40 dark:bg-black/20 border border-espresso/10 rounded-xl md:rounded-2xl text-espresso dark:text-white font-serif text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-espresso transition-all placeholder:text-espresso/20 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.4em] placeholder:text-[9px] md:placeholder:text-[10px] shadow-inner"
                            placeholder="Search Faculty Directory..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {['all', 'active', 'on_leave'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex h-9 md:h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg md:rounded-xl px-4 md:px-6 transition-all text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-sm whitespace-nowrap",
                                    activeTab === tab
                                        ? 'bg-espresso text-white'
                                        : 'bg-white/40 dark:bg-black/20 border border-espresso/10 text-espresso/60 dark:text-white/60 hover:bg-white/60'
                                )}
                            >
                                {tab === 'all' ? 'Universal Access' : tab.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[9px] md:text-[10px] font-black text-espresso/40 uppercase tracking-[0.4em] flex items-center gap-2 md:gap-3">
                            <span className="w-6 md:w-8 h-px bg-espresso/20"></span>
                            Instructional Logic Core
                        </h3>
                        <p className="text-[8px] md:text-[10px] font-black text-espresso/20 uppercase tracking-widest leading-none">{filteredInstructors.length} Faculty Nodes</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-24">
                            <span className="animate-spin h-10 w-10 border-4 border-espresso border-t-transparent rounded-full shadow-lg"></span>
                        </div>
                    ) : filteredInstructors.length === 0 ? (
                        <div className="text-center py-24 bg-white/20 rounded-[3rem] border-2 border-dashed border-espresso/10 flex flex-col items-center gap-6 opacity-40">
                            <span className="material-symbols-outlined text-5xl">person_off</span>
                            <p className="text-[10px] font-black uppercase tracking-[0.5em]">The directorate is currently vacant</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {filteredInstructors.map((instructor) => (
                                <div
                                    key={instructor.id}
                                    className={cn(
                                        "bg-espresso p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden gap-6",
                                        instructor.status === 'on_leave' && 'opacity-60'
                                    )}
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-white/20 group-hover:bg-white transition-colors"></div>

                                    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 md:gap-8">
                                        <div className="relative shrink-0">
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-[2rem] overflow-hidden border-2 border-white/60 shadow-lg group-hover:scale-105 transition-transform">
                                                <img
                                                    src={instructor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name || 'I')}&background=random`}
                                                    className={cn("w-full h-full object-cover", instructor.status === 'on_leave' && 'grayscale')}
                                                    alt={instructor.name}
                                                />
                                            </div>
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 h-5 w-5 md:h-6 md:w-6 rounded-full border-4 border-espresso shadow-sm",
                                                instructor.status === 'active' ? 'bg-green-500' : 'bg-amber-400'
                                            )} />
                                        </div>
                                        <div className="space-y-1.5 md:space-y-2">
                                            <h3 className="text-xl md:text-2xl font-serif font-black text-white leading-tight tracking-tight break-all uppercase">{instructor.name || instructor.email}</h3>
                                            <p className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-widest break-all">{instructor.email}</p>
                                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3 md:mt-4">
                                                {(instructor.tags || []).map(tag => (
                                                    <span key={tag} className="px-2 md:px-3 py-1 bg-white/10 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white/70 rounded-lg border border-white/5 shadow-inner">{tag}</span>
                                                ))}
                                                {instructor.status === 'on_leave' && (
                                                    <span className="px-2 md:px-3 py-1 bg-amber-500 text-white text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">LEAVE OF ABSENCE</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end gap-4 md:gap-6 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                                        <div className="flex gap-3 md:gap-4 items-center">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[8px] md:text-[9px] font-black text-white/80 uppercase tracking-widest">{(instructor.assignedStudentIds || []).length} Participants</span>
                                                <span className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-widest">{(instructor.assignedCourseIds || []).length} Schemata</span>
                                            </div>
                                            <div className="h-6 md:h-8 w-px bg-white/10"></div>
                                            <div className="flex gap-1.5 md:gap-2">
                                                <button onClick={() => openCourseAssignModal(instructor)} className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/10 hover:bg-white text-white/70 hover:text-espresso transition-all flex items-center justify-center shadow-sm active:scale-90 border border-white/5" title="Assign Courses">
                                                    <span className="material-symbols-outlined text-[18px] md:text-[20px]">hub</span>
                                                </button>
                                                <button onClick={() => openAssignModal(instructor)} className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/10 hover:bg-white text-white/70 hover:text-espresso transition-all flex items-center justify-center shadow-sm active:scale-90 border border-white/5" title="Assign Participants">
                                                    <span className="material-symbols-outlined text-[18px] md:text-[20px]">groups</span>
                                                </button>
                                                <button onClick={() => openEditModal(instructor)} className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/10 hover:bg-white text-white/70 hover:text-espresso transition-all flex items-center justify-center shadow-sm active:scale-90 border border-white/5" title="Modify Node">
                                                    <span className="material-symbols-outlined text-[18px] md:text-[20px]">edit_note</span>
                                                </button>
                                                <button onClick={() => openDeleteConfirm(instructor)} className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-400/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-90 border border-red-400/10" title="Decommission">
                                                    <span className="material-symbols-outlined text-[18px] md:text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <span className="hidden sm:inline-block text-[8px] md:text-[9px] font-black text-white/20 italic uppercase tracking-widest">Node Verified Protocol 1.2</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals - Integrated Style */}
            <ModalWrapper show={showAddModal} onClose={() => setShowAddModal(false)}>
                <h3 className="text-2xl md:text-3xl font-serif font-black text-espresso mb-6 md:mb-8 uppercase tracking-tight">Appoint Faculty Node</h3>
                <form onSubmit={handleAddInstructor} className="space-y-4 md:space-y-6">
                    <div className="space-y-3 md:space-y-4">
                        <InputGroup label="Identity Tag" placeholder="FULL NAME" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <InputGroup label="Transmission Array" placeholder="EMAIL ADDRESS" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        <div className="relative">
                            <InputGroup
                                label="Access Cipher"
                                placeholder="PASSWORD"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-espresso/40 hover:text-espresso transition-colors pt-6"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                        <InputGroup label="Specialization Tags" placeholder="TAGS (COMMA SEPARATED)" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
                        <div>
                            <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-1.5 md:mb-2 ml-1">DEPLOYMENT STATE</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full p-3.5 md:p-4 bg-black/5 border border-espresso/10 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-espresso text-espresso font-black uppercase tracking-widest text-[9px] md:text-[10px]">
                                <option value="active">ACTIVE OPERATION</option>
                                <option value="on_leave">LEAVE OF ABSENCE</option>
                            </select>
                        </div>
                    </div>
                    {formError && <p className="text-red-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-red-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-red-100">{formError}</p>}
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4">
                        <button type="button" onClick={() => setShowAddModal(false)} className="order-2 sm:order-1 flex-1 py-3 md:py-4 bg-black/5 text-espresso text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl hover:bg-black/10 transition-all">Abort</button>
                        <button type="submit" disabled={formLoading} className="order-1 sm:order-2 flex-1 py-3 md:py-4 bg-espresso text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all disabled:opacity-50">{formLoading ? 'PROCESSING...' : 'EXECUTE APPOINTMENT'}</button>
                    </div>
                </form>
            </ModalWrapper>

            <ModalWrapper show={showEditModal} onClose={() => setShowEditModal(false)}>
                <h3 className="text-2xl md:text-3xl font-serif font-black text-espresso mb-6 md:mb-8 uppercase tracking-tight">Modify Faculty Node</h3>
                <form onSubmit={handleEditInstructor} className="space-y-4 md:space-y-6">
                    <div className="space-y-3 md:space-y-4">
                        <InputGroup label="Identity Tag" placeholder="FULL NAME" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <InputGroup label="Specialization Tags" placeholder="TAGS (COMMA SEPARATED)" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
                        <div>
                            <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-1.5 md:mb-2 ml-1">DEPLOYMENT STATE</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full p-3.5 md:p-4 bg-black/5 border border-espresso/10 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-espresso text-espresso font-black uppercase tracking-widest text-[9px] md:text-[10px]">
                                <option value="active">ACTIVE OPERATION</option>
                                <option value="on_leave">LEAVE OF ABSENCE</option>
                            </select>
                        </div>
                    </div>
                    {formError && <p className="text-red-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-red-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-red-100">{formError}</p>}
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4">
                        <button type="button" onClick={() => setShowEditModal(false)} className="order-2 sm:order-1 flex-1 py-3 md:py-4 bg-black/5 text-espresso text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl hover:bg-black/10 transition-all">Abort</button>
                        <button type="submit" disabled={formLoading} className="order-1 sm:order-2 flex-1 py-3 md:py-4 bg-espresso text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all disabled:opacity-50">{formLoading ? 'COMMITTING...' : 'COMMIT CHANGES'}</button>
                    </div>
                </form>
            </ModalWrapper>

            {showAssignModal && selectedInstructor && (
                <AssignStudentsModal
                    instructor={selectedInstructor}
                    students={students}
                    onClose={() => setShowAssignModal(false)}
                    onAssign={handleAssignStudents}
                    loading={formLoading}
                />
            )}

            {showCourseAssignModal && selectedInstructor && (
                <AssignCoursesModal
                    instructor={selectedInstructor}
                    courses={courses}
                    onClose={() => setShowCourseAssignModal(false)}
                    onAssign={handleAssignCourses}
                    loading={formLoading}
                />
            )}

            {showDeleteConfirm && selectedInstructor && (
                <ModalWrapper show={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
                    <div className="text-center space-y-4 md:space-y-6 py-2 md:py-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 text-red-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-sm">
                            <span className="material-symbols-outlined text-3xl md:text-4xl">warning</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-serif font-black text-espresso uppercase tracking-tight">Decommission Node?</h3>
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/60 uppercase tracking-widest leading-relaxed px-4">Confirm extraction of {selectedInstructor.name || selectedInstructor.email} from active directory. This action is final.</p>
                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-6">
                            <button onClick={() => setShowDeleteConfirm(false)} className="order-2 sm:order-1 flex-1 py-3 md:py-4 bg-black/5 text-espresso text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl hover:bg-black/10 transition-all">Abort</button>
                            <button onClick={handleDeleteInstructor} disabled={formLoading} className="order-1 sm:order-2 flex-1 py-3 md:py-4 bg-red-600 text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl hover:shadow-red-600/40 active:scale-95 transition-all disabled:opacity-50">{formLoading ? 'EXTRACTING...' : 'EXECUTE'}</button>
                        </div>
                    </div>
                </ModalWrapper>
            )}
        </div>
    );
}

// Helper Components for Structural Aesthetic
function ModalWrapper({ show, onClose, children }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6" onClick={onClose}>
            <div className="absolute inset-0 bg-espresso/40 backdrop-blur-md animate-fade-in" />
            <div className="bg-[#F5DEB3] rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 w-full max-w-xl shadow-2xl relative overflow-hidden animate-scale-in border border-espresso/10 max-h-[95vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
                <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-espresso"></div>
                {children}
            </div>
        </div>
    );
}

function InputGroup({ label, ...props }) {
    return (
        <div>
            <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-1.5 md:mb-2 ml-1">{label}</label>
            <input
                {...props}
                className="w-full p-3.5 md:p-4 bg-black/5 border border-espresso/10 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-espresso text-espresso font-serif text-base md:text-lg transition-all shadow-inner placeholder:text-espresso/10"
            />
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
        (s.fullName || s.name || '').toLowerCase().includes(filter.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <ModalWrapper show={true} onClose={onClose}>
            <h3 className="text-2xl md:text-3xl font-serif font-black text-espresso mb-6 md:mb-8 uppercase tracking-tight">Assign Participants</h3>
            <div className="relative group mb-6 md:mb-8">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-espresso/30 group-focus-within:text-espresso transition-colors">
                    <span className="material-symbols-outlined text-[16px] md:text-sm">search</span>
                </div>
                <input
                    type="text"
                    placeholder="LOCATE PARTICIPANT..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full h-11 md:h-12 pl-10 md:pl-12 pr-6 bg-black/5 border border-espresso/10 rounded-lg md:rounded-xl text-espresso font-serif text-sm focus:outline-none focus:ring-2 focus:ring-espresso transition-all placeholder:text-espresso/10 placeholder:font-black placeholder:text-[9px] md:placeholder:text-[10px] placeholder:tracking-widest shadow-inner"
                />
            </div>
            <div className="overflow-y-auto space-y-2 md:space-y-3 mb-6 md:mb-8 max-h-[250px] md:max-h-[300px] pr-2 no-scrollbar">
                {filteredStudents.length === 0 ? (
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 text-center py-10">No matches found</p>
                ) : (
                    filteredStudents.map(student => (
                        <label key={student.id} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-[1.5rem] bg-black/5 border border-espresso/5 hover:bg-espresso/5 transition-all cursor-pointer group/item">
                            <input
                                type="checkbox"
                                checked={selected.includes(student.id)}
                                onChange={() => toggleStudent(student.id)}
                                className="h-5 w-5 md:h-6 md:w-6 rounded-md md:rounded-lg border-espresso/20 text-espresso focus:ring-espresso bg-white/40"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-serif font-black text-espresso leading-none truncate">{student.fullName || student.name || student.email}</p>
                                <p className="text-[8px] md:text-[9px] font-black text-espresso/40 uppercase tracking-widest mt-1 truncate">{student.email}</p>
                            </div>
                        </label>
                    ))
                )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 border-t border-espresso/10">
                <button onClick={onClose} className="order-2 sm:order-1 flex-1 py-3 md:py-4 bg-black/5 text-espresso text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl hover:bg-black/10 transition-all">Abort</button>
                <button onClick={() => onAssign(selected)} disabled={loading} className="order-1 sm:order-2 flex-1 py-3 md:py-4 bg-espresso text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all disabled:opacity-50">
                    {loading ? 'PROCESSING...' : `DEPLOY ${selected.length} NODES`}
                </button>
            </div>
        </ModalWrapper>
    );
}

// Assign Courses Modal Component
function AssignCoursesModal({ instructor, courses, onClose, onAssign, loading }) {
    const [selected, setSelected] = useState(instructor.assignedCourseIds || []);

    const toggleCourse = (cid) => {
        setSelected(prev => prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]);
    };

    return (
        <ModalWrapper show={true} onClose={onClose}>
            <h3 className="text-2xl md:text-3xl font-serif font-black text-espresso mb-6 md:mb-8 uppercase tracking-tight">Assign Schemata</h3>
            <div className="overflow-y-auto space-y-3 md:space-y-4 mb-6 md:mb-8 max-h-[300px] md:max-h-[400px] pr-2 no-scrollbar">
                {courses.length === 0 ? (
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 text-center py-10">No assets available</p>
                ) : (
                    courses.map(course => (
                        <label key={course.id} className="flex items-center gap-4 md:gap-6 p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] bg-black/5 border border-espresso/5 hover:bg-espresso/5 transition-all cursor-pointer group/item">
                            <input
                                type="checkbox"
                                checked={selected.includes(course.id)}
                                onChange={() => toggleCourse(course.id)}
                                className="h-6 w-6 md:h-8 md:w-8 rounded-lg md:rounded-xl border-espresso/20 text-espresso focus:ring-espresso bg-white/40"
                            />
                            <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                                {course.thumbnail && (
                                    <img src={course.thumbnail} alt="" className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-2xl object-cover shadow-md border-2 border-white shrink-0" />
                                )}
                                <div className="min-w-0">
                                    <p className="font-serif font-black text-espresso text-base md:text-lg leading-tight truncate">{course.title || 'Untitled Asset'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[8px] md:text-[9px] font-black px-1.5 md:px-2 py-0.5 bg-espresso text-white rounded uppercase tracking-widest">{course.status}</span>
                                        <span className="hidden xs:inline-block text-[8px] md:text-[9px] font-black text-espresso/20 uppercase tracking-widest">Protocol Active</span>
                                    </div>
                                </div>
                            </div>
                        </label>
                    ))
                )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 border-t border-espresso/10">
                <button onClick={onClose} className="order-2 sm:order-1 flex-1 py-3 md:py-4 bg-black/5 text-espresso text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl hover:bg-black/10 transition-all">Abort</button>
                <button onClick={() => onAssign(selected)} disabled={loading} className="order-1 sm:order-2 flex-1 py-3 md:py-4 bg-espresso text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all disabled:opacity-50">
                    {loading ? 'PROCESSING...' : `DEPLOY ${selected.length} ASSETS`}
                </button>
            </div>
        </ModalWrapper>
    );
}



