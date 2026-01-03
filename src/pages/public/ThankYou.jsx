import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function ThankYou() {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white px-6 text-center">
            <div className="bg-[#F5DEB3] dark:bg-white/5 p-12 rounded-3xl shadow-2xl border border-espresso/10 max-w-2xl w-full relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                <div className="w-20 h-20 rounded-2xl bg-espresso text-white flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-5xl">check_circle</span>
                </div>

                <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-espresso dark:text-white">
                    {t('thankyou.title')}
                </h1>

                <p className="text-lg text-espresso/80 dark:text-white/80 mb-10 leading-relaxed">
                    {t('thankyou.description')}
                </p>

                <div className="flex justify-center">
                    <Link
                        to="/"
                        className="px-10 py-4 rounded-xl bg-espresso text-white font-bold shadow-xl hover:bg-espresso/90 transition-all hover:scale-[1.05] active:scale-[0.98]"
                    >
                        {t('thankyou.button')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
