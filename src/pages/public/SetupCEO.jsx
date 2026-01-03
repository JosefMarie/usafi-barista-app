import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export function SetupCEO() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUpgrade = async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                role: 'ceo'
            });
            // Force reload to update auth state or just navigate
            // Since role is often part of auth state, we might need to rely on the app logic to refresh, but a navigation is a start
            await new Promise(resolve => setTimeout(resolve, 1000));
            window.location.href = '/ceo/dashboard';
        } catch (err) {
            console.error(err);
            setError('Failed to upgrade role.');
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-[#F5DEB3] dark:bg-[#1c1916] flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-espresso dark:text-white mb-4">Please log in first.</p>
                    <button onClick={() => navigate('/login')} className="px-6 py-2 bg-espresso text-white rounded-lg">Go to Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5DEB3] dark:bg-[#1c1916] flex items-center justify-center p-4">
            <div className="bg-white/50 dark:bg-black/20 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-espresso/10">
                <span className="material-symbols-outlined text-6xl text-[#D4Af37] mb-4">diamond</span>
                <h1 className="text-2xl font-serif font-black text-espresso dark:text-white mb-2">Executive Access</h1>
                <p className="text-espresso/70 dark:text-white/70 mb-6">
                    You are currently logged in as <strong>{user.email}</strong> ({user.role}).
                </p>
                <div className="bg-amber-100 text-amber-900 p-4 rounded-lg text-sm mb-6 text-left">
                    <strong>Warning:</strong> This will elevate your account to the <strong>CEO</strong> role. You will gain full access to the Executive Suite.
                </div>

                {error && <p className="text-red-500 mb-4 font-bold">{error}</p>}

                <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full py-4 bg-[#D4Af37] text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#b08d26] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'Confirm Promotion'}
                </button>
            </div>
        </div>
    );
}
