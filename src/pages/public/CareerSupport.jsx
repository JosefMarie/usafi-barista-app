import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientButton } from '../../components/ui/GradientButton';
import { Newsletter } from '../../components/ui/Newsletter';

export function CareerSupport() {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

            {/* 1. Page Title */}
            <div className="container mx-auto px-6 text-center mb-16">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white mb-4 tracking-tight">
                    {t('careerSupport.title')}
                </h1>
                <h2 className="text-xl md:text-2xl text-primary font-medium mb-6">
                    {t('careerSupport.subtitle')}
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 leading-relaxed max-w-3xl mx-auto">
                    {t('careerSupport.description')}
                </p>
            </div>

            {/* 2. Section 1: Internship Placement Program */}
            <section className="container mx-auto px-6 mb-20">
                <div className="bg-white dark:bg-white/5 rounded-3xl overflow-hidden shadow-lg border border-[#e0dbd6] dark:border-white/10">
                    <div className="grid grid-cols-1 lg:grid-cols-2">

                        {/* Image Side */}
                        <div className="h-64 lg:h-auto bg-gray-200 relative min-h-[300px]">
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCtF-XnL_08lHxvP43xR4yC62ZJvv_9c5A7Q8XG0E4wHk3_nL2zO9Qf6_W5p_1rD-4qGZ0e8j7aV6kBMx3tY9uN1i_cR5oF2T6nU8D4yB7vA9sL5X3wK1zJ2mH6qC0r_4P8o9nB7vE5t3xL1zK2jM4yN6oP9qR8sT3vW1uX5yZ0aB2cD4eF6gH8iJ0kL2mNwO4qP6rT8sV9uX1yZ3aB5cD7eG9jK0lM3nO5qQ7sU9w")' }} // Placeholder
                            ></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent lg:hidden"></div>
                        </div>

                        {/* Content Side */}
                        <div className="p-8 lg:p-12">
                            <h2 className="font-serif text-2xl md:text-3xl font-bold text-espresso dark:text-white mb-6">
                                {t('careerSupport.internship.title')}
                            </h2>
                            <p className="text-espresso/80 dark:text-white/80 mb-8 leading-relaxed">
                                {t('careerSupport.internship.description')}
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined">checklist</span> {t('careerSupport.internship.requirements.title')}
                                    </h3>
                                    <ul className="list-disc list-inside text-sm text-espresso/70 dark:text-white/70 space-y-1 ml-2">
                                        {t('careerSupport.internship.requirements.list', { returnObjects: true }).map((req, idx) => (
                                            <li key={idx}>{req}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined">handshake</span> {t('careerSupport.internship.partnerships.title')}
                                    </h3>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 ml-2">
                                        {t('careerSupport.internship.partnerships.description')}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined">how_to_reg</span> {t('careerSupport.internship.howToApply.title')}
                                    </h3>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 ml-2">
                                        {t('careerSupport.internship.howToApply.description')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Section 2: Job Hunting & Interview Skills */}
            <section className="bg-[#FAF5E8] dark:bg-white/5 py-20 px-6 border-y border-[#e0dbd6] dark:border-white/10">
                <div className="container mx-auto max-w-5xl">
                    <div className="text-center mb-16">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-espresso dark:text-white mb-4">
                            {t('careerSupport.market.title')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Resource 1 */}
                        <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-3xl">description</span>
                            </div>
                            <h3 className="font-serif font-bold text-xl text-espresso dark:text-white mb-3">{t('careerSupport.market.cv.title')}</h3>
                            <p className="text-sm text-espresso/70 dark:text-white/70 leading-relaxed">
                                {t('careerSupport.market.cv.description')}
                            </p>
                        </div>

                        {/* Resource 2 */}
                        <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-3xl">notifications_active</span>
                            </div>
                            <h3 className="font-serif font-bold text-xl text-espresso dark:text-white mb-3">{t('careerSupport.market.alerts.title')}</h3>
                            <p className="text-sm text-espresso/70 dark:text-white/70 leading-relaxed">
                                {t('careerSupport.market.alerts.description')}
                            </p>
                        </div>

                        {/* Resource 3 */}
                        <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-3xl">supervisor_account</span>
                            </div>
                            <h3 className="font-serif font-bold text-xl text-espresso dark:text-white mb-3">{t('careerSupport.market.interview.title')}</h3>
                            <p className="text-sm text-espresso/70 dark:text-white/70 leading-relaxed">
                                {t('careerSupport.market.interview.description')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Section 3: The Entrepreneurial Path */}
            <section className="container mx-auto px-6 py-20">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-espresso text-[#FAF5E8] rounded-3xl p-8 md:p-12 relative overflow-hidden">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-primary rounded-xl text-white">
                                    <span className="material-symbols-outlined text-3xl">storefront</span>
                                </div>
                                <h2 className="font-serif text-2xl md:text-3xl font-bold text-white">
                                    {t('careerSupport.business.title')}
                                </h2>
                            </div>

                            <p className="text-white/80 text-lg mb-8">
                                {t('careerSupport.business.description')}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary mt-1">edit_document</span>
                                    <div>
                                        <h4 className="font-bold text-white">{t('careerSupport.business.plan.title')}</h4>
                                        <p className="text-sm text-white/60">{t('careerSupport.business.plan.description')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary mt-1">add_location</span>
                                    <div>
                                        <h4 className="font-bold text-white">{t('careerSupport.business.location.title')}</h4>
                                        <p className="text-sm text-white/60">{t('careerSupport.business.location.description')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary mt-1">restaurant_menu</span>
                                    <div>
                                        <h4 className="font-bold text-white">{t('careerSupport.business.pricing.title')}</h4>
                                        <p className="text-sm text-white/60">{t('careerSupport.business.pricing.description')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary mt-1">campaign</span>
                                    <div>
                                        <h4 className="font-bold text-white">{t('careerSupport.business.marketing.title')}</h4>
                                        <p className="text-sm text-white/60">{t('careerSupport.business.marketing.description')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center sm:text-left">
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg"
                                >
                                    {t('careerSupport.business.cta')}
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section className="container mx-auto px-6 text-center">
                <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-6">{t('careerSupport.cta.title')}</h3>
                <GradientButton to="/enroll" className="w-full sm:w-auto">
                    {t('careerSupport.cta.button')}
                </GradientButton>
            </section>

            {/* Newsletter Section */}
            <Newsletter />

        </div>
    );
}
