import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientButton } from '../../components/ui/GradientButton';
import { Newsletter } from '../../components/ui/Newsletter';

export function Equipment() {
    const { t } = useTranslation();
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
                    <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-lg border border-[#e0dbd6] dark:border-white/10 flex flex-col">
                        <div className="h-64 bg-gray-200 relative">
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1570554807185-5c202029b3fd?q=80&w=2699&auto=format&fit=crop")' }}
                            ></div>
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
                    <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-lg border border-[#e0dbd6] dark:border-white/10 flex flex-col">
                        <div className="h-64 bg-gray-200 relative">
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1598516086280-9759368d447a?q=80&w=2574&auto=format&fit=crop")' }}
                            ></div>
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
            <section className="bg-[#FAF5E8] dark:bg-white/5 py-20 px-6 border-y border-[#e0dbd6] dark:border-white/10">
                <div className="container mx-auto px-6">
                    <h2 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-8 border-b-2 border-primary/20 pb-2 inline-block">
                        {t('equipment.smallwares.title')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* Tool 1 */}
                        <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-2xl">hardware</span>
                            </div>
                            <h3 className="font-bold text-lg text-espresso dark:text-white mb-2">{t('equipment.smallwares.tamper.title')}</h3>
                            <p className="text-sm text-espresso/70 dark:text-white/70">
                                {t('equipment.smallwares.tamper.description')}
                            </p>
                        </div>

                        {/* Tool 2 */}
                        <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-2xl">local_cafe</span>
                            </div>
                            <h3 className="font-bold text-lg text-espresso dark:text-white mb-2">{t('equipment.smallwares.pitcher.title')}</h3>
                            <p className="text-sm text-espresso/70 dark:text-white/70">
                                {t('equipment.smallwares.pitcher.description')}
                            </p>
                        </div>

                        {/* Tool 3 */}
                        <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-2xl">delete</span>
                            </div>
                            <h3 className="font-bold text-lg text-espresso dark:text-white mb-2">{t('equipment.smallwares.knock.title')}</h3>
                            <p className="text-sm text-espresso/70 dark:text-white/70">
                                {t('equipment.smallwares.knock.description')}
                            </p>
                        </div>

                        {/* Tool 4 */}
                        <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-2xl">scale</span>
                            </div>
                            <h3 className="font-bold text-lg text-espresso dark:text-white mb-2">{t('equipment.smallwares.scales.title')}</h3>
                            <p className="text-sm text-espresso/70 dark:text-white/70">
                                {t('equipment.smallwares.scales.description')}
                            </p>
                        </div>

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

        </div>
    );
}
