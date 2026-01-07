import React, { useState, useEffect } from 'react';
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

const heroImages = [hero1, hero2, hero3, hero5, hero6, hero7, hero8];

export function About() {
    const { t } = useTranslation();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-10">
            <SEO
                title={t('about.title')}
                description={t('about.hero.description')}
            />

            {/* 1. Page Title */}
            <div className="pt-24 pb-8 px-6 text-center">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white tracking-tight">
                    {t('about.title')}
                </h1>
            </div>

            {/* 2. Introduction Section */}
            <section className="container mx-auto px-6 mb-20">
                <div className="relative w-full h-[80vh] rounded-3xl overflow-hidden shadow-xl mb-10">
                    {/* Image Slider */}
                    {heroImages.map((image, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                                }`}
                        >
                            <img
                                src={image}
                                alt={`About Hero ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20"></div>
                        </div>
                    ))}
                </div>

                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-6">
                        {t('about.hero.title')}
                    </h2>
                    <p className="text-lg text-espresso/80 dark:text-white/80 leading-relaxed font-normal">
                        {t('about.hero.description')}
                    </p>
                </div>
            </section>

            {/* 3. Mission & Vision Section */}
            <section className="w-full bg-[#F5DEB3] py-20 px-6 border-y border-espresso/10 dark:border-white/10 dark:bg-white/5">
                <div className="container mx-auto max-w-5xl">
                    <div className="flex flex-col md:flex-row gap-8">

                        {/* Mission Card */}
                        <div className="flex-1 bg-[#F5DEB3] dark:bg-white/5 p-8 rounded-3xl shadow-xl border border-espresso/10 flex flex-col items-center text-center gap-4 relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <div className="h-16 w-16 rounded-2xl bg-espresso text-white flex items-center justify-center shadow-md mb-2 group-hover:scale-110 transition-transform">
                                {/* Target Icon */}
                                <span className="material-symbols-outlined text-3xl">ads_click</span>
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white">{t('about.mission.title')}</h3>
                            <p className="text-espresso/70 dark:text-white/70 leading-relaxed">
                                {t('about.mission.description')}
                            </p>
                        </div>

                        {/* Vision Card */}
                        <div className="flex-1 bg-[#F5DEB3] dark:bg-white/5 p-8 rounded-3xl shadow-xl border border-espresso/10 flex flex-col items-center text-center gap-4 relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <div className="h-16 w-16 rounded-2xl bg-espresso text-white flex items-center justify-center shadow-md mb-2 group-hover:scale-110 transition-transform">
                                {/* Compass Icon */}
                                <span className="material-symbols-outlined text-3xl">explore</span>
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white">{t('about.vision.title')}</h3>
                            <p className="text-espresso/70 dark:text-white/70 leading-relaxed">
                                {t('about.vision.description')}
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* 4. Leadership & Team Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-espresso dark:text-white">
                        {t('about.leadership.title')}
                    </h2>
                </div>

                <div className="max-w-5xl mx-auto flex flex-col gap-16">

                    {/* Director Profile */}
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        {/* Image 1: Circular Headshot */}
                        <div className="shrink-0 w-64 h-64 rounded-full overflow-hidden border-4 border-primary shadow-lg">
                            <img
                                src="./Ebene.png"
                                alt="Sandrine Gasarasi"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col text-center md:text-left">
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-1">{t('about.leadership.director.name')}</h3>
                            <p className="text-primary font-bold uppercase tracking-wider text-sm mb-4">{t('about.leadership.director.role')}</p>
                            <p className="text-espresso/80 dark:text-white/80 leading-relaxed">
                                {t('about.leadership.director.description')}
                            </p>
                        </div>
                    </div>

                    {/* Instructor Profile */}
                    <div className="flex flex-col md:flex-row-reverse items-center gap-10">
                        {/* Image 2: Circular Headshot/Action shot */}
                        <div className="shrink-0 w-64 h-64 rounded-full overflow-hidden border-4 border-primary shadow-lg">
                            <img
                                src="./Ebene.png" // Placeholder using the Latte Art Specialist image
                                alt="Ishimwe Ebenezer"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col text-center md:text-right">
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-1">{t('about.leadership.mentorship.title')}</h3>
                            <p className="text-primary font-bold uppercase tracking-wider text-sm mb-4">{t('about.leadership.mentorship.lead')}</p>
                            <p className="text-espresso/80 dark:text-white/80 leading-relaxed">
                                {t('about.leadership.mentorship.description')}
                            </p>
                        </div>
                    </div>

                </div>
            </section>

            {/* 5. Why We Exist */}
            <section className="bg-espresso text-[#FAF5E8] py-20 px-6">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">{t('about.represent.title')}</h2>
                    <p className="text-lg md:text-xl font-light leading-relaxed opacity-90">
                        {t('about.represent.description')}
                    </p>
                </div>
            </section>

            {/* 6. CTA Section */}
            <section className="py-20 px-6 bg-background-light dark:bg-background-dark text-center">
                <h2 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-6">{t('about.cta.title')}</h2>
                <Link to="/courses" className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-primary text-[#fbfaf9] text-lg font-bold tracking-wide shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-105 transition-all duration-300">
                    {t('about.cta.button')}
                </Link>
            </section>

        </div>
    );
}
