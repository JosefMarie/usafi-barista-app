import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { GradientButton } from '../../components/ui/GradientButton';
import { Newsletter } from '../../components/ui/Newsletter';

export function Equipment() {
    const { t } = useTranslation();
    const [selectedImage, setSelectedImage] = useState(null);

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

            {/* Page Title */}
            <div className="container mx-auto px-6 text-center mb-16">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white mb-4 tracking-tight">
                    {t('equipment.title')}
                </h1>
                <h2 className="text-xl md:text-2xl text-primary font-medium mb-6">
                    {t('equipment.subtitle')}
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 leading-relaxed max-w-3xl mx-auto">
                    {t('equipment.description')}
                </p>
            </div>

            {/* Section 1: Core Machinery */}
            <section className="container mx-auto px-6 mb-20">
                <h2 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-8 border-b-2 border-primary/20 pb-2 inline-block">
                    {t('equipment.machinery.title')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Espresso Machine Card */}
                    <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl overflow-hidden shadow-xl border border-espresso/10 flex flex-col relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors z-10"></div>
                        <div className="h-64 bg-gray-200 relative cursor-pointer" onClick={() => setSelectedImage("/image/espresso-machine.jpeg")}>
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                style={{ backgroundImage: 'url("/image/espresso-machine.jpeg")' }}
                            ></div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="material-symbols-outlined text-white text-4xl drop-shadow-lg">zoom_in</span>
                            </div>
                        </div>
                        <div className="p-8 flex-1">
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-2">{t('equipment.machinery.espresso.title')}</h3>
                            <p className="text-primary font-medium mb-4">{t('equipment.machinery.espresso.subtitle')}</p>
                            <p className="text-espresso/80 dark:text-white/80 leading-relaxed mb-4">
                                {t('equipment.machinery.espresso.description')}
                            </p>
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-espresso/60 dark:text-white/60">{t('equipment.machinery.espresso.considerations.label')}</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{t('equipment.machinery.espresso.considerations.reliability')}</span>
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{t('equipment.machinery.espresso.considerations.boiler')}</span>
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{t('equipment.machinery.espresso.considerations.ease')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grinder Card */}
                    <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl overflow-hidden shadow-xl border border-espresso/10 flex flex-col relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors z-10"></div>
                        <div className="h-64 bg-gray-200 relative cursor-pointer" onClick={() => setSelectedImage("/image/coffee-grinder.jpeg")}>
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                style={{ backgroundImage: 'url("/image/coffee-grinder.jpeg")' }}
                            ></div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="material-symbols-outlined text-white text-4xl drop-shadow-lg">zoom_in</span>
                            </div>
                        </div>
                        <div className="p-8 flex-1">
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-2">{t('equipment.machinery.grinder.title')}</h3>
                            <p className="text-primary font-medium mb-4">{t('equipment.machinery.grinder.subtitle')}</p>
                            <p className="text-espresso/80 dark:text-white/80 leading-relaxed mb-4">
                                {t('equipment.machinery.grinder.description')}
                            </p>
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-espresso/60 dark:text-white/60">{t('equipment.machinery.grinder.considerations.label')}</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{t('equipment.machinery.grinder.considerations.consistency')}</span>
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{t('equipment.machinery.grinder.considerations.burr')}</span>
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{t('equipment.machinery.grinder.considerations.dosing')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Section 2: Essential Barista Tools */}
            <section className="bg-[#F5DEB3] dark:bg-white/5 py-20 border-y border-espresso/10 overflow-hidden">
                <div className="container mx-auto px-6 mb-10">
                    <h2 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-2 border-b-2 border-primary/20 pb-2 inline-block">
                        {t('equipment.smallwares.title')}
                    </h2>
                </div>

                {/* Marquee Container */}
                <div className="relative w-full">
                    <style>{`
                        @keyframes marquee {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                        .animate-marquee {
                            animation: marquee 30s linear infinite;
                        }
                        .animate-marquee:hover {
                            animation-play-state: paused;
                        }
                    `}</style>
                    <div className="flex animate-marquee gap-8 w-max px-6">
                        {/* Double the items for seamless loop */}
                        {[...Array(2)].map((_, i) => (
                            <>
                                {[
                                    { id: 'tamper', image: '/image/tamper.jpeg', icon: 'hardware', key: 'tamper' },
                                    { id: 'pitcher', image: '/image/pitcher.jpeg', icon: 'local_cafe', key: 'pitcher' },
                                    { id: 'knock', image: '/image/knock-box.jpeg', icon: 'delete', key: 'knock' },
                                    { id: 'scales', image: '/image/scale.jpeg', icon: 'scale', key: 'scales' }
                                ].map((tool) => (
                                    <div
                                        key={`${i}-${tool.id}`}
                                        className="w-[300px] md:w-[350px] bg-[#F5DEB3] dark:bg-white/5 rounded-2xl shadow-xl border border-espresso/5 overflow-hidden group shrink-0"
                                    >
                                        <div 
                                            className="h-48 relative cursor-pointer overflow-hidden"
                                            onClick={() => setSelectedImage(tool.image)}
                                        >
                                            <div 
                                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                                style={{ backgroundImage: `url("${tool.image}")` }}
                                            ></div>
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <span className="material-symbols-outlined text-white text-4xl drop-shadow-lg">zoom_in</span>
                                            </div>
                                        </div>
                                        <div className="p-6 relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/10 group-hover:bg-espresso transition-colors"></div>
                                            <div className="w-10 h-10 rounded-xl bg-espresso text-white flex items-center justify-center mb-3 shadow-md">
                                                <span className="material-symbols-outlined text-xl">{tool.icon}</span>
                                            </div>
                                            <h3 className="font-bold text-lg text-espresso dark:text-white mb-2">
                                                {t(`equipment.smallwares.${tool.key}.title`)}
                                            </h3>
                                            <p className="text-sm text-espresso/70 dark:text-white/70">
                                                {t(`equipment.smallwares.${tool.key}.description`)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 3 & 4 Grid */}
            <section className="container mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                    {/* Serving & Inventory */}
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-3xl">inventory_2</span>
                            {t('equipment.serving.title')}
                        </h2>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0"></div>
                                <div>
                                    <h4 className="font-bold text-espresso dark:text-white">{t('equipment.serving.cups.title')}</h4>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">{t('equipment.serving.cups.description')}</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0"></div>
                                <div>
                                    <h4 className="font-bold text-espresso dark:text-white">{t('equipment.serving.storage.title')}</h4>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">{t('equipment.serving.storage.description')}</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0"></div>
                                <div>
                                    <h4 className="font-bold text-espresso dark:text-white">{t('equipment.serving.pos.title')}</h4>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">{t('equipment.serving.pos.description')}</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Cleaning & Maintenance */}
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-3xl">cleaning_services</span>
                            {t('equipment.hygiene.title')}
                        </h2>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0"></div>
                                <div>
                                    <h4 className="font-bold text-espresso dark:text-white">{t('equipment.hygiene.kit.title')}</h4>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">{t('equipment.hygiene.kit.description')}</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0"></div>
                                <div>
                                    <h4 className="font-bold text-espresso dark:text-white">{t('equipment.hygiene.agents.title')}</h4>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">{t('equipment.hygiene.agents.description')}</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0"></div>
                                <div>
                                    <h4 className="font-bold text-espresso dark:text-white">{t('equipment.hygiene.gear.title')}</h4>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">{t('equipment.hygiene.gear.description')}</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                </div>
            </section>

            {/* Section 5: Purchasing and Pricing */}
            <section className="bg-espresso text-[#FAF5E8] py-20 px-6">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
                        {t('equipment.pricing.title')}
                    </h2>
                    <p className="text-white/80 text-lg mb-12">
                        {t('equipment.pricing.description')}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                            <h3 className="font-bold text-xl mb-2">{t('equipment.machinery.espresso.title')}</h3>
                            <p className="text-sm text-white/60 uppercase tracking-widest mb-4">{t('equipment.pricing.espresso.level')}</p>
                            <p className="text-2xl font-bold text-primary">{t('equipment.pricing.espresso.price')}</p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                            <h3 className="font-bold text-xl mb-2">{t('equipment.machinery.grinder.title')}</h3>
                            <p className="text-sm text-white/60 uppercase tracking-widest mb-4">{t('equipment.pricing.grinder.level')}</p>
                            <p className="text-2xl font-bold text-primary">{t('equipment.pricing.grinder.price')}</p>
                        </div>
                    </div>

                    <div className="bg-primary/20 p-6 rounded-xl border border-primary/30 inline-block text-left max-w-2xl mb-12">
                        <p className="flex gap-3">
                            <span className="material-symbols-outlined text-primary shrink-0">lightbulb</span>
                            <span className="text-sm text-white/90">
                                <strong>{t('equipment.pricing.advice.title')}</strong> {t('equipment.pricing.advice.description')}
                            </span>
                        </p>
                    </div>

                    <div>
                        <p className="font-serif text-2xl italic text-white mb-6">
                            {t('equipment.pricing.cta_text')}
                        </p>
                        <p className="text-white/70 mb-8">
                            {t('equipment.pricing.cta_sub')}
                        </p>
                        <GradientButton
                            to="/enroll"
                        >
                            {t('equipment.pricing.cta_button')}
                        </GradientButton>
                    </div>

                </div>
            </section>

            {/* Newsletter Section */}
            <Newsletter />

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 md:top-8 md:right-8 text-white/50 hover:text-white transition-colors bg-black/20 p-2 rounded-full backdrop-blur-md"
                        onClick={() => setSelectedImage(null)}
                    >
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </button>
                    <img
                        src={selectedImage}
                        alt="Equipment Full View"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
