import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Newsletter } from '../../components/ui/Newsletter';

export function Inclusion() {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

            {/* 1. Page Title */}
            <div className="container mx-auto px-6 text-center mb-16">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white mb-4 tracking-tight">
                    {t('inclusion.title')}
                </h1>
                <h2 className="text-xl md:text-2xl text-primary font-medium mb-6">
                    {t('inclusion.subtitle')}
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 leading-relaxed max-w-3xl mx-auto">
                    {t('inclusion.description')}
                </p>
            </div>

            {/* 2. Section 1: Adapted Curriculum */}
            <section className="container mx-auto px-6 mb-20">
                <div className="bg-white dark:bg-white/5 rounded-3xl overflow-hidden shadow-lg border border-[#e0dbd6] dark:border-white/10">
                    <div className="grid grid-cols-1 lg:grid-cols-2">

                        {/* Image Side */}
                        <div className="h-64 lg:h-auto bg-gray-200 relative min-h-[300px]">
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=2670&auto=format&fit=crop")' }} // Placeholder
                            ></div>
                        </div>

                        {/* Content Side */}
                        <div className="p-8 lg:p-12">
                            <h2 className="font-serif text-2xl md:text-3xl font-bold text-espresso dark:text-white mb-8">
                                {t('inclusion.tailoptimized.title')}
                            </h2>

                            <div className="space-y-8">
                                {/* Visual/Hearing Support */}
                                <div>
                                    <h3 className="font-bold text-primary text-xl mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined">visibility</span>
                                        {t('inclusion.tailoptimized.hearing.title')}
                                    </h3>
                                    <ul className="space-y-3">
                                        {t('inclusion.tailoptimized.hearing.list', { returnObjects: true }).map((item, idx) => (
                                            <li key={idx} className="flex gap-3 text-sm text-espresso/70 dark:text-white/70">
                                                <span className="material-symbols-outlined text-primary shrink-0">check</span>
                                                <span dangerouslySetInnerHTML={{ __html: item }}></span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Mobility Support */}
                                <div>
                                    <h3 className="font-bold text-primary text-xl mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined">accessible</span>
                                        {t('inclusion.tailoptimized.mobility.title')}
                                    </h3>
                                    <ul className="space-y-3">
                                        {t('inclusion.tailoptimized.mobility.list', { returnObjects: true }).map((item, idx) => (
                                            <li key={idx} className="flex gap-3 text-sm text-espresso/70 dark:text-white/70">
                                                <span className="material-symbols-outlined text-primary shrink-0">check</span>
                                                <span dangerouslySetInnerHTML={{ __html: item }}></span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Section 2: Customer Service Adaptation */}
            <section className="bg-[#FAF5E8] dark:bg-white/5 py-20 px-6 border-y border-[#e0dbd6] dark:border-white/10">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-8">
                        {t('inclusion.service.title')}
                    </h2>
                    <p className="text-lg text-espresso/80 dark:text-white/80 mb-12">
                        {t('inclusion.service.description')}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-2xl">touch_app</span>
                            </div>
                            <h4 className="font-bold text-lg mb-2">{t('inclusion.service.ordering.title')}</h4>
                            <p className="text-sm text-espresso/70 dark:text-white/70">{t('inclusion.service.ordering.description')}</p>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-2xl">diversity_3</span>
                            </div>
                            <h4 className="font-bold text-lg mb-2">{t('inclusion.service.etiquette.title')}</h4>
                            <p className="text-sm text-espresso/70 dark:text-white/70">{t('inclusion.service.etiquette.description')}</p>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-2xl">door_open</span>
                            </div>
                            <h4 className="font-bold text-lg mb-2">{t('inclusion.service.awareness.title')}</h4>
                            <p className="text-sm text-espresso/70 dark:text-white/70">{t('inclusion.service.awareness.description')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Section 3: Consultation */}
            <section className="container mx-auto px-6 py-20 text-center">
                <div className="max-w-3xl mx-auto bg-primary/5 rounded-3xl p-10 border border-primary/10">
                    <h2 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-4">
                        {t('inclusion.consultation.title')}
                    </h2>
                    <p className="text-lg text-espresso/80 dark:text-white/80 mb-8">
                        {t('inclusion.consultation.description')}
                    </p>
                    <Link to="/contact" className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-white text-lg font-bold shadow-lg hover:bg-primary/90 hover:scale-105 transition-all">
                        {t('inclusion.consultation.cta')}
                    </Link>
                </div>
            </section>

            {/* Newsletter Section */}
            <Newsletter />

        </div>
    );
}
