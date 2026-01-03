import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function SetupAdmin() {
    const navigate = useNavigate();
    const { login, user } = useAuth(); // Monitor user state

    // Mode Toggle: 'login' or 'register'
    const [mode, setMode] = useState('login');
    const [isLoggingIn, setIsLoggingIn] = useState(false); // Track if we initiated a login

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'instructor',
        accessKey: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const STAFF_ACCESS_KEY = 'USAFI-STAFF-2025';

    // Watch for successful login state change
    useEffect(() => {
        if (user && isLoggingIn) {
            // User is now authenticated and we were trying to log in/register
            if (user.role === 'admin' || user.role === 'instructor' || user.role === 'manager') {
                if (user.role === 'manager') {
                    navigate('/manager/dashboard');
                } else if (user.role === 'instructor') {
                    navigate('/instructor/dashboard');
                } else {
                    navigate('/admin/dashboard');
                }
            } else {
                // Determine where to send them if they aren't admin (e.g. they logged in with a student account)
                setStatus({ type: 'error', message: 'This account is not authorized for the Staff Portal.' });
                // If you want to allow them to student portal, you could navigate there
                // navigate('/student/dashboard'); 
                setIsLoggingIn(false);
                setLoading(false);
            }
        }
    }, [user, isLoggingIn, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });
        setLoading(true);
        setIsLoggingIn(true); // Signal that we expect a user update

        try {
            await login(formData.email, formData.password);
            // We removed the immediate navigate() here because we wait for the useEffect
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: 'Invalid credentials. Please try again.' });
            setLoading(false); // Reset loading if error
            setIsLoggingIn(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        if (formData.accessKey !== STAFF_ACCESS_KEY) {
            setStatus({ type: 'error', message: 'Invalid Access Key. Authorization denied.' });
            return;
        }

        setLoading(true);
        try {
            const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
            const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
            const { auth, db } = await import('../../lib/firebase');

            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: formData.name });

            await setDoc(doc(db, 'users', user.uid), {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                status: 'active',
                createdAt: serverTimestamp(),
                phone: '',
                bio: 'New staff member',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
            });

            setStatus({ type: 'success', message: `Success! ${formData.role} account created.` });
            setIsLoggingIn(true); // Treat registration as "logging in" so useEffect handles redirect

        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: error.message });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto space-y-8 bg-[#F5DEB3] dark:bg-white/5 p-10 rounded-3xl shadow-2xl border border-espresso/10 relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>

                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white mb-4 shadow-lg">
                        <span className="material-symbols-outlined text-2xl">shield_person</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-espresso dark:text-white font-serif">
                        Staff Portal
                    </h2>
                    <p className="mt-2 text-sm text-espresso/70 dark:text-white/70">
                        {mode === 'login' ? 'Secure Login for Admins & Instructors' : 'Register New Staff Member'}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                    <button
                        onClick={() => { setMode('login'); setStatus({ type: '', message: '' }); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'login'
                            ? 'bg-white dark:bg-[#2c2825] text-primary shadow-sm'
                            : 'text-espresso/60 dark:text-white/60 hover:text-espresso dark:hover:text-white'
                            }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => { setMode('register'); setStatus({ type: '', message: '' }); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'register'
                            ? 'bg-white dark:bg-[#2c2825] text-primary shadow-sm'
                            : 'text-espresso/60 dark:text-white/60 hover:text-espresso dark:hover:text-white'
                            }`}
                    >
                        Register
                    </button>
                </div>

                <form className="mt-4 space-y-6" onSubmit={mode === 'login' ? handleLogin : handleRegister}>

                    {mode === 'register' && (
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                            <label className="block text-sm font-bold text-primary mb-1">
                                Access Key <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="accessKey"
                                type="password"
                                required
                                placeholder="Enter Staff Key"
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.accessKey}
                                onChange={handleChange}
                            />
                        </div>
                    )}

                    <div className="space-y-4">
                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-1">Full Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    className="block w-full px-3 py-2 border border-espresso/10 rounded-lg bg-white/50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-espresso text-espresso dark:text-white placeholder:text-espresso/40"
                                    placeholder="e.g. Sarah Kimani"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-espresso dark:text-white mb-1">
                                {mode === 'login' ? 'Email Address' : 'Staff Email'}
                            </label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="name@usafibarista.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-espresso dark:text-white mb-1">Password</label>
                            <input
                                name="password"
                                type="password"
                                required
                                minLength="6"
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-1">Role Assignment</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'instructor' })}
                                        className={`px-4 py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.role === 'instructor'
                                            ? 'bg-primary text-white border-primary shadow-md'
                                            : 'bg-white dark:bg-white/5 text-espresso/70 dark:text-white/70 border-gray-200 dark:border-white/10 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">school</span>
                                        Instructor
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'manager' })}
                                        className={`px-4 py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.role === 'manager'
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                            : 'bg-white dark:bg-white/5 text-espresso/70 dark:text-white/70 border-gray-200 dark:border-white/10 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">campaign</span>
                                        Manager
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'admin' })}
                                        className={`px-4 py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.role === 'admin'
                                            ? 'bg-espresso dark:bg-black text-white border-espresso shadow-md'
                                            : 'bg-white dark:bg-white/5 text-espresso/70 dark:text-white/70 border-gray-200 dark:border-white/10 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                                        Admin
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {status.message && (
                        <div className={`p-4 rounded-xl text-sm font-bold text-center ${status.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200'
                            }`}>
                            {status.message}
                        </div>
                    )}

                    {mode === 'login' && (
                        <div className="text-right">
                            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                            </span>
                        ) : (
                            mode === 'login' ? 'Sign In to Dashboard' : 'Create Staff Account'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}


