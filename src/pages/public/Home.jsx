import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientButton } from '../../components/ui/GradientButton';
import { Newsletter } from '../../components/ui/Newsletter';

export function Home() {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white">

            {/* 1. Hero Section */}
            <section className="relative h-[85vh] w-full shrink-0 overflow-hidden flex items-center justify-center">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-center bg-cover bg-no-repeat"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDHGrdFHJ9eE3j63p0CnWhSu2c9gdjURP92ss0xMKkiLXo_gS2ndsYFhFMRzgEdXVwtj4xsrdwZzQRHSoL4-tb13qSXwu9N2hoY7hnL-RFrh146t89ZBjw7RAqr6CU8Bzg6fXI-mK8mVLPk-EXBLnQNcsLXWY9jVA5dz3IaX5v1lt7GAbHfbKdZysOXzmy5Y8MdBAF67NxyxUNyEygPJqqec0ir8_ZMuUyzLnCwq_sqj42fRA7xPHQ0TpXNbdxo9toiBP94kZzgnNni")' }}
                >
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50"></div>

                {/* Content */}
                <div className="relative z-10 container mx-auto px-6 flex flex-col items-center md:items-start text-center md:text-left gap-8 max-w-6xl">
                    <div className="max-w-3xl">
                        <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight text-[#FAF5E8] tracking-tight mb-4">
                            {t('home.hero.title')}
                        </h1>

                        <h2 className="text-white/90 text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto md:mx-0">
                            {t('home.hero.subtitle')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4 w-full max-w-2xl">
                        {/* 1. Apply Now - Growing Orange/Red */}
                        <GradientButton to="/enroll">
                            {t('home.hero.cta_apply')}
                        </GradientButton>

                        {/* 2. Opportunities - Growing Green */}
                        <Link to="/opportunities" className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 p-[2px] transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/30">
                            <div className="relative flex h-14 w-full items-center justify-center rounded-xl bg-transparent px-8 transition-all duration-300 group-hover:bg-white/10">
                                <span className="text-lg font-bold tracking-wide text-white">
                                    {t('home.hero.cta_opportunities')}
                                </span>
                            </div>
                        </Link>

                        {/* 3. Testimonials - Growing Blue */}
                        <Link to="/testimonials" className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-[2px] transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30">
                            <div className="relative flex h-14 w-full items-center justify-center rounded-xl bg-transparent px-8 transition-all duration-300 group-hover:bg-white/10">
                                <span className="text-lg font-bold tracking-wide text-white">
                                    {t('home.hero.cta_testimonials')}
                                </span>
                            </div>
                        </Link>

                        {/* 4. Business Classes - Growing Purple */}
                        <Link to="/business/register" className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 p-[2px] transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30">
                            <div className="relative flex h-14 w-full items-center justify-center rounded-xl bg-transparent px-8 transition-all duration-300 group-hover:bg-white/10">
                                <span className="text-lg font-bold tracking-wide text-white">
                                    {t('home.hero.cta_business')}
                                </span>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Bottom fade/transition */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent"></div>
            </section>

            {/* 2. Key Benefits Section (Why Choose Us?) */}
            <section className="py-20 px-6 bg-background-light dark:bg-background-dark">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-espresso dark:text-white mb-4">
                            {t('home.benefits.title')}
                        </h2>
                        <p className="text-espresso/70 dark:text-white/70 text-lg font-normal">
                            {t('home.benefits.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Column 1: Comprehensive Curriculum */}
                        <div className="flex flex-col items-center text-center p-8 bg-[#F5DEB3] dark:bg-white/5 rounded-3xl shadow-xl border border-espresso/5 gap-4 group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-espresso text-white mb-2 shadow-md group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">school</span>
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white">
                                {t('home.benefits.item1.title')}
                            </h3>
                            <p className="text-espresso/70 dark:text-white/70 leading-relaxed">
                                {t('home.benefits.item1.description')}
                            </p>
                        </div>

                        {/* Column 2: Flexible Learning Options */}
                        <div className="flex flex-col items-center text-center p-8 bg-[#F5DEB3] dark:bg-white/5 rounded-3xl shadow-xl border border-espresso/5 gap-4 group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-espresso text-white mb-2 shadow-md group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">sync_alt</span>
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white">
                                {t('home.benefits.item2.title')}
                            </h3>
                            <p className="text-espresso/70 dark:text-white/70 leading-relaxed">
                                {t('home.benefits.item2.description')}
                            </p>
                        </div>

                        {/* Column 3: Real Career Support */}
                        <div className="flex flex-col items-center text-center p-8 bg-[#F5DEB3] dark:bg-white/5 rounded-3xl shadow-xl border border-espresso/5 gap-4 group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-espresso text-white mb-2 shadow-md group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">work</span>
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white">
                                {t('home.benefits.item3.title')}
                            </h3>
                            <p className="text-espresso/70 dark:text-white/70 leading-relaxed">
                                {t('home.benefits.item3.description')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter Section */}
            <Newsletter />

        </div>
    );
}

// Separate component or inline logic for Newsletter to avoid polluting the main component?
// Let's add the logic inside Home for simplicity as requested.

