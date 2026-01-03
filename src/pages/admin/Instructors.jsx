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
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-32">
            <div className=" w-full px-2 py-10 space-y-10">
                {/* Header */}
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-10"></div>
                    <div>
                        <h1 className="text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Directorate of Instruction</h1>
                        <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-2">Faculty Management & Operational Oversight</p>
                    </div>
                    <button
                        onClick={() => { setFormData({ name: '', email: '', password: '', status: 'active', tags: '' }); setShowAddModal(true); }}
                        className="px-8 py-3.5 bg-espresso text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                        Appoint Node
                    </button>
                </div>

                {/* Search & Filters Array */}
                <div className="space-y-6">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-espresso/30 group-focus-within:text-espresso transition-colors">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input
                            className="w-full h-16 pl-16 pr-8 bg-white/40 dark:bg-black/20 border border-espresso/10 rounded-2xl text-espresso dark:text-white font-serif text-lg focus:outline-none focus:ring-2 focus:ring-espresso transition-all placeholder:text-espresso/20 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.4em] placeholder:text-[10px] shadow-inner"
                            placeholder="Search Faculty Directory..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {['all', 'active', 'on_leave'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl px-6 transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-sm",
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
                        <h3 className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.4em] flex items-center gap-3">
                            <span className="w-8 h-px bg-espresso/20"></span>
                            Instructional Logic Core
                        </h3>
                        <p className="text-[10px] font-black text-espresso/20 uppercase tracking-widest">{filteredInstructors.length} Faculty Nodes</p>
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
                                        "bg-white/40 dark:bg-black/20 p-8 rounded-[2.5rem] border border-espresso/10 shadow-xl flex items-center justify-between hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden",
                                        instructor.status === 'on_leave' && 'opacity-60'
                                    )}
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover:bg-espresso transition-colors"></div>

                                    <div className="flex items-center gap-8">
                                        <div className="relative shrink-0">
                                            <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-white/60 shadow-lg group-hover:scale-105 transition-transform">
                                                <img
                                                    src={instructor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name || 'I')}&background=random`}
                                                    className={cn("w-full h-full object-cover", instructor.status === 'on_leave' && 'grayscale')}
                                                    alt={instructor.name}
                                                />
                                            </div>
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-[#F5DEB3] dark:border-[#1c1916] shadow-sm",
                                                instructor.status === 'active' ? 'bg-green-500' : 'bg-amber-400'
                                            )} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-serif font-black text-espresso dark:text-white leading-tight tracking-tight">{instructor.name || instructor.email}</h3>
                                            <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest">{instructor.email}</p>
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {(instructor.tags || []).map(tag => (
                                                    <span key={tag} className="px-3 py-1 bg-white/60 dark:bg-black/30 text-[9px] font-black uppercase tracking-widest text-espresso/60 rounded-lg border border-espresso/5 shadow-inner">{tag}</span>
                                                ))}
                                                {instructor.status === 'on_leave' && (
                                                    <span className="px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">LEAVE OF ABSENCE</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-6">
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-black text-espresso uppercase tracking-widest">{(instructor.assignedStudentIds || []).length} Participants</span>
                                                <span className="text-[9px] font-black text-espresso/40 uppercase tracking-widest">{(instructor.assignedCourseIds || []).length} Schemata</span>
                                            </div>
                                            <div className="h-8 w-px bg-espresso/10 mx-2"></div>
                                            <div className="flex gap-2">
                                                <button onClick={() => openCourseAssignModal(instructor)} className="w-10 h-10 rounded-xl bg-white/60 hover:bg-espresso hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-90" title="Assign Courses">
                                                    <span className="material-symbols-outlined text-[20px]">hub</span>
                                                </button>
                                                <button onClick={() => openAssignModal(instructor)} className="w-10 h-10 rounded-xl bg-white/60 hover:bg-espresso hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-90" title="Assign Participants">
                                                    <span className="material-symbols-outlined text-[20px]">groups</span>
                                                </button>
                                                <button onClick={() => openEditModal(instructor)} className="w-10 h-10 rounded-xl bg-white/60 hover:bg-espresso hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-90" title="Modify Node">
                                                    <span className="material-symbols-outlined text-[20px]">edit_note</span>
                                                </button>
                                                <button onClick={() => openDeleteConfirm(instructor)} className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-90" title="Decommission">
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black text-espresso/20 italic uppercase tracking-widest">Node Verified Protocol 1.2</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals - Integrated Style */}
            <ModalWrapper show={showAddModal} onClose={() => setShowAddModal(false)}>
                <h3 className="text-3xl font-serif font-black text-espresso mb-8 uppercase tracking-tight">Appoint Faculty Node</h3>
                <form onSubmit={handleAddInstructor} className="space-y-6">
                    <div className="space-y-4">
                        <InputGroup label="Identity Tag" placeholder="FULL NAME" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <InputGroup label="Transmission Array" placeholder="EMAIL ADDRESS" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        <InputGroup label="Access Cipher" placeholder="PASSWORD" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                        <InputGroup label="Specialization Tags" placeholder="TAGS (COMMA SEPARATED)" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-2 ml-1">DEPLOYMENT STATE</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full p-4 bg-black/5 border border-espresso/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-espresso text-espresso font-black uppercase tracking-widest text-[10px]">
                                <option value="active">ACTIVE OPERATION</option>
                                <option value="on_leave">LEAVE OF ABSENCE</option>
                            </select>
                        </div>
                    </div>
                    {formError && <p className="text-red-600 text-[10px] font-black uppercase tracking-widest bg-red-50 p-4 rounded-xl border border-red-100">{formError}</p>}
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-black/5 text-espresso text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black/10 transition-all">Abort</button>
                        <button type="submit" disabled={formLoading} className="flex-1 py-4 bg-espresso text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all disabled:opacity-50">{formLoading ? 'PROCESSING...' : 'EXECUTE APPOINTMENT'}</button>
                    </div>
                </form>
            </ModalWrapper>

            <ModalWrapper show={showEditModal} onClose={() => setShowEditModal(false)}>
                <h3 className="text-3xl font-serif font-black text-espresso mb-8 uppercase tracking-tight">Modify Faculty Node</h3>
                <form onSubmit={handleEditInstructor} className="space-y-6">
                    <div className="space-y-4">
                        <InputGroup label="Identity Tag" placeholder="FULL NAME" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <InputGroup label="Specialization Tags" placeholder="TAGS (COMMA SEPARATED)" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-2 ml-1">DEPLOYMENT STATE</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full p-4 bg-black/5 border border-espresso/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-espresso text-espresso font-black uppercase tracking-widest text-[10px]">
                                <option value="active">ACTIVE OPERATION</option>
                                <option value="on_leave">LEAVE OF ABSENCE</option>
                            </select>
                        </div>
                    </div>
                    {formError && <p className="text-red-600 text-[10px] font-black uppercase tracking-widest bg-red-50 p-4 rounded-xl border border-red-100">{formError}</p>}
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 bg-black/5 text-espresso text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black/10 transition-all">Abort</button>
                        <button type="submit" disabled={formLoading} className="flex-1 py-4 bg-espresso text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all disabled:opacity-50">{formLoading ? 'COMMITTING...' : 'COMMIT CHANGES'}</button>
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
                    <div className="text-center space-y-6 py-4">
                        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <span className="material-symbols-outlined text-4xl">warning</span>
                        </div>
                        <h3 className="text-3xl font-serif font-black text-espresso uppercase tracking-tight">Decommission Node?</h3>
                        <p className="text-[10px] font-black text-espresso/60 uppercase tracking-widest leading-relaxed">Confirm extraction of {selectedInstructor.name || selectedInstructor.email} from active directory. This action is final.</p>
                        <div className="flex gap-4 pt-6">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 bg-black/5 text-espresso text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black/10 transition-all">Abort</button>
                            <button onClick={handleDeleteInstructor} disabled={formLoading} className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:shadow-red-600/40 active:scale-95 transition-all disabled:opacity-50">{formLoading ? 'EXTRACTING...' : 'EXECUTE'}</button>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" onClick={onClose}>
            <div className="absolute inset-0 bg-espresso/40 backdrop-blur-md animate-fade-in" />
            <div className="bg-[#F5DEB3] rounded-[3rem] p-12 w-full max-w-xl shadow-2xl relative overflow-hidden animate-scale-in border border-espresso/10" onClick={e => e.stopPropagation()}>
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso"></div>
                {children}
            </div>
        </div>
    );
}

function InputGroup({ label, ...props }) {
    return (
        <div>
            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-2 ml-1">{label}</label>
            <input
                {...props}
                className="w-full p-4 bg-black/5 border border-espresso/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-espresso text-espresso font-serif text-lg transition-all shadow-inner placeholder:text-espresso/10"
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
        (s.name || '').toLowerCase().includes(filter.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <ModalWrapper show={true} onClose={onClose}>
            <h3 className="text-3xl font-serif font-black text-espresso mb-8 uppercase tracking-tight">Assign Participants</h3>
            <div className="relative group mb-8">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-espresso/30 group-focus-within:text-espresso transition-colors">
                    <span className="material-symbols-outlined text-sm">search</span>
                </div>
                <input
                    type="text"
                    placeholder="LOCATE PARTICIPANT..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full h-12 pl-12 pr-6 bg-black/5 border border-espresso/10 rounded-xl text-espresso font-serif text-sm focus:outline-none focus:ring-2 focus:ring-espresso transition-all placeholder:text-espresso/10 placeholder:font-black placeholder:text-[10px] placeholder:tracking-widest shadow-inner"
                />
            </div>
            <div className="overflow-y-auto space-y-3 mb-8 max-h-[300px] pr-2 scrollbar-premium">
                {filteredStudents.length === 0 ? (
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 text-center py-10">No matches found</p>
                ) : (
                    filteredStudents.map(student => (
                        <label key={student.id} className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-black/5 border border-espresso/5 hover:bg-espresso/5 transition-all cursor-pointer group/item">
                            <input
                                type="checkbox"
                                checked={selected.includes(student.id)}
                                onChange={() => toggleStudent(student.id)}
                                className="h-6 w-6 rounded-lg border-espresso/20 text-espresso focus:ring-espresso bg-white/40"
                            />
                            <div className="flex-1">
                                <p className="font-serif font-black text-espresso leading-none">{student.name || student.email}</p>
                                <p className="text-[9px] font-black text-espresso/40 uppercase tracking-widest mt-1">{student.email}</p>
                            </div>
                        </label>
                    ))
                )}
            </div>
            <div className="flex gap-4 pt-4 border-t border-espresso/10">
                <button onClick={onClose} className="flex-1 py-4 bg-black/5 text-espresso text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black/10 transition-all">Abort</button>
                <button onClick={() => onAssign(selected)} disabled={loading} className="flex-1 py-4 bg-espresso text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all disabled:opacity-50">
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
            <h3 className="text-3xl font-serif font-black text-espresso mb-8 uppercase tracking-tight">Assign Schemata</h3>
            <div className="overflow-y-auto space-y-4 mb-8 max-h-[400px] pr-2 scrollbar-premium">
                {courses.length === 0 ? (
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 text-center py-10">No assets available</p>
                ) : (
                    courses.map(course => (
                        <label key={course.id} className="flex items-center gap-6 p-5 rounded-[2rem] bg-black/5 border border-espresso/5 hover:bg-espresso/5 transition-all cursor-pointer group/item">
                            <input
                                type="checkbox"
                                checked={selected.includes(course.id)}
                                onChange={() => toggleCourse(course.id)}
                                className="h-8 w-8 rounded-xl border-espresso/20 text-espresso focus:ring-espresso bg-white/40"
                            />
                            <div className="flex items-center gap-6 flex-1">
                                {course.thumbnail && (
                                    <img src={course.thumbnail} alt="" className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white" />
                                )}
                                <div>
                                    <p className="font-serif font-black text-espresso text-lg leading-tight">{course.title || 'Untitled Asset'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-black px-2 py-0.5 bg-espresso text-white rounded uppercase tracking-widest">{course.status}</span>
                                        <span className="text-[9px] font-black text-espresso/20 uppercase tracking-widest">Protocol Active</span>
                                    </div>
                                </div>
                            </div>
                        </label>
                    ))
                )}
            </div>
            <div className="flex gap-4 pt-4 border-t border-espresso/10">
                <button onClick={onClose} className="flex-1 py-4 bg-black/5 text-espresso text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black/10 transition-all">Abort</button>
                <button onClick={() => onAssign(selected)} disabled={loading} className="flex-1 py-4 bg-espresso text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all disabled:opacity-50">
                    {loading ? 'PROCESSING...' : `DEPLOY ${selected.length} ASSETS`}
                </button>
            </div>
        </ModalWrapper>
    );
}



