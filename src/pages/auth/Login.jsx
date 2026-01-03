import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils'; // Assuming you have a utils file

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
            const role = userData?.role || 'student';

            if (role === 'ceo') navigate('/ceo/dashboard');
            else if (role === 'admin') navigate('/admin/dashboard');
            else if (role === 'instructor') navigate('/instructor/dashboard');
            else if (role === 'manager') navigate('/manager/dashboard');
            else if (role === 'business_student') navigate('/business/dashboard');
            else navigate('/student/dashboard');

        } catch (err) {
            console.error("Login Error:", err);
            setError('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-[#F5DEB3] dark:bg-white/5 p-10 rounded-3xl shadow-2xl border border-espresso/10 relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                <div className="text-center">
                    <Link to="/" className="inline-flex items-center gap-2 justify-center mb-6">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                            <span className="material-symbols-outlined text-2xl">coffee</span>
                        </div>
                        <span className="font-serif text-2xl font-bold text-espresso dark:text-white">
                            Usafi Barista
                        </span>
                    </Link>
                    <h2 className="text-3xl font-extrabold text-espresso dark:text-white font-serif">
                        Student Portal
                    </h2>
                    <p className="mt-2 text-sm text-espresso/70 dark:text-white/70">
                        Sign in to access your courses and progress
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="gap-4 flex flex-col">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-espresso/50">
                                    <span className="material-symbols-outlined">mail</span>
                                </div>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-espresso/10 rounded-lg bg-white/50 dark:bg-white/5 text-espresso dark:text-white placeholder-espresso/40 focus:outline-none focus:ring-2 focus:ring-espresso focus:border-transparent transition-all"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-espresso/50">
                                    <span className="material-symbols-outlined">lock</span>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-espresso/10 rounded-lg bg-white/50 dark:bg-white/5 text-espresso dark:text-white placeholder-espresso/40 focus:outline-none focus:ring-2 focus:ring-espresso focus:border-transparent transition-all"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg border border-red-100 dark:border-red-900/50">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-espresso/70 dark:text-white/70">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <Link to="/forgot-password" className="font-medium text-primary hover:text-primary/80 transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-full text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </div>
                </form>
                <div className="mt-6 text-center">
                    <p className="text-sm text-espresso/60 dark:text-white/60">
                        Don't have an account?{' '}
                        <Link to="/enroll" className="font-medium text-primary hover:text-primary/80 transition-colors">
                            Enroll / Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
