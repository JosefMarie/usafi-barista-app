import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientButton } from '../../components/ui/GradientButton';
import { Newsletter } from '../../components/ui/Newsletter';
import { SEO } from '../../components/common/SEO';

export function Courses() {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-10">
            <SEO
                title={t('courses.title')}
                description={t('courses.subtitle')}
            />

            {/* 1. Page Title */}
            <div className="pt-24 pb-12 px-6 text-center bg-espresso text-wedding-white relative overflow-hidden">
                {/* Background Pattern or Overlay could go here */}
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#FAF5E8] mb-4 tracking-tight">
                        {t('courses.title')}
                    </h1>
                    <p className="text-xl text-white/90 font-light">
                        {t('courses.subtitle')}
                    </p>
                </div>
            </div>

            {/* 2. Section 1: Choose Your Learning Method (Comparison/Pricing Style) */}
            <section className="container mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

                    {/* Card 1: Onsite */}
                    <div className="flex flex-col rounded-3xl overflow-hidden bg-[#F5DEB3] dark:bg-white/5 border border-espresso/10 dark:border-white/10 shadow-xl group hover:border-espresso/30 transition-all duration-300 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors z-10"></div>
                        {/* Card Image */}
                        <div className="h-64 bg-gray-200 relative">
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDHGrdFHJ9eE3j63p0CnWhSu2c9gdjURP92ss0xMKkiLXo_gS2ndsYFhFMRzgEdXVwtj4xsrdwZzQRHSoL4-tb13qSXwu9N2hoY7hnL-RFrh146t89ZBjw7RAqr6CU8Bzg6fXI-mK8mVLPk-EXBLnQNcsLXWY9jVA5dz3IaX5v1lt7GAbHfbKdZysOXzmy5Y8MdBAF67NxyxUNyEygPJqqec0ir8_ZMuUyzLnCwq_sqj42fRA7xPHQ0TpXNbdxo9toiBP94kZzgnNni")' }} // Placeholder
                            ></div>
                            <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                                {t('courses.onsite.badge')}
                            </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-8 flex-1 flex flex-col">
                            <h3 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-2">{t('courses.onsite.title')}</h3>
                            <p className="text-sm text-espresso/60 dark:text-white/60 font-bold uppercase tracking-wide mb-6">{t('courses.onsite.location')}</p>

                            <p className="text-espresso/80 dark:text-white/80 mb-6 flex-1">
                                {t('courses.onsite.description')}
                            </p>

                            <ul className="space-y-4 mb-8">
                                {t('courses.onsite.features', { returnObjects: true }).map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
                                        <span className="text-sm text-espresso/80 dark:text-white/80">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <GradientButton to="/enroll" className="w-full">
                                {t('courses.onsite.button')}
                            </GradientButton>
                        </div>
                    </div>

                    {/* Card 2: Online */}
                    <div className="flex flex-col rounded-3xl overflow-hidden bg-[#F5DEB3] dark:bg-white/5 border border-espresso/10 dark:border-white/10 shadow-xl group hover:border-espresso/30 transition-all duration-300 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors z-10"></div>
                        {/* Card Image */}
                        <div className="h-64 bg-gray-200 relative">
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCtF-XnL_08lHxvP43xR4yC62ZJvv_9c5A7Q8XG0E4wHk3_nL2zO9Qf6_W5p_1rD-4qGZ0e8j7aV6kBMx3tY9uN1i_cR5oF2T6nU8D4yB7vA9sL5X3wK1zJ2mH6qC0r_4P8o9nB7vE5t3xL1zK2jM4yN6oP9qR8sT3vW1uX5yZ0aB2cD4eF6gH8iJ0kL2mNwO4qP6rT8sV9uX1yZ3aB5cD7eG9jK0lM3nO5qQ7sU9w")' }} // Placeholder
                            ></div>
                        </div>

                        {/* Card Content */}
                        <div className="p-8 flex-1 flex flex-col">
                            <h3 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-2">{t('courses.online.title')}</h3>
                            <p className="text-sm text-espresso/60 dark:text-white/60 font-bold uppercase tracking-wide mb-6">{t('courses.online.location')}</p>

                            <p className="text-espresso/80 dark:text-white/80 mb-6 flex-1">
                                {t('courses.online.description')}
                            </p>

                            <ul className="space-y-4 mb-8">
                                {t('courses.online.features', { returnObjects: true }).map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
                                        <span className="text-sm text-espresso/80 dark:text-white/80">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <GradientButton to="/enroll" className="w-full">
                                {t('courses.online.button')}
                            </GradientButton>
                        </div>
                    </div>

                </div>
            </section>

            {/* 3. Section 2: Core Curriculum */}
            <section className="bg-[#F5DEB3] dark:bg-white/5 py-20 px-6 border-y border-espresso/10">
                <div className="container mx-auto max-w-5xl">
                    <div className="text-center mb-16">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-espresso dark:text-white mb-4">
                            {t('courses.curriculum.title')}
                        </h2>
                        <p className="text-lg text-espresso/70 dark:text-white/70">
                            {t('courses.curriculum.description')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Module 1 */}
                        <div className="bg-[#F5DEB3] dark:bg-white/5 p-6 rounded-2xl shadow-xl border border-espresso/5 hover:border-espresso/20 transition-all relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/10 group-hover:bg-espresso transition-colors"></div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-espresso bg-white/30 rounded-lg p-2 group-hover:scale-110 transition-transform text-2xl">coffee</span>
                                <h3 className="font-serif font-bold text-lg text-espresso dark:text-white">{t('courses.curriculum.modules.m1.title')}</h3>
                            </div>
                            <p className="text-sm text-espresso/70 dark:text-white/70">{t('courses.curriculum.modules.m1.description')}</p>
                        </div>

                        {/* Module 2 */}
                        <div className="bg-[#F5DEB3] dark:bg-white/5 p-6 rounded-2xl shadow-xl border border-espresso/5 hover:border-espresso/20 transition-all relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/10 group-hover:bg-espresso transition-colors"></div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-espresso bg-white/30 rounded-lg p-2 group-hover:scale-110 transition-transform text-2xl">build</span>
                                <h3 className="font-serif font-bold text-lg text-espresso dark:text-white">{t('courses.curriculum.modules.m2.title')}</h3>
                            </div>
                            <p className="text-sm text-espresso/70 dark:text-white/70">{t('courses.curriculum.modules.m2.description')}</p>
                        </div>

                        {/* Module 3 */}
                        <div className="bg-[#F5DEB3] dark:bg-white/5 p-6 rounded-2xl shadow-xl border border-espresso/5 hover:border-espresso/20 transition-all relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/10 group-hover:bg-espresso transition-colors"></div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-espresso bg-white/30 rounded-lg p-2 group-hover:scale-110 transition-transform text-2xl">science</span>
                                <h3 className="font-serif font-bold text-lg text-espresso dark:text-white">{t('courses.curriculum.modules.m3.title')}</h3>
                            </div>
                            <p className="text-sm text-espresso/70 dark:text-white/70">{t('courses.curriculum.modules.m3.description')}</p>
                        </div>

                        {/* Module 4 */}
                        <div className="bg-[#F5DEB3] dark:bg-white/5 p-6 rounded-2xl shadow-xl border border-espresso/5 hover:border-espresso/20 transition-all relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/10 group-hover:bg-espresso transition-colors"></div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-espresso bg-white/30 rounded-lg p-2 group-hover:scale-110 transition-transform text-2xl">palette</span>
                                <h3 className="font-serif font-bold text-lg text-espresso dark:text-white">{t('courses.curriculum.modules.m4.title')}</h3>
                            </div>
                            <p className="text-sm text-espresso/70 dark:text-white/70">{t('courses.curriculum.modules.m4.description')}</p>
                        </div>

                        {/* Module 5 */}
                        <div className="bg-[#F5DEB3] dark:bg-white/5 p-6 rounded-2xl shadow-xl border border-espresso/5 hover:border-espresso/20 transition-all relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/10 group-hover:bg-espresso transition-colors"></div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-espresso bg-white/30 rounded-lg p-2 group-hover:scale-110 transition-transform text-2xl">cleaning_services</span>
                                <h3 className="font-serif font-bold text-lg text-espresso dark:text-white">{t('courses.curriculum.modules.m5.title')}</h3>
                            </div>
                            <p className="text-sm text-espresso/70 dark:text-white/70">{t('courses.curriculum.modules.m5.description')}</p>
                        </div>

                        {/* Module 6 */}
                        <div className="bg-[#F5DEB3] dark:bg-white/5 p-6 rounded-2xl shadow-xl border border-espresso/5 hover:border-espresso/20 transition-all relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/10 group-hover:bg-espresso transition-colors"></div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-espresso bg-white/30 rounded-lg p-2 group-hover:scale-110 transition-transform text-2xl">handshake</span>
                                <h3 className="font-serif font-bold text-lg text-espresso dark:text-white">{t('courses.curriculum.modules.m6.title')}</h3>
                            </div>
                            <p className="text-sm text-espresso/70 dark:text-white/70">{t('courses.curriculum.modules.m6.description')}</p>
                        </div>

                        {/* Module 7 (Bonus, Full Width) */}
                        <div className="md:col-span-2 lg:col-span-3 bg-espresso text-white p-8 rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/5 -rotate-12 translate-x-16 group-hover:translate-x-12 transition-transform"></div>
                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                <span className="material-symbols-outlined text-primary text-3xl group-hover:rotate-12 transition-transform">trending_up</span>
                                <h3 className="font-serif font-bold text-xl text-[#F5DEB3]">{t('courses.curriculum.modules.m7.title')}</h3>
                            </div>
                            <p className="text-sm text-white/80 relative z-10">{t('courses.curriculum.modules.m7.description')}</p>
                        </div>
                    </div>
                </div>
            </section>


            {/* 4. Section 3: Learning Materials & Certification */}
            <section className="container mx-auto px-6 py-20">
                <div className="max-w-4xl mx-auto">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-center text-espresso dark:text-white mb-16">
                        {t('courses.tools.title')}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* 1. Student Notes */}
                        <div className="flex flex-col gap-4">
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">book</span>
                                {t('courses.tools.notes.title')}
                            </h3>
                            <p className="text-espresso/70 dark:text-white/70">
                                {t('courses.tools.notes.description')}
                            </p>
                            <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-lg border-l-4 border-primary text-sm">
                                {t('courses.tools.notes.badge')}
                            </div>
                        </div>

                        {/* 2. Official Certification */}
                        <div className="flex flex-col gap-4">
                            <h3 className="font-serif text-2xl font-bold text-[#4CAF50] flex items-center gap-2">
                                <span className="material-symbols-outlined">workspace_premium</span>
                                {t('courses.tools.cert.title')}
                            </h3>
                            <p className="text-espresso/70 dark:text-white/70">
                                {t('courses.tools.cert.description')}
                            </p>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-[#4CAF50] text-sm text-green-800 dark:text-green-200">
                                {t('courses.tools.cert.badge')}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Section 4: CTA */}
            <section className="bg-espresso py-20 px-6 text-center">
                <div className="container mx-auto max-w-3xl">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#FAF5E8] mb-6">
                        {t('courses.cta.title')}
                    </h2>
                    <p className="text-white/80 text-lg mb-10">
                        {t('courses.cta.description')}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <GradientButton to="/enroll" className="w-full sm:w-auto">
                            {t('courses.cta.register')}
                        </GradientButton>
                        <Link to="/contact" className="inline-flex items-center justify-center w-full sm:w-auto h-14 px-8 rounded-xl border border-white/30 text-white text-lg font-bold hover:bg-white/10 transition-all">
                            {t('courses.cta.contact')}
                        </Link>
                    </div>

                    <p className="mt-6 text-sm text-white/50">
                        {t('courses.cta.questions')} <Link to="/contact" className="text-primary hover:underline">{t('courses.cta.contact')}</Link>
                    </p>
                </div>
            </section>

            {/* Newsletter Section */}
            <Newsletter />

        </div>
    );
}
