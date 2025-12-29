import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function SeekerLogin() {
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
            await login(email, password);
            navigate('/seeker/dashboard'); // Specific redirect for Seekers
        } catch (err) {
            console.error(err);
            setError('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-12 px-4 sm:px-6 lg:px-8 font-display">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#2c2825] p-10 rounded-2xl shadow-xl border border-green-500/20">
                <div className="text-center">
                    <Link to="/opportunities" className="inline-flex items-center gap-2 justify-center mb-6">
                        <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white shadow-lg">
                            <span className="material-symbols-outlined text-2xl">work</span>
                        </div>
                        <span className="font-serif text-2xl font-bold text-espresso dark:text-white">
                            Usafi Opportunities
                        </span>
                    </Link>
                    <h2 className="text-3xl font-extrabold text-espresso dark:text-white font-serif">
                        Seeker Login
                    </h2>
                    <p className="mt-2 text-sm text-espresso/70 dark:text-white/70">
                        Sign in to find your next hospitality job
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
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-espresso dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-espresso dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
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
                        <Link to="/opportunities/register" className="font-medium text-green-600 hover:text-green-500 transition-colors">
                            Register Here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
