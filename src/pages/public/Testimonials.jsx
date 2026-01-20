import React, { useState, useRef, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientButton } from '../../components/ui/GradientButton';
import { Newsletter } from '../../components/ui/Newsletter';

export function Testimonials() {
    const { t } = useTranslation();
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);

    const [dynamicTestimonials, setDynamicTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        topic: '',
        content: '',
        image: null
    });

    useEffect(() => {
        const q = query(
            collection(db, 'testimonials'),
            where('status', '==', 'approved')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort by createdAt on client side to avoid composite index requirement
            const sortedItems = items.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB - dateA;
            });

            setDynamicTestimonials(sortedItems);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let imageUrl = '';
            if (formData.image) {
                const storageRef = ref(storage, `testimonials/${Date.now()}_${formData.image.name}`);
                const snapshot = await uploadBytes(storageRef, formData.image);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(db, 'testimonials'), {
                name: formData.name,
                phone: formData.phone,
                topic: formData.topic,
                content: formData.content,
                imageUrl,
                status: 'pending',
                type: 'public',
                createdAt: serverTimestamp()
            });

            alert("Testimony submitted! It will appear after manager approval.");
            setFormData({ name: '', phone: '', topic: '', content: '', image: null });
            setShowForm(false);
        } catch (error) {
            console.error("Error submitting testimony:", error);
            alert("Submission failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

            {/* 1. Page Title */}
            <div className="container mx-auto px-6 text-center mb-16">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white mb-4 tracking-tight">
                    {t('testimonials.title')}
                </h1>
                <h2 className="text-xl md:text-2xl text-primary font-medium mb-6">
                    {t('testimonials.subtitle')}
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 leading-relaxed max-w-3xl mx-auto">
                    {t('testimonials.description')}
                </p>
            </div>

            {/* 2. Section 1: Featured Video Testimonial */}
            <section className="container mx-auto px-6 mb-20">
                <div className="bg-espresso text-[#FAF5E8] rounded-3xl overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* Video Player */}
                        <div
                            className="aspect-video lg:aspect-auto bg-black relative flex items-center justify-center group cursor-pointer overflow-hidden"
                            onClick={togglePlay}
                        >
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                poster="/image/hero-image-8.webp"
                                playsInline
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                            >
                                <source src="/Video/8.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>

                            {/* Play Overlay */}
                            {!isPlaying && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity hover:bg-black/30">
                                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-4xl text-white ml-2">play_arrow</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Video Description */}
                        <div className="p-8 lg:p-12 flex flex-col justify-center">
                            <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm font-bold uppercase tracking-wider rounded-full mb-4 w-fit">
                                {t('testimonials.featured.badge')}
                            </span>
                            <h3 className="font-serif text-3xl font-bold text-white mb-4">
                                {t('testimonials.featured.title')}
                            </h3>
                            <p className="text-white/80 leading-relaxed mb-6">
                                {t('testimonials.featured.description')}
                            </p>
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <span className="material-symbols-outlined">verified</span>
                                <span>{t('testimonials.featured.class')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Section 2: Written Testimonials */}
            <section className="container mx-auto px-6 mb-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Testimonial 1 */}
                    <div className="bg-[#F5DEB3] dark:bg-white/5 p-8 rounded-3xl shadow-xl border border-espresso/10 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                        <span className="material-symbols-outlined text-6xl text-espresso/10 absolute top-4 right-4">format_quote</span>
                        <div className="mb-6">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider rounded-full">
                                {t('testimonials.tags.placement')}
                            </span>
                        </div>
                        <p className="text-espresso/80 dark:text-white/80 italic mb-8 relative z-10">
                            {t('testimonials.items.grace.text')}
                        </p>
                        <div className="flex items-center gap-4">
                            <div
                                className="h-12 w-12 rounded-full bg-gray-300 bg-cover bg-center"
                                style={{ backgroundImage: "url('/image/Nyamwiza Aidah.jpeg')" }}
                            ></div>
                            <div>
                                <h4 className="font-bold text-espresso dark:text-white">{t('testimonials.items.grace.name')}</h4>
                                <p className="text-xs text-espresso/60 dark:text-white/60 uppercase tracking-wide">{t('testimonials.items.grace.role')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Testimonial 2 */}
                    <div className="bg-[#F5DEB3] dark:bg-white/5 p-8 rounded-3xl shadow-xl border border-espresso/10 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                        <span className="material-symbols-outlined text-6xl text-espresso/10 absolute top-4 right-4">format_quote</span>
                        <div className="mb-6">
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-bold uppercase tracking-wider rounded-full">
                                {t('testimonials.tags.technical')}
                            </span>
                        </div>
                        <p className="text-espresso/80 dark:text-white/80 italic mb-8 relative z-10">
                            {t('testimonials.items.kevin.text')}
                        </p>
                        <div className="flex items-center gap-4">
                            <div
                                className="h-12 w-12 rounded-full bg-gray-300 bg-cover bg-center"
                                style={{ backgroundImage: "url('/image/Umwali Ratifa.jpeg')" }}
                            ></div>
                            <div>
                                <h4 className="font-bold text-espresso dark:text-white">{t('testimonials.items.kevin.name')}</h4>
                                <p className="text-xs text-espresso/60 dark:text-white/60 uppercase tracking-wide">{t('testimonials.items.kevin.role')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Testimonial 3 */}
                    <div className="bg-[#F5DEB3] dark:bg-white/5 p-8 rounded-3xl shadow-xl border border-espresso/10 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                        <span className="material-symbols-outlined text-6xl text-espresso/10 absolute top-4 right-4">format_quote</span>
                        <div className="mb-6">
                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-bold uppercase tracking-wider rounded-full">
                                {t('testimonials.tags.online')}
                            </span>
                        </div>
                        <p className="text-espresso/80 dark:text-white/80 italic mb-8 relative z-10">
                            {t('testimonials.items.patience.text')}
                        </p>
                        <div className="flex items-center gap-4">
                            <div
                                className="h-12 w-12 rounded-full bg-gray-300 bg-cover bg-center"
                                style={{ backgroundImage: "url('/image/Munyaneza Eric.jpeg')" }}
                            ></div>
                            <div>
                                <h4 className="font-bold text-espresso dark:text-white">{t('testimonials.items.patience.name')}</h4>
                                <p className="text-xs text-espresso/60 dark:text-white/60 uppercase tracking-wide">{t('testimonials.items.patience.role')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3.1 Dynamic Testimonials */}
            {dynamicTestimonials.length > 0 && (
                <section className="container mx-auto px-6 mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {dynamicTestimonials.map((item) => (
                            <div key={item.id} className="bg-[#F5DEB3] dark:bg-white/5 p-8 rounded-3xl shadow-xl border border-espresso/10 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/40 group-hover:bg-primary transition-colors"></div>
                                <span className="material-symbols-outlined text-6xl text-espresso/10 absolute top-4 right-4">format_quote</span>
                                <div className="mb-6">
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full">
                                        {item.topic || 'General Feedback'}
                                    </span>
                                </div>
                                <p className="text-espresso/80 dark:text-white/80 italic mb-8 relative z-10">
                                    "{item.content}"
                                </p>
                                <div className="flex items-center gap-4">
                                    <div
                                        className="h-12 w-12 rounded-full bg-gray-300 bg-cover bg-center border border-espresso/10"
                                        style={{ backgroundImage: item.imageUrl ? `url("${item.imageUrl}")` : "url('/image/hero-image-1.webp')" }}
                                    ></div>
                                    <div>
                                        <h4 className="font-bold text-espresso dark:text-white uppercase text-xs tracking-wider">{item.name}</h4>
                                        <p className="text-[10px] text-espresso/60 dark:text-white/60 uppercase tracking-widest">Verified {item.type || 'Reviewer'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 3.2 Submission Form (Conditional) */}
            {showForm && (
                <section className="container mx-auto px-6 mb-20 animate-in slide-in-from-bottom duration-500">
                    <div className="bg-white/40 dark:bg-black/20 rounded-[2.5rem] p-8 md:p-12 border-2 border-primary/20 shadow-2xl backdrop-blur-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <button onClick={() => setShowForm(false)} className="text-espresso/40 hover:text-espresso transition-colors">
                                <span className="material-symbols-outlined text-3xl">close</span>
                            </button>
                        </div>

                        <div className="max-w-3xl mx-auto space-y-10">
                            <div className="text-center">
                                <h3 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-2">Share Your Story</h3>
                                <p className="text-sm font-bold text-espresso/60 uppercase tracking-widest">Help us inspire the next generation of baristas</p>
                            </div>

                            <form onSubmit={handleFormSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-espresso/40 uppercase tracking-widest ml-2">Your Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full p-4 bg-white/60 dark:bg-black/40 border border-espresso/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
                                            placeholder="Full Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-espresso/40 uppercase tracking-widest ml-2">Phone Number</label>
                                        <input
                                            required
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full p-4 bg-white/60 dark:bg-black/40 border border-espresso/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
                                            placeholder="Contact Info"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-espresso/40 uppercase tracking-widest ml-2">Topic / Area of Training</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.topic}
                                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                        className="w-full p-4 bg-white/60 dark:bg-black/40 border border-espresso/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
                                        placeholder="e.g. Latte Art, Career Growth, Customer Service"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-espresso/40 uppercase tracking-widest ml-2">Your Message</label>
                                    <textarea
                                        required
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full p-4 bg-white/60 dark:bg-black/40 border border-espresso/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all min-h-[150px]"
                                        placeholder="Describe your experience with USAFFI..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-espresso/40 uppercase tracking-widest ml-2">Optional Picture</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                                        className="w-full p-4 bg-white/60 dark:bg-black/40 border border-espresso/10 rounded-2xl outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-16 bg-espresso text-white rounded-2xl font-serif font-black text-xl uppercase tracking-widest shadow-2xl hover:bg-primary transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                                >
                                    {isSubmitting ? 'SYNCING DATA...' : 'SUBMIT TESTIMONY'}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            )}

            {/* 4. Section 3: Call to Action */}
            <section className="bg-espresso text-[#FAF5E8] py-20 px-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="grid grid-cols-6 h-full w-full">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="border border-white/10 aspect-square"></div>
                        ))}
                    </div>
                </div>

                <div className="container mx-auto max-w-3xl relative z-10">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">
                        {t('testimonials.cta.title')}
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <GradientButton to="/enroll">
                            {t('testimonials.cta.button')}
                        </GradientButton>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-10 h-14 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white font-serif font-black text-sm uppercase tracking-widest transition-all"
                        >
                            Share Your Testimony
                        </button>
                    </div>
                </div>
            </section>

            {/* Newsletter Section */}
            <Newsletter />

        </div>
    );
}
