import React, { useState, useRef, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Newsletter } from '../../components/ui/Newsletter';
import { SEO } from '../../components/common/SEO';

import hero1 from '../../assets/images/about/hero-image-1.webp';
import hero2 from '../../assets/images/about/hero-image-2.webp';
import hero3 from '../../assets/images/about/hero-image-3.webp';
import hero5 from '../../assets/images/about/hero-image-5.webp';
import hero6 from '../../assets/images/about/hero-image-6.webp';
import hero7 from '../../assets/images/about/hero-image-7.webp';
import hero8 from '../../assets/images/about/hero-image-8.webp';

export function Gallery() {
    const { t } = useTranslation();
    const [dynamicItems, setDynamicItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState(null); // { url, type }

    useEffect(() => {
        const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDynamicItems(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 15 New local images from /public/image/
    const newPhotos = [
        { url: "/image/image1.jpeg", category: t('gallery.categories.practice'), desc: t('gallery.photos.grind'), type: 'image' },
        { url: "/image/image2.jpeg", category: t('gallery.categories.mastery'), desc: t('gallery.photos.heart'), type: 'image' },
        { url: "/image/image3.jpeg", category: t('gallery.categories.classroom'), desc: t('gallery.photos.discussion'), type: 'image' },
        { url: "/image/image4.jpeg", category: t('gallery.categories.practice'), desc: t('gallery.photos.tamping'), type: 'image' },
        { url: "/image/image5.jpeg", category: t('gallery.categories.graduation'), desc: t('gallery.photos.class2024'), type: 'image' },
        { url: "/image/image6.jpeg", category: t('gallery.categories.practice'), desc: "Learning the machine", type: 'image' },
        { url: "/image/image7.jpeg", category: t('gallery.categories.classroom'), desc: "Theoretical foundations", type: 'image' },
        { url: "/image/image8.jpeg", category: t('gallery.categories.mastery'), desc: "Steam wand control", type: 'image' },
        { url: "/image/image9.jpeg", category: t('gallery.categories.practice'), desc: "Precision tamping", type: 'image' },
        { url: "/image/image10.jpeg", category: t('gallery.categories.classroom'), desc: "Tasting session", type: 'image' },
        { url: "/image/image11.jpeg", category: t('gallery.categories.mastery'), desc: "Latte art practice", type: 'image' },
        { url: "/image/image12.jpeg", category: t('gallery.categories.practice'), desc: "Workflow optimization", type: 'image' },
        { url: "/image/image13.jpeg", category: t('gallery.categories.graduation'), desc: "Celebrating success", type: 'image' },
        { url: "/image/image14.jpeg", category: t('gallery.categories.classroom'), desc: "Bean selection science", type: 'image' },
        { url: "/image/image15.jpeg", category: t('gallery.categories.practice'), desc: "Center operations", type: 'image' },
    ];

    const localHeroPhotos = [
        { url: hero1, category: t('gallery.categories.practice'), desc: "Hero 1", type: 'image' },
        { url: hero2, category: t('gallery.categories.mastery'), desc: "Hero 2", type: 'image' },
        { url: hero3, category: t('gallery.categories.classroom'), desc: "Hero 3", type: 'image' },
        { url: hero5, category: t('gallery.categories.graduation'), desc: "Hero 5", type: 'image' },
        { url: hero6, category: t('gallery.categories.practice'), desc: "Hero 6", type: 'image' },
        { url: hero7, category: t('gallery.categories.classroom'), desc: "Hero 7", type: 'image' },
        { url: hero8, category: t('gallery.categories.practice'), desc: "Hero 8", type: 'image' },
    ];

    const allPhotos = [...newPhotos, ...localHeroPhotos];

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">
            <SEO
                title={t('gallery.title')}
                description={t('gallery.description')}
            />

            {/* 1. Page Title */}
            <div className="container mx-auto px-6 text-center mb-16">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white mb-4 tracking-tight">
                    {t('gallery.title')}
                </h1>
                <h2 className="text-xl md:text-2xl text-primary font-medium mb-6">
                    {t('gallery.subtitle')}
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 leading-relaxed max-w-3xl mx-auto">
                    {t('gallery.description')}
                </p>
            </div>

            {/* 2. Section 1: Image Gallery (Grid) */}
            <section className="container mx-auto px-6 mb-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {allPhotos.map((photo, index) => (
                        <div
                            key={index}
                            className="group relative break-inside-avoid overflow-hidden rounded-2xl shadow-xl border border-espresso/10 aspect-square bg-[#F5DEB3] dark:bg-white/5 cursor-pointer"
                            onClick={() => setSelectedMedia({ url: photo.url, type: 'image' })}
                        >
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                style={{ backgroundImage: `url("${photo.url}")` }}
                            ></div>
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <p className="text-white font-bold text-sm uppercase tracking-wider">{photo.category}</p>
                                <p className="text-white/80 text-xs">{photo.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Section 2: Video Highlights */}
            <section className="bg-espresso text-[#FAF5E8] py-20 px-6">
                <div className="container mx-auto px-6">
                    <h2 className="font-serif text-3xl font-bold mb-12 text-center">{t('gallery.videos.title')}</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((id) => (
                            <VideoCard key={id} id={id} onOpen={(url) => setSelectedMedia({ url, type: 'video' })} />
                        ))}
                    </div>
                </div>
            </section>

            {/* 3.5 Section 2.5: Dynamic Institutional Moments */}
            {dynamicItems.length > 0 && (
                <section className="container mx-auto px-6 py-20">
                    <div className="flex flex-col items-center text-center mb-16">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-espresso dark:text-white mb-4 border-b-2 border-primary/20 pb-2">
                            Recent Institutional Highlights
                        </h2>
                        <p className="text-espresso/60 dark:text-white/60 text-sm font-bold uppercase tracking-[0.3em]">
                            Latest Visual Records & Community Archives
                        </p>
                    </div>

                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                        {dynamicItems.map((item) => (
                            <div
                                key={item.id}
                                className="break-inside-avoid group relative overflow-hidden rounded-2xl shadow-xl border border-espresso/10 bg-[#F5DEB3] dark:bg-white/5 transition-all hover:-translate-y-2 duration-300 cursor-pointer"
                                onClick={() => setSelectedMedia({ url: item.url, type: item.type })}
                            >
                                {item.type === 'image' ? (
                                    <div className="relative overflow-hidden cursor-pointer">
                                        <img src={item.url} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110" alt="Institutional Highlight" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-black flex items-center justify-center relative group/vid cursor-pointer overflow-hidden">
                                        <video className="w-full h-full object-cover">
                                            <source src={item.url} type="video/mp4" />
                                        </video>
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/vid:bg-black/30 transition-all">
                                            <span className="material-symbols-outlined text-4xl text-white">play_circle</span>
                                        </div>
                                    </div>
                                )}
                                <div className="p-5 border-l-4 border-espresso group-hover:border-primary transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{item.type} Archive</span>
                                        <span className="text-[8px] font-bold text-espresso/40 italic">{item.createdAt?.toDate().toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-espresso/80 dark:text-white/80 text-sm font-medium leading-relaxed italic">
                                        "{item.description}"
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 4. Section 3: Call to Action */}
            <section className="container mx-auto px-6 py-20 text-center bg-[#F5DEB3] dark:bg-white/5 border-y border-espresso/10 rounded-3xl mt-20 relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-espresso dark:text-white mb-6">
                    {t('gallery.cta.title')}
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 mb-10 max-w-2xl mx-auto">
                    {t('gallery.cta.description')}
                </p>
                <Link to="/contact" className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-primary text-primary font-bold text-lg hover:bg-primary hover:text-white transition-all">
                    {t('gallery.cta.button')}
                </Link>
            </section>

            <Newsletter />

            {/* Lightbox Modal */}
            {selectedMedia && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
                    onClick={() => setSelectedMedia(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/50 hover:text-white transition-all bg-white/10 p-3 rounded-full hover:scale-110"
                        onClick={() => setSelectedMedia(null)}
                    >
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </button>

                    <div className="max-w-6xl w-full max-h-full flex items-center justify-center animate-in zoom-in-95 duration-500">
                        {selectedMedia.type === 'image' ? (
                            <img
                                src={selectedMedia.url}
                                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
                                alt="Full View"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <div className="w-full aspect-video max-h-[85vh] relative rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black" onClick={(e) => e.stopPropagation()}>
                                <video
                                    src={selectedMedia.url}
                                    className="w-full h-full object-contain"
                                    controls
                                    autoPlay
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function VideoCard({ id, onOpen }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);

    const togglePlay = () => {
        if (onOpen) {
            onOpen(`/Video/${id}.mp4`);
            return;
        }
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
        <div
            className="bg-white/5 rounded-2xl overflow-hidden shadow-lg border border-white/10 group cursor-pointer relative aspect-video"
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            >
                <source src={`/Video/${id}.mp4`} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Play Overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity hover:bg-black/30">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-3xl text-white ml-1">play_arrow</span>
                    </div>
                </div>
            )}

            {/* ID Tag */}
            <div className="absolute top-4 left-4 z-10">
                <span className="px-2 py-1 bg-espresso/60 backdrop-blur-md text-white/90 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                    Story #{id}
                </span>
            </div>
        </div>
    );
}
