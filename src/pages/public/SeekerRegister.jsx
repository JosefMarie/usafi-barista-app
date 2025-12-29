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
        <div className="min-h-screen bg-background-light dark:bg-background-dark py-24 px-4 font-display flex items-center justify-center">
            <div className="bg-white dark:bg-white/5 rounded-3xl shadow-xl border border-espresso/5 p-8 md:p-12 max-w-lg w-full">
                <div className="text-center mb-10">
                    <h1 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-3">Job Seeker Registration</h1>
                    <p className="text-espresso/70 dark:text-white/70">Create an account to find opportunities.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Gender</label>
                        <select
                            name="genre"
                            value={formData.genre}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="+250..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="pt-4">
                        <GradientButton onClick={handleSubmit} disabled={loading} className="w-full">
                            {loading ? 'Creating Account...' : 'Continue to Payment'}
                        </GradientButton>
                    </div>

                    <p className="text-center text-sm text-espresso/60 dark:text-white/60">
                        Already have an account? <Link to="/seeker/login" className="text-primary font-bold hover:underline">Login here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
