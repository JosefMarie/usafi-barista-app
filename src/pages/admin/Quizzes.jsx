import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, collectionGroup, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

export function Quizzes() {
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'results'
    const [loading, setLoading] = useState(true);

    // Editor State
    const [questions, setQuestions] = useState([
        { id: 1, text: 'What is the ideal extraction time for a standard espresso shot?', answer: '25-30 seconds', options: ['15-20 seconds', '25-30 seconds', '35-40 seconds'] },
        { id: 2, text: 'Which roast level is typically preferred for traditional espresso?', answer: 'Medium-Dark Roast', options: ['Light Roast', 'Medium-Dark Roast', 'Dark Roast'] },
        { id: 3, text: 'What is the correct tamping pressure?', answer: '30 lbs', options: ['10 lbs', '20 lbs', '30 lbs'] },
    ]);

    // Results State
    const [results, setResults] = useState([]); // Array of { studentId, studentName, modules: { [moduleId]: { name, attempts, score, passed, date } } }
    const [expandedStudents, setExpandedStudents] = useState(new Set());
    const [modules, setModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const toggleStudent = (id) => {
        const newSet = new Set(expandedStudents);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedStudents(newSet);
    };

    const grantAccess = async (studentId, moduleId) => {
        try {
            const progressRef = doc(db, 'users', studentId, 'progress', moduleId);
            const progSnap = await getDoc(progressRef);
            if (!progSnap.exists()) {
                alert("Could not find progress data for this student/module.");
                return;
            }
            const progData = progSnap.data();
            const cid = progData.courseId;
            if (!cid) {
                alert("Course ID missing in progress data.");
                return;
            }

            await updateDoc(progressRef, {
                quizRequested: false,
                isAuthorized: true, // RESET PERMISSION SLOT
                attempts: 0, // Reset attempts to 0 so they get 3 more
                updatedAt: serverTimestamp()
            });

            const moduleRef = doc(db, 'courses', cid, 'modules', moduleId);
            await updateDoc(moduleRef, {
                quizAllowedStudents: arrayUnion(studentId)
            });

            // Local update
            setResults(prev => prev.map(res => {
                if (res.studentId === studentId) {
                    return {
                        ...res,
                        modules: {
                            ...res.modules,
                            [moduleId]: {
                                ...res.modules[moduleId],
                                quizRequested: false,
                                attempts: 0
                            }
                        }
                    };
                }
                return res;
            }));

            alert("Access granted successfully.");
        } catch (err) {
            console.error("Error granting access:", err);
            alert("Failed to grant access.");
        }
    };

    // Quiz Schema State
    const [allQuizzes, setAllQuizzes] = useState([]);
    const [selectedQuizId, setSelectedQuizId] = useState(null);
    const [quizSearch, setQuizSearch] = useState('');

    // Logic Node Modal State
    const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
    const [editingNode, setEditingNode] = useState(null);
    const [nodeForm, setNodeForm] = useState({
        type: 'multiple_choice',
        question: '',
        options: ['', '', '', ''],
        correctOption: 0,
        correctAnswer: true, // for true_false
        correctAnswerText: '', // for fill_in
        pairs: [{ key: '', value: '' }, { key: '', value: '' }], // for matching
        duration: 30
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Students Map (for names)
                const usersSnap = await getDocs(collection(db, 'users'));
                const userMap = {};
                usersSnap.docs.forEach(doc => {
                    const userData = doc.data();
                    userMap[doc.id] = userData.fullName || userData.email || 'Unknown User';
                });
                console.log("User Map Populated:", Object.keys(userMap).length);

                // 2. Fetch All Regular Modules across all courses
                const coursesSnap = await getDocs(collection(db, 'courses'));
                const modulesList = [];
                const extractedQuizzes = [];

                for (const courseDoc of coursesSnap.docs) {
                    const modsSnap = await getDocs(collection(db, 'courses', courseDoc.id, 'modules'));
                    modsSnap.docs.forEach(modDoc => {
                        const data = modDoc.data();
                        modulesList.push({
                            id: modDoc.id,
                            title: data.title,
                            courseId: courseDoc.id
                        });

                        if (data.quiz && data.quiz.questions && data.quiz.questions.length > 0) {
                            extractedQuizzes.push({
                                id: `reg-${modDoc.id}`,
                                type: 'regular',
                                title: data.title,
                                courseId: courseDoc.id,
                                moduleId: modDoc.id,
                                questions: data.quiz.questions,
                                passMark: data.quiz.passMark
                            });
                        }
                    });
                }
                setModules(modulesList);

                // 3. Fetch All Business Chapters
                const businessCoursesSnap = await getDocs(collection(db, 'business_courses'));
                for (const courseDoc of businessCoursesSnap.docs) {
                    const chaptersSnap = await getDocs(collection(db, 'business_courses', courseDoc.id, 'chapters'));
                    chaptersSnap.docs.forEach(chapDoc => {
                        const data = chapDoc.data();

                        modulesList.push({
                            id: chapDoc.id,
                            title: data.title,
                            courseId: courseDoc.id
                        });

                        if (data.quiz && data.quiz.enabled && data.quiz.questions && data.quiz.questions.length > 0) {
                            extractedQuizzes.push({
                                id: `bus-${chapDoc.id}`,
                                type: 'business',
                                title: data.title,
                                courseId: courseDoc.id,
                                chapterId: chapDoc.id,
                                questions: data.quiz.questions,
                                passMark: data.quiz.passMark
                            });
                        }
                    });
                }

                setModules(modulesList);

                setAllQuizzes(extractedQuizzes);
                if (extractedQuizzes.length > 0) {
                    setSelectedQuizId(extractedQuizzes[0].id);
                }

                // 4. Fetch All Progress (Quiz Results)
                let progressDocs = [];
                try {
                    const progressSnap = await getDocs(collectionGroup(db, 'progress'));
                    progressDocs = progressSnap.docs;

                    // Fallback if collectionGroup returns nothing (might be blocked/indexed)
                    if (progressDocs.length === 0) {
                        console.warn("Quizzes collectionGroup empty, using fallback.");
                        const usersSnap = await getDocs(collection(db, 'users'));
                        const fallbackDocs = [];
                        await Promise.all(usersSnap.docs.map(async (uDoc) => {
                            const pSnap = await getDocs(collection(db, 'users', uDoc.id, 'progress'));
                            fallbackDocs.push(...pSnap.docs);
                        }));
                        progressDocs = fallbackDocs;
                    }
                } catch (e) {
                    console.warn("Quizzes collectionGroup failed, using fallback:", e);
                    const usersSnap = await getDocs(collection(db, 'users'));
                    const fallbackDocs = [];
                    await Promise.all(usersSnap.docs.map(async (uDoc) => {
                        const pSnap = await getDocs(collection(db, 'users', uDoc.id, 'progress'));
                        fallbackDocs.push(...pSnap.docs);
                    }));
                    progressDocs = fallbackDocs;
                }

                const studentStatsMap = new Map(); // Key: studentId

                progressDocs.forEach(doc => {
                    const data = doc.data();
                    const studentId = doc.ref.parent.parent.id;
                    const moduleId = doc.id;

                    if (data.score === undefined) return;

                    if (!studentStatsMap.has(studentId)) {
                        studentStatsMap.set(studentId, {
                            studentId,
                            studentName: userMap[studentId] || 'Deleted Student',
                            modules: {}
                        });
                    }

                    const studentData = studentStatsMap.get(studentId);
                    const modTitle = modulesList.find(m => m.id === moduleId)?.title || 'Unknown Module';

                    if (!studentData.modules[moduleId]) {
                        studentData.modules[moduleId] = {
                            id: moduleId,
                            name: modTitle,
                            attempts: data.attempts || 1,
                            score: data.score,
                            passed: data.passed,
                            quizRequested: data.quizRequested || false,
                            date: data.completedAt?.toDate?.() || new Date(data.updatedAt?.toDate?.() || Date.now())
                        };
                    } else {
                        // Aggregate / Take latest
                        const modData = studentData.modules[moduleId];
                        modData.attempts = Math.max(modData.attempts, data.attempts || 1);
                        if (data.quizRequested) modData.quizRequested = true;
                        if (data.score > modData.score) {
                            modData.score = data.score;
                            modData.passed = data.passed;
                        }
                        const currentDate = data.completedAt?.toDate?.() || new Date(data.updatedAt?.toDate?.() || Date.now());
                        if (currentDate > modData.date) modData.date = currentDate;
                    }
                });

                const quizResults = Array.from(studentStatsMap.values())
                    .sort((a, b) => a.studentName.localeCompare(b.studentName));

                setResults(quizResults);
            } catch (err) {
                console.error("Error fetching quiz data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredResults = results.filter(res => {
        const sName = (res.studentName || '').toLowerCase();
        const sId = (res.studentId || '').toLowerCase();
        const qTerm = (searchQuery || '').toLowerCase().trim();

        // 1. Search Query Match
        const matchesSearch = !qTerm || sName.includes(qTerm) || sId.includes(qTerm);

        // 2. Module Filter Match
        const matchesModule = selectedModule === 'all' || Object.keys(res.modules).includes(selectedModule);

        return matchesSearch && matchesModule;
    });

    const activeQuiz = allQuizzes.find(q => q.id === selectedQuizId);
    const filteredQuizzes = allQuizzes.filter(q =>
        q.title.toLowerCase().includes(quizSearch.toLowerCase())
    );

    const getCorrectResponse = (q) => {
        if (q.type === 'multiple_choice') return q.options[q.correctOption];
        if (q.type === 'true_false') return q.correctAnswer ? 'True' : 'False';
        if (q.type === 'fill_in') return q.correctAnswer;
        if (q.type === 'matching') return q.pairs.map(p => `${p.key} → ${p.value}`).join(', ');
        return 'N/A';
    };

    const handleOpenNodeModal = (node = null, idx = null) => {
        if (node) {
            setEditingNode({ ...node, index: idx });
            setNodeForm({
                type: node.type || 'multiple_choice',
                question: node.question || node.text || '',
                options: node.options || ['', '', '', ''],
                correctOption: node.correctOption || 0,
                correctAnswer: node.correctAnswer ?? true,
                correctAnswerText: node.type === 'fill_in' ? node.correctAnswer : '',
                pairs: node.pairs || [{ key: '', value: '' }, { key: '', value: '' }],
                duration: node.duration || 30
            });
        } else {
            setEditingNode(null);
            setNodeForm({
                type: 'multiple_choice',
                question: '',
                options: ['', '', '', ''],
                correctOption: 0,
                correctAnswer: true,
                correctAnswerText: '',
                pairs: [{ key: '', value: '' }, { key: '', value: '' }],
                duration: 30
            });
        }
        setIsNodeModalOpen(true);
    };

    const handleSaveNode = async () => {
        if (!activeQuiz) return;

        try {
            setLoading(true);
            const newNode = {
                type: nodeForm.type,
                question: nodeForm.question,
                duration: nodeForm.duration
            };

            if (nodeForm.type === 'multiple_choice') {
                newNode.options = nodeForm.options;
                newNode.correctOption = nodeForm.correctOption;
            } else if (nodeForm.type === 'true_false') {
                newNode.correctAnswer = nodeForm.correctAnswer;
            } else if (nodeForm.type === 'fill_in') {
                newNode.correctAnswer = nodeForm.correctAnswerText;
            } else if (nodeForm.type === 'matching') {
                newNode.pairs = nodeForm.pairs;
            }

            let updatedQuestions = [...activeQuiz.questions];
            if (editingNode) {
                updatedQuestions[editingNode.index] = newNode;
            } else {
                updatedQuestions.push(newNode);
            }

            // Update Firestore
            const { type, courseId, moduleId, chapterId } = activeQuiz;
            if (type === 'regular') {
                const docRef = doc(db, 'courses', courseId, 'modules', moduleId);
                await updateDoc(docRef, { 'quiz.questions': updatedQuestions });
            } else {
                const docRef = doc(db, 'business_courses', courseId, 'chapters', chapterId);
                await updateDoc(docRef, { 'quiz.questions': updatedQuestions });
            }

            // Local state update
            setAllQuizzes(prev => prev.map(q =>
                q.id === selectedQuizId ? { ...q, questions: updatedQuestions } : q
            ));

            setIsNodeModalOpen(false);
            alert('Logic Node synchronized successfully!');
        } catch (err) {
            console.error("Error saving logic node:", err);
            alert('Failed to synchronize logic node.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteNode = async (idx) => {
        if (!activeQuiz) return;
        if (!confirm('Are you sure you want to PERMANENTLY delete this Logic Node? This action cannot be undone.')) return;

        try {
            setLoading(true);
            let updatedQuestions = [...activeQuiz.questions];
            updatedQuestions.splice(idx, 1);

            // Update Firestore
            const { type, courseId, moduleId, chapterId } = activeQuiz;
            if (type === 'regular') {
                const docRef = doc(db, 'courses', courseId, 'modules', moduleId);
                await updateDoc(docRef, { 'quiz.questions': updatedQuestions });
            } else {
                const docRef = doc(db, 'business_courses', courseId, 'chapters', chapterId);
                await updateDoc(docRef, { 'quiz.questions': updatedQuestions });
            }

            // Local state update
            setAllQuizzes(prev => prev.map(q =>
                q.id === selectedQuizId ? { ...q, questions: updatedQuestions } : q
            ));

            if (isNodeModalOpen) setIsNodeModalOpen(false);
            alert('Logic Node deleted successfully!');
        } catch (err) {
            console.error("Error deleting logic node:", err);
            alert('Failed to delete logic node.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-32">
            <div className=" w-full px-2 py-10 space-y-10">
                {/* Header Section */}
                <div className="flex flex-col gap-6 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-4 md:-ml-10"></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Evaluation Matrix</h1>
                            <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-1 md:mt-2">Knowledge Assessment & Proficiency Oversight</p>
                        </div>
                        <div className="flex bg-white/40 dark:bg-black/20 p-1 md:p-1.5 rounded-xl md:rounded-[1.5rem] shadow-sm border border-espresso/10 backdrop-blur-md w-full md:w-auto overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setActiveTab('editor')}
                                className={cn(
                                    "flex-1 md:flex-none px-4 md:px-6 py-2 md:py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-lg md:rounded-xl transition-all whitespace-nowrap",
                                    activeTab === 'editor' ? "bg-espresso text-white shadow-lg" : "text-espresso/40 hover:text-espresso"
                                )}
                            >
                                Schema Editor
                            </button>
                            <button
                                onClick={() => setActiveTab('results')}
                                className={cn(
                                    "flex-1 md:flex-none px-4 md:px-6 py-2 md:py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-lg md:rounded-xl transition-all whitespace-nowrap",
                                    activeTab === 'results' ? "bg-espresso text-white shadow-lg" : "text-espresso/40 hover:text-espresso"
                                )}
                            >
                                Proficiency Registry
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'editor' ? (
                    <div className="space-y-10 animate-fade-in">
                        {/* Featured Schema Card */}
                        <div className="bg-espresso dark:bg-black/40 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-white/5 rounded-full -mr-16 md:-mr-20 -mt-16 md:-mt-20 blur-3xl group-hover:bg-white/10 transition-colors"></div>
                            <div className="flex flex-col sm:flex-row items-start justify-between relative z-10 gap-6">
                                <div className="space-y-3 md:space-y-4">
                                    <span className="inline-flex items-center bg-white/10 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-black text-white uppercase tracking-[0.3em] backdrop-blur-md border border-white/10">
                                        {activeQuiz?.type === 'business' ? 'Business Intelligence Schema' : 'Core Certification Schema'}
                                    </span>
                                    <h2 className="text-white text-2xl md:text-4xl font-serif font-black leading-tight tracking-tight uppercase break-all">
                                        {activeQuiz?.title || 'System Initializing...'}
                                    </h2>
                                    <p className="text-white/60 text-[11px] md:text-xs font-medium max-w-md leading-relaxed">
                                        Modify universal knowledge nodes for this curriculum component. Changes propagate across all active instances.
                                    </p>
                                </div>
                                <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] bg-white/10 border-2 border-white/20 overflow-hidden shadow-2xl backdrop-blur-md flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-white text-2xl md:text-4xl opacity-40">
                                        {activeQuiz?.type === 'business' ? 'corporate_fare' : 'psychology'}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-6 md:mt-10 pt-6 border-t border-white/10 flex flex-col lg:flex-row lg:items-center gap-4 md:gap-6">
                                <div className="flex flex-wrap gap-4 md:gap-6">
                                    <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-widest">
                                        <span className="material-symbols-outlined text-[16px] md:text-[18px]">verified</span>
                                        {activeQuiz?.type?.toUpperCase()} PROTOCOL ACTIVE
                                    </div>
                                    <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-widest">
                                        <span className="material-symbols-outlined text-[16px] md:text-[18px]">account_tree</span>
                                        {activeQuiz?.questions?.length || 0} Logic Nodes
                                    </div>
                                </div>
                                <div className="hidden lg:block flex-1"></div>
                                <div className="relative w-full lg:w-auto">
                                    <select
                                        value={selectedQuizId}
                                        onChange={(e) => setSelectedQuizId(e.target.value)}
                                        className="w-full lg:w-auto bg-white/10 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border border-white/20 outline-none appearance-none pr-10 cursor-pointer"
                                    >
                                        {allQuizzes.map(q => (
                                            <option key={q.id} value={q.id} className="bg-espresso text-white">
                                                {q.title.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">expand_more</span>
                                </div>
                            </div>
                        </div>

                        {/* Search & Collection Header */}
                        <div className="space-y-6">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-5 md:left-6 flex items-center pointer-events-none text-espresso/30">
                                    <span className="material-symbols-outlined text-[20px] md:text-[24px]">search</span>
                                </div>
                                <input
                                    className="w-full h-14 md:h-16 pl-12 md:pl-16 pr-6 md:pr-8 bg-white/40 dark:bg-black/20 border border-espresso/10 rounded-xl md:rounded-[1.5rem] text-espresso dark:text-white font-serif text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-espresso transition-all placeholder:text-espresso/20 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.4em] placeholder:text-[9px] md:placeholder:text-[10px]"
                                    placeholder="Locate logic nodes..."
                                    type="text"
                                    value={quizSearch}
                                    onChange={(e) => setQuizSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[9px] md:text-[10px] font-black text-espresso/40 uppercase tracking-[0.4em] flex items-center gap-3">
                                        <span className="w-6 md:w-8 h-px bg-espresso/20"></span>
                                        Logic Array Preview
                                    </h3>
                                </div>
                                {activeQuiz?.questions?.map((q, idx) => (
                                    <div key={idx} className="group bg-espresso rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 border border-white/10 hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-white/20 group-hover:bg-white transition-colors"></div>
                                        <div className="flex flex-col sm:flex-row gap-4 md:gap-8">
                                            <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center text-white/70 font-black font-serif text-lg md:text-xl border border-white/5 group-hover:bg-white group-hover:text-espresso transition-all shadow-inner">
                                                {String(idx + 1).padStart(2, '0')}
                                            </div>
                                            <div className="flex-1 space-y-3 md:space-y-4">
                                                <div className="flex justify-between items-start gap-4">
                                                    <p className="text-lg md:text-xl font-serif font-black text-white leading-tight tracking-tight uppercase group-hover:text-white/80 transition-colors break-words">
                                                        {q.question || q.text}
                                                    </p>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleOpenNodeModal(q, idx)}
                                                            className="p-2 text-white/40 hover:text-white transition-colors shrink-0"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px] md:text-[20px]">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteNode(idx);
                                                            }}
                                                            className="p-2 text-red-400/40 hover:text-red-400 transition-colors shrink-0"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px] md:text-[20px]">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="px-2 md:px-3 py-1 bg-white/10 text-white/70 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/5 flex items-center gap-2 shadow-inner">
                                                        <span className="material-symbols-outlined text-[12px] md:text-[14px]">task_alt</span>
                                                        Response: <span className="truncate max-w-[150px]">{getCorrectResponse(q)}</span>
                                                    </span>
                                                    <span className="text-[8px] md:text-[9px] font-black text-white/20 uppercase tracking-widest italic font-medium">Type: {q.type?.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!activeQuiz || activeQuiz.questions.length === 0) && (
                                    <div className="text-center py-20 bg-white/20 rounded-[2rem] border-2 border-dashed border-espresso/10">
                                        <p className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.4em]">No logic nodes available for this schema</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-10 animate-fade-in">
                        {/* Analytics Summary */}
                        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 relative z-10">
                            <div className="flex-1 relative group">
                                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors text-[20px]">search</span>
                                <input
                                    type="text"
                                    placeholder="IDENTIFY PARTICIPANT OR MODULE..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 md:h-14 pl-12 md:pl-14 pr-6 rounded-xl md:rounded-2xl bg-espresso border border-white/10 text-white !text-white font-serif text-[10px] md:text-sm font-black uppercase tracking-widest focus:ring-2 focus:ring-white/20 focus:outline-none transition-all shadow-inner placeholder:text-white/20"
                                />
                            </div>
                            <div className="relative">
                                <select
                                    value={selectedModule}
                                    onChange={(e) => setSelectedModule(e.target.value)}
                                    className="w-full lg:w-auto h-12 md:h-14 pl-6 pr-12 rounded-xl md:rounded-2xl bg-espresso border border-white/10 text-white !text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-white/20 focus:outline-none min-w-[200px] lg:min-w-[240px] appearance-none cursor-pointer shadow-sm"
                                >
                                    <option value="all" className="bg-espresso text-white">Universal View</option>
                                    {modules.map(m => (
                                        <option key={m.id} value={m.id} className="bg-espresso text-white">{m.title.toUpperCase()}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">expand_more</span>
                            </div>
                        </div>

                        {/* Registry Table */}
                        <div className="space-y-6">
                            {filteredResults.length > 0 ? filteredResults.map((res) => (
                                <div key={res.studentId} className="bg-espresso rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl relative transition-all group">
                                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-white/20 group-hover:bg-white transition-colors"></div>

                                    {/* Student Main Row */}
                                    <div
                                        onClick={() => toggleStudent(res.studentId)}
                                        className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 cursor-pointer hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="relative shrink-0">
                                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl overflow-hidden border-2 border-white/40 shadow-xl group-hover:scale-105 transition-transform">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(res.studentName)}&background=random&color=fff&bold=true`}
                                                        alt={res.studentName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xl md:text-2xl font-serif font-black text-white uppercase tracking-tight">{res.studentName}</h3>
                                                <p className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Participant Code: {res.studentId.slice(0, 12).toUpperCase()}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 md:gap-8">
                                            <div className="text-center">
                                                <p className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Modules Cleared</p>
                                                <p className="text-lg md:text-xl font-black text-white">{Object.keys(res.modules).length}</p>
                                            </div>
                                            <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
                                            <button className={cn(
                                                "w-10 h-10 md:w-12 md:h-12 rounded-xl border border-white/10 flex items-center justify-center text-white transition-all",
                                                expandedStudents.has(res.studentId) ? "bg-white text-espresso rotate-180" : "bg-white/5"
                                            )}>
                                                <span className="material-symbols-outlined">{expandedStudents.has(res.studentId) ? 'expand_less' : 'expand_more'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Dropdown / Module Details */}
                                    {expandedStudents.has(res.studentId) && (
                                        <div className="px-6 md:px-10 pb-8 md:pb-12 animate-in fade-in slide-in-from-top-4 duration-300">
                                            <div className="pt-6 border-t border-white/5 space-y-4">
                                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
                                                    <span className="w-8 h-px bg-white/10"></span>
                                                    Knowledge Breakdown
                                                </h4>
                                                <div className="grid gap-4">
                                                    {Object.values(res.modules).map((mod) => (
                                                        <div key={mod.id} className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/5 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group/mod">
                                                            <div className="flex items-center gap-5">
                                                                <div className={cn(
                                                                    "w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm",
                                                                    mod.passed ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                                                                )}>
                                                                    <span className="material-symbols-outlined text-[20px]">{mod.passed ? 'verified' : 'error'}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[11px] md:text-[13px] font-black text-white uppercase tracking-wider">{mod.name}</p>
                                                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">LATEST SYNC: {mod.date.toLocaleDateString().toUpperCase()}</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-6 md:gap-12 pl-[60px] md:pl-0">
                                                                <div className="text-center">
                                                                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Attempts</p>
                                                                    <p className="text-sm md:text-base font-black text-white">{mod.attempts}</p>
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Score Matrix</p>
                                                                    <p className={cn(
                                                                        "text-sm md:text-base font-black",
                                                                        mod.passed ? "text-green-400" : "text-red-400"
                                                                    )}>{Math.round(mod.score)}%</p>
                                                                </div>
                                                                <div className="hidden sm:block">
                                                                    <span className={cn(
                                                                        "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                                                                        mod.passed ? "bg-green-500/10 border-green-500/20 text-green-500" : (mod.quizRequested ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-red-500/10 border-red-500/20 text-red-500")
                                                                    )}>
                                                                        {mod.passed ? 'COMPETENT' : (mod.quizRequested ? 'AWAITING' : 'LOCKED')}
                                                                    </span>
                                                                </div>
                                                                {mod.quizRequested && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            grantAccess(res.studentId, mod.id);
                                                                        }}
                                                                        className="px-4 py-2 bg-white text-espresso rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-espresso hover:text-white transition-all shadow-sm flex items-center gap-2"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                                                                        Grant Access
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-20 md:py-32 bg-espresso rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center gap-6 opacity-40">
                                    <span className="material-symbols-outlined text-6xl text-white">psychology_alt</span>
                                    <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-white">No synchronized results found in registry</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Matrix Expansion Trigger */}
            {activeTab === 'editor' && (
                <div className="fixed bottom-6 md:bottom-12 right-6 md:right-12 z-50">
                    <button
                        onClick={() => handleOpenNodeModal()}
                        className="group flex items-center gap-3 md:gap-4 bg-espresso hover:bg-espresso/90 text-white rounded-[1.5rem] md:rounded-[2rem] shadow-2xl hover:shadow-espresso/40 transition-all p-1.5 md:p-2 pr-6 md:pr-10 hover:scale-105 active:scale-95"
                    >
                        <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-[1.75rem] border-2 border-white/20 flex items-center justify-center bg-white/10 group-hover:rotate-90 transition-transform duration-500">
                            <span className="material-symbols-outlined text-[24px] md:text-[32px]">add</span>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Assemble</span>
                            <span className="font-serif font-black text-base md:text-xl uppercase tracking-tight">Logic Node</span>
                        </div>
                    </button>
                </div>
            )}

            {/* Logic Node Modal */}
            {isNodeModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2rem] md:rounded-[3rem] w-full max-w-2xl border border-espresso/10 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="p-6 md:p-10 border-b border-espresso/10 bg-white/20 dark:bg-black/20">
                            <h2 className="text-xl md:text-3xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight">
                                {editingNode ? 'Modify Logic Node' : 'Assemble Logic Node'}
                            </h2>
                            <p className="text-[9px] md:text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em] mt-1 md:mt-2">Relational Knowledge Synthesis Protocol</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-8 no-scrollbar">
                            <div className="space-y-3 md:space-y-4">
                                <label className="text-[9px] md:text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em] ml-1">Query Designation</label>
                                <textarea
                                    className="w-full bg-white/40 dark:bg-black/20 border border-espresso/10 rounded-xl md:rounded-2xl p-4 md:p-6 text-espresso dark:text-white font-serif text-lg outline-none focus:ring-2 focus:ring-espresso transition-all shadow-inner"
                                    placeholder="SYNTHESIZE QUERY..."
                                    rows={3}
                                    value={nodeForm.question}
                                    onChange={(e) => setNodeForm({ ...nodeForm, question: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-3 md:space-y-4">
                                    <label className="text-[9px] md:text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em] ml-1">Query Type</label>
                                    <select
                                        className="w-full h-12 md:h-14 bg-white/40 dark:bg-black/20 border border-espresso/10 rounded-xl md:rounded-2xl px-4 md:px-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-espresso transition-all"
                                        value={nodeForm.type}
                                        onChange={(e) => setNodeForm({ ...nodeForm, type: e.target.value })}
                                    >
                                        <option value="multiple_choice">Multiple Choice</option>
                                        <option value="true_false">True / False</option>
                                        <option value="fill_in">Fill in Blank</option>
                                        <option value="matching">Relational Matching</option>
                                    </select>
                                </div>
                                <div className="space-y-3 md:space-y-4">
                                    <label className="text-[9px] md:text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em] ml-1">Time Delta (SEC)</label>
                                    <input
                                        type="number"
                                        className="w-full h-12 md:h-14 bg-white/40 dark:bg-black/20 border border-espresso/10 rounded-xl md:rounded-2xl px-4 md:px-6 text-center text-espresso dark:text-white font-black outline-none focus:ring-2 focus:ring-espresso transition-all"
                                        value={nodeForm.duration}
                                        onChange={(e) => setNodeForm({ ...nodeForm, duration: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {/* Type Specific Fields */}
                            {nodeForm.type === 'multiple_choice' && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em]">Result Options</label>
                                    <div className="space-y-3">
                                        {nodeForm.options.map((opt, idx) => (
                                            <div key={idx} className="flex gap-4">
                                                <input
                                                    type="radio"
                                                    name="correct"
                                                    checked={nodeForm.correctOption === idx}
                                                    onChange={() => setNodeForm({ ...nodeForm, correctOption: idx })}
                                                    className="w-6 h-6 accent-espresso mt-4"
                                                />
                                                <input
                                                    className="flex-1 bg-white/20 border border-espresso/10 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-espresso transition-all"
                                                    placeholder={`OPTION ${idx + 1}`}
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOpts = [...nodeForm.options];
                                                        newOpts[idx] = e.target.value;
                                                        setNodeForm({ ...nodeForm, options: newOpts });
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {nodeForm.type === 'true_false' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setNodeForm({ ...nodeForm, correctAnswer: true })}
                                        className={cn(
                                            "h-16 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                            nodeForm.correctAnswer ? "bg-espresso text-white border-espresso" : "bg-white/20 border-espresso/10 text-espresso/40"
                                        )}
                                    >
                                        True Path
                                    </button>
                                    <button
                                        onClick={() => setNodeForm({ ...nodeForm, correctAnswer: false })}
                                        className={cn(
                                            "h-16 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                            !nodeForm.correctAnswer ? "bg-espresso text-white border-espresso" : "bg-white/20 border-espresso/10 text-espresso/40"
                                        )}
                                    >
                                        False Path
                                    </button>
                                </div>
                            )}

                            {nodeForm.type === 'fill_in' && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em]">Validation String</label>
                                    <input
                                        className="w-full h-14 bg-white/40 border border-espresso/10 rounded-2xl px-6 text-espresso font-black outline-none"
                                        placeholder="SPECIFY CORRECT TERMINOLOGY..."
                                        value={nodeForm.correctAnswerText}
                                        onChange={(e) => setNodeForm({ ...nodeForm, correctAnswerText: e.target.value })}
                                    />
                                </div>
                            )}

                            {nodeForm.type === 'matching' && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em]">Relational Pairs</label>
                                    <div className="space-y-3">
                                        {nodeForm.pairs.map((pair, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <input
                                                    className="flex-1 bg-white/20 border border-espresso/10 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                                                    placeholder="SIGNAL A"
                                                    value={pair.key}
                                                    onChange={(e) => {
                                                        const newPairs = [...nodeForm.pairs];
                                                        newPairs[idx].key = e.target.value;
                                                        setNodeForm({ ...nodeForm, pairs: newPairs });
                                                    }}
                                                />
                                                <span className="material-symbols-outlined text-espresso/20">sync_alt</span>
                                                <input
                                                    className="flex-1 bg-white/20 border border-espresso/10 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                                                    placeholder="SIGNAL B"
                                                    value={pair.value}
                                                    onChange={(e) => {
                                                        const newPairs = [...nodeForm.pairs];
                                                        newPairs[idx].value = e.target.value;
                                                        setNodeForm({ ...nodeForm, pairs: newPairs });
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newPairs = nodeForm.pairs.filter((_, i) => i !== idx);
                                                        setNodeForm({ ...nodeForm, pairs: newPairs });
                                                    }}
                                                    className="text-red-400 p-1"
                                                >
                                                    <span className="material-symbols-outlined text-sm">cancel</span>
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setNodeForm({ ...nodeForm, pairs: [...nodeForm.pairs, { key: '', value: '' }] })}
                                            className="text-[10px] font-black text-espresso uppercase tracking-widest hover:underline"
                                        >
                                            + Insert Relational Pair
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 md:p-10 bg-white/40 dark:bg-black/20 flex flex-col md:flex-row justify-end gap-3 md:gap-6">
                            {editingNode && (
                                <button
                                    onClick={() => handleDeleteNode(editingNode.index)}
                                    className="px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"
                                >
                                    Decommission Node
                                </button>
                            )}
                            <div className="flex-1"></div>
                            <button
                                onClick={() => setIsNodeModalOpen(false)}
                                className="order-2 md:order-1 px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-black text-espresso/40 uppercase tracking-widest hover:text-espresso transition-colors"
                            >
                                Abort Protocol
                            </button>
                            <button
                                onClick={handleSaveNode}
                                className="order-1 md:order-2 px-10 py-3 md:py-4 bg-espresso text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl shadow-xl hover:shadow-espresso/40 transition-all active:scale-95"
                            >
                                Synchronize Logic
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}




