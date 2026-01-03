import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export function PrivacySettings() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        profileVisibility: 'public', // public, private, connections
        showEmail: false,
        showPhone: false,
        allowMessages: true,
        allowNotifications: true,
        dataSharing: false,
        marketingEmails: false
    });

    useEffect(() => {
        loadSettings();
    }, [user]);

    const loadSettings = async () => {
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.privacySettings) {
                    setSettings({ ...settings, ...userData.privacySettings });
                }
            }
        } catch (error) {
            console.error('Error loading privacy settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                privacySettings: settings
            });
            alert('Privacy settings saved successfully!');
        } catch (error) {
            console.error('Error saving privacy settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-espresso/70 dark:text-white/70 hover:text-espresso font-black uppercase tracking-widest text-[10px] mb-6 group transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Back to Portal
                    </button>
                    <h1 className="text-4xl font-serif font-bold text-espresso dark:text-white mb-2">
                        Privacy & Permissions
                    </h1>
                    <p className="text-espresso/60 dark:text-white/60 font-medium">
                        Manage your digital presence and secure your platform interactions
                    </p>
                </div>

                {/* Profile Visibility */}
                <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl shadow-xl border border-espresso/10 p-8 mb-8 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    <h2 className="text-[10px] font-black text-espresso/50 dark:text-white/50 mb-6 uppercase tracking-[0.2em] relative z-10">Access & Identification</h2>

                    <div className="space-y-4">
                        <div className="relative z-10">
                            <label className="block text-[10px] font-black text-espresso/40 dark:text-white/40 mb-2 uppercase tracking-widest">
                                Global Visibility Threshold
                            </label>
                            <select
                                value={settings.profileVisibility}
                                onChange={e => setSettings({ ...settings, profileVisibility: e.target.value })}
                                className="w-full px-4 py-3.5 rounded-xl border border-espresso/10 bg-white/40 dark:bg-white/5 text-espresso dark:text-white focus:outline-none focus:ring-2 focus:ring-espresso transition-all font-bold text-sm"
                            >
                                <option value="public">Public - Worldwide Presence</option>
                                <option value="connections">Connections Only - Internal Network</option>
                                <option value="private">Private - Stealth Mode</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-5 bg-white/30 dark:bg-white/5 rounded-2xl border border-espresso/5 relative z-10">
                            <div>
                                <p className="font-bold text-espresso dark:text-white text-sm">Broadcast Email</p>
                                <p className="text-xs text-espresso/50 dark:text-white/50">Allow network to view your contact path</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.showEmail}
                                    onChange={e => setSettings({ ...settings, showEmail: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-12 h-6 bg-espresso/10 border border-espresso/10 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-espresso"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-5 bg-white/30 dark:bg-white/5 rounded-2xl border border-espresso/5 relative z-10">
                            <div>
                                <p className="font-bold text-espresso dark:text-white text-sm">Show Mobile Link</p>
                                <p className="text-xs text-espresso/50 dark:text-white/50">Enable direct phone communication</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.showPhone}
                                    onChange={e => setSettings({ ...settings, showPhone: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-12 h-6 bg-espresso/10 border border-espresso/10 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-espresso"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Communication Preferences */}
                <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl shadow-xl border border-espresso/10 p-8 mb-8 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    <h2 className="text-[10px] font-black text-espresso/50 dark:text-white/50 mb-6 uppercase tracking-[0.2em] relative z-10">Communication Channels</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <div>
                                <p className="font-medium text-espresso dark:text-white">Allow Messages</p>
                                <p className="text-sm text-espresso/60 dark:text-white/60">Receive messages from other users</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.allowMessages}
                                    onChange={e => setSettings({ ...settings, allowMessages: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <div>
                                <p className="font-medium text-espresso dark:text-white">Push Notifications</p>
                                <p className="text-sm text-espresso/60 dark:text-white/60">Receive notifications about updates</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.allowNotifications}
                                    onChange={e => setSettings({ ...settings, allowNotifications: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <div>
                                <p className="font-medium text-espresso dark:text-white">Marketing Emails</p>
                                <p className="text-sm text-espresso/60 dark:text-white/60">Receive promotional emails and updates</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.marketingEmails}
                                    onChange={e => setSettings({ ...settings, marketingEmails: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Data & Privacy */}
                <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl shadow-xl border border-espresso/10 p-8 mb-8 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    <h2 className="text-[10px] font-black text-espresso/50 dark:text-white/50 mb-6 uppercase tracking-[0.2em] relative z-10">Data Integrity & Trust</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <div>
                                <p className="font-medium text-espresso dark:text-white">Data Sharing</p>
                                <p className="text-sm text-espresso/60 dark:text-white/60">Share anonymized data for platform improvement</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.dataSharing}
                                    onChange={e => setSettings({ ...settings, dataSharing: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
                                <div>
                                    <p className="font-medium text-blue-900 dark:text-blue-100 text-sm mb-1">Your Privacy Matters</p>
                                    <p className="text-blue-800 dark:text-blue-200 text-xs">
                                        We never sell your personal data. Read our <button onClick={() => navigate('/privacy-policy')} className="underline font-bold">Privacy Policy</button> to learn more about how we protect your information.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex-1 py-4 rounded-2xl border border-espresso/10 text-espresso dark:text-white font-black uppercase tracking-widest text-xs hover:bg-white/40 dark:hover:bg-white/5 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-4 rounded-2xl bg-espresso text-white font-black uppercase tracking-widest text-xs hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                    >
                        {saving ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">save</span>
                                Save Permissions
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
