import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Newsletter } from '../../components/ui/Newsletter';

import hero1 from '../../assets/images/about/hero-image-1.webp';
import hero2 from '../../assets/images/about/hero-image-2.webp';
import hero3 from '../../assets/images/about/hero-image-3.webp';
import hero5 from '../../assets/images/about/hero-image-5.webp';
import hero6 from '../../assets/images/about/hero-image-6.webp';
import hero7 from '../../assets/images/about/hero-image-7.webp';
import hero8 from '../../assets/images/about/hero-image-8.webp';

export function Gallery() {
    const { t } = useTranslation();
    const photos = [
        {
            url: "https://images.unsplash.com/photo-1574914540608-f1c2b53b7549?q=80&w=2670&auto=format&fit=crop",
            category: t('gallery.categories.practice'),
            desc: t('gallery.photos.grind')
        },
        {
            url: "https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?q=80&w=2670&auto=format&fit=crop",
            category: t('gallery.categories.mastery'),
            desc: t('gallery.photos.heart')
        },
        {
            url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2670&auto=format&fit=crop",
            category: t('gallery.categories.classroom'),
            desc: t('gallery.photos.discussion')
        },
        {
            url: "https://images.unsplash.com/photo-1607619662634-3acce2e03cc1?q=80&w=2670&auto=format&fit=crop",
            category: t('gallery.categories.graduation'),
            desc: t('gallery.photos.class2024')
        },
        {
            url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2670&auto=format&fit=crop",
            category: t('gallery.categories.practice'),
            desc: t('gallery.photos.tamping')
        },
        {
            url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=2837&auto=format&fit=crop",
            category: t('gallery.categories.classroom'),
            desc: t('gallery.photos.testing')
        },
    ];

    const localPhotos = [
        { url: hero1, category: t('gallery.categories.practice'), desc: "Hero 1" },
        { url: hero2, category: t('gallery.categories.mastery'), desc: "Hero 2" },
        { url: hero3, category: t('gallery.categories.classroom'), desc: "Hero 3" },
        { url: hero5, category: t('gallery.categories.graduation'), desc: "Hero 5" },
        { url: hero6, category: t('gallery.categories.practice'), desc: "Hero 6" },
        { url: hero7, category: t('gallery.categories.classroom'), desc: "Hero 7" },
        { url: hero8, category: t('gallery.categories.practice'), desc: "Hero 8" },
    ];

    const allPhotos = [...photos, ...localPhotos];

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {allPhotos.map((photo, index) => (
                        <div key={index} className="group relative break-inside-avoid overflow-hidden rounded-2xl shadow-xl border border-espresso/10 aspect-[4/3] bg-[#F5DEB3] dark:bg-white/5">
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
                            <VideoCard key={id} id={id} />
                        ))}
                    </div>
                </div>
            </section>

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
        </div>
    );
}

function VideoCard({ id }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);

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
