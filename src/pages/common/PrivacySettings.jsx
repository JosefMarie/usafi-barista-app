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
                        className="flex items-center gap-2 text-espresso/70 dark:text-white/70 hover:text-primary mb-4"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back
                    </button>
                    <h1 className="text-3xl font-serif font-bold text-espresso dark:text-white mb-2">
                        Privacy & Permissions
                    </h1>
                    <p className="text-espresso/60 dark:text-white/60">
                        Manage your privacy settings and control how your information is shared
                    </p>
                </div>

                {/* Profile Visibility */}
                <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-black/5 dark:border-white/5 p-6 mb-6">
                    <h2 className="text-xl font-bold text-espresso dark:text-white mb-4">Profile Visibility</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-espresso dark:text-white mb-2">
                                Who can see your profile?
                            </label>
                            <select
                                value={settings.profileVisibility}
                                onChange={e => setSettings({ ...settings, profileVisibility: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="public">Public - Anyone can see</option>
                                <option value="connections">Connections Only - Only people you know</option>
                                <option value="private">Private - Only you</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <div>
                                <p className="font-medium text-espresso dark:text-white">Show Email Address</p>
                                <p className="text-sm text-espresso/60 dark:text-white/60">Allow others to see your email</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.showEmail}
                                    onChange={e => setSettings({ ...settings, showEmail: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <div>
                                <p className="font-medium text-espresso dark:text-white">Show Phone Number</p>
                                <p className="text-sm text-espresso/60 dark:text-white/60">Allow others to see your phone</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.showPhone}
                                    onChange={e => setSettings({ ...settings, showPhone: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Communication Preferences */}
                <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-black/5 dark:border-white/5 p-6 mb-6">
                    <h2 className="text-xl font-bold text-espresso dark:text-white mb-4">Communication</h2>

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
                <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-black/5 dark:border-white/5 p-6 mb-6">
                    <h2 className="text-xl font-bold text-espresso dark:text-white mb-4">Data & Privacy</h2>

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
                        className="flex-1 py-3 rounded-full border border-black/10 dark:border-white/10 text-espresso dark:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">save</span>
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
