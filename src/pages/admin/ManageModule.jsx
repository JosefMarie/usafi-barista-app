import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import imageCompression from 'browser-image-compression';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { RichTextEditor } from '../../components/common/RichTextEditor';

// --- DnD Kit Imports ---
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Summary Item Component ---
function SortableSummaryItem({ slide, index, removeSlide, updateSlide }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: slide.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white/40 dark:bg-black/20 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-espresso/10 relative overflow-hidden group/slide shadow-2xl cursor-grab active:cursor-grabbing hover:border-espresso/40 transition-colors"
        >
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/10 group-hover/slide:bg-espresso transition-colors"></div>
            <button
                onClick={(e) => { e.stopPropagation(); removeSlide(index); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-4 md:top-8 right-4 md:right-8 z-10 text-espresso/20 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50"
            >
                <span className="material-symbols-outlined text-[20px] md:text-[24px]">delete_sweep</span>
            </button>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black font-serif text-espresso">{slide.url ? (slide.type === 'pdf' ? 'Summary PDF Asset' : 'Summary Image Asset') : 'Summary Text Point'} {index + 1}</h3>
                    {slide.url && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-espresso/40 px-3 py-1 bg-espresso/5 rounded-full">{slide.fileName}</span>
                    )}
                </div>

                {slide.url ? (
                    <div
                        className="aspect-video bg-white/40 rounded-2xl overflow-hidden border border-espresso/10 flex items-center justify-center relative"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {slide.type === 'pdf' ? (
                            <div className="flex flex-col items-center gap-4 text-espresso/40">
                                <span className="material-symbols-outlined text-5xl">picture_as_pdf</span>
                                <p className="font-black text-[10px] uppercase tracking-widest">PDF Asset Attached</p>
                                <button
                                    onClick={() => window.open(slide.url, '_blank')}
                                    className="px-4 py-2 bg-espresso text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg hover:shadow-espresso/40 transition-all"
                                >
                                    Review Protocol
                                </button>
                            </div>
                        ) : (
                            <img src={slide.url} alt="Summary Preview" className="w-full h-full object-contain" />
                        )}
                    </div>
                ) : (
                    <div onPointerDown={(e) => e.stopPropagation()}>
                        <RichTextEditor
                            value={slide.text}
                            onChange={(val) => updateSlide(index, 'text', val)}
                            placeholder="Summary content..."
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Sortable Slide Item Component ---
function SortableSlideItem({ slide, index, updateSlide, removeSlide, handleFileUpload, isDragging }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: slide.id || `slide-${index}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1,
    };

    const slideUrl = slide.url || slide.image || (slide.media && slide.media[0]?.url);
    const isPdf = slide.type === 'pdf' ||
        (slideUrl && slideUrl.toLowerCase().split('?')[0].includes('.pdf')) ||
        (slide.fileName && slide.fileName.toLowerCase().endsWith('.pdf'));

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white/40 dark:bg-black/20 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-espresso/10 relative overflow-hidden group/slide shadow-lg cursor-grab active:cursor-grabbing hover:border-espresso/40 transition-colors"
        >
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/10 group-hover/slide:bg-espresso transition-colors"></div>

            <div className="flex items-center gap-4 md:gap-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-espresso text-white flex items-center justify-center font-black text-lg shadow-lg shrink-0">
                    {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="aspect-[3/4] max-w-[200px] bg-white dark:bg-white/5 rounded-xl border border-espresso/5 overflow-hidden relative group/img shadow-inner">
                        {isPdf ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-espresso/40">
                                <span className="material-symbols-outlined text-4xl">description</span>
                                <span className="text-[8px] font-black uppercase mt-1">PDF Page</span>
                            </div>
                        ) : (
                            <img src={slideUrl} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                        )}
                        <a
                            href={slideUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            draggable="false"
                            onDragStart={(e) => e.preventDefault()}
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="absolute inset-0 bg-espresso/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-sm text-white z-20"
                        >
                            <span className="material-symbols-outlined text-2xl">visibility</span>
                        </a>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); removeSlide(index); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="w-10 h-10 rounded-xl bg-white/40 text-espresso/40 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center shadow-sm relative z-30"
                        title="Remove Page"
                    >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
}


export function ManageModule() {
    const { courseId, moduleId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [module, setModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('content'); // content, quiz, assignments

    // Duration State
    const [duration, setDuration] = useState(0);

    // Progress State
    const [studentProgress, setStudentProgress] = useState({});

    // Content State
    // Multi-Language State
    const [selectedLang, setSelectedLang] = useState('en'); // en, fr, rw, sw
    const [langsData, setLangsData] = useState({
        en: { content: [], summaryContent: [], quiz: { questions: [], passMark: 70 } },
        fr: { content: [], summaryContent: [], quiz: { questions: [], passMark: 70 } },
        rw: { content: [], summaryContent: [], quiz: { questions: [], passMark: 70 } },
        sw: { content: [], summaryContent: [], quiz: { questions: [], passMark: 70 } }
    });
    const [slides, setSlides] = useState([]);
    const [summarySlides, setSummarySlides] = useState([]);
    const [contentType, setContentType] = useState('full'); // full, summary
    const [quiz, setQuiz] = useState({ questions: [], passMark: 70 });
    const [isFinalAssessment, setIsFinalAssessment] = useState(false);

    const [students, setStudents] = useState([]);
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [quizAllowedStudents, setQuizAllowedStudents] = useState([]);
    const [saving, setSaving] = useState(false);

    const [filterThreshold, setFilterThreshold] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'progress', direction: 'desc' });

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'Français' },
        { code: 'rw', name: 'Kinyarwanda' },
        { code: 'sw', name: 'Kiswahili' }
    ];

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const fetchModuleData = async () => {
            if (!courseId || !moduleId) return;

            // Allow time for Firebase connection
            try {
                // Fetch Module
                const modRef = doc(db, 'courses', courseId, 'modules', moduleId);
                const modSnap = await getDoc(modRef);

                if (modSnap.exists()) {
                    const data = modSnap.data();
                    setModule({ id: modSnap.id, ...data });

                    // Multi-Language Normalization
                    const initialLangs = {
                        en: {
                            content: data.languages?.en?.content || data.content || [],
                            summaryContent: data.languages?.en?.summaryContent || data.summaryContent || [],
                            quiz: data.languages?.en?.quiz || data.quiz || { questions: [], passMark: 70 }
                        },
                        fr: {
                            content: data.languages?.fr?.content || [],
                            summaryContent: data.languages?.fr?.summaryContent || [],
                            quiz: data.languages?.fr?.quiz || { questions: [], passMark: 70 }
                        },
                        rw: {
                            content: data.languages?.rw?.content || [],
                            summaryContent: data.languages?.rw?.summaryContent || [],
                            quiz: data.languages?.rw?.quiz || { questions: [], passMark: 70 }
                        },
                        sw: {
                            content: data.languages?.sw?.content || [],
                            summaryContent: data.languages?.sw?.summaryContent || [],
                            quiz: data.languages?.sw?.quiz || { questions: [], passMark: 70 }
                        }
                    };

                    // Normalize IDs for English (Legacy Migration)
                    initialLangs.en.content = initialLangs.en.content.map((s, i) => {
                        let media = s.media || [];
                        if (s.image && media.length === 0) media = [{ url: s.image, caption: '' }];
                        const slideUrl = s.url || s.image || (media.length > 0 ? media[0].url : null);
                        const inferredType = (s.type === 'pdf' || (slideUrl && slideUrl.toLowerCase().split('?')[0].includes('.pdf'))) ? 'pdf' : 'image';
                        return { ...s, id: s.id || `slide-en-${Date.now()}-${i}`, url: slideUrl, type: inferredType, media };
                    });

                    setLangsData(initialLangs);
                    setSlides(initialLangs.en.content);
                    setSummarySlides(initialLangs.en.summaryContent);
                    setQuiz(initialLangs.en.quiz);
                    setAssignedStudents(data.assignedStudents || []);
                    setQuizAllowedStudents(data.quizAllowedStudents || []);
                    setAssignedStudents(data.assignedStudents || []);
                    setQuizAllowedStudents(data.quizAllowedStudents || []);
                    setDuration(data.duration || 0);
                    setIsFinalAssessment(data.isFinalAssessment || false);
                } else if (moduleId === 'new') {
                    // Initialize New Module State
                    setModule({
                        title: 'New Instructional Node',
                        status: 'draft',
                        courseId: courseId
                    });
                    setSlides([]);
                    setSummarySlides([]);
                    setQuiz({ questions: [], passMark: 70 });
                    setAssignedStudents([]);
                    setQuizAllowedStudents([]);
                    setQuizAllowedStudents([]);
                    setDuration(0);
                    setIsFinalAssessment(false);
                } else {
                    navigate(`/admin/courses/${courseId}`);
                }

                // Fetch All Students
                const q = query(collection(db, 'users'), where('role', '==', 'student'));
                const studentSnaps = await getDocs(q);
                setStudents(studentSnaps.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setLoading(false);
            }
        };
        fetchModuleData();
    }, [courseId, moduleId, navigate]);

    // Handle Language Switch
    const changeLanguage = (newLangCode) => {
        // 1. Save current content to buffer
        setLangsData(prev => ({
            ...prev,
            [selectedLang]: {
                content: slides,
                summaryContent: summarySlides,
                quiz: quiz
            }
        }));

        // 2. Load new content
        const nextLang = langsData[newLangCode];
        setSlides(nextLang.content || []);
        setSummarySlides(nextLang.summaryContent || []);
        setQuiz(nextLang.quiz || { questions: [], passMark: 70 });
        setSelectedLang(newLangCode);
    };

    // --- Progress Fetching ---
    const fetchProgress = useCallback(async () => {
        if (activeTab === 'assignments' && assignedStudents.length > 0) {
            const progressMap = {};
            await Promise.all(assignedStudents.map(async (uid) => {
                try {
                    const progDoc = await getDoc(doc(db, 'users', uid, 'progress', moduleId));
                    if (progDoc.exists()) {
                        progressMap[uid] = progDoc.data();
                    }
                } catch (e) {
                    console.error("Error loading progress for", uid, e);
                }
            }));
            setStudentProgress(progressMap);
        }
    }, [activeTab, assignedStudents, moduleId]);

    // Fetch Progress when Assignments tab is active
    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    // Derived State: Filtered & Sorted Students
    const filteredAndSortedStudents = useMemo(() => {
        let result = [...students];

        // 1. Filter by assignment (since we are in the assignments tab, we only want to see people we can potentially manage here)
        // Or do we want to see ALL students? Usually, we want to see assigned students or everyone. 
        // Let's stick to showing everyone but sorting/filtering them based on their progress in this module.

        const processed = result.map(s => {
            const prog = studentProgress[s.id];
            const total = slides.length;
            const current = (prog?.lastSlideIndex ?? -1) + 1;
            const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
            return { ...s, _percent: percent };
        });

        // 2. Filter by threshold
        let filtered = processed;
        if (filterThreshold > 0) {
            filtered = filtered.filter(s => s._percent >= filterThreshold);
        }

        // 3. Filter by search term
        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(s =>
                (s.fullName || '').toLowerCase().includes(query) ||
                (s.name || '').toLowerCase().includes(query) ||
                (s.email || '').toLowerCase().includes(query) ||
                (s.id || '').toLowerCase().includes(query)
            );
        }

        result = filtered;

        // 4. Sort
        result.sort((a, b) => {
            let valA = a._percent;
            let valB = b._percent;

            if (sortConfig.key === 'name') {
                valA = (a.fullName || a.name || '').toLowerCase();
                valB = (b.fullName || b.name || '').toLowerCase();
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [students, studentProgress, slides.length, sortConfig, filterThreshold, searchTerm]);


    // --- Content Handlers ---
    const addSlide = (type = 'standard') => {
        // Now just a placeholder, the actual upload will push to slides
    };

    const updateSlide = (index, field, value) => {
        if (contentType === 'full') {
            const newSlides = [...slides];
            newSlides[index][field] = value;
            setSlides(newSlides);
        } else {
            const newSlides = [...summarySlides];
            newSlides[index][field] = value;
            setSummarySlides(newSlides);
        }
    };

    const removeSlide = (index) => {
        if (contentType === 'full') {
            setSlides(slides.filter((_, i) => i !== index));
        } else {
            setSummarySlides(summarySlides.filter((_, i) => i !== index));
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            if (contentType === 'full') {
                setSlides((items) => {
                    const oldIndex = items.findIndex((i) => (i.id || `slide-${items.indexOf(i)}`) === active.id);
                    const newIndex = items.findIndex((i) => (i.id || `slide-${items.indexOf(i)}`) === over.id);
                    return arrayMove(items, oldIndex, newIndex);
                });
            } else {
                setSummarySlides((items) => {
                    const oldIndex = items.findIndex((i) => i.id === active.id);
                    const newIndex = items.findIndex((i) => i.id === over.id);
                    return arrayMove(items, oldIndex, newIndex);
                });
            }
        }
    };

    // --- Summary Handlers ---
    const addSummaryPoint = () => {
        setSummarySlides(prev => [...prev, {
            id: `summary-${Date.now()}`,
            text: '',
            type: 'text'
        }]);
    };

    // --- File Upload Handler (PDF or Image) ---
    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        try {
            setLoading(true);
            const newAssets = [];

            for (const file of files) {
                let fileToUpload = file;

                // Compress if it's an image
                if (file.type.startsWith('image/')) {
                    const options = {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                    };
                    try {
                        fileToUpload = await imageCompression(file, options);
                    } catch (e) {
                        console.warn("Compression failed for", file.name, e);
                    }
                }

                // Upload to Firebase Storage
                const path = `module-content/${courseId}/${moduleId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const storageRef = ref(storage, path);
                const snapshot = await uploadBytes(storageRef, fileToUpload);

                // Get Download URL
                const downloadURL = await getDownloadURL(snapshot.ref);

                newAssets.push({
                    id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title: file.name,
                    fileName: file.name,
                    type: (file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) ? 'pdf' : 'standard', // standard = image
                    url: downloadURL,
                    uploadedAt: new Date().toISOString()
                });
            }

            if (contentType === 'full') {
                setSlides(prev => [...prev, ...newAssets]);
            } else {
                setSummarySlides(prev => [...prev, ...newAssets]);
            }
            setLoading(false);
        } catch (error) {
            console.error("Error uploading file:", error);
            alert(`Failed to upload file: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Quiz Handlers ---
    const addQuestion = (type = 'multiple_choice') => {
        const questionBase = {
            type,
            question: '',
            duration: 30, // Default 30 seconds
        };

        let specificData = {};
        if (type === 'multiple_choice') {
            specificData = { options: ['', '', '', ''], correctOption: 0 };
        } else if (type === 'true_false') {
            specificData = { correctAnswer: true };
        } else if (type === 'fill_in') {
            specificData = { correctAnswer: '' };
        } else if (type === 'matching') {
            specificData = { pairs: [{ key: '', value: '' }, { key: '', value: '' }] };
        }

        setQuiz(prev => ({
            ...prev,
            questions: [...prev.questions, { ...questionBase, ...specificData }]
        }));
    };

    const updateQuestion = (qIndex, field, value) => {
        const newQuestions = [...quiz.questions];
        newQuestions[qIndex][field] = value;
        setQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const updateOption = (qIndex, oIndex, value) => {
        const newQuestions = [...quiz.questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const updatePair = (qIndex, pIndex, field, value) => {
        const newQuestions = [...quiz.questions];
        newQuestions[qIndex].pairs[pIndex][field] = value;
        setQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const addPair = (qIndex) => {
        const newQuestions = [...quiz.questions];
        newQuestions[qIndex].pairs.push({ key: '', value: '' });
        setQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const removePair = (qIndex, pIndex) => {
        const newQuestions = [...quiz.questions];
        newQuestions[qIndex].pairs = newQuestions[qIndex].pairs.filter((_, i) => i !== pIndex);
        setQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const removeQuestion = (qIndex) => {
        setQuiz(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== qIndex)
        }));
    };

    // --- Assignment Handlers ---
    const toggleAssignment = async (studentId) => {
        const newAssigned = assignedStudents.includes(studentId)
            ? assignedStudents.filter(id => id !== studentId)
            : [...assignedStudents, studentId];

        setAssignedStudents(newAssigned);

        try {
            await updateDoc(doc(db, 'courses', courseId, 'modules', moduleId), {
                assignedStudents: newAssigned
            });
        } catch (error) {
            console.error("Sync Error:", error);
        }
    };

    const toggleQuizAccess = async (e, studentId) => {
        e.stopPropagation(); // Prevent row click
        const newAllowed = quizAllowedStudents.includes(studentId)
            ? quizAllowedStudents.filter(id => id !== studentId)
            : [...quizAllowedStudents, studentId];

        setQuizAllowedStudents(newAllowed);

        try {
            await updateDoc(doc(db, 'courses', courseId, 'modules', moduleId), {
                quizAllowedStudents: newAllowed
            });

            // If we are allowing access, reset the quizRequested flag in user progress
            if (newAllowed.includes(studentId)) {
                const progressRef = doc(db, 'users', studentId, 'progress', moduleId);
                await updateDoc(progressRef, { quizRequested: false });
            }
        } catch (error) {
            console.error("Sync Error:", error);
        }
    };

    const grantQuizAccessToCompleted = async () => {
        const completedStudentIds = students.filter(student => {
            const progress = studentProgress[student.id];
            // Check if they have reached the last slide (Assuming content length > 0)
            const lastSlideIndex = progress?.lastSlideIndex || 0;
            const contentLen = (contentType === 'full' ? slides : summarySlides).length;
            // Consider completed if they are at the last slide or have a 'completed' status
            return (contentLen > 0 && lastSlideIndex >= contentLen - 1) || progress?.status === 'completed';
        }).map(s => s.id);

        const newAllowed = [...new Set([...quizAllowedStudents, ...completedStudentIds])];
        setQuizAllowedStudents(newAllowed);

        try {
            await updateDoc(doc(db, 'courses', courseId, 'modules', moduleId), {
                quizAllowedStudents: newAllowed
            });
            alert(`Granted quiz access to ${completedStudentIds.length} students who finished content.`);
        } catch (error) {
            console.error("Sync Error:", error);
            alert("Failed to sync permissions: " + error.message);
        }
    };

    const resetProgressForAll = async () => {
        if (!window.confirm("WARNING: This will wipe all progress, scores, and quiz permissions for ALL assigned students in this module. This action cannot be undone. Proceed?")) return;

        try {
            setLoading(true);
            const batchPromises = assignedStudents.map(async (uid) => {
                const progressRef = doc(db, 'users', uid, 'progress', moduleId);
                // Reset progress record
                await setDoc(progressRef, {
                    courseId,
                    moduleId,
                    lastSlideIndex: 0,
                    status: 'not-started',
                    score: 0,
                    passed: false,
                    quizRequested: false,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            });

            await Promise.all(batchPromises);

            // Clear quiz allowed list since we are resetting everything
            setQuizAllowedStudents([]);

            // Refresh local progress state
            await fetchProgress();

            alert("Protocol Reset Successful: All student progress for this module has been wiped.");
        } catch (error) {
            console.error("Reset Error:", error);
            alert("Failed to reset progress: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Save Handler ---
    const handleSave = async () => {
        try {
            setSaving(true);
            const isNew = moduleId === 'new';
            const modulesRef = collection(db, 'courses', courseId, 'modules');
            const modRef = isNew ? doc(modulesRef) : doc(db, 'courses', courseId, 'modules', moduleId);

            const saveDoc = {
                title: module.title,
                // Top-level content remains for backward compatibility in some views
                content: selectedLang === 'en' ? slides : (langsData.en.content || []),
                summaryContent: selectedLang === 'en' ? summarySlides : (langsData.en.summaryContent || []),
                quiz: selectedLang === 'en' ? quiz : (langsData.en.quiz || { questions: [], passMark: 70 }),
                // All languages mapped
                languages: {
                    ...langsData,
                    [selectedLang]: {
                        content: slides,
                        summaryContent: summarySlides,
                        quiz: quiz
                    }
                },
                assignedStudents: assignedStudents,
                quizAllowedStudents: quizAllowedStudents,
                duration: parseInt(duration) || 0,
                updatedAt: serverTimestamp(),
                status: module.status || 'draft',
                courseId: courseId
            };

            if (isNew) {
                saveDoc.createdAt = serverTimestamp();
                await setDoc(modRef, saveDoc);
                alert('Module created successfully!');
                navigate(`/admin/courses/${courseId}/modules/${modRef.id}`, { replace: true });
            } else {
                await updateDoc(modRef, saveDoc);
                alert('Changes saved successfully!');
            }
        } catch (error) {
            console.error("Error saving module:", error);
            alert(`Error saving changes: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const pendingQuizRequests = useMemo(() => {
        return students.filter(s => {
            const prog = studentProgress[s.id];
            return prog?.quizRequested && !quizAllowedStudents.includes(s.id);
        });
    }, [students, studentProgress, quizAllowedStudents]);

    const togglePublish = async () => {
        const newStatus = module.status === 'published' ? 'draft' : 'published';
        try {
            await updateDoc(doc(db, 'courses', courseId, 'modules', moduleId), { status: newStatus });
            setModule(prev => ({ ...prev, status: newStatus }));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    if (loading) return <div className="p-10 text-center text-espresso font-black uppercase tracking-widest animate-pulse">Initializing Interface...</div>;
    if (!module) return null;
    return (
        <div className="flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in relative">
            {/* Header */}
            <header className="bg-[#F5DEB3]/90 dark:bg-[#1e1e1e]/90 backdrop-blur-md border-b border-espresso/10 sticky top-0 z-50 px-3 md:px-10 py-3 md:py-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 md:gap-8 shadow-sm">
                <div className="flex items-center gap-3 md:gap-8 flex-1">
                    <button onClick={() => navigate(`/admin/courses/${courseId}`)} className="size-10 md:size-14 flex items-center justify-center bg-white/40 hover:bg-white text-espresso rounded-xl md:rounded-[1.5rem] transition-all shadow-sm active:scale-95 shrink-0 border border-espresso/5">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">arrow_back</span>
                    </button>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-0.5 md:mb-1">
                            <span className="px-2 py-0.5 bg-espresso/5 text-espresso/40 text-[7px] md:text-[9px] font-black uppercase tracking-widest rounded-lg border border-espresso/10">Module Engineering</span>
                            <span className="text-espresso/20">•</span>
                            <span className="text-[7px] md:text-[9px] font-black text-espresso/40 uppercase tracking-widest">{module.id}</span>
                        </div>
                        <input
                            className="w-full bg-espresso text-white font-serif font-black text-base md:text-3xl outline-none placeholder:text-white/20 px-3 py-1 md:px-6 md:py-2 rounded-lg md:rounded-2xl shadow-inner transition-all hover:bg-espresso/90 focus:ring-2 focus:ring-espresso focus:ring-offset-2"
                            value={module.title || ''}
                            onChange={(e) => setModule({ ...module, title: e.target.value })}
                            placeholder="Designate Module Title..."
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-6 bg-white/40 dark:bg-black/20 p-1.5 md:p-3 rounded-xl md:rounded-[2rem] border border-espresso/5 shadow-inner">
                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar py-1">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={cn(
                                    "px-3 md:px-6 py-2 md:py-3 text-[8px] md:text-[10px] font-black rounded-xl transition-all uppercase tracking-widest whitespace-nowrap",
                                    selectedLang === lang.code
                                        ? "bg-espresso text-white shadow-xl scale-105"
                                        : "text-espresso/40 hover:text-espresso hover:bg-white/60"
                                )}
                            >
                                {lang.name.charAt(0).toUpperCase() + lang.name.slice(1, 2)}
                                <span className="hidden md:inline">{lang.name.slice(2)}</span>
                            </button>
                        ))}
                    </div>
                    <div className="w-px h-8 bg-espresso/10 hidden lg:block"></div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none flex items-center justify-center gap-2 md:gap-3 bg-espresso text-white px-4 md:px-10 py-2.5 md:py-5 rounded-xl md:rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[8px] md:text-[11px] shadow-2xl shadow-espresso/30 hover:shadow-espresso/50 transition-all active:scale-95 disabled:opacity-50">
                            <span className="material-symbols-outlined text-[18px] md:text-[22px]">{saving ? 'sync' : 'database'}</span>
                            {saving ? 'Syncing...' : 'Sync State'}
                        </button>
                        <button
                            onClick={togglePublish}
                            className={cn(
                                "flex-1 sm:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-2.5 md:py-5 rounded-xl md:rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[8px] md:text-[11px] shadow-2xl transition-all active:scale-95",
                                module.status === 'published'
                                    ? "bg-red-500 text-white shadow-red-500/20 hover:bg-red-600"
                                    : "bg-green-600 text-white shadow-green-600/20 hover:bg-green-700"
                            )}>
                            <span className="material-symbols-outlined text-[18px] md:text-[22px]">{module.status === 'published' ? 'block' : 'rocket_launch'}</span>
                            {module.status === 'published' ? 'Unpublish' : 'Production'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Language Switcher & Tabs */}
            <div className="flex flex-col border-y border-espresso/10 bg-white/20 dark:bg-black/20 relative z-10 w-full">
                <div className="flex items-center justify-center min-h-[50px] md:min-h-[60px] px-2 md:px-4 overflow-x-auto no-scrollbar w-full py-2 md:py-4">
                    {['content', 'quiz', 'assignments'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-4 md:px-8 py-2.5 md:py-4 text-[9px] md:text-xs font-black uppercase tracking-[0.2em] rounded-lg md:rounded-xl transition-all relative group whitespace-nowrap mx-1.5 md:mx-3",
                                activeTab === tab
                                    ? "bg-espresso text-white shadow-lg scale-100"
                                    : "text-espresso/60 dark:text-white/60 hover:bg-white/40 hover:text-espresso"
                            )}
                        >
                            {tab}
                            {tab === 'assignments' && pendingQuizRequests.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[8px] items-center justify-center text-white border border-white">
                                        {pendingQuizRequests.length}
                                    </span>
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <main className="p-4 md:p-10 w-full pb-32 max-w-7xl mx-auto">

                {/* CONTENT TAB */}
                {activeTab === 'content' && (
                    <div className="space-y-6 md:space-y-10">
                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/40 dark:bg-black/20 p-6 md:p-8 rounded-[2rem] border border-espresso/10 shadow-xl relative overflow-hidden group/meta">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/10 group-hover/meta:bg-espresso transition-colors"></div>
                            <div className="flex flex-col sm:flex-row sm:items-center xl:items-start gap-4 md:gap-6 w-full xl:w-auto">
                                <div className="flex-1">
                                    <h2 className="text-[7px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                                        <span className="w-4 md:w-6 h-px bg-espresso/20"></span>
                                        Module Assets
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <div className="flex bg-espresso/5 p-1 rounded-lg md:rounded-xl">
                                            <button
                                                onClick={() => setContentType('full')}
                                                className={cn(
                                                    "px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-[7px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                                                    contentType === 'full' ? "bg-espresso text-white shadow-md" : "text-espresso/40 hover:text-espresso"
                                                )}
                                            >
                                                Full
                                            </button>
                                            <button
                                                onClick={() => setContentType('summary')}
                                                className={cn(
                                                    "px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-[7px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                                                    contentType === 'summary' ? "bg-espresso text-white shadow-lg" : "text-espresso/40 hover:text-espresso"
                                                )}
                                            >
                                                Summary
                                            </button>
                                        </div>
                                        <p className="text-sm md:text-xl font-serif font-black text-espresso dark:text-white truncate">
                                            {contentType === 'full' ? 'Sequence' : 'Protocol'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-6 w-full xl:w-auto">
                                <div className="flex items-center justify-between sm:justify-start gap-4 bg-white/40 dark:bg-black/20 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-espresso/5 shadow-inner w-full sm:w-auto">
                                    <label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-espresso/40 whitespace-nowrap">Est. Time:</label>
                                    <div className="flex items-center gap-1 md:gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            className="w-10 md:w-16 bg-transparent text-center font-black text-espresso dark:text-white text-xs md:text-sm outline-none"
                                        />
                                        <span className="text-[7px] md:text-[9px] font-black uppercase text-espresso/30">MIN</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    {contentType === 'full' ? (
                                        <label className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 md:gap-2 bg-espresso text-white px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap">
                                            <span className="material-symbols-outlined text-[16px] md:text-[18px]">add_circle</span>
                                            Asset
                                            <input type="file" accept="application/pdf,image/*" multiple className="hidden" onChange={handleFileUpload} />
                                        </label>
                                    ) : (
                                        <div className="flex gap-2 w-full">
                                            <button
                                                onClick={addSummaryPoint}
                                                className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 bg-white/40 text-espresso border border-espresso/10 px-3 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] shadow-sm hover:bg-white active:scale-95 transition-all whitespace-nowrap"
                                            >
                                                <span className="material-symbols-outlined text-[16px] md:text-[18px]">add_notes</span>
                                                Point
                                            </button>
                                            <label className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 bg-espresso text-white px-3 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap">
                                                <span className="material-symbols-outlined text-[16px] md:text-[18px]">upload_file</span>
                                                Media
                                                <input type="file" accept="application/pdf,image/*" multiple className="hidden" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {contentType === 'full' ? (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={slides.map((s, i) => s.id || `slide-${i}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {slides.map((slide, index) => (
                                            <SortableSlideItem
                                                key={slide.id || `slide-${index}`}
                                                slide={slide}
                                                index={index}
                                                updateSlide={updateSlide}
                                                removeSlide={removeSlide}
                                                handleFileUpload={handleFileUpload}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={summarySlides.map((s) => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-6">
                                        {summarySlides.map((slide, index) => (
                                            <SortableSummaryItem
                                                key={slide.id}
                                                slide={slide}
                                                index={index}
                                                removeSlide={removeSlide}
                                                updateSlide={updateSlide}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}

                        {(contentType === 'full' ? slides : summarySlides).length === 0 && (
                            <div className="text-center py-32 bg-white/20 dark:bg-black/10 border-2 border-dashed border-espresso/10 rounded-[3rem] flex flex-col items-center justify-center gap-6">
                                <div className="w-20 h-20 rounded-[2rem] bg-espresso/5 flex items-center justify-center text-espresso/20">
                                    <span className="material-symbols-outlined text-5xl">auto_stories</span>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-espresso/30 italic">No {contentType === 'full' ? 'slide' : 'summary'} patterns detected. Initialize narrative sequence.</p>
                            </div>
                        )}
                    </div>
                )}


                {/* QUIZ TAB */}
                {activeTab === 'quiz' && (
                    <div className="space-y-10">
                        <div className="flex flex-col sm:flex-row justify-between items-center bg-espresso text-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-espresso/20 relative overflow-hidden group/score gap-4 md:gap-6">
                            <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/5 skew-x-12 translate-x-16 group-hover/score:translate-x-12 transition-transform duration-700"></div>
                            <div className="text-center sm:text-left z-10">
                                <h3 className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] mb-1 md:mb-3 text-white/60">Integrity Threshold</h3>
                                <p className="text-base md:text-2xl font-serif font-black tracking-tight">Certification Pass Protocol</p>
                            </div>
                            <div className="flex items-center gap-3 md:gap-4 bg-white/10 px-4 md:px-8 py-2 md:py-4 rounded-xl md:rounded-2xl border border-white/20 shadow-inner group-hover/score:scale-105 transition-transform z-10">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={quiz.passMark}
                                    onChange={(e) => setQuiz({ ...quiz, passMark: parseInt(e.target.value) })}
                                    className="w-12 md:w-20 bg-transparent text-center font-black text-xl md:text-3xl outline-none"
                                />
                                <span className="font-serif font-black text-lg md:text-2xl text-white/40">%</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center px-2 gap-4">
                            <h2 className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                                <span className="w-8 h-px bg-espresso/20"></span>
                                Query Matrix
                            </h2>
                            <div className="w-full sm:w-auto">
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) addQuestion(e.target.value);
                                        e.target.value = '';
                                    }}
                                    className="w-full sm:w-auto bg-espresso text-white px-6 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all outline-none"
                                    defaultValue=""
                                >
                                    <option value="" disabled>+ SELECT QUERY TYPE</option>
                                    <option value="multiple_choice">MULTIPLE CHOICE</option>
                                    <option value="true_false">LOGIC: TRUE / FALSE</option>
                                    <option value="fill_in">NARRATIVE DATA: FILL IN</option>
                                    <option value="matching">RELATIONAL: MATCHING</option>
                                </select>
                            </div>
                        </div>

                        {quiz.questions.map((q, qIndex) => (
                            <div key={qIndex} className="bg-white/40 dark:bg-black/20 p-5 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-espresso/10 relative overflow-hidden shadow-2xl group/q animate-in fade-in slide-in-from-bottom-4">
                                <div className="absolute left-0 top-0 bottom-0 w-1 md:w-2 bg-espresso/5 group-hover/q:bg-espresso transition-colors"></div>
                                <button onClick={() => removeQuestion(qIndex)} className="absolute top-4 md:top-8 right-4 md:right-8 text-espresso/20 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50">
                                    <span className="material-symbols-outlined text-[18px] md:text-[24px]">delete_sweep</span>
                                </button>
                                <div className="mb-6 md:mb-10 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8">
                                    <div className="md:col-span-3">
                                        <label className="block text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-espresso/40 mb-1 md:mb-3 ml-1">Query Designation {qIndex + 1}</label>
                                        <input
                                            className="w-full px-4 md:px-6 py-2.5 md:py-4 text-sm md:text-lg font-serif font-black bg-white/20 dark:bg-black/20 border border-espresso/10 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-espresso shadow-inner text-espresso dark:text-white transition-all"
                                            placeholder="Specify query protocol..."
                                            value={q.question}
                                            onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-espresso/40 mb-1 md:mb-3 ml-1">Time Delta (Sec)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 md:px-6 py-2.5 md:py-4 font-black text-center bg-white/20 dark:bg-black/20 border border-espresso/10 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-espresso shadow-inner text-espresso dark:text-white transition-all text-sm md:text-base"
                                            value={q.duration}
                                            onChange={(e) => updateQuestion(qIndex, 'duration', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* QUESTION TYPE UI */}
                                {q.type === 'multiple_choice' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {q.options.map((opt, oIndex) => (
                                            <div key={oIndex} className="flex items-center gap-4 group/opt">
                                                <input
                                                    type="radio"
                                                    name={`correct-${qIndex}`}
                                                    checked={q.correctOption === oIndex}
                                                    onChange={() => updateQuestion(qIndex, 'correctOption', oIndex)}
                                                    className="w-6 h-6 accent-espresso"
                                                />
                                                <input
                                                    className="flex-1 px-6 py-4 text-sm font-bold bg-white/10 dark:bg-black/20 border border-espresso/10 rounded-2xl outline-none focus:ring-2 focus:ring-espresso shadow-sm text-espresso dark:text-white transition-all"
                                                    placeholder={`Option Result ${oIndex + 1}`}
                                                    value={opt}
                                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'true_false' && (
                                    <div className="flex gap-6">
                                        <button
                                            onClick={() => updateQuestion(qIndex, 'correctAnswer', true)}
                                            className={cn(
                                                "flex-1 py-5 rounded-2xl border-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden",
                                                q.correctAnswer === true
                                                    ? "bg-espresso text-white border-espresso shadow-xl shadow-espresso/20"
                                                    : "bg-white/20 border-espresso/10 text-espresso/40 hover:bg-espresso/5"
                                            )}
                                        >
                                            AFFIRMATIVE: TRUE
                                        </button>
                                        <button
                                            onClick={() => updateQuestion(qIndex, 'correctAnswer', false)}
                                            className={cn(
                                                "flex-1 py-5 rounded-2xl border-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden",
                                                q.correctAnswer === false
                                                    ? "bg-espresso text-white border-espresso shadow-xl shadow-espresso/20"
                                                    : "bg-white/20 border-espresso/10 text-espresso/40 hover:bg-espresso/5"
                                            )}
                                        >
                                            NEGATIVE: FALSE
                                        </button>
                                    </div>
                                )}

                                {q.type === 'fill_in' && (
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-espresso/30 ml-2 italic">Validation String</label>
                                        <input
                                            className="w-full px-8 py-5 bg-white/20 dark:bg-black/20 border border-espresso/10 rounded-2xl font-black text-espresso dark:text-white tracking-widest outline-none shadow-inner focus:ring-2 focus:ring-espresso transition-all"
                                            placeholder="Specify correct terminology..."
                                            value={q.correctAnswer}
                                            onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                                        />
                                    </div>
                                )}

                                {q.type === 'matching' && (
                                    <div className="space-y-6">
                                        {q.pairs.map((pair, pIndex) => (
                                            <div key={pIndex} className="flex flex-col sm:flex-row gap-4 bg-white/10 p-4 rounded-2xl border border-espresso/5">
                                                <input
                                                    className="flex-1 px-4 py-3 bg-transparent border-b border-espresso/10 text-sm font-bold placeholder:text-espresso/20 outline-none focus:border-espresso"
                                                    placeholder="Anchor Value A"
                                                    value={pair.key}
                                                    onChange={(e) => updatePair(qIndex, pIndex, 'key', e.target.value)}
                                                />
                                                <div className="hidden sm:flex items-center justify-center w-8 text-espresso/20">
                                                    <span className="material-symbols-outlined">link</span>
                                                </div>
                                                <input
                                                    className="flex-1 px-4 py-3 bg-transparent border-b border-espresso/10 text-sm font-bold placeholder:text-espresso/20 outline-none focus:border-espresso"
                                                    placeholder="Linked Value B"
                                                    value={pair.value}
                                                    onChange={(e) => updatePair(qIndex, pIndex, 'value', e.target.value)}
                                                />
                                                <button onClick={() => removePair(qIndex, pIndex)} className="text-red-400 hover:text-red-600 transition-colors p-2">
                                                    <span className="material-symbols-outlined">remove_circle</span>
                                                </button>
                                            </div>
                                        ))}
                                        <button onClick={() => addPair(qIndex)} className="w-full py-4 rounded-2xl border border-dashed border-espresso/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 hover:border-espresso/40 hover:text-espresso transition-all bg-white/5">
                                            <span className="material-symbols-outlined">add_link</span> Append Relational Pair
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        <button
                            onClick={() => addQuestion('multiple_choice')}
                            className="w-full py-12 border-4 border-dashed border-espresso/5 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-espresso/20 font-black uppercase tracking-[0.2em] text-xs hover:border-espresso/20 hover:text-espresso/60 transition-all group/add"
                        >
                            <div className="w-20 h-20 rounded-[2rem] bg-espresso/5 flex items-center justify-center group-hover/add:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-5xl">add_circle</span>
                            </div>
                            Inject Assessment Node
                        </button>
                    </div>
                )}

                {/* ASSIGNMENTS TAB */}
                {activeTab === 'assignments' && (
                    <div className="space-y-10">
                        <div className="bg-espresso text-white p-6 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                            <div className="relative z-10 flex flex-col md:flex-row gap-4 md:gap-8 items-start">
                                <div className="p-3 md:p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                                    <span className="material-symbols-outlined text-3xl md:text-4xl">verified_user</span>
                                </div>
                                <div className="space-y-2 md:space-y-4">
                                    <h3 className="font-serif font-black text-xl md:text-3xl leading-none">Access Control</h3>
                                    <p className="text-white/60 text-[11px] md:text-sm font-medium max-w-xl leading-relaxed">
                                        Configure student access privileges. Authorized personnel will retain access to this logic block indefinitely until revocation.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 md:gap-6 bg-white/40 dark:bg-black/20 p-4 md:p-6 rounded-3xl border border-espresso/10">
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={grantQuizAccessToCompleted}
                                        className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-white text-espresso font-black uppercase tracking-[0.2em] text-[8px] md:text-[10px] rounded-xl hover:bg-espresso hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px] md:text-[18px]">auto_fix</span>
                                        Grant Quiz Access
                                    </button>

                                    <button
                                        onClick={async () => {
                                            if (!window.confirm("Assign this module to ALL fetched students?")) return;
                                            const allStudentIds = students.map(s => s.id);
                                            setAssignedStudents(allStudentIds);
                                            try {
                                                await updateDoc(doc(db, 'courses', courseId, 'modules', moduleId), {
                                                    assignedStudents: allStudentIds
                                                });
                                                alert(`Successfully assigned module to ${allStudentIds.length} students.`);
                                            } catch (error) {
                                                console.error("Sync Error:", error);
                                                alert("Failed to assign all: " + error.message);
                                            }
                                        }}
                                        className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-espresso/10 text-espresso font-black uppercase tracking-[0.2em] text-[8px] md:text-[10px] rounded-xl hover:bg-espresso hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px] md:text-[18px]">group_add</span>
                                        Assign All
                                    </button>

                                    <button
                                        onClick={resetProgressForAll}
                                        className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-red-500/10 text-red-600 border border-red-500/20 font-black uppercase tracking-[0.2em] text-[8px] md:text-[10px] rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 group/reset"
                                    >
                                        <span className="material-symbols-outlined text-[16px] md:text-[18px] group-hover/reset:rotate-180 transition-transform duration-500">restart_alt</span>
                                        Reset All
                                    </button>
                                </div>

                                <div className="h-8 w-px bg-espresso/10 hidden lg:block" />

                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                    <span className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-espresso/40 shrink-0">Filter:</span>
                                    {[0, 50, 70, 100].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setFilterThreshold(val)}
                                            className={cn(
                                                "px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[7px] md:text-[9px] font-black uppercase tracking-tighter transition-all border shrink-0",
                                                filterThreshold === val
                                                    ? "bg-espresso text-white border-espresso"
                                                    : "bg-white/40 text-espresso/40 border-espresso/5 hover:border-espresso/20"
                                            )}
                                        >
                                            {val === 0 ? 'All' : `${val}%+`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-8 w-px bg-espresso/10 hidden xl:block" />

                            <div className="flex-1 relative group max-w-md">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-espresso/30">
                                    <span className="material-symbols-outlined text-[18px] md:text-[20px]">search</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="SEARCH STUDENT..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/40 dark:bg-black/20 border border-espresso/10 rounded-xl px-10 py-2.5 text-[9px] md:text-[11px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-espresso transition-all placeholder:text-espresso/20"
                                />
                            </div>

                            <div className="h-8 w-px bg-espresso/10 hidden xl:block" />

                            <div className="flex items-center justify-between md:justify-end gap-3 border-t border-espresso/5 pt-4 xl:border-none xl:pt-0">
                                <span className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-espresso/40">Sort Progress:</span>
                                <button
                                    onClick={() => setSortConfig({ key: 'progress', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                    className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/40 border border-espresso/5 flex items-center justify-center text-espresso/60 hover:border-espresso/20 transition-all shadow-sm active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-lg md:text-xl">
                                        {sortConfig.direction === 'asc' ? 'keyboard_double_arrow_up' : 'keyboard_double_arrow_down'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/40 dark:bg-black/20 rounded-[2rem] md:rounded-[2.5rem] border border-espresso/10 overflow-hidden shadow-xl">
                            <div className="max-h-[600px] overflow-auto no-scrollbar custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead className="bg-white/40 dark:bg-black/40 border-b border-espresso/10 sticky top-0 z-10 backdrop-blur-md">
                                        <tr>
                                            <th className="px-4 md:px-8 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40">Student Identity</th>
                                            <th className="px-4 md:px-8 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40">Contact Point</th>
                                            <th className="px-4 md:px-8 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 text-center">Module Permit</th>
                                            <th className="px-4 md:px-8 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 text-center">Quiz Permit</th>
                                            <th className="px-4 md:px-8 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 text-center">Progress</th>
                                            <th className="px-4 md:px-8 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 text-center">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-espresso/5">
                                        {filteredAndSortedStudents.map(student => {
                                            const progress = studentProgress[student.id];
                                            const status = progress?.status;
                                            const lastSlide = progress?.lastSlideIndex ?? -1;
                                            const totalSlides = slides.length;
                                            const percentRead = totalSlides > 0 ? Math.min(100, Math.round(((lastSlide + 1) / totalSlides) * 100)) : 0;
                                            const score = progress?.score !== undefined ? `${progress.score.toFixed(0)}%` : '-';
                                            const hasRequestedQuiz = progress?.quizRequested;
                                            const isQuizAllowed = quizAllowedStudents.includes(student.id);

                                            return (
                                                <tr key={student.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => toggleAssignment(student.id)}>
                                                    <td className="px-4 md:px-8 py-4 md:py-5">
                                                        <div className="flex items-center gap-3 md:gap-4">
                                                            <div className="size-8 md:size-10 rounded-full bg-espresso/5 flex items-center justify-center font-black text-espresso text-[11px] md:text-sm">
                                                                {(student.fullName || student.name || student.email)?.charAt(0)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-espresso dark:text-white text-xs md:text-base leading-tight">{student.fullName || student.name || 'Unknown'}</span>
                                                                <span className="text-[7px] md:text-[8px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest">{student.id}</span>
                                                                {hasRequestedQuiz && !isQuizAllowed && (
                                                                    <span className="text-[6px] font-black bg-amber-500 text-white px-1 py-0.5 rounded uppercase tracking-tighter w-fit mt-0.5">Quiz Requested</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-8 py-4 md:py-5 text-[11px] md:text-sm font-medium text-espresso/60">{student.email}</td>
                                                    <td className="px-4 md:px-8 py-4 md:py-5 text-center">
                                                        <div className={cn(
                                                            "size-6 md:size-8 rounded-lg md:rounded-xl border flex items-center justify-center transition-all mx-auto",
                                                            assignedStudents.includes(student.id)
                                                                ? "bg-espresso border-espresso text-white scale-110 shadow-lg"
                                                                : "border-espresso/20 text-transparent opacity-50"
                                                        )}>
                                                            <span className="material-symbols-outlined text-[16px] md:text-[20px] font-bold">check</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-8 py-4 md:py-5 text-center">
                                                        <div onClick={(e) => toggleQuizAccess(e, student.id)} className={cn(
                                                            "size-6 md:size-8 rounded-lg md:rounded-xl border flex items-center justify-center transition-all mx-auto z-20 relative hover:scale-110",
                                                            isQuizAllowed
                                                                ? "bg-green-600 border-green-600 text-white scale-110 shadow-lg"
                                                                : hasRequestedQuiz ? "bg-amber-100 border-amber-500 text-amber-600 opacity-100" : "border-espresso/20 text-transparent opacity-50 hover:opacity-100 hover:text-espresso/40"
                                                        )}>
                                                            <span className="material-symbols-outlined text-[16px] md:text-[20px] font-bold">
                                                                {isQuizAllowed ? 'lock_open' : hasRequestedQuiz ? 'notification_important' : 'lock'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-8 py-4 md:py-5 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className="w-16 md:w-24 h-1 md:h-1.5 bg-espresso/5 rounded-full overflow-hidden shadow-inner">
                                                                <div className={cn(
                                                                    "h-full transition-all duration-1000",
                                                                    percentRead === 100 ? "bg-green-500" : "bg-espresso"
                                                                )} style={{ width: `${percentRead}%` }} />
                                                            </div>
                                                            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-espresso/40">
                                                                {percentRead}% {status === 'completed' && '• Cert'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-8 py-4 md:py-5 text-center font-black text-[11px] md:text-base text-espresso">{score}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main >
        </div >
    );
}
