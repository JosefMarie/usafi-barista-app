import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { GradientButton } from '../../components/ui/GradientButton';

export function BusinessCourseView() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [activeChapter, setActiveChapter] = useState(null);
    const [loading, setLoading] = useState(true);

    // TTS State
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [selectedGender, setSelectedGender] = useState('female'); // 'male' or 'female'
    const [voices, setVoices] = useState([]);
    const synth = useRef(window.speechSynthesis);

    useEffect(() => {
        // Load Voices
        const loadVoices = () => {
            const availableVoices = synth.current.getVoices();
            setVoices(availableVoices);
        };

        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }

        if (!courseId) return;

        // Fetch Course
        getDoc(doc(db, 'business_courses', courseId)).then(snap => {
            if (snap.exists()) setCourse({ id: snap.id, ...snap.data() });
        });

        // Fetch Chapters
        const q = query(collection(db, 'business_courses', courseId, 'chapters'), orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedChapters = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setChapters(fetchedChapters);

            // Set first chapter as active if none selected
            if (fetchedChapters.length > 0 && !activeChapter) {
                setActiveChapter(fetchedChapters[0]);
            }
            setLoading(false);
        });

        return () => {
            unsubscribe();
            synth.current.cancel(); // Stop speaking on unmount
        };
    }, [courseId]);

    // Update active chapter if chapters load late
    useEffect(() => {
        if (!activeChapter && chapters.length > 0) {
            setActiveChapter(chapters[0]);
        }
    }, [chapters]);

    const handleSpeak = () => {
        if (isSpeaking) {
            synth.current.cancel();
            setIsSpeaking(false);
            return;
        }

        if (!activeChapter?.content) return;

        const utterance = new SpeechSynthesisUtterance(activeChapter.content);

        // Voice Selection Logic
        let voice = null;
        if (selectedGender === 'male') {
            voice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.includes('David') || v.name.includes('James'));
        } else {
            voice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google US English'));
        }

        // Fallback if no specific gender found, just use default but try to pick standard ones
        if (!voice && voices.length > 0) voice = voices[0];

        if (voice) utterance.voice = voice;

        utterance.rate = 1;

        utterance.onend = () => setIsSpeaking(false);

        synth.current.speak(utterance);
        setIsSpeaking(true);
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!course) return <div className="p-8">Course not found</div>;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col md:flex-row">
            {/* Sidebar / Chapter List */}
            <aside className="w-full md:w-80 bg-white dark:bg-[#1e1e1e] border-r border-black/5 flex flex-col h-[40vh] md:h-screen sticky top-0">
                <div className="p-6 border-b border-black/5 bg-gray-50 dark:bg-black/20">
                    <Link to="/business/dashboard" className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block hover:underline">
                        &larr; Back to Dashboard
                    </Link>
                    <h2 className="font-serif text-xl font-bold text-espresso dark:text-white leading-tight">
                        {course.title}
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {chapters.map((chapter, index) => (
                        <button
                            key={chapter.id}
                            onClick={() => {
                                setActiveChapter(chapter);
                                synth.current.cancel();
                                setIsSpeaking(false);
                            }}
                            className={`w-full text-left p-4 rounded-xl mb-1 transition-all flex items-start gap-3 ${activeChapter?.id === chapter.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'hover:bg-gray-100 dark:hover:bg-white/5 text-espresso/70 dark:text-white/70'
                                }`}
                        >
                            <span className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${activeChapter?.id === chapter.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-white/10'
                                }`}>
                                {index + 1}
                            </span>
                            <span className="text-sm font-medium line-clamp-2">{chapter.title}</span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto h-screen">
                {activeChapter ? (
                    <div className="max-w-3xl mx-auto animate-fadeIn">
                        <header className="mb-8 border-b border-black/5 dark:border-white/5 pb-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h1 className="font-serif text-3xl font-bold text-espresso dark:text-white">
                                    {activeChapter.title}
                                </h1>

                                {/* TTS Controls */}
                                <div className="flex items-center gap-3 bg-white dark:bg-white/5 p-2 rounded-xl shadow-sm border border-black/5 dark:border-white/5">
                                    <div className="flex bg-gray-100 dark:bg-white/10 rounded-lg p-1">
                                        <button
                                            onClick={() => setSelectedGender('male')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${selectedGender === 'male' ? 'bg-white dark:bg-[#1e1e1e] shadow-sm text-espresso dark:text-white' : 'text-espresso/50 dark:text-white/50'
                                                }`}
                                        >
                                            Male
                                        </button>
                                        <button
                                            onClick={() => setSelectedGender('female')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${selectedGender === 'female' ? 'bg-white dark:bg-[#1e1e1e] shadow-sm text-espresso dark:text-white' : 'text-espresso/50 dark:text-white/50'
                                                }`}
                                        >
                                            Female
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleSpeak}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white transition-all ${isSpeaking ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">
                                            {isSpeaking ? 'stop' : 'volume_up'}
                                        </span>
                                        {isSpeaking ? 'Stop' : 'Listen'}
                                    </button>
                                </div>
                            </div>
                        </header>

                        <div className="prose dark:prose-invert max-w-none">
                            {activeChapter.imageUrl && (
                                <img
                                    src={activeChapter.imageUrl}
                                    alt={activeChapter.title}
                                    className="w-full h-auto rounded-2xl shadow-lg mb-8"
                                />
                            )}

                            <div className="whitespace-pre-wrap text-lg leading-relaxed text-espresso/80 dark:text-white/80 font-serif">
                                {activeChapter.content}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-espresso/50 dark:text-white/50">
                        <span className="material-symbols-outlined text-6xl mb-4">menu_book</span>
                        <p className="text-xl">Select a chapter to begin reading</p>
                    </div>
                )}
            </main>
        </div>
    );
}
