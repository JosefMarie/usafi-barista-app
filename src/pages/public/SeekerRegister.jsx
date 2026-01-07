import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { GradientButton } from '../../components/ui/GradientButton';

export function SeekerRegister() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        genre: 'Male', // Using 'genre' based on user request "Gender" but key name is flexible. Sticking to 'gender' is better practice but sticking to user request context.
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Create User Document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                name: formData.name,
                email: formData.email,
                gender: formData.genre,
                phone: formData.phone,
                role: 'job_seeker',
                paymentStatus: 'pending',
                createdAt: serverTimestamp(),
                status: 'active'
            });

            // 3. Navigate to Payment Pending Page
            navigate('/seeker/payment-pending');

        } catch (error) {
            console.error("Error registering seeker: ", error);
            let errorMessage = "Registration failed. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Email is already in use.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Password should be at least 6 characters.";
            }
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5DEB3] dark:bg-[#1c1916] py-24 px-4 font-display flex items-center justify-center relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-espresso/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-espresso/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-white/5 p-8 md:p-12 max-w-lg w-full relative z-10 transition-all hover:shadow-espresso/20">
                <div className="text-center mb-10">
                    <div className="inline-block p-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6 shadow-lg">
                        <div className="h-16 w-16 rounded-full overflow-hidden bg-white">
                            <img src="/logo.jpg" alt="Usafi Logo" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <h1 className="font-serif text-3xl font-black text-espresso dark:text-white uppercase tracking-tight leading-none mb-2">
                        Seeker Registration
                    </h1>
                    <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em]">
                        Initialize Your Career Profile
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-black text-espresso/60 dark:text-white/60 uppercase tracking-widest mb-2 pl-2">Full Legal Name</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-5 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-espresso/10 focus:ring-2 focus:ring-espresso/20 outline-none transition-all placeholder:text-espresso/20 text-espresso dark:text-white font-medium shadow-sm"
                                placeholder="e.g. Jean Pierre"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-espresso/60 dark:text-white/60 uppercase tracking-widest mb-2 pl-2">Gender Identification</label>
                            <div className="relative">
                                <select
                                    name="genre"
                                    value={formData.genre}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-espresso/10 focus:ring-2 focus:ring-espresso/20 outline-none transition-all text-espresso dark:text-white font-medium appearance-none shadow-sm cursor-pointer"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-espresso/40">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-espresso/60 dark:text-white/60 uppercase tracking-widest mb-2 pl-2">Direct Contact (Email)</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-5 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-espresso/10 focus:ring-2 focus:ring-espresso/20 outline-none transition-all placeholder:text-espresso/20 text-espresso dark:text-white font-medium shadow-sm"
                                placeholder="candidate@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-espresso/60 dark:text-white/60 uppercase tracking-widest mb-2 pl-2">Mobile Number</label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-5 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-espresso/10 focus:ring-2 focus:ring-espresso/20 outline-none transition-all placeholder:text-espresso/20 text-espresso dark:text-white font-medium shadow-sm"
                                placeholder="+250..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[10px] font-black text-espresso/60 dark:text-white/60 uppercase tracking-widest mb-2 pl-2">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-espresso/10 focus:ring-2 focus:ring-espresso/20 outline-none transition-all placeholder:text-espresso/20 text-espresso dark:text-white font-medium shadow-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-espresso/60 dark:text-white/60 uppercase tracking-widest mb-2 pl-2">Confirm</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-espresso/10 focus:ring-2 focus:ring-espresso/20 outline-none transition-all placeholder:text-espresso/20 text-espresso dark:text-white font-medium shadow-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            type="button" // Ensuring type button to prevent implicit submit issues with onClick if needed, but onSubmit handles it. Keeping simple.
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black uppercase tracking-widest rounded-2xl text-white bg-espresso hover:bg-espresso/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-espresso transition-all shadow-xl shadow-espresso/20 hover:shadow-2xl hover:shadow-espresso/30 hover:-translate-y-0.5 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                            {loading ? 'PROVISIONING ACCOUNT...' : 'PROCEED TO PAYMENT'}
                        </button>
                    </div>

                    <p className="text-center text-xs text-espresso/60 dark:text-white/60 font-medium">
                        Existing Candidate? <Link to="/seeker/login" className="text-espresso font-bold hover:underline">ACCESS LOGIN</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
