import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

export function ManageLesson() {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [moduleName, setModuleName] = useState('General');
    const [videoUrl, setVideoUrl] = useState('');
    const [pdfFiles, setPdfFiles] = useState([]);
    const [status, setStatus] = useState('draft');

    const isNew = lessonId === 'new';

    useEffect(() => {
        const fetchLesson = async () => {
            if (isNew) {
                setLoading(false);
                return;
            }

            try {
                // Assuming lessons are stored in a top-level collection for simplicity in this demo,
                // OR in a subcollection. Let's go with subcollection: courses/{courseId}/lessons/{lessonId}
                const docRef = doc(db, 'courses', courseId, 'lessons', lessonId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setTitle(data.title || '');
                    setModuleName(data.module || 'General');
                    setVideoUrl(data.videoUrl || '');
                    setPdfFiles(data.pdfFiles || []); // Array of objects { name, url, size }
                    setStatus(data.status || 'draft');
                } else {
                    console.error("No such lesson!");
                }
            } catch (error) {
                console.error("Error fetching lesson:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLesson();
    }, [courseId, lessonId, isNew]);

    const handleSave = async (newStatus) => {
        setSaving(true);
        try {
            const lessonData = {
                title,
                module: moduleName,
                videoUrl,
                pdfFiles,
                status: newStatus || status,
                updatedAt: serverTimestamp()
            };

            if (isNew) {
                // Generate a new ID or let Firestore do it
                const newLessonRef = doc(collection(db, 'courses', courseId, 'lessons'));
                await setDoc(newLessonRef, {
                    ...lessonData,
                    createdAt: serverTimestamp()
                });
                navigate(`/admin/courses/${courseId}/lessons/${newLessonRef.id}`, { replace: true });
            } else {
                const docRef = doc(db, 'courses', courseId, 'lessons', lessonId);
                await updateDoc(docRef, lessonData);
                if (newStatus) setStatus(newStatus);
            }
        } catch (error) {
            console.error("Error saving lesson:", error);
            alert("Failed to save lesson");
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = (e) => {
        // Mock upload
        const file = e.target.files[0];
        if (file) {
            // In a real app, upload to Storage and get URL
            const newPdf = {
                name: file.name,
                url: '#', // Mock URL
                size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
                uploadedAt: new Date().toISOString()
            };
            setPdfFiles([...pdfFiles, newPdf]);
        }
    };

    const removePdf = (index) => {
        setPdfFiles(pdfFiles.filter((_, i) => i !== index));
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-gray-100 overflow-hidden">

            {/* Top App Bar */}
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-primary/10">
                <div className="flex items-center p-4 justify-between h-16">
                    <button
                        onClick={() => navigate('/admin/courses')}
                        className="flex size-10 shrink-0 items-center justify-center rounded-full active:bg-primary/10 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <span className="material-symbols-outlined text-espresso dark:text-white">arrow_back</span>
                    </button>
                    <h2 className="text-espresso dark:text-white text-lg font-bold leading-tight flex-1 text-center truncate px-2">
                        {isNew ? 'Create Lesson' : 'Manage Lesson'}
                    </h2>
                    <div className="flex size-10 items-center justify-center">
                        <button className="flex items-center justify-center rounded-full size-10 active:bg-primary/10 text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 w-full  flex flex-col pb-24 px-2 pt-2 gap-6 overflow-y-auto">

                {/* Lesson Title Section */}
                <div>
                    <label className="sr-only" htmlFor="lesson-title">Lesson Title</label>
                    <input
                        className="w-full bg-transparent border-0 border-b-2 border-primary/20 focus:border-primary focus:ring-0 text-2xl font-bold text-espresso dark:text-white px-0 py-2 placeholder-espresso/50 transition-colors"
                        id="lesson-title"
                        placeholder="Enter Lesson Title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-espresso/60 dark:text-gray-400">Module:</span>
                        <input
                            className="bg-transparent border-b border-primary/20 focus:border-primary text-sm font-medium text-espresso dark:text-white px-0 py-1"
                            value={moduleName}
                            onChange={(e) => setModuleName(e.target.value)}
                            placeholder="Module Name"
                        />
                    </div>
                </div>

                {/* Video Upload Section */}
                <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-espresso dark:text-white">Training Video</h3>
                        {!videoUrl ? (
                            <span className="text-xs font-medium px-2 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">Missing</span>
                        ) : (
                            <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Uploaded</span>
                        )}
                    </div>
                    <div className="bg-white dark:bg-[#2c2825] p-4 rounded-xl shadow-sm border border-primary/5">
                        <div className="flex flex-col items-center justify-center w-full aspect-video rounded-lg border-2 border-dashed border-primary/30 bg-background-light dark:bg-background-dark/50 relative overflow-hidden group cursor-pointer hover:bg-primary/5 transition-colors relative">
                            {videoUrl ? (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-primary mb-2">play_circle</span>
                                    <p className="text-sm font-bold text-espresso dark:text-white">Video Added</p>
                                    <button
                                        onClick={() => setVideoUrl('')}
                                        className="mt-2 text-xs text-red-500 hover:underline z-20"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 z-10 p-4 text-center">
                                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-3xl">upload_file</span>
                                    </div>
                                    <p className="text-sm font-medium text-primary">Paste Video URL</p>
                                    <input
                                        className="w-full text-xs bg-white dark:bg-black/20 border border-primary/20 rounded p-1"
                                        placeholder="https://vimeo..."
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* PDF Notes Section */}
                <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-espresso dark:text-white">Class Notes</h3>
                    </div>
                    <div className="bg-white dark:bg-[#2c2825] p-4 rounded-xl shadow-sm border border-primary/5 flex flex-col gap-4">
                        {/* Add Button */}
                        <label className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-primary/30 text-primary font-medium hover:bg-primary/5 transition-colors cursor-pointer">
                            <span className="material-symbols-outlined">add</span>
                            Upload PDF Document
                            <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                        </label>

                        {/* Existing Files List */}
                        <div className="flex flex-col gap-2">
                            {pdfFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-background-light dark:bg-background-dark/50 rounded-lg border border-primary/10">
                                    <div className="size-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                                        <span className="material-symbols-outlined">description</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-espresso dark:text-white truncate">{file.name}</p>
                                        <p className="text-xs text-espresso/60 dark:text-gray-400">{file.size} • Uploaded</p>
                                    </div>
                                    <button
                                        onClick={() => removePdf(idx)}
                                        className="text-espresso/40 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors p-2"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Quiz Management Section */}
                <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-espresso dark:text-white">Assessment</h3>
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-leaf/10 text-leaf">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Ready
                        </span>
                    </div>
                    <div className="bg-white dark:bg-[#2c2825] p-4 rounded-xl shadow-sm border border-primary/5">
                        <div className="flex items-start gap-4">
                            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined">quiz</span>
                            </div>
                            <div className="flex-1">
                                <h4 class="text-base font-bold text-espresso dark:text-white">Knowledge Check</h4>
                                <p className="text-sm text-espresso/60 dark:text-gray-400 mb-3">Linked to quiz module.</p>
                                <button className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                                    Manage Questions
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Spacer for fixed footer */}
                <div className="h-8"></div>
            </main>

            {/* Sticky Footer Actions */}
            <div className="fixed bottom-0 w-full  left-0 right-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-primary/10 p-4 safe-area-pb z-20">
                <div className="flex gap-3">
                    <button
                        onClick={() => handleSave('draft')}
                        disabled={saving}
                        className="flex-1 h-12 rounded-lg border border-primary text-primary font-bold text-base hover:bg-primary/5 active:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={() => handleSave('published')}
                        disabled={saving}
                        className="flex-1 h-12 rounded-lg bg-green-600 text-white font-bold text-base shadow-lg shadow-green-600/20 hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined">publish</span>
                        Publish
                    </button>
                </div>
            </div>

            {/* Background Pattern */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/coffee.png')] z-[-1]"></div>
        </div>
    );
}



