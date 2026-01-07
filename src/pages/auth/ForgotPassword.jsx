import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Link } from 'react-router-dom';

export function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
            setEmail('');
        } catch (err) {
            console.error('Password reset error:', err);
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email address');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address');
            } else {
                setError(err.message || 'Failed to send reset email');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream via-background-light to-primary/5 dark:from-background-dark dark:via-background-dark dark:to-primary/5 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4 overflow-hidden">
                        <img src="/logo.jpg" alt="Usafi Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-2">
                        Reset Password
                    </h1>
                    <p className="text-espresso/60 dark:text-white/60">
                        Enter your email to receive a password reset link
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl shadow-2xl border border-espresso/10 p-8 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-4xl">mark_email_read</span>
                            </div>
                            <h3 className="text-xl font-bold text-espresso dark:text-white">
                                Check Your Email
                            </h3>
                            <p className="text-espresso/70 dark:text-white/70">
                                We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                            </p>
                            <div className="pt-4">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                                >
                                    <span className="material-symbols-outlined">arrow_back</span>
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                        <span className="material-symbols-outlined">error</span>
                                        <p className="font-medium">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-espresso/10 bg-white/50 dark:bg-white/5 text-espresso dark:text-white placeholder:text-espresso/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-espresso"
                                    placeholder="your.email@example.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">send</span>
                                        Send Reset Link
                                    </>
                                )}
                            </button>

                            <div className="text-center pt-4">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-1 text-espresso/70 dark:text-white/70 hover:text-primary dark:hover:text-primary font-medium"
                                >
                                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>

                {/* Additional Help */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-espresso/60 dark:text-white/60">
                        Need help? Contact{' '}
                        <a href="mailto:support@usafi.com" className="text-primary font-bold hover:underline">
                            support@usafi.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
