import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import imageCompression from 'browser-image-compression';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { RichTextEditor } from '../../components/common/RichTextEditor';

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
                    setSlides(data.content || []);
                    setSummarySlides(data.summaryContent || []);
                    setQuiz(data.quiz || { questions: [], passMark: 70 });
                    setAssignedStudents(data.assignedStudents || []);
                    setDuration(data.duration || 0);
                } else {
                    // Create if not exists (fallback) or redirect
                    console.log("Module not found, creating placeholder in memory");
                    setModule({ id: moduleId, title: 'Loading...', status: 'draft' });
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
    const addSlide = () => {
        if (contentType === 'full') {
            setSlides([...slides, { title: '', text: '', image: '' }]);
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

            // 4. Update Slide State
            updateSlide(index, 'image', downloadURL);

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
            await updateDoc(modRef, {
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
                <div className="flex items-center gap-4 md:gap-6">
                    <button
                        onClick={() => navigate(`/admin/courses/${courseId}`)}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/40 hover:bg-espresso hover:text-white transition-all flex items-center justify-center active:scale-95 shadow-sm group"
                    >
                        <span className="material-symbols-outlined text-[20px] md:text-[24px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl md:text-3xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none break-all">{module?.title}</h1>
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

            {/* Tabs */}
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
                                <button onClick={addSlide} className="w-full sm:w-auto flex items-center justify-center gap-3 bg-espresso text-white px-6 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all group/add">
                                    <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform">add_circle</span>
                                    Insert Slide
                                </button>
                            </div>
                        </div>

                        {(contentType === 'full' ? slides : summarySlides).map((slide, index) => (
                            <div key={index} className="bg-white/40 dark:bg-black/20 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-espresso/10 relative overflow-hidden group/slide shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/10 group-hover/slide:bg-espresso transition-colors"></div>
                                <button onClick={() => removeSlide(index)} className="absolute top-4 md:top-8 right-4 md:right-8 text-espresso/20 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50">
                                    <span className="material-symbols-outlined text-[20px] md:text-[24px]">delete_sweep</span>
                                </button>
                                <div className="space-y-6 md:space-y-8">
                                    <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-start sm:items-center">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-espresso text-white flex items-center justify-center font-black text-base md:text-lg shadow-xl shadow-espresso/20 font-serif shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 w-full">
                                            <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 mb-1 md:mb-2 ml-1">Slide Identification</label>
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
                                    <div className="space-y-2 md:space-y-3">
                                        <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 ml-1">Visual Asset Synchronization</label>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <div className="flex-1 relative group/upload">
                                                <div className="absolute inset-0 bg-white/20 dark:bg-black/20 border border-espresso/10 rounded-xl md:rounded-2xl flex items-center px-4 pointer-events-none">
                                                    <span className="text-xs md:text-sm font-medium text-espresso/60 dark:text-white/60 truncate">
                                                        {slide.image ? "Image Asset Uploaded" : "Upload Visual Asset..."}
                                                    </span>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(index, e)}
                                                    className="w-full h-full opacity-0 py-4 cursor-pointer"
                                                />
                                            </div>
                                            {slide.image && (
                                                <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl overflow-hidden border-2 border-espresso/20 shadow-xl group/preview relative shrink-0">
                                                    <img src={slide.image} alt="Preview" className="h-full w-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                                        <div className="grid grid-cols-1 gap-4">
                                            {q.pairs.map((pair, pIndex) => (
                                                <div key={pIndex} className="flex gap-4 group/pair items-center bg-white/10 p-4 rounded-2xl border border-espresso/5 shadow-inner">
                                                    <input
                                                        className="flex-1 px-4 py-3 text-xs font-bold bg-transparent border-b border-espresso/10 outline-none text-espresso dark:text-white"
                                                        placeholder="Signal A"
                                                        value={pair.key}
                                                        onChange={(e) => updatePair(qIndex, pIndex, 'key', e.target.value)}
                                                    />
                                                    <div className="w-10 h-10 rounded-full bg-espresso/5 flex items-center justify-center text-espresso/20">
                                                        <span className="material-symbols-outlined text-[20px]">sync_alt</span>
                                                    </div>
                                                    <input
                                                        className="flex-1 px-4 py-3 text-xs font-bold bg-transparent border-b border-espresso/10 outline-none text-espresso dark:text-white"
                                                        placeholder="Signal B"
                                                        value={pair.value}
                                                        onChange={(e) => updatePair(qIndex, pIndex, 'value', e.target.value)}
                                                    />
                                                    <button onClick={() => removePair(qIndex, pIndex)} className="w-10 h-10 rounded-xl text-red-400 hover:bg-red-50 transition-colors">
                                                        <span className="material-symbols-outlined text-[20px]">close</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => addPair(qIndex)} className="px-6 py-3 bg-espresso/5 text-espresso text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-espresso hover:text-white transition-all flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">add_link</span> Insert Relational Pair
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ASSIGNMENTS TAB */}
                {activeTab === 'assignments' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-espresso text-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-espresso/20 relative overflow-hidden group/intel">
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-white/20"></div>
                            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-start">
                                <span className="material-symbols-outlined text-3xl md:text-4xl text-white/40 shrink-0">security</span>
                                <div>
                                    <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] mb-2 md:mb-3 text-white/60">Logic Override Protocol</h3>
                                    <p className="text-xs md:text-sm font-medium leading-relaxed max-w-2xl text-white/80 italic">
                                        Sequential access is naturally enforced by the curriculum engine. Manual assignment here bypasses standard progression requirements for the selected participants. Use with caution.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/40 dark:bg-black/20 rounded-[2rem] md:rounded-[3rem] border border-espresso/10 overflow-hidden shadow-2xl overflow-x-auto no-scrollbar">
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="bg-white/40 dark:bg-black/40 border-b border-espresso/10">
                                    <tr>
                                        <th className="px-6 md:px-8 py-5 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40">Participant Profile</th>
                                        <th className="px-6 md:px-8 py-5 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40">Endpoint</th>
                                        <th className="px-6 md:px-8 py-5 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40">Operational Status</th>
                                        <th className="px-6 md:px-8 py-5 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 text-center">Access Grant</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-espresso/5">
                                    {students.map(student => {
                                        const prog = studentProgress[student.id];
                                        return (
                                            <tr key={student.id} className="hover:bg-white/40 dark:hover:bg-black/40 transition-colors group/row">
                                                <td className="px-6 md:px-8 py-5 md:py-6">
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-espresso/10 overflow-hidden border border-espresso/5 shadow-sm group-hover/row:scale-110 transition-transform shrink-0">
                                                            <img src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName || 'S')}`} alt="" className="h-full w-full object-cover" />
                                                        </div>
                                                        <span className="font-serif font-black text-espresso dark:text-white text-base md:text-lg tracking-tight truncate max-w-[150px] md:max-w-none">{student.fullName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 md:px-8 py-5 md:py-6 text-xs md:text-sm font-medium text-espresso/60 dark:text-white/60 tracking-tight">{student.email}</td>
                                                <td className="px-6 md:px-8 py-5 md:py-6">
                                                    {prog ? (
                                                        <div className={cn(
                                                            "inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest border shadow-inner",
                                                            prog.passed ? "bg-green-50/50 text-green-700 border-green-200" : "bg-red-50/50 text-red-700 border-red-200"
                                                        )}>
                                                            <span className="material-symbols-outlined text-[12px] md:text-[14px]">{prog.passed ? 'verified' : 'cancel'}</span>
                                                            {prog.passed ? 'VERIFIED' : 'DEFICIENT'} ({Math.round(prog.score)}%)
                                                        </div>
                                                    ) : (
                                                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-espresso/20 italic">No Data</span>
                                                    )}
                                                </td>
                                                <td className="px-6 md:px-8 py-5 md:py-6 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={assignedStudents.includes(student.id)}
                                                        onChange={() => toggleAssignment(student.id)}
                                                        className="w-5 h-5 md:w-6 md:h-6 rounded-lg border-espresso/20 text-espresso focus:ring-espresso accent-espresso cursor-pointer"
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}


