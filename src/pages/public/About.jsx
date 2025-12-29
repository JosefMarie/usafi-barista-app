import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function About() {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-10">

            {/* 1. Page Title */}
            <div className="pt-24 pb-8 px-6 text-center">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white tracking-tight">
                    {t('about.title')}
                </h1>
            </div>

            {/* 2. Introduction Section */}
            <section className="container mx-auto px-6 mb-20">
                <div className="relative w-full h-[60vh] rounded-3xl overflow-hidden shadow-xl mb-10">
                    {/* Image placeholder: School interior/exterior */}
                    <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDtNLCBME4CThl5fKEEVW5bHFXBXpMLQ7mgs42CaXljuX3Nr5GsMCDaRUfa7uyJtdXCey_giXghk4qvxRXT37O3ZZhQWZNop-oJWtAxcgpvjiuNu9tjXoU5UTNMrdxgQ6sNohg1R6ZLXfFH3zs0mpgkZe0P0Ol5yIQ75hm2zgZsClouHMn56_zs5-9ELI1JN9Qxf7553_SJH9sUcI8WoAz1qfoFUc22GUG1oL_XjzkETm5NOyPbqszR0NkefOWubHhiLOnj0G_a5hm3")' }} // Using a placeholder from the ref file for now, ideally user replaces this.
                    >
                        <div className="absolute inset-0 bg-black/20"></div>
                    </div>
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
            <section className="w-full bg-[#FAF5E8] py-20 px-6 border-y border-[#e0dbd6] dark:border-white/10 dark:bg-white/5">
                <div className="container mx-auto max-w-5xl">
                    <div className="flex flex-col md:flex-row gap-8">

                        {/* Mission Card */}
                        <div className="flex-1 bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm border border-[#e0dbd6] dark:border-white/10 flex flex-col items-center text-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                                {/* Target Icon */}
                                <span className="material-symbols-outlined text-4xl">ads_click</span>
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white">{t('about.mission.title')}</h3>
                            <p className="text-espresso/70 dark:text-white/70 leading-relaxed">
                                {t('about.mission.description')}
                            </p>
                        </div>

                        {/* Vision Card */}
                        <div className="flex-1 bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm border border-[#e0dbd6] dark:border-white/10 flex flex-col items-center text-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                                {/* Compass Icon */}
                                <span className="material-symbols-outlined text-4xl">explore</span>
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
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtNLCBME4CThl5fKEEVW5bHFXBXpMLQ7mgs42CaXljuX3Nr5GsMCDaRUfa7uyJtdXCey_giXghk4qvxRXT37O3ZZhQWZNop-oJWtAxcgpvjiuNu9tjXoU5UTNMrdxgQ6sNohg1R6ZLXfFH3zs0mpgkZe0P0Ol5yIQ75hm2zgZsClouHMn56_zs5-9ELI1JN9Qxf7553_SJH9sUcI8WoAz1qfoFUc22GUG1oL_XjzkETm5NOyPbqszR0NkefOWubHhiLOnj0G_a5hm3"
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
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbkS6b0MP8hct7Qap1lLv5An_0Edh4JLRPfOj7LCx6HjFH_-QTjuwJIDBMuux5BLnDZpDiIbEJ5hJflRG3y3W3IYN_qn-Cn9F8_NyZADF-d9h5BliZ8KiMSgrysIS30826crRF_5Ei7KbNfwRAR944v-3Qg4GfUGZXZD64iNZH53h_lrQm09fgGobO8CSfVivEabO5dTGcmOG_J1r7X-8CXQsdsw9-1HRnKwJrnst30S_6iSkPhBcyTt3rD4iXes0OhVnMVtsimpv8" // Placeholder using the Latte Art Specialist image
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
