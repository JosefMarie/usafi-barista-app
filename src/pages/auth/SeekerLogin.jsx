import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function SeekerLogin() {
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
        <div className="min-h-screen flex items-center justify-center bg-[#F5DEB3] dark:bg-[#1c1916] py-12 px-4 sm:px-6 lg:px-8 font-display relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-espresso/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-espresso/5 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="max-w-md w-full space-y-8 bg-white/40 dark:bg-black/40 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-white/5 relative z-10 transition-all hover:shadow-espresso/20 hover:-translate-y-1">
                <div className="text-center">
                    <Link to="/opportunities" className="inline-flex flex-col items-center gap-4 justify-center mb-8 group">
                        <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform overflow-hidden p-1">
                            <img src="/logo.jpg" alt="Usafi Logo" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div>
                            <span className="block font-serif text-3xl font-black text-espresso dark:text-white uppercase tracking-tight leading-none">
                                Usafi Opportunities
                            </span>
                            <span className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.4em] mt-1 block">
                                Career Access Portal
                            </span>
                        </div>
                    </Link>
                    <h2 className="text-xl font-bold text-espresso/80 dark:text-white/80 font-serif uppercase tracking-widest mb-1">
                        Seeker Access
                    </h2>
                    <p className="text-xs font-medium text-espresso/50 dark:text-white/50 bg-white/30 dark:bg-white/5 inline-block px-4 py-1 rounded-full border border-white/20">
                        Sign in to managed career ledger
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-espresso/40 group-focus-within/input:text-espresso transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </div>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 border border-espresso/10 rounded-2xl bg-white/50 dark:bg-white/5 text-espresso dark:text-white placeholder-espresso/30 focus:outline-none focus:ring-2 focus:ring-espresso/20 focus:border-espresso/30 transition-all font-medium"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
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
                                    placeholder="Enter authorization key"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-[11px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-100 dark:border-red-900/30">
                            <span className="material-symbols-outlined text-base">error</span>
                            {error}
                        </div>
                    )}

                    <div className="text-right">
                        <Link to="/forgot-password" className="text-[10px] font-black text-espresso/60 hover:text-espresso uppercase tracking-widest transition-colors border-b border-transparent hover:border-espresso/20 pb-0.5">
                            Forgot Credentials?
                        </Link>
                    </div>

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
                </form>
                <div className="mt-8 pt-6 border-t border-espresso/10 text-center">
                    <p className="text-xs text-espresso/60 dark:text-white/60 font-medium">
                        New Candidate?{' '}
                        <Link to="/opportunities/register" className="font-bold text-espresso hover:text-black dark:text-white dark:hover:text-white/80 transition-colors uppercase tracking-wide ml-1">
                            Initialize Profile
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
