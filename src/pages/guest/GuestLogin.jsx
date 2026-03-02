import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTranslation } from 'react-i18next';

export function GuestLogin() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await login(email, password);
            const user = userCredential.user;

            // Fetch user role
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();

            // If they just booked, their profile might have a different role or they might be student by default
            const role = userData?.role;

            if (role === 'weekend_guest') {
                navigate('/guest/dashboard');
            } else if (userData) {
                setError('This login is for Weekend Experience guests only.');
            } else {
                // This might happen if Auth exists but Firestore doc is delayed
                setError('Guest profile not found. Please ensure your booking is complete.');
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF5E8] dark:bg-[#1c1916] py-12 px-4 sm:px-6 lg:px-8 font-display relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -ml-48 -mb-48"></div>

            <div className="max-w-md w-full space-y-8 bg-white/40 dark:bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-espresso/10 relative z-10 transition-all">
                <div className="text-center">
                    <Link to="/" className="inline-flex flex-col items-center gap-4 justify-center mb-8 group">
                        <div className="h-20 w-20 rounded-3xl bg-white flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform overflow-hidden p-1 border border-espresso/10">
                            <img src="/logo.jpg" alt="Usafi Logo" className="w-full h-full object-cover rounded-2xl" />
                        </div>
                        <div>
                            <span className="block font-serif text-2xl font-black text-espresso dark:text-white uppercase tracking-tight leading-none">
                                Usafi Barista
                            </span>
                            <span className="text-[8px] font-black text-rose-500 uppercase tracking-[0.4em] mt-1 block">
                                Weekend Experience
                            </span>
                        </div>
                    </Link>
                    <h2 className="text-2xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight mb-2">
                        Guest Portal
                    </h2>
                    <p className="text-xs font-medium text-espresso/50 dark:text-white/40 uppercase tracking-widest">
                        Sign in to track your coffee journey
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 ml-2">Email Address</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-espresso/30 group-focus-within:text-rose-500 transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </span>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 border border-espresso/5 rounded-2xl bg-white/50 dark:bg-white/5 text-espresso dark:text-white placeholder-espresso/20 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-espresso/40 ml-2">Password</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-espresso/30 group-focus-within:text-rose-500 transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">lock</span>
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full pl-12 pr-12 py-4 border border-espresso/5 rounded-2xl bg-white/50 dark:bg-white/5 text-espresso dark:text-white placeholder-espresso/20 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-espresso/30 hover:text-rose-500 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-rose-600 text-[10px] font-black uppercase tracking-widest bg-rose-50 dark:bg-rose-900/10 px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-900/20">
                            <span className="material-symbols-outlined text-sm">error</span>
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-5 px-4 border border-transparent text-xs font-black uppercase tracking-[0.25em] rounded-2xl text-white bg-gradient-to-r from-rose-500 to-amber-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-rose-500/20 disabled:opacity-70 disabled:grayscale disabled:pointer-events-none"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                    Authenticating...
                                </span>
                            ) : (
                                "Enter Journey"
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-6 border-t border-espresso/5 text-center space-y-4">
                    <p className="text-[10px] text-espresso/40 dark:text-white/20 font-black uppercase tracking-widest">
                        New Guest?{' '}
                        <Link to="/weekend-experience" className="text-rose-500 hover:text-rose-600 transition-colors ml-1">
                            Book Your Spot
                        </Link>
                    </p>

                    {/* Dev/Demo Helper: Only if explicitly needed for verification */}
                    <button
                        type="button"
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const { createUserWithEmailAndPassword } = await import('firebase/auth');
                                const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
                                const { auth, db } = await import('../../lib/firebase');

                                const userCredential = await createUserWithEmailAndPassword(auth, 'guest@test.com', 'password123');
                                await setDoc(doc(db, 'users', userCredential.user.uid), {
                                    name: 'Weekend Guest',
                                    email: 'guest@test.com',
                                    role: 'weekend_guest',
                                    status: 'active',
                                    createdAt: serverTimestamp()
                                });
                                alert('Test account guest@test.com created! You can now sign in.');
                            } catch (err) {
                                console.error(err);
                                alert(err.message);
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="text-[8px] font-black text-espresso/10 hover:text-rose-500/40 transition-colors uppercase tracking-[0.3em]"
                    >
                        Troubleshoot Test Account
                    </button>
                </div>
            </div>

            {/* Back button */}
            <button
                onClick={() => navigate('/weekend-experience')}
                className="absolute top-8 left-8 size-12 rounded-2xl bg-white/50 dark:bg-white/5 border border-espresso/10 flex items-center justify-center text-espresso dark:text-white hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-lg backdrop-blur-md"
            >
                <span className="material-symbols-outlined">arrow_back</span>
            </button>

            <style dangerouslySetInnerHTML={{
                __html: `
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
            ` }} />
        </div>
    );
}
