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
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-12 px-4 sm:px-6 lg:px-8 font-display">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-white/5 p-8 rounded-3xl shadow-xl border border-espresso/10 dark:border-white/10">
                <div className="text-center">
                    <span className="material-symbols-outlined text-5xl text-primary mb-2">business_center</span>
                    <h2 className="mt-2 text-3xl font-bold text-espresso dark:text-white font-serif">
                        Business Class Login
                    </h2>
                    <p className="mt-2 text-sm text-espresso/70 dark:text-white/70">
                        Access your premium business courses and materials.
                    </p>
                </div>

                {successMessage && (
                    <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-lg text-sm text-center border border-green-200 dark:border-green-800">
                        {successMessage}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-white/20 placeholder-gray-500 text-espresso dark:text-white rounded-xl focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-transparent"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-white/20 placeholder-gray-500 text-espresso dark:text-white rounded-xl focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-transparent"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-espresso/70 dark:text-white/70">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <Link to="/forgot-password" className="font-medium text-primary hover:text-primary/80 hover:underline">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-900/50">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/30"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                    Signing in...
                                </span>
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-espresso/70 dark:text-white/70">
                            Don't have an account?{' '}
                            <Link to="/business/register" className="font-medium text-primary hover:text-primary/80 hover:underline">
                                Apply for Access
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
