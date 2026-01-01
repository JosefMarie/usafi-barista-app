import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Newsletter } from '../../components/ui/Newsletter';

export function Contact() {
    const { t } = useTranslation();
    const [formData, setFormData] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState({ type: '', message: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('../../lib/firebase');

            console.log("Attempting to write to firestore...");
            const docRef = await addDoc(collection(db, 'contact_messages'), {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                subject: formData.subject,
                message: formData.message,
                status: 'new',
                createdAt: serverTimestamp()
            });
            console.log("Document written with ID: ", docRef.id);

            setStatus({ type: 'success', message: 'Message sent successfully! We will get back to you soon.' });
            setFormData({ firstName: '', lastName: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error("Error sending message:", error);
            setStatus({ type: 'error', message: 'Failed to send message. Please try again later.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

            {/* Page Header */}
            <div className="container mx-auto px-6 text-center mb-16">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white mb-4 tracking-tight">
                    {t('contact.title')}
                </h1>
                <h2 className="text-xl md:text-2xl text-primary font-medium mb-6">
                    {t('contact.subtitle')}
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 leading-relaxed max-w-2xl mx-auto">
                    {t('contact.description')}
                </p>
            </div>

            <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">

                {/* Contact Information & Map */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm border border-[#e0dbd6] dark:border-white/10">
                        <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-6">{t('contact.info.title')}</h3>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                    <span className="material-symbols-outlined">location_on</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-espresso dark:text-white mb-1">{t('contact.info.visit.title')}</h4>
                                    <p className="text-espresso/70 dark:text-white/70">
                                        {t('contact.info.visit.address')}<br />
                                        {t('contact.info.visit.near')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                    <span className="material-symbols-outlined">call</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-espresso dark:text-white mb-1">{t('contact.info.call')}</h4>
                                    <p className="text-espresso/70 dark:text-white/70">
                                        <a href="tel:+250788123456" className="hover:text-primary transition-colors">+250 788 123 456</a>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                    <span className="material-symbols-outlined">mail</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-espresso dark:text-white mb-1">{t('contact.info.email')}</h4>
                                    <p className="text-espresso/70 dark:text-white/70">
                                        <a href="mailto:info@usafibarista.com" className="hover:text-primary transition-colors">info@usafibarista.com</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Placeholder */}
                    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-sm border border-[#e0dbd6] dark:border-white/10 relative bg-gray-200">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.5327096677!2d30.1039!3d-1.9567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca655d9d95f85%3A0x49f5747444747!2sKimironko%20Market!5e0!3m2!1sen!2srw!4v1620000000000!5m2!1sen!2srw"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            className="absolute inset-0"
                            title="Usafi Location"
                        ></iframe>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-lg border border-[#e0dbd6] dark:border-white/10">
                    <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-6">{t('contact.form.title')}</h3>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="firstName" className="text-sm font-bold text-espresso dark:text-white">{t('contact.form.firstName')}</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    required
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg bg-background-light dark:bg-white/10 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="John"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="lastName" className="text-sm font-bold text-espresso dark:text-white">{t('contact.form.lastName')}</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    required
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg bg-background-light dark:bg-white/10 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-bold text-espresso dark:text-white">{t('contact.form.email')}</label>
                            <input
                                type="email"
                                id="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg bg-background-light dark:bg-white/10 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="john@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="subject" className="text-sm font-bold text-espresso dark:text-white">{t('contact.form.subject.label')}</label>
                            <select
                                id="subject"
                                required
                                value={formData.subject}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg bg-background-light dark:bg-white/10 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            >
                                <option value="">{t('contact.form.subject.placeholder')}</option>
                                <option value="enrollment">{t('contact.form.subject.options.enrollment')}</option>
                                <option value="visit">{t('contact.form.subject.options.visit')}</option>
                                <option value="consultation">{t('contact.form.subject.options.consultation')}</option>
                                <option value="partnership">{t('contact.form.subject.options.partnership')}</option>
                                <option value="other">{t('contact.form.subject.options.other')}</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="message" className="text-sm font-bold text-espresso dark:text-white">{t('contact.form.message.label')}</label>
                            <textarea
                                id="message"
                                rows="5"
                                required
                                value={formData.message}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg bg-background-light dark:bg-white/10 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                placeholder={t('contact.form.message.placeholder')}
                            ></textarea>
                        </div>

                        {status.message && (
                            <div className={`p-4 rounded-lg text-sm font-bold text-center ${status.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {status.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : t('contact.form.button')}
                        </button>
                    </form>
                </div>

            </div>

            {/* Newsletter Section */}
            <Newsletter />

        </div>
    );
}
