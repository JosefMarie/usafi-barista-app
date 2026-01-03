import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Enrollment() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        password: '', // Added password field
        residence: '',
        course: 'full-barista',
        studyMethod: '',
        startDate: '',
        shift: '',
        referral: ''
    });
    const [loadingMessage, setLoadingMessage] = useState(''); // Changed from boolean to string/empty checks
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingMessage(t('enrollment.loading.init'));
        setError('');

        try {
            // Import Firebase services dynamically
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
            const { auth, db } = await import('../../lib/firebase');

            // 1. Create Authentication User
            setLoadingMessage(t('enrollment.loading.auth'));
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Create User Document in Firestore
            setLoadingMessage(t('enrollment.loading.db'));
            console.log("Attempting to write to Firestore users collection...");

            // Prepare user data
            const userData = {
                fullName: formData.fullName,
                phone: formData.phone,
                email: formData.email,
                residence: formData.residence,
                course: formData.course,
                studyMethod: formData.studyMethod,
                startDate: formData.startDate,
                shift: formData.shift || '', // Include shift
                referral: formData.referral,
                role: 'student',
                status: 'pending', // Pending approval
                createdAt: serverTimestamp(),
                // Initialize default student data
                progress: 0,
                enrolledCourses: []
            };

            await setDoc(doc(db, 'users', user.uid), userData);

            // 3. Redirect to Thank You / Pending Page
            setLoadingMessage(t('enrollment.loading.final'));
            navigate('/thank-you');

        } catch (err) {
            console.error("Enrollment error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError(t('enrollment.errors.email_in_use'));
            } else if (err.code === 'auth/weak-password') {
                setError(t('enrollment.errors.weak_password'));
            } else {
                // Show the specific error message for debugging
                setError(`Error: ${err.message}`);
            }
        } finally {
            setLoadingMessage('');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

            <div className="container mx-auto px-6 max-w-3xl">

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="font-serif text-3xl md:text-5xl font-bold text-espresso dark:text-white mb-4">
                        {t('enrollment.title')}
                    </h1>
                    <h2 className="text-xl text-primary font-medium mb-4">
                        {t('enrollment.subtitle')}
                    </h2>
                    <p className="text-espresso/70 dark:text-white/70 leading-relaxed max-w-2xl mx-auto">
                        {t('enrollment.description')}
                    </p>
                </div>

                {/* Section 1: Online Registration Form */}
                <div className="bg-[#F5DEB3] dark:bg-white/5 p-8 rounded-3xl shadow-2xl border border-espresso/10 mb-12 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-sm font-medium">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Full Name */}
                        <div>
                            <label htmlFor="fullName" className="block text-espresso dark:text-white font-bold mb-2">
                                {t('enrollment.form.fullName.label')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                                placeholder={t('enrollment.form.fullName.placeholder')}
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Phone */}
                            <div>
                                <label htmlFor="phone" className="block text-espresso dark:text-white font-bold mb-2">
                                    {t('enrollment.form.phone.label')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                                    placeholder={t('enrollment.form.phone.placeholder')}
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-espresso dark:text-white font-bold mb-2">
                                    {t('enrollment.form.email.label')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                                    placeholder={t('enrollment.form.email.placeholder')}
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Password Field - NEW */}
                        <div>
                            <label htmlFor="password" className="block text-espresso dark:text-white font-bold mb-2">
                                {t('enrollment.form.password.label')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                minLength="6"
                                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                                placeholder={t('enrollment.form.password.placeholder')}
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <p className="text-xs text-espresso/50 dark:text-white/50 mt-1">
                                {t('enrollment.form.password.hint')}
                            </p>
                        </div>

                        {/* Residence */}
                        <div>
                            <label htmlFor="residence" className="block text-espresso dark:text-white font-bold mb-2">
                                {t('enrollment.form.residence.label')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="residence"
                                name="residence"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                                placeholder={t('enrollment.form.residence.placeholder')}
                                value={formData.residence}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Course Ahisemo */}
                        <div>
                            <label htmlFor="course" className="block text-espresso dark:text-white font-bold mb-2">
                                {t('enrollment.form.course.label')} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    id="course"
                                    name="course"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-background-light dark:bg-black/20 border border-[#e0dbd6] dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                                    value={formData.course}
                                    onChange={handleChange}
                                >
                                    <option value="full-barista">{t('enrollment.form.course.options.full-barista')}</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-espresso/50">expand_more</span>
                            </div>
                        </div>

                        {/* Study Method */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="studyMethod" className="block text-espresso dark:text-white font-bold mb-2">
                                    {t('enrollment.form.studyMethod.label')} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="studyMethod"
                                        name="studyMethod"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-background-light dark:bg-black/20 border border-[#e0dbd6] dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                                        value={formData.studyMethod}
                                        onChange={handleChange}
                                    >
                                        <option value="" disabled>{t('enrollment.form.studyMethod.placeholder')}</option>
                                        <option value="onsite">{t('enrollment.form.studyMethod.options.onsite')}</option>
                                        <option value="online">{t('enrollment.form.studyMethod.options.online')}</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-espresso/50">expand_more</span>
                                </div>
                            </div>

                            {/* Start Date */}
                            {/* Start Date OR Shift Selection */}
                            <div>
                                <label htmlFor="startDate" className="block text-espresso dark:text-white font-bold mb-2">
                                    {formData.studyMethod === 'onsite' ? t('enrollment.form.onsite.label') : t('enrollment.form.online.label')} <span className="text-red-500">*</span>
                                </label>
                                {formData.studyMethod === 'onsite' ? (
                                    <div className="relative">
                                        <select
                                            id="shift"
                                            name="shift"
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-background-light dark:bg-black/20 border border-[#e0dbd6] dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                                            value={formData.shift}
                                            onChange={handleChange}
                                        >
                                            <option value="" disabled>{t('enrollment.form.onsite.placeholder')}</option>
                                            <option value="1st-shift">{t('enrollment.form.onsite.options.1st-shift')}</option>
                                            <option value="2nd-shift">{t('enrollment.form.onsite.options.2nd-shift')}</option>
                                            <option value="3rd-shift">{t('enrollment.form.onsite.options.3rd-shift')}</option>
                                            <option value="4th-shift">{t('enrollment.form.onsite.options.4th-shift')}</option>
                                            <option value="5th-shift">{t('enrollment.form.onsite.options.5th-shift')}</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-espresso/50">expand_more</span>
                                    </div>
                                ) : (
                                    <input
                                        type="date"
                                        id="startDate"
                                        name="startDate"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Referral (Optional) */}
                        <div>
                            <label htmlFor="referral" className="block text-espresso dark:text-white font-bold mb-2">
                                {t('enrollment.form.referral.label')}
                            </label>
                            <div className="relative">
                                <select
                                    id="referral"
                                    name="referral"
                                    className="w-full px-4 py-3 rounded-xl bg-background-light dark:bg-black/20 border border-[#e0dbd6] dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                                    value={formData.referral}
                                    onChange={handleChange}
                                >
                                    <option value="">{t('enrollment.form.referral.placeholder')}</option>
                                    <option value="social-media">{t('enrollment.form.referral.options.social-media')}</option>
                                    <option value="google">{t('enrollment.form.referral.options.google')}</option>
                                    <option value="referral">{t('enrollment.form.referral.options.referral')}</option>
                                    <option value="other">{t('enrollment.form.referral.options.other')}</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-espresso/50">expand_more</span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!!loadingMessage}
                            className="w-full py-4 rounded-xl bg-primary text-white text-lg font-bold shadow-lg hover:bg-primary/90 hover:scale-[1.02] transition-all duration-200 mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {loadingMessage ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                    {loadingMessage}
                                </span>
                            ) : (
                                t('enrollment.form.submit')
                            )}
                        </button>

                    </form>
                </div>

                {/* Section 2: Payment Information & Policy */}
                <div className="space-y-8">
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-4">
                            {t('enrollment.payment.title')}
                        </h2>
                        <p className="text-espresso/80 dark:text-white/80 leading-relaxed mb-6">
                            {t('enrollment.payment.description')}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-[#F5DEB3] dark:bg-white/5 p-4 rounded-xl border border-espresso/10 shadow-lg relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined">smartphone</span> {t('enrollment.payment.momo.title')}
                                </h3>
                                <p className="text-sm text-espresso/70 dark:text-white/70">{t('enrollment.payment.momo.description')}</p>
                            </div>
                            <div className="bg-[#F5DEB3] dark:bg-white/5 p-4 rounded-xl border border-espresso/10 shadow-lg relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined">account_balance</span> {t('enrollment.payment.bank.title')}
                                </h3>
                                <p className="text-sm text-espresso/70 dark:text-white/70">{t('enrollment.payment.bank.description')}</p>
                            </div>
                        </div>

                        <div className="bg-[#F5DEB3] dark:bg-white/5 p-4 rounded-xl border-l-4 border-espresso shadow-md">
                            <h4 className="font-bold text-espresso dark:text-white mb-1">{t('enrollment.payment.flexibility.title')}</h4>
                            <p className="text-sm text-espresso/80 dark:text-white/80">
                                {t('enrollment.payment.flexibility.description')}
                            </p>
                        </div>
                    </div>

                    {/* Critical Policy Notice */}
                    <div className="p-6 rounded-2xl bg-[#FFF5F5] dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
                        <h3 className="font-serif text-xl font-bold text-[#D32F2F] dark:text-red-400 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined">warning</span>
                            {t('enrollment.policy.title')}
                        </h3>
                        <p className="text-[#B71C1C] dark:text-red-200 font-bold text-lg mb-1">
                            {t('enrollment.policy.highlight')}
                        </p>
                        <p className="text-red-800 dark:text-red-300">
                            {t('enrollment.policy.subtext')}
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                            {t('enrollment.policy.details')}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
