import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { storage, db } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';

export function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({
        phone: '',
        location: ''
    });
    const [saving, setSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleEditClick = () => {
        setEditData({
            phone: user?.phone || '',
            location: user?.location || ''
        });
        setShowEditModal(true);
    };

    const handleSaveInfo = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                phone: editData.phone,
                location: editData.location
            });

            setShowEditModal(false);
            window.location.reload();
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile information.");
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !user) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Update Firestore
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                avatar: downloadURL
            });

            // Refresh to show update if not using real-time listener for Auth
            window.location.reload();
        } catch (error) {
            console.error("Error uploading avatar:", error);
            alert("Failed to update profile picture.");
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const displayName = user?.name || user?.fullName || user?.email?.split('@')[0] || 'User';
    const avatarUrl = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=128`;
    const userId = user?.uid?.substring(0, 8).toUpperCase() || 'UNKNOWN';

    // Role based labels
    const roleLabel = user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User';
    const idLabel = user?.role === 'student' ? 'Student ID' : 'Staff ID';

    return (
        <div className="flex flex-col w-full max-w-4xl mx-auto pb-8 animate-fade-in">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-espresso dark:text-white">
                        {roleLabel} Profile
                    </h2>
                    <p className="text-espresso/60 dark:text-white/60 text-sm">
                        Manage your personal information and account settings
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Avatar and Quick Info */}
                <div className="lg:col-span-1 flex flex-col items-center">
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-8 shadow-sm border border-black/5 dark:border-white/5 w-full flex flex-col items-center">
                        <div
                            onClick={handleAvatarClick}
                            className="relative mb-6 group cursor-pointer"
                        >
                            <div
                                className="w-40 h-40 rounded-full border-4 border-primary/10 shadow-lg bg-cover bg-center overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-white/5"
                                style={{ backgroundImage: uploading ? 'none' : `url('${avatarUrl}')` }}
                            >
                                {uploading && (
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                )}
                            </div>
                            <div className="absolute bottom-2 right-2 bg-primary text-white p-2.5 rounded-full shadow-md flex items-center justify-center border-4 border-white dark:border-[#1e1e1e] group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        <h1 className="text-2xl font-bold text-espresso dark:text-white text-center mb-1">
                            {displayName}
                        </h1>
                        <p className="text-primary font-bold text-sm tracking-wider uppercase mb-4">
                            {idLabel}: {userId}
                        </p>

                        <div className="px-4 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-full mb-6">
                            <p className="text-primary text-xs font-bold tracking-widest uppercase">
                                {roleLabel}
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/10 transition-colors font-medium text-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Right Column: Settings and Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Personal Info Card */}
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                            <h3 className="font-bold text-espresso dark:text-white">Personal Information</h3>
                            <button
                                onClick={handleEditClick}
                                className="text-primary text-sm font-bold hover:underline"
                            >
                                Edit
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-espresso/50 dark:text-white/50 font-bold uppercase tracking-wider">Full Name</p>
                                <p className="text-espresso dark:text-white font-medium">{displayName}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-espresso/50 dark:text-white/50 font-bold uppercase tracking-wider">Email Address</p>
                                <p className="text-espresso dark:text-white font-medium">{user?.email}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-espresso/50 dark:text-white/50 font-bold uppercase tracking-wider">Phone Number</p>
                                <p className="text-espresso dark:text-white font-medium">{user?.phone || 'Not provided'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-espresso/50 dark:text-white/50 font-bold uppercase tracking-wider">Location</p>
                                <p className="text-espresso dark:text-white font-medium">{user?.location || 'Not set'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Account Settings Card */}
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-black/5 dark:border-white/5">
                            <h3 className="font-bold text-espresso dark:text-white">Account Settings</h3>
                        </div>
                        <div className="divide-y divide-black/5 dark:divide-white/5">
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                            >
                                <div className="flex items-center gap-4 text-left">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">lock</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-espresso dark:text-white text-sm">Change Password</p>
                                        <p className="text-espresso/50 dark:text-white/50 text-xs">Update your account security</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-espresso/30 group-hover:translate-x-1 transition-transform">chevron_right</span>
                            </button>

                            <button
                                onClick={() => navigate('../privacy-settings')}
                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                            >
                                <div className="flex items-center gap-4 text-left">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">shield_person</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-espresso dark:text-white text-sm">Privacy Settings</p>
                                        <p className="text-espresso/50 dark:text-white/50 text-xs">Manage your visibility and data</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-espresso/30 group-hover:translate-x-1 transition-transform">chevron_right</span>
                            </button>

                            <button className="w-full flex items-center justify-between px-6 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-center gap-4 text-left">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">notifications_active</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-espresso dark:text-white text-sm">Notifications</p>
                                        <p className="text-espresso/50 dark:text-white/50 text-xs">Manage how you receive updates</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-espresso/30 group-hover:translate-x-1 transition-transform">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-espresso dark:text-white mb-6">
                            Edit Personal Information
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={editData.phone}
                                    onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                    placeholder="e.g., +250 712 345 678"
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white placeholder:text-espresso/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={editData.location}
                                    onChange={e => setEditData({ ...editData, location: e.target.value })}
                                    placeholder="e.g., Kigali, Rwanda"
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white placeholder:text-espresso/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 py-3 rounded-full border border-black/10 dark:border-white/10 text-espresso dark:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveInfo}
                                disabled={saving}
                                className="flex-1 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </div>
    );
}
