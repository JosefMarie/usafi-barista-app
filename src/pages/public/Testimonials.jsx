import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientButton } from '../../components/ui/GradientButton';
import { Newsletter } from '../../components/ui/Newsletter';

export function Testimonials() {
    const { t } = useTranslation();
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
                        {/* Video Player Placeholder */}
                        <div className="aspect-video lg:aspect-auto bg-black relative flex items-center justify-center group cursor-pointer">
                            {/* This would be an iframe in production */}
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-70"></div>
                            <div className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-4xl text-white ml-2">play_arrow</span>
                            </div>
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

                        {/* Tag */}
                        <div className="mb-6">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider rounded-full">
                                {t('testimonials.tags.placement')}
                            </span>
                        </div>

                        <p className="text-espresso/80 dark:text-white/80 italic mb-8 relative z-10">
                            {t('testimonials.items.grace.text')}
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gray-300 bg-[url('https://randomuser.me/api/portraits/women/44.jpg')] bg-cover"></div>
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

                        {/* Tag */}
                        <div className="mb-6">
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-bold uppercase tracking-wider rounded-full">
                                {t('testimonials.tags.technical')}
                            </span>
                        </div>

                        <p className="text-espresso/80 dark:text-white/80 italic mb-8 relative z-10">
                            {t('testimonials.items.kevin.text')}
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gray-300 bg-[url('https://randomuser.me/api/portraits/men/32.jpg')] bg-cover"></div>
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

                        {/* Tag */}
                        <div className="mb-6">
                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-bold uppercase tracking-wider rounded-full">
                                {t('testimonials.tags.online')}
                            </span>
                        </div>

                        <p className="text-espresso/80 dark:text-white/80 italic mb-8 relative z-10">
                            {t('testimonials.items.patience.text')}
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gray-300 bg-[url('https://randomuser.me/api/portraits/women/65.jpg')] bg-cover"></div>
                            <div>
                                <h4 className="font-bold text-espresso dark:text-white">{t('testimonials.items.patience.name')}</h4>
                                <p className="text-xs text-espresso/60 dark:text-white/60 uppercase tracking-wide">{t('testimonials.items.patience.role')}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* 4. Section 3: Call to Action */}
            <section className="bg-espresso text-[#FAF5E8] py-20 px-6 text-center">
                <div className="container mx-auto max-w-3xl">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">
                        {t('testimonials.cta.title')}
                    </h2>
                    <GradientButton to="/enroll">
                        {t('testimonials.cta.button')}
                    </GradientButton>
                </div>
            </section>

            {/* Newsletter Section */}
            <Newsletter />

        </div>
    );
}
