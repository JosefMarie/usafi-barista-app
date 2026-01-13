import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useTranslation } from 'react-i18next';

export function BusinessLogin() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Check for message from registration redirect
    const successMessage = location.state?.message;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // Check Role and Approval Status
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role !== 'business_student' && userData.role !== 'admin') {
                    // Optionally restrict log in if not the right role, 
                    // OR just redirect them to their appropriate dashboard.
                    // For now, let's just warn but allow if we want generic login reuse, 
                    // but this is a specific portal.
                    // Let's enforce role for clarity.
                    if (userData.role !== 'admin') { // Admins can probably login anywhere
                        setError("Access denied. This portal is for Business Class students.");
                        await auth.signOut();
                        setLoading(false);
                        return;
                    }
                }

                if (userData.role === 'business_student' && !userData.approved) {
                    setError("Your account is pending approval. Please contact the administrator.");
                    await auth.signOut();
                    setLoading(false);
                    return;
                }

                // Success! Redirect to Business Dashboard
                navigate('/business/dashboard');
            } else {
                setError("User profile not found.");
            }

        } catch (err) {
            console.error(err);
            setError("Invalid email or password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5DEB3] dark:bg-[#1c1916] py-12 px-4 sm:px-6 lg:px-8 font-display relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-espresso/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-espresso/5 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="max-w-md w-full space-y-8 bg-white/40 dark:bg-black/40 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-white/5 relative z-10 transition-all hover:shadow-espresso/20 hover:-translate-y-1">
                <div className="text-center">
                    <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-white flex items-center justify-center shadow-xl p-1">
                        <img src="/logo.jpg" alt="Usafi Logo" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <h2 className="text-3xl font-black text-espresso dark:text-white font-serif uppercase tracking-tight leading-none mb-2">
                        Business Class
                    </h2>
                    <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em]">
                        Executive Portal Access
                    </p>
                </div>

                {successMessage && (
                    <div className="bg-green-50/80 dark:bg-green-900/40 text-green-800 dark:text-green-300 p-4 rounded-2xl text-xs font-bold uppercase tracking-wide text-center border border-green-200 dark:border-green-800 backdrop-blur-sm shadow-sm flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        {successMessage}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-espresso/40 group-focus-within/input:text-espresso transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 border border-espresso/10 rounded-2xl bg-white/50 dark:bg-white/5 text-espresso dark:text-white placeholder-espresso/30 focus:outline-none focus:ring-2 focus:ring-espresso/20 focus:border-espresso/30 transition-all font-medium"
                                    placeholder="Enter business email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-espresso/40 group-focus-within/input:text-espresso transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">lock</span>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    className="block w-full pl-12 pr-12 py-4 border border-espresso/10 rounded-2xl bg-white/50 dark:bg-white/5 text-espresso dark:text-white placeholder-espresso/30 focus:outline-none focus:ring-2 focus:ring-espresso/20 focus:border-espresso/30 transition-all font-medium"
                                    placeholder="Enter access code"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-espresso/40 hover:text-espresso transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-espresso focus:ring-espresso border-espresso/20 rounded cursor-pointer bg-white/50"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-[10px] font-black uppercase tracking-widest text-espresso/60 dark:text-white/60">
                                Remember Session
                            </label>
                        </div>

                        <div className="text-sm">
                            <Link to="/forgot-password" className="text-[10px] font-black text-espresso/60 hover:text-espresso uppercase tracking-widest transition-colors border-b border-transparent hover:border-espresso/20 pb-0.5">
                                Forgot Credentials?
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-[11px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-100 dark:border-red-900/30">
                            <span className="material-symbols-outlined text-base">error</span>
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black uppercase tracking-widest rounded-2xl text-white bg-espresso hover:bg-espresso/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-espresso transition-all shadow-xl shadow-espresso/20 hover:shadow-2xl hover:shadow-espresso/30 hover:-translate-y-0.5 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                    AUTHENTICATING...
                                </span>
                            ) : (
                                "ACCESS DASHBOARD"
                            )}
                        </button>
                    </div>

                    <div className="text-center pt-4 border-t border-espresso/5 mt-6">
                        <p className="text-xs text-espresso/60 dark:text-white/60 font-medium">
                            New Applicant?{' '}
                            <Link to="/business/register" className="font-bold text-espresso hover:text-black dark:text-white dark:hover:text-white/80 transition-colors uppercase tracking-wide ml-1">
                                Apply for Business Class
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
