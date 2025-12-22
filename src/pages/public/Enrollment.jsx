import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Enrollment() {
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
        setLoadingMessage('Initializing...');
        setError('');

        try {
            // Import Firebase services dynamically
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
            const { auth, db } = await import('../../lib/firebase');

            // 1. Create Authentication User
            setLoadingMessage('Creating Login Credentials...');
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Create User Document in Firestore
            setLoadingMessage('Saving Student Profile to Database...');
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
            setLoadingMessage('Finalizing...');
            navigate('/thank-you');

        } catch (err) {
            console.error("Enrollment error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please log in instead.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
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
                        Enroll Now: Secure Your Spot
                    </h1>
                    <h2 className="text-xl text-primary font-medium mb-4">
                        Join the Usafi Barista Training Center
                    </h2>
                    <p className="text-espresso/70 dark:text-white/70 leading-relaxed max-w-2xl mx-auto">
                        Create your student account and complete your enrollment. After submission, your application will be reviewed for approval.
                    </p>
                </div>

                {/* Section 1: Online Registration Form */}
                <div className="bg-white dark:bg-white/5 p-8 rounded-3xl shadow-xl border border-[#e0dbd6] dark:border-white/10 mb-12">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-sm font-medium">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Full Name */}
                        <div>
                            <label htmlFor="fullName" className="block text-espresso dark:text-white font-bold mb-2">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-background-light dark:bg-black/20 border border-[#e0dbd6] dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="As it should appear on your certificate"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Phone */}
                            <div>
                                <label htmlFor="phone" className="block text-espresso dark:text-white font-bold mb-2">
                                    Primary Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-background-light dark:bg-black/20 border border-[#e0dbd6] dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="+250..."
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-espresso dark:text-white font-bold mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-background-light dark:bg-black/20 border border-[#e0dbd6] dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Password Field - NEW */}
                        <div>
                            <label htmlFor="password" className="block text-espresso dark:text-white font-bold mb-2">
                                Create Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                minLength="6"
                                className="w-full px-4 py-3 rounded-xl bg-background-light dark:bg-black/20 border border-[#e0dbd6] dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="Create a secure password (min 6 chars)"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <p className="text-xs text-espresso/50 dark:text-white/50 mt-1">
                                You will use this password to log in to the student portal.
                            </p>
                        </div>

                        {/* Residence */}
                        <div>
                            <label htmlFor="residence" className="block text-espresso dark:text-white font-bold mb-2">
                                Place of Residence <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="residence"
                                name="residence"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-background-light dark:bg-black/20 border border-[#e0dbd6] dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="City / District"
                                value={formData.residence}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Course Ahisemo */}
                        <div>
                            <label htmlFor="course" className="block text-espresso dark:text-white font-bold mb-2">
                                Course Ahisemo (Chosen Course) <span className="text-red-500">*</span>
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
                                    <option value="full-barista">Full Barista Certificate</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-espresso/50">expand_more</span>
                            </div>
                        </div>

                        {/* Study Method */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="studyMethod" className="block text-espresso dark:text-white font-bold mb-2">
                                    Uburyo bwo Kwiga (Method) <span className="text-red-500">*</span>
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
                                        <option value="" disabled>Select method</option>
                                        <option value="onsite">Onsite (In-Person)</option>
                                        <option value="online">E-Learning (Online)</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-espresso/50">expand_more</span>
                                </div>
                            </div>

                            {/* Start Date */}
                            {/* Start Date OR Shift Selection */}
                            <div>
                                <label htmlFor="startDate" className="block text-espresso dark:text-white font-bold mb-2">
                                    {formData.studyMethod === 'onsite' ? 'Hitamo Isaha (Choose Shift)' : 'Igihe Ashaka Gutangirira'} <span className="text-red-500">*</span>
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
                                            <option value="" disabled>Select a shift</option>
                                            <option value="1st-shift">1st Shift (9am - 11am)</option>
                                            <option value="2nd-shift">2nd Shift (11:30am - 1:30pm)</option>
                                            <option value="3rd-shift">3rd Shift (2pm - 4pm)</option>
                                            <option value="4th-shift">4th Shift (4:30pm - 6:30pm)</option>
                                            <option value="5th-shift">5th Shift (7pm - 9pm)</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-espresso/50">expand_more</span>
                                    </div>
                                ) : (
                                    <input
                                        type="date"
                                        id="startDate"
                                        name="startDate"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-background-light dark:bg-black/20 border border-[#e0dbd6] dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Referral (Optional) */}
                        <div>
                            <label htmlFor="referral" className="block text-espresso dark:text-white font-bold mb-2">
                                How did you hear about Usafi?
                            </label>
                            <div className="relative">
                                <select
                                    id="referral"
                                    name="referral"
                                    className="w-full px-4 py-3 rounded-xl bg-background-light dark:bg-black/20 border border-[#e0dbd6] dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                                    value={formData.referral}
                                    onChange={handleChange}
                                >
                                    <option value="">Select an option</option>
                                    <option value="social-media">Social Media</option>
                                    <option value="google">Google Search</option>
                                    <option value="referral">Friend / Referral</option>
                                    <option value="other">Other</option>
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
                                "Create Account & Enroll"
                            )}
                        </button>

                    </form>
                </div>

                {/* Section 2: Payment Information & Policy */}
                <div className="space-y-8">
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-4">
                            Payment Details & Financial Policy
                        </h2>
                        <p className="text-espresso/80 dark:text-white/80 leading-relaxed mb-6">
                            Enrollment is confirmed upon receipt of payment. We offer flexibility through the following channels:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-[#e0dbd6] dark:border-white/10">
                                <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined">smartphone</span> Mobile Money
                                </h3>
                                <p className="text-sm text-espresso/70 dark:text-white/70">Details provided upon form submission.</p>
                            </div>
                            <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-[#e0dbd6] dark:border-white/10">
                                <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined">account_balance</span> Bank Transfer
                                </h3>
                                <p className="text-sm text-espresso/70 dark:text-white/70">Bank details provided upon submission.</p>
                            </div>
                        </div>

                        <div className="bg-primary/5 p-4 rounded-xl border-l-4 border-primary">
                            <h4 className="font-bold text-espresso dark:text-white mb-1">Payment Flexibility</h4>
                            <p className="text-sm text-espresso/80 dark:text-white/80">
                                We allow students to pay the tuition fee in installments, as per our standard agreement. Details will be sent to your email after registration.
                            </p>
                        </div>
                    </div>

                    {/* Critical Policy Notice */}
                    <div className="p-6 rounded-2xl bg-[#FFF5F5] dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
                        <h3 className="font-serif text-xl font-bold text-[#D32F2F] dark:text-red-400 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined">warning</span>
                            Icyitonderwa (Important Note)
                        </h3>
                        <p className="text-[#B71C1C] dark:text-red-200 font-bold text-lg mb-1">
                            Amafaranga yishyuwe ntasubizwa.
                        </p>
                        <p className="text-red-800 dark:text-red-300">
                            (All tuition fees paid are strictly non-refundable.)
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                            Please ensure you are fully committed to your chosen course and study method before making a payment.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
