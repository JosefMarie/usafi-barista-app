import React, { useState, useEffect } from 'react';
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

// --- Sortable Slide Item Component ---
function SortableSlideItem({ slide, index, contentType, updateSlide, removeSlide, handleImageUpload, activeId }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: slide.id || `slide-${index}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1,
    };

    // Helper to update specific media item
    const updateMediaCaption = (mIndex, val) => {
        const newMedia = [...(slide.media || [])];
        newMedia[mIndex].caption = val;
        updateSlide(index, 'media', newMedia);
    };

    const removeMediaItem = (mIndex) => {
        const newMedia = (slide.media || []).filter((_, i) => i !== mIndex);
        updateSlide(index, 'media', newMedia);
    };

    // --- Renders for different Slide Types ---

    // 1. STANDARD TYPE (Title + Text + Multi-Media Gallery)
    const renderStandard = () => (
        <div className="space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-start sm:items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-espresso text-white flex items-center justify-center font-black text-base md:text-lg shadow-xl shadow-espresso/20 font-serif shrink-0 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                    {index + 1}
                </div>
                <div className="flex-1 w-full">
                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-1 md:mb-2 ml-1">Slide Identification (Standard)</label>
                    <input
                        className="w-full text-lg md:text-2xl font-serif font-black bg-transparent border-b-2 border-espresso/5 focus:border-espresso outline-none px-1 py-1.5 md:py-2 text-espresso dark:text-white transition-all"
                        placeholder="Initialize title..."
                        value={slide.title}
                        onChange={(e) => updateSlide(index, 'title', e.target.value)}
                    />
                </div>
            </div>
            <div className="space-y-2 md:space-y-3">
                <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 ml-1">Rich Narrative Content</label>
                <div className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-espresso/10 bg-white/20 dark:bg-black/20 shadow-inner">
                    <RichTextEditor
                        value={slide.text}
                        onChange={(val) => updateSlide(index, 'text', val)}
                        placeholder="Synthesize slide narrative..."
                        className="border-none"
                        minHeight="150px"
                    />
                </div>
            </div>

            {/* Multi-Media Gallery */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 ml-1">Visual Assets</label>
                    <label className="cursor-pointer px-4 py-2 bg-espresso text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-espresso/80 transition-all flex items-center gap-2 shadow-lg">
                        <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                        Add Media
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(index, e)} />
                    </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(slide.media || []).map((item, mIndex) => (
                        <div key={mIndex} className="group relative bg-white dark:bg-black/20 rounded-2xl overflow-hidden border border-espresso/10 shadow-sm hover:shadow-md transition-all">
                            <div className="aspect-square bg-gray-100 dark:bg-white/5 relative">
                                <img src={item.url} alt="" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => removeMediaItem(mIndex)}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                            <div className="p-2">
                                <input
                                    className="w-full bg-transparent border-b border-transparent focus:border-espresso/20 text-[10px] font-medium placeholder:text-espresso/30 focus:outline-none py-1 transition-all text-center"
                                    placeholder="Caption..."
                                    value={item.caption || ''}
                                    onChange={(e) => updateMediaCaption(mIndex, e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                    {(slide.media || []).length === 0 && (
                        <div className="col-span-full py-8 text-center border-2 border-dashed border-espresso/10 rounded-2xl text-espresso/30 text-xs italic">
                            No visual assets appended.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // 2. MEDIA TYPE (Title, Text on Left, Media Gallery on Right)
    const renderMedia = () => (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-start sm:items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-espresso text-white flex items-center justify-center font-black text-base md:text-lg shadow-xl shadow-espresso/20 font-serif shrink-0 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                    {index + 1}
                </div>
                <div className="flex-1 w-full">
                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-1 md:mb-2 ml-1">Slide Identification (Media Layout)</label>
                    <input
                        className="w-full text-lg md:text-2xl font-serif font-black bg-transparent border-b-2 border-espresso/5 focus:border-espresso outline-none px-1 py-1.5 md:py-2 text-espresso dark:text-white transition-all"
                        placeholder="Initialize title..."
                        value={slide.title}
                        onChange={(e) => updateSlide(index, 'title', e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Left: Text Content */}
                <div className="space-y-2 md:space-y-3 flex flex-col">
                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 ml-1">Contextual Narrative</label>
                    <div className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-espresso/10 bg-white/20 dark:bg-black/20 shadow-inner flex-1 min-h-[300px]">
                        <RichTextEditor
                            value={slide.text}
                            onChange={(val) => updateSlide(index, 'text', val)}
                            placeholder="Add slide context..."
                            className="border-none h-full"
                            minHeight="100%"
                        />
                    </div>
                </div>

                {/* Right: Multi-Media Gallery */}
                <div className="space-y-2 md:space-y-3 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 ml-1">Media Canvas</label>
                        <label className="cursor-pointer px-3 py-1.5 bg-espresso text-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-espresso/80 transition-all flex items-center gap-1.5 shadow-md">
                            <span className="material-symbols-outlined text-[14px]">add_photo_alternate</span>
                            Add
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(index, e)} />
                        </label>
                    </div>

                    <div className="flex-1 min-h-[300px] bg-white/40 dark:bg-black/10 rounded-[2rem] border border-espresso/10 p-4 space-y-4">
                        {(slide.media || []).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-espresso/30 border-2 border-dashed border-espresso/10 rounded-2xl">
                                <span className="material-symbols-outlined text-4xl mb-2">perm_media</span>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Canvas Empty</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(slide.media || []).map((item, mIndex) => (
                                    <div key={mIndex} className="group relative bg-white dark:bg-white/5 rounded-xl overflow-hidden shadow-sm border border-espresso/5">
                                        <div className="aspect-video bg-black/10 relative">
                                            <img src={item.url} alt="" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removeMediaItem(mIndex)}
                                                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        </div>
                                        <div className="p-2">
                                            <input
                                                className="w-full bg-transparent border-b border-transparent focus:border-espresso/20 text-[10px] font-medium placeholder:text-espresso/30 focus:outline-none py-1 transition-all"
                                                placeholder="Caption..."
                                                value={item.caption || ''}
                                                onChange={(e) => updateMediaCaption(mIndex, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );


    return (
        <div ref={setNodeRef} style={style} className="bg-white/40 dark:bg-black/20 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-espresso/10 relative overflow-hidden group/slide shadow-2xl">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/10 group-hover/slide:bg-espresso transition-colors"></div>

            {/* Delete Button */}
            <button onClick={() => removeSlide(index)} className="absolute top-4 md:top-8 right-4 md:right-8 text-espresso/20 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50 z-20">
                <span className="material-symbols-outlined text-[20px] md:text-[24px]">delete_sweep</span>
            </button>

            {/* Type Indicator */}
            <div className="absolute top-0 right-16 md:right-20 px-4 py-1.5 md:py-2 bg-white/40 rounded-b-xl border-x border-b border-espresso/5 shadow-sm">
                <span className="text-[8px] font-black uppercase tracking-widest text-espresso/40">
                    {slide.type === 'media' ? 'Media Layout' : 'Standard Layout'}
                </span>
            </div>

            {slide.type === 'media' ? renderMedia() : renderStandard()}
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
    const [slides, setSlides] = useState([]);
    const [summarySlides, setSummarySlides] = useState([]);
    const [contentType, setContentType] = useState('full'); // full, summary

    // Quiz State
    const [quiz, setQuiz] = useState({ questions: [], passMark: 70 });

    // Assignments State
    const [students, setStudents] = useState([]);
    const [assignedStudents, setAssignedStudents] = useState([]);

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

                    // Normalize slides to include ID for DnD and migrate legacy Image string to Media array
                    const content = (data.content || []).map((s, i) => {
                        let media = s.media || [];
                        // Migration Logic: If legacy image exists and no media, move it
                        if (s.image && media.length === 0) {
                            media = [{ url: s.image, caption: '' }];
                        }
                        return {
                            ...s,
                            id: s.id || `slide-${Date.now()}-${i}`,
                            type: s.type || 'standard',
                            media: media
                        };
                    });
                    setSlides(content);

                    setSummarySlides(data.summaryContent || []);
                    setQuiz(data.quiz || { questions: [], passMark: 70 });
                    setAssignedStudents(data.assignedStudents || []);
                    setDuration(data.duration || 0);
                } else {
                    // Create if not exists (fallback) or redirect
                    console.log("Module not found, creating placeholder in memory");
                    setModule({ id: moduleId, title: 'New Module', status: 'draft' });
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

    // Fetch Progress when Assignments tab is active
    useEffect(() => {
        const fetchProgress = async () => {
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
        };
        fetchProgress();
    }, [activeTab, assignedStudents, moduleId]);


    // --- Content Handlers ---
    const addSlide = (type = 'standard') => {
        if (contentType === 'full') {
            setSlides([...slides, {
                id: `slide-${Date.now()}`,
                type: type,
                title: '',
                text: '',
                media: [] // Initialize with empty media array
            }]);
        } else {
            setSummarySlides([...summarySlides, { title: '', text: '', image: '' }]);
        }
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
        if (active.id !== over.id) {
            setSlides((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // --- Image Upload Handler ---
    const handleImageUpload = async (index, event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // 1. Compress the image
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };
            const compressedFile = await imageCompression(file, options);

            // 2. Upload to Firebase Storage
            const storageRef = ref(storage, `module-content/${courseId}/${moduleId}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, compressedFile);

            // 3. Get Download URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            // 4. Update Slide State (Append to Media Array)
            const currentSlide = slides[index];
            const currentMedia = currentSlide.media || [];
            updateSlide(index, 'media', [...currentMedia, { url: downloadURL, caption: '' }]);

        } catch (error) {
            console.error("Error uploading image:", error);
            alert(`Failed to upload image: ${error.message}`);
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
    const toggleAssignment = (studentId) => {
        if (assignedStudents.includes(studentId)) {
            setAssignedStudents(prev => prev.filter(id => id !== studentId));
        } else {
            setAssignedStudents(prev => [...prev, studentId]);
        }
    };

    // --- Save Handler ---
    const handleSave = async () => {
        try {
            setLoading(true);
            const modRef = doc(db, 'courses', courseId, 'modules', moduleId);

            // Clean slides before saving to remove legacy 'image' field if mapped to 'media' already? 
            // Actually, we can keep it optional for safety or just save 'media'. 
            // Let's save both for now or just trust new structure. 
            // To be clean, let's just save the new structure.

            await updateDoc(modRef, {
                title: module.title, // Save Title
                content: slides,
                summaryContent: summarySlides,
                quiz: quiz,
                assignedStudents: assignedStudents,
                duration: parseInt(duration),
                updatedAt: serverTimestamp()
            });
            alert('Changes saved successfully!');
        } catch (error) {
            console.error("Error saving module:", error);
            alert('Error saving changes.');
        } finally {
            setLoading(false);
        }
    };

    const togglePublish = async () => {
        const newStatus = module.status === 'published' ? 'draft' : 'published';
        try {
            await updateDoc(doc(db, 'courses', courseId, 'modules', moduleId), { status: newStatus });
            setModule(prev => ({ ...prev, status: newStatus }));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Module...</div>;

    return (
        <div className="flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#F5DEB3]/90 dark:bg-[#1c1916]/90 backdrop-blur-md border-b border-espresso/10 px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20"></div>
                <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                    <button
                        onClick={() => navigate(`/admin/courses/${courseId}`)}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/40 hover:bg-espresso hover:text-white transition-all flex items-center justify-center active:scale-95 shadow-sm group shrink-0"
                    >
                        <span className="material-symbols-outlined text-[20px] md:text-[24px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    </button>
                    <div className="flex-1 w-full">
                        {/* Editable Title */}
                        <input
                            className="w-full text-xl md:text-3xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none bg-transparent outline-none border-b border-transparent focus:border-espresso/20 transition-colors"
                            value={module?.title || ''}
                            onChange={(e) => setModule({ ...module, title: e.target.value })}
                        />
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-1 md:mt-2">Instructional Logic Controller</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 md:gap-4 w-full md:w-auto">
                    <button
                        onClick={togglePublish}
                        className={cn(
                            "flex-1 md:flex-none px-4 md:px-8 py-2.5 md:py-3.5 font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] rounded-xl md:rounded-2xl transition-all border shadow-sm active:scale-95 flex items-center justify-center gap-2",
                            module?.status === 'published'
                                ? "bg-white text-green-600 border-green-200 hover:bg-green-50"
                                : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50"
                        )}
                    >
                        <span className="material-symbols-outlined text-[16px] md:text-[18px]">
                            {module?.status === 'published' ? 'verified' : 'pending'}
                        </span>
                        {module?.status === 'published' ? 'PRODUCTION LIVE' : 'DRAFT PROTOCOL'}
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 md:flex-none px-4 md:px-8 py-2.5 md:py-3.5 bg-espresso text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[16px] md:text-[18px]">synchronized</span>
                        Sync State
                    </button>
                </div>
            </header>

            {/* Tabs - FORCED VISIBILITY (Removed Sticky) */}
            <div className="flex items-center justify-center min-h-[60px] border-y border-espresso/10 px-2 md:px-4 bg-white/20 dark:bg-black/20 relative z-10 overflow-x-auto no-scrollbar w-full mb-6 py-4">
                {['content', 'quiz', 'assignments'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-6 md:px-8 py-3 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all relative group whitespace-nowrap mx-3",
                            activeTab === tab
                                ? "bg-espresso text-white shadow-lg scale-100"
                                : "text-espresso/60 dark:text-white/60 hover:bg-white/40 hover:text-espresso"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <main className="p-10  w-full pb-32">

                {/* CONTENT TAB */}
                {activeTab === 'content' && (
                    <div className="space-y-6 md:space-y-10">
                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/40 dark:bg-black/20 p-6 md:p-8 rounded-[2rem] border border-espresso/10 shadow-xl relative overflow-hidden group/meta">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/10 group-hover/meta:bg-espresso transition-colors"></div>
                            <div className="flex flex-col sm:flex-row sm:items-center xl:items-start gap-4 md:gap-6 w-full xl:w-auto">
                                <div className="flex-1">
                                    <h2 className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] flex items-center gap-3 mb-2">
                                        <span className="w-6 h-px bg-espresso/20"></span>
                                        Node Attributes
                                    </h2>
                                    <p className="text-lg md:text-xl font-serif font-black text-espresso dark:text-white">Instructional Narrative & Media Assets</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => setContentType('full')}
                                        className={cn(
                                            "flex-1 sm:flex-none px-3 md:px-4 py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border whitespace-nowrap",
                                            contentType === 'full'
                                                ? "bg-espresso text-white border-espresso shadow-lg"
                                                : "bg-white/40 text-espresso/60 border-espresso/10 hover:bg-white"
                                        )}
                                    >
                                        Full Notes
                                    </button>
                                    <button
                                        onClick={() => setContentType('summary')}
                                        className={cn(
                                            "flex-1 sm:flex-none px-3 md:px-4 py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border whitespace-nowrap",
                                            contentType === 'summary'
                                                ? "bg-espresso text-white border-espresso shadow-lg"
                                                : "bg-white/40 text-espresso/60 border-espresso/10 hover:bg-white"
                                        )}
                                    >
                                        Summary
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 w-full xl:w-auto">
                                <div className="flex items-center justify-between sm:justify-start gap-4 bg-white/40 dark:bg-black/20 px-4 md:px-6 py-3 rounded-xl md:rounded-2xl border border-espresso/5 shadow-inner w-full sm:w-auto">
                                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-espresso/40 whitespace-nowrap">Duration:</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            className="w-12 md:w-16 bg-transparent text-center font-black text-espresso dark:text-white text-sm outline-none"
                                        />
                                        <span className="text-[8px] md:text-[9px] font-black uppercase text-espresso/30">MIN</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button onClick={() => addSlide('standard')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-espresso text-white px-4 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all">
                                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                        Standard Slide
                                    </button>
                                    <button onClick={() => addSlide('media')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-espresso border border-espresso/10 px-4 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] shadow-lg active:scale-95 transition-all">
                                        <span className="material-symbols-outlined text-[18px]">image</span>
                                        Media Slide
                                    </button>
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
                                    items={slides.map(s => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {slides.map((slide, index) => (
                                        <SortableSlideItem
                                            key={slide.id}
                                            slide={slide}
                                            index={index}
                                            contentType={contentType}
                                            updateSlide={updateSlide}
                                            removeSlide={removeSlide}
                                            handleImageUpload={handleImageUpload}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        ) : (
                            // Summary Slides (Not draggable needed yet, or use same pattern if needed)
                            <div className="space-y-6">
                                {summarySlides.map((slide, index) => (
                                    <div key={index} className="bg-white/40 dark:bg-black/20 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-espresso/10 relative overflow-hidden group/slide shadow-2xl">
                                        {/* ... Simplified Summary Render can just be a subset of Standard ... */}
                                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/10 group-hover/slide:bg-espresso transition-colors"></div>
                                        <button onClick={() => removeSlide(index)} className="absolute top-4 md:top-8 right-4 md:right-8 text-espresso/20 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50">
                                            <span className="material-symbols-outlined text-[20px] md:text-[24px]">delete_sweep</span>
                                        </button>
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-black font-serif text-espresso">Summary Point {index + 1}</h3>
                                            <RichTextEditor
                                                value={slide.text}
                                                onChange={(val) => updateSlide(index, 'text', val)}
                                                placeholder="Summary content..."
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                        <div className="flex flex-col sm:flex-row justify-between items-center bg-espresso text-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-espresso/20 relative overflow-hidden group/score gap-6">
                            <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/5 skew-x-12 translate-x-16 group-hover/score:translate-x-12 transition-transform duration-700"></div>
                            <div className="text-center sm:text-left z-10">
                                <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] mb-2 md:mb-3 text-white/60">Integrity Threshold</h3>
                                <p className="text-xl md:text-2xl font-serif font-black tracking-tight">Certification Pass Protocol</p>
                            </div>
                            <div className="flex items-center gap-4 bg-white/10 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl border border-white/20 shadow-inner group-hover/score:scale-105 transition-transform z-10">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={quiz.passMark}
                                    onChange={(e) => setQuiz({ ...quiz, passMark: parseInt(e.target.value) })}
                                    className="w-16 md:w-20 bg-transparent text-center font-black text-2xl md:text-3xl outline-none"
                                />
                                <span className="font-serif font-black text-xl md:text-2xl text-white/40">%</span>
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
                            <div key={qIndex} className="bg-white/40 dark:bg-black/20 p-10 rounded-[2.5rem] border border-espresso/10 relative overflow-hidden shadow-2xl group/q animate-in fade-in slide-in-from-bottom-4">
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover/q:bg-espresso transition-colors"></div>
                                <button onClick={() => removeQuestion(qIndex)} className="absolute top-8 right-8 text-espresso/20 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50">
                                    <span className="material-symbols-outlined text-[24px]">delete_sweep</span>
                                </button>
                                <div className="mb-8 md:mb-10 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
                                    <div className="md:col-span-3">
                                        <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-2 md:mb-3 ml-1">Query Designation {qIndex + 1}</label>
                                        <input
                                            className="w-full px-5 md:px-6 py-3.5 md:py-4 text-base md:text-lg font-serif font-black bg-white/20 dark:bg-black/20 border border-espresso/10 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-espresso shadow-inner text-espresso dark:text-white transition-all"
                                            placeholder="Specify query protocol..."
                                            value={q.question}
                                            onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-2 md:mb-3 ml-1">Time Delta (Sec)</label>
                                        <input
                                            type="number"
                                            className="w-full px-5 md:px-6 py-3.5 md:py-4 font-black text-center bg-white/20 dark:bg-black/20 border border-espresso/10 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-espresso shadow-inner text-espresso dark:text-white transition-all"
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
                        <div className="bg-espresso text-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                            <div className="relative z-10 flex flex-col sm:flex-row gap-8 items-start">
                                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                                    <span className="material-symbols-outlined text-4xl">verified_user</span>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-serif font-black text-2xl md:text-3xl leading-none">Access Control</h3>
                                    <p className="text-white/60 text-sm font-medium max-w-xl leading-relaxed">
                                        Configure student access privileges. Authorized personnel will retain access to this logic block indefinitely until revocation.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/40 dark:bg-black/20 rounded-[2.5rem] border border-espresso/10 overflow-hidden shadow-xl">
                            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white/40 dark:bg-black/40 border-b border-espresso/10 sticky top-0 z-10 backdrop-blur-md">
                                        <tr>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40">Student Identity</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40">Contact Point</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 text-center">Permit</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 text-center">Progress</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 text-center">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-espresso/5">
                                        {students.map(student => {
                                            const progress = studentProgress[student.id];
                                            const completed = progress?.completed || false;
                                            const score = progress?.quizScore !== undefined ? `${progress.quizScore}%` : '-';

                                            return (
                                                <tr key={student.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => toggleAssignment(student.id)}>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-espresso/5 flex items-center justify-center font-black text-espresso text-sm">
                                                                {student.name?.charAt(0) || student.email?.charAt(0)}
                                                            </div>
                                                            <span className="font-bold text-espresso dark:text-white">{student.name || 'Unknown'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-sm font-medium text-espresso/60">{student.email}</td>
                                                    <td className="px-8 py-5 text-center">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all mx-auto",
                                                            assignedStudents.includes(student.id)
                                                                ? "bg-espresso border-espresso text-white scale-110 shadow-lg"
                                                                : "border-espresso/20 text-transparent opacity-50"
                                                        )}>
                                                            <span className="material-symbols-outlined text-[20px] font-bold">check</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        {completed ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-100/50 text-green-700 text-[9px] font-black uppercase tracking-widest border border-green-200">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                                Complete
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-espresso/20">Pending</span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5 text-center font-black text-espresso">{score}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
