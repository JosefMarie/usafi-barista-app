import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useTranslation } from 'react-i18next';

export function BusinessRegister() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError(t('auth.passwordsDoNotMatch') || 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Create User Doc in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                role: 'business_student',
                approved: false, // Default to false, Admin must approve
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // 3. Redirect to Pending/Dashboard
            // For now, redirect to login with a message or a specific pending page
            // Let's redirect to login for simplicity in this step, or a dashboard that shows "Pending"
            navigate('/business/login', { state: { message: 'Registration successful! Please wait for admin approval before logging in.' } });

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5DEB3] dark:bg-[#1c1916] py-24 px-4 font-display flex items-center justify-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-espresso/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-espresso/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-white/5 p-8 md:p-12 max-w-lg w-full relative z-10 transition-all hover:shadow-espresso/20">
                <div className="text-center mb-10">
                    <div className="inline-block p-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6 shadow-lg">
                        <div className="h-20 w-20 rounded-full overflow-hidden bg-white">
                            <img src="/logo.jpg" alt="Usafi Logo" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <h1 className="font-serif text-3xl font-black text-espresso dark:text-white uppercase tracking-tight leading-none mb-2">
                        Business Class Application
                    </h1>
                    <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em]">
                        Executive Membership Program
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-espresso/60 dark:text-white/60 uppercase tracking-widest mb-2 pl-2">Full Legal Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="w-full px-5 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-espresso/10 focus:ring-2 focus:ring-espresso/20 outline-none transition-all placeholder:text-espresso/20 text-espresso dark:text-white font-medium shadow-sm"
                                placeholder="e.g. Jean Pierre"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-espresso/60 dark:text-white/60 uppercase tracking-widest mb-2 pl-2">Business Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="w-full px-5 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-espresso/10 focus:ring-2 focus:ring-espresso/20 outline-none transition-all placeholder:text-espresso/20 text-espresso dark:text-white font-medium shadow-sm"
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-espresso/60 dark:text-white/60 uppercase tracking-widest mb-2 pl-2">Contact Number</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                autoComplete="tel"
                                required
                                className="w-full px-5 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-espresso/10 focus:ring-2 focus:ring-espresso/20 outline-none transition-all placeholder:text-espresso/20 text-espresso dark:text-white font-medium shadow-sm"
                                placeholder="+250..."
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[10px] font-black text-espresso/60 dark:text-white/60 uppercase tracking-widest mb-2 pl-2">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="w-full px-5 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-espresso/10 focus:ring-2 focus:ring-espresso/20 outline-none transition-all placeholder:text-espresso/20 text-espresso dark:text-white font-medium shadow-sm"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-espresso/60 dark:text-white/60 uppercase tracking-widest mb-2 pl-2">Confirm</label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="w-full px-5 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-espresso/10 focus:ring-2 focus:ring-espresso/20 outline-none transition-all placeholder:text-espresso/20 text-espresso dark:text-white font-medium shadow-sm"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-[11px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-100 dark:border-red-900/30">
                            <span className="material-symbols-outlined text-base">error</span>
                            {error}
                        </div>
                    )}

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black uppercase tracking-widest rounded-2xl text-white bg-espresso hover:bg-espresso/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-espresso transition-all shadow-xl shadow-espresso/20 hover:shadow-2xl hover:shadow-espresso/30 hover:-translate-y-0.5 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                    PROCESSING APPLICATION...
                                </span>
                            ) : (
                                "SUBMIT APPLICATION"
                            )}
                        </button>
                    </div>

                    <div className="text-center pt-4 border-t border-espresso/5 mt-6">
                        <p className="text-xs text-espresso/60 dark:text-white/60 font-medium">
                            Already a Member?{' '}
                            <Link to="/business/login" className="font-bold text-espresso hover:text-black dark:text-white dark:hover:text-white/80 transition-colors uppercase tracking-wide ml-1">
                                Access Portal
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
