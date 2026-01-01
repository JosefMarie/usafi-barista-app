import React from 'react';
import { useTranslation } from 'react-i18next';

export function Newsletter() {
    const { t } = useTranslation();

    const handleSubscribe = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        if (!email) return;

        try {
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('../../lib/firebase');

            await addDoc(collection(db, 'subscribers'), {
                email,
                source: window.location.pathname, // improved tracking
                createdAt: serverTimestamp(),
                active: true
            });

            alert(t('newsletter.success'));
            e.target.reset();
        } catch (error) {
            console.error("Error subscribing:", error);
            alert(t('newsletter.error'));
        }
    };

    return (
        <section className="py-20 bg-espresso dark:bg-black relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000')] bg-cover bg-center opacity-10" />
            <div className="container mx-auto px-6 relative z-10 text-center">
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
                    {t('newsletter.title')}
                </h2>
                <p className="text-white/70 mb-8 max-w-2xl mx-auto text-lg">
                    {t('newsletter.subtitle')}
                </p>

                <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
                    <input
                        type="email"
                        name="email"
                        required
                        placeholder={t('newsletter.placeholder')}
                        className="flex-1 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary backdrop-blur-sm transition-all"
                    />
                    <button
                        type="submit"
                        className="px-8 py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
                    >
                        {t('newsletter.button')}
                    </button>
                </form>
            </div>
        </section>
    );
}
