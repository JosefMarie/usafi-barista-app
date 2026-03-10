import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { ShapeCard } from '../../components/weekend/ShapeCard';
import { useNavigate } from 'react-router-dom';

const MODULES = [
    { id: 'm1', icon: 'history_edu', color: 'from-amber-500 to-orange-600', ring: 'ring-amber-500/30' },
    { id: 'm2', icon: 'local_fire_department', color: 'from-orange-500 to-rose-600', ring: 'ring-orange-500/30' },
    { id: 'm3', icon: 'grain', color: 'from-rose-500 to-pink-600', ring: 'ring-rose-500/30' },
    { id: 'm4', icon: 'coffee_maker', color: 'from-pink-500 to-purple-600', ring: 'ring-pink-500/30' },
    { id: 'm5', icon: 'brush', color: 'from-purple-500 to-indigo-600', ring: 'ring-purple-500/30' },
    { id: 'm6', icon: 'local_cafe', color: 'from-indigo-500 to-blue-600', ring: 'ring-indigo-500/30' },
    { id: 'm7', icon: 'science', color: 'from-blue-500 to-emerald-600', ring: 'ring-blue-500/30' },
];

// ── Hook to load cards for a module ──────────────────────────────────────────
function useModuleCards(moduleId) {
    const [cards, setCards] = useState([]);
    useEffect(() => {
        if (!moduleId) return;
        const q = query(
            collection(db, 'weekend_module_cards', moduleId, 'cards'),
            orderBy('order', 'asc')
        );
        return onSnapshot(q, (snap) => {
            setCards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, () => setCards([]));
    }, [moduleId]);
    return cards;
}

// ── Module Cards Panel (Slideshow) ───────────────────────────────────────────
function ModulePanel({ mod, isLocked, onClose, onDone, t }) {
    const cards = useModuleCards(mod.id);
    const [idx, setIdx] = useState(0);
    const [direction, setDirection] = useState(null);
    const [finishing, setFinishing] = useState(false);

    // Reset to first card when module changes
    useEffect(() => { setIdx(0); setFinishing(false); }, [mod.id]);

    const goTo = (next) => {
        if (next < 0 || next >= cards.length) return;
        setDirection(next > idx ? 'right' : 'left');
        setIdx(next);
    };

    const handleDone = async () => {
        setFinishing(true);
        await onDone(mod);
        setFinishing(false);
    };

    const moduleIndex = MODULES.findIndex(m => m.id === mod.id);

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}>
            <div
                className="relative w-full max-w-2xl bg-[#FAF5E8] dark:bg-[#1c1916] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-500"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className={`relative p-6 bg-gradient-to-br ${mod.color} text-white flex-shrink-0`}>
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">{mod.icon}</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Module 0{moduleIndex + 1}</span>
                                <h2 className="font-serif font-black text-lg uppercase leading-tight">
                                    {t(`weekendExperience.combo.m${moduleIndex + 1}.title`)}
                                </h2>
                            </div>
                        </div>
                        <button onClick={onClose}
                            className="size-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0">
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>

                    {isLocked && (
                        <div className="mt-3 flex items-center gap-2 bg-black/20 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest">
                            <span className="material-symbols-outlined text-xs">lock</span>
                            Complete previous modules to unlock
                        </div>
                    )}
                </div>

                {/* Slideshow Body */}
                <div className="flex-1 flex flex-col min-h-[320px]">
                    {cards.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-16 text-espresso/30 text-center px-6">
                            <span className="material-symbols-outlined text-5xl mb-3">style</span>
                            <p className="font-bold">No content cards yet for this module.</p>
                            <p className="text-xs mt-1 opacity-60">Admin will add them soon!</p>
                            <button onClick={handleDone} disabled={finishing} className="mt-6 flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all">
                                {finishing ? 'Processing...' : 'Mark as Complete Anyway'}
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Card display */}
                            <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
                                {/* Slide animation wrapper */}
                                <div key={idx}
                                    className={`w-full flex items-center justify-center animate-in duration-300 ${direction === 'right' ? 'slide-in-from-right-8' : direction === 'left' ? 'slide-in-from-left-8' : 'fade-in'}`}>
                                    <div className="w-full max-w-sm">
                                        <ShapeCard card={cards[idx]} isLocked={isLocked} size="large" />
                                    </div>
                                </div>

                                {/* Side click zones (ghost) */}
                                {idx > 0 && (
                                    <button onClick={() => goTo(idx - 1)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 size-10 rounded-2xl bg-white/80 dark:bg-white/10 shadow-lg flex items-center justify-center text-espresso hover:scale-110 transition-all">
                                        <span className="material-symbols-outlined">chevron_left</span>
                                    </button>
                                )}
                                {idx < cards.length - 1 && (
                                    <button onClick={() => goTo(idx + 1)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-2xl bg-white/80 dark:bg-white/10 shadow-lg flex items-center justify-center text-espresso hover:scale-110 transition-all">
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                )}
                            </div>

                            {/* Bottom nav bar */}
                            <div className="flex-shrink-0 border-t border-espresso/5 px-6 py-4 flex items-center justify-between gap-4">
                                {/* Prev button */}
                                <button onClick={() => goTo(idx - 1)} disabled={idx === 0}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-espresso/5 dark:bg-white/5 border border-espresso/10 text-xs font-black uppercase tracking-widest text-espresso dark:text-white disabled:opacity-20 hover:bg-espresso hover:text-white transition-all disabled:pointer-events-none">
                                    <span className="material-symbols-outlined text-base">arrow_back</span>
                                    Prev
                                </button>

                                {/* Dot indicator + counter */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex gap-1.5">
                                        {cards.map((_, i) => (
                                            <button key={i} onClick={() => goTo(i)}
                                                className={`transition-all rounded-full ${i === idx ? 'w-6 h-2 bg-rose-500' : 'size-2 bg-espresso/20 hover:bg-rose-400'}`} />
                                        ))}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-espresso/30">
                                        {idx + 1} / {cards.length}
                                    </span>
                                </div>

                                {/* Next / Done button */}
                                {idx < cards.length - 1 ? (
                                    <button onClick={() => goTo(idx + 1)}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg">
                                        Next
                                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                                    </button>
                                ) : (
                                    <button onClick={handleDone} disabled={finishing}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-70">
                                        {finishing ? (
                                            <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Processing...</>
                                        ) : (
                                            <><span className="material-symbols-outlined text-base">arrow_forward</span>Next Module</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Feedback Section ─────────────────────────────────────────────────────────
function FeedbackSection({ user, userData }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const fileInputRef = React.useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setSubmitting(true);
        try {
            let imageUrl = '';
            // Upload image if selected
            if (imageFile) {
                const storageRef = ref(storage, `testimonials/${user.uid}_${Date.now()}_${imageFile.name}`);
                const snapshot = await uploadBytesResumable(storageRef, imageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(db, 'testimonials'), {
                userId: user.uid,
                name: userData?.name || userData?.fullName || 'Weekend Guest',
                role: 'Weekend Guest',
                rating,
                text: comment,
                imageUrl: imageUrl, // Save image URL
                status: 'pending', // Requires admin approval
                createdAt: serverTimestamp(),
                avatar: userData?.avatar || ''
            });
            setSubmitted(true);
        } catch (error) {
            console.error("Error submitting feedback:", error);
            alert("Failed to submit feedback. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    if (submitted) {
        return (
            <div className="mt-16 bg-emerald-500/10 border border-emerald-500/20 rounded-[3rem] p-10 text-center animate-in fade-in zoom-in duration-500 max-w-4xl mx-auto">
                <div className="size-20 bg-emerald-500 rounded-full mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/20">
                    <span className="material-symbols-outlined text-4xl">favorite</span>
                </div>
                <h3 className="font-serif text-2xl md:text-3xl font-black text-espresso dark:text-white mb-2">Thank you!</h3>
                <p className="text-espresso/60 dark:text-white/60 font-medium">Your feedback has been received and is highly appreciated.</p>
            </div>
        );
    }

    return (
        <div className="mt-16 bg-white/40 dark:bg-white/5 border border-espresso/5 rounded-[3rem] p-8 md:p-12 backdrop-blur-xl relative overflow-hidden max-w-4xl mx-auto shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
            <div className="relative z-10 text-center mb-10">
                <h3 className="font-serif text-3xl font-black text-espresso dark:text-white uppercase tracking-tight">Share Your Experience</h3>
                <p className="text-[10px] md:text-sm text-espresso/50 dark:text-white/50 tracking-widest uppercase mt-3 font-bold">Let others know about your time with us</p>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`transition-all duration-300 hover:scale-125 hover:-rotate-6 ${star <= rating ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-espresso/10 dark:text-white/10 hover:text-amber-400/50'}`}
                        >
                            <span className="material-symbols-outlined text-4xl md:text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What did you love about the Weekend Coffee Experience? Your feedback helps us grow!"
                        className="w-full h-40 px-6 py-5 rounded-3xl bg-white/60 dark:bg-black/20 border border-espresso/10 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/50 shadow-inner outline-none resize-none transition-all placeholder:text-espresso/30 text-base md:text-lg font-medium text-espresso dark:text-white"
                        required
                    />

                    {/* Image Upload Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-4 border-2 border-dashed border-espresso/20 rounded-2xl bg-white/40 dark:bg-black/10 hover:bg-white/60 dark:hover:bg-black/20 hover:border-rose-400 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
                    >
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        {imageFile ? (
                            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                                <span className="material-symbols-outlined">image</span>
                                <span className="font-bold text-sm tracking-wide">{imageFile.name} (Ready to upload)</span>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setImageFile(null); }}
                                    className="ml-2 size-6 flex items-center justify-center rounded-full hover:bg-emerald-500/20"
                                >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="size-10 rounded-full bg-espresso/5 flex items-center justify-center text-espresso/40 group-hover:text-rose-500 group-hover:scale-110 transition-all">
                                    <span className="material-symbols-outlined">add_photo_alternate</span>
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-espresso/40 group-hover:text-rose-500">Attach a photo of your experience (Optional)</span>
                            </>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting || !comment.trim()}
                    className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <span className="relative z-10">{submitting ? 'Submitting...' : 'Submit Feedback'}</span>
                    {!submitting && <span className="relative z-10 material-symbols-outlined text-base animate-bounce-x">send</span>}
                </button>
            </form>
        </div>
    );
}

// ── Donation Call-to-Action Section ──────────────────────────────────────────
function DonationSection() {
    const navigate = useNavigate();

    return (
        <div className="mt-8 bg-gradient-to-br from-espresso to-[#3A2A25] rounded-[3rem] p-8 md:p-12 relative overflow-hidden text-[#F5DEB3] shadow-2xl max-w-4xl mx-auto group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none group-hover:bg-rose-500/20 transition-colors duration-700" />
            <div className="absolute -left-10 -bottom-10 p-20 opacity-5 scale-150 -rotate-12 pointer-events-none transition-transform duration-1000 group-hover:scale-110">
                <span className="material-symbols-outlined text-[10rem]">volunteer_activism</span>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                <div className="size-24 md:size-32 shrink-0 bg-[#F5DEB3]/10 rounded-full flex items-center justify-center border-4 border-[#F5DEB3]/20 shadow-lg relative">
                    <div className="absolute inset-0 rounded-full border border-rose-500/50 animate-ping" />
                    <span className="material-symbols-outlined text-5xl md:text-6xl text-rose-400">favorite</span>
                </div>

                <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400 mb-2 block">Empower a Future Barista</span>
                        <h3 className="font-serif text-3xl md:text-4xl font-black text-white leading-tight">Support the USAFI Scholarship</h3>
                    </div>
                    <p className="text-[#F5DEB3]/70 font-medium leading-relaxed max-w-lg mx-auto md:mx-0">
                        Help passionate young Africans access professional coffee training. Your contribution funds essentials, intensive training, or full course scholarships.
                    </p>
                    <button
                        onClick={() => navigate('/donate')}
                        className="mt-4 px-8 py-4 rounded-2xl bg-rose-600 text-white font-black uppercase text-[10px] md:text-xs tracking-[0.2em] shadow-lg hover:shadow-rose-500/30 hover:bg-rose-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center md:justify-start gap-3 w-full md:w-auto"
                    >
                        Make a Donation
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function GuestDashboard() {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [progress, setProgress] = useState({});
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);

    // Mark module complete → open next module automatically
    const handleModuleDone = async (mod) => {
        if (user) {
            await setDoc(
                doc(db, 'users', user.uid, 'weekend_progress', mod.id),
                { status: 'completed', completedAt: serverTimestamp() },
                { merge: true }
            );
        }
        const currentIdx = MODULES.findIndex(m => m.id === mod.id);
        const nextMod = MODULES[currentIdx + 1];
        if (nextMod) {
            // Slide into the next module
            setSelectedModule({ mod: nextMod, isLocked: false });
        } else {
            // All 7 modules done!
            setSelectedModule(null);
        }
    };

    useEffect(() => {
        if (!user) return;

        getDoc(doc(db, 'users', user.uid)).then(snap => {
            if (snap.exists()) setUserData(snap.data());
        });

        const q = query(collection(db, 'users', user.uid, 'weekend_progress'));
        const timeout = setTimeout(() => setLoading(false), 5000);

        const unsubscribe = onSnapshot(q,
            (snap) => {
                clearTimeout(timeout);
                const p = {};
                snap.forEach(d => { p[d.id] = d.data(); });
                setProgress(p);
                setLoading(false);
            },
            (err) => {
                clearTimeout(timeout);
                console.warn('Progress read error:', err.message);
                setLoading(false);
            }
        );

        return () => { clearTimeout(timeout); unsubscribe(); };
    }, [user]);

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF5E8] dark:bg-[#1c1916]">
            <div className="text-center space-y-4">
                <p className="text-espresso/60">Please log in to access your journey.</p>
                <a href="/guest/login" className="text-rose-500 font-bold">Go to Guest Login</a>
            </div>
        </div>
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF5E8] dark:bg-[#1c1916]">
            <div className="size-16 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
        </div>
    );

    // Determine module accessibility
    const getModuleState = (index) => {
        const mod = MODULES[index];
        const mod_prog = progress[mod.id] || {};
        const isCompleted = mod_prog.status === 'completed';
        // First module is always current; others need previous completed
        const prevCompleted = index === 0 || progress[MODULES[index - 1]?.id]?.status === 'completed';
        const isCurrent = !isCompleted && prevCompleted;
        const isLocked = !isCompleted && !prevCompleted;
        return { isCompleted, isCurrent, isLocked };
    };

    const completedCount = MODULES.filter(m => progress[m.id]?.status === 'completed').length;

    return (
        <div className="min-h-screen bg-[#FAF5E8] dark:bg-[#1c1916] font-display flex flex-col">
            <Navbar />

            <main className="flex-grow pt-32 pb-20 px-4 md:px-8">
                <div className="max-w-4xl mx-auto space-y-12">

                    {/* Hero Header */}
                    <div className="relative p-8 md:p-12 rounded-[3rem] bg-espresso text-white overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl -mr-24 -mt-24" />
                        <div className="relative z-10">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10">
                                        <span className="material-symbols-outlined text-rose-500 text-sm animate-pulse">star</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Guest Experience Dashboard</span>
                                    </div>
                                    <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tight leading-none uppercase">
                                        Welcome, <span className="text-rose-500">{userData?.name?.split(' ')[0] || 'Coffee Lover'}</span>
                                    </h1>
                                    <p className="text-white/60 max-w-lg font-medium">
                                        Your journey through the 7-Point Combo Course. Tap any module to explore its content.
                                    </p>
                                </div>

                                {/* Progress Ring */}
                                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                    <div className="relative size-20">
                                        <svg className="size-20 -rotate-90" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f43f5e" strokeWidth="3"
                                                strokeDasharray={`${(completedCount / 7) * 100} 100`}
                                                strokeLinecap="round" className="transition-all duration-1000" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-lg font-black">{completedCount}/7</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Progress</span>
                                </div>
                            </div>

                            {/* Log out */}
                            <button onClick={async () => { await logout(); navigate('/guest/login'); }}
                                className="mt-6 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-rose-400 transition-colors flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">logout</span>
                                Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Journey Map */}
                    <div className="relative py-10 px-4 md:px-12 bg-white/40 dark:bg-white/5 rounded-[3rem] border border-espresso/5 backdrop-blur-xl">
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose-500 via-amber-500 to-emerald-500 opacity-10 -translate-x-1/2 hidden md:block" />

                        <div className="text-center mb-10">
                            <h2 className="font-serif font-black text-2xl text-espresso dark:text-white uppercase">Your Coffee Journey</h2>
                            <p className="text-xs text-espresso/40 uppercase tracking-widest mt-1">Tap a module to explore its content cards</p>
                        </div>

                        <div className="space-y-16 relative">
                            {MODULES.map((mod, index) => {
                                const { isCompleted, isCurrent, isLocked } = getModuleState(index);

                                return (
                                    <div key={mod.id}
                                        className={`flex flex-col md:flex-row items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} relative group cursor-pointer`}
                                        onClick={() => setSelectedModule({ mod, isLocked })}>

                                        {/* Module Icon */}
                                        <div className="relative z-10 flex-shrink-0">
                                            <div className={`size-24 md:size-32 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-105 ${isLocked
                                                ? 'bg-espresso/10 dark:bg-white/5 text-espresso/20'
                                                : `bg-gradient-to-br ${mod.color} text-white ring-8 ${mod.ring} shadow-rose-500/20`}`}>
                                                <span className="material-symbols-outlined text-4xl md:text-5xl">
                                                    {isLocked ? 'lock' : mod.icon}
                                                </span>
                                            </div>
                                            {isCompleted && (
                                                <div className="absolute -top-2 -right-2 size-9 rounded-full bg-emerald-500 text-white flex items-center justify-center border-4 border-[#FAF5E8] dark:border-[#1c1916] shadow-lg animate-bounce">
                                                    <span className="material-symbols-outlined text-sm">check</span>
                                                </div>
                                            )}
                                            {isCurrent && (
                                                <div className="absolute -bottom-2 -right-2 size-7 rounded-full bg-rose-500 border-4 border-[#FAF5E8] dark:border-[#1c1916] animate-pulse" />
                                            )}
                                        </div>

                                        {/* Module Content */}
                                        <div className={`flex-1 text-center ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'} space-y-2`}>
                                            <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isLocked ? 'text-espresso/20' : 'text-rose-500'}`}>
                                                Module 0{index + 1}
                                            </span>
                                            <h3 className={`text-2xl md:text-3xl font-serif font-black uppercase ${isLocked ? 'text-espresso/20 dark:text-white/10' : 'text-espresso dark:text-white'}`}>
                                                {t(`weekendExperience.combo.m${index + 1}.title`)}
                                            </h3>
                                            <p className={`max-w-md ${index % 2 === 0 ? 'md:ml-0 mx-auto' : 'md:mr-0 mx-auto'} font-medium text-sm ${isLocked ? 'text-espresso/10' : 'text-espresso/60 dark:text-white/60'}`}>
                                                {t(`weekendExperience.combo.m${index + 1}.desc`)}
                                            </p>

                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest mt-2 border transition-all group-hover:scale-105
                                                ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600'
                                                    : isCurrent ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-500/20 text-rose-600'
                                                        : 'bg-espresso/5 border-espresso/10 text-espresso/20'}`}>
                                                <span className="material-symbols-outlined text-sm">
                                                    {isCompleted ? 'check_circle' : isCurrent ? 'play_circle' : 'lock'}
                                                </span>
                                                {isCompleted ? 'Completed' : isCurrent ? 'Tap to Explore →' : 'Locked'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Donation CTA */}
                    <DonationSection />

                    {/* Feedback / Testimonial Section */}
                    <FeedbackSection user={user} userData={userData} />
                </div>
            </main>

            <Footer />

            {/* Module Panel Overlay */}
            {selectedModule && (
                <ModulePanel
                    mod={selectedModule.mod}
                    isLocked={selectedModule.isLocked}
                    onClose={() => setSelectedModule(null)}
                    onDone={handleModuleDone}
                    t={t}
                />
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .material-symbols-outlined { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
            ` }} />
        </div>
    );
}
