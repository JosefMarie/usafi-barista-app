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
        <div className="flex-1 flex flex-col h-full overflow-y-auto w-full max-w-5xl mx-auto pb-12 animate-fade-in px-4 custom-scrollbar">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-espresso dark:text-white leading-tight">
                        {roleLabel} Profile
                    </h2>
                    <p className="text-espresso/60 dark:text-white/60 text-sm font-medium uppercase tracking-wide mt-1">
                        Securely manage your personal account & settings
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Avatar and Quick Info */}
                <div className="lg:col-span-4 flex flex-col items-center">
                    <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-3xl p-10 shadow-xl border border-primary/20 w-full flex flex-col items-center relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/30 group-hover:bg-espresso transition-colors"></div>

                        <div
                            onClick={handleAvatarClick}
                            className="relative mb-8 group/avatar cursor-pointer"
                        >
                            <div
                                className="w-44 h-44 rounded-full border-4 border-white dark:border-[#2c2825] shadow-2xl bg-cover bg-center overflow-hidden flex items-center justify-center bg-white/50 backdrop-blur-sm transition-transform duration-500 group-hover/avatar:scale-105"
                                style={{ backgroundImage: uploading ? 'none' : `url('${avatarUrl}')` }}
                            >
                                {uploading && (
                                    <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-primary"></div>
                                )}
                            </div>
                            <div className="absolute bottom-2 right-2 bg-espresso text-white p-3 rounded-full shadow-lg flex items-center justify-center border-4 border-[#F5DEB3] dark:border-[#1c1916] group-hover/avatar:scale-110 transition-transform">
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

                        <h1 className="text-2xl font-bold text-espresso dark:text-white text-center mb-1 font-serif">
                            {displayName}
                        </h1>
                        <p className="text-espresso/60 font-black text-[10px] tracking-[0.2em] uppercase mb-6 bg-white/30 px-4 py-1.5 rounded-full border border-white/20">
                            {idLabel}: {userId}
                        </p>

                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/40 text-red-600 border border-red-200/50 hover:bg-red-50 hover:border-red-300 transition-all font-bold text-xs uppercase tracking-widest shadow-sm active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                Sign Out Account
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings and Info */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Personal Info Card */}
                    <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-3xl shadow-xl border border-primary/20 overflow-hidden relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/30 group-hover:bg-espresso transition-colors"></div>
                        <div className="px-8 py-5 border-b border-espresso/10 flex items-center justify-between bg-white/20">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-espresso/60">badge</span>
                                <h3 className="font-bold text-espresso dark:text-white uppercase tracking-widest text-xs">Identity Profile</h3>
                            </div>
                            <button
                                onClick={handleEditClick}
                                className="h-10 px-6 rounded-xl bg-espresso text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
                            >
                                Edit Info
                            </button>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-1.5">
                                <p className="text-[10px] text-espresso/40 dark:text-white/50 font-black uppercase tracking-[0.2em]">Full Name</p>
                                <p className="text-espresso dark:text-white font-bold text-lg">{displayName}</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] text-espresso/40 dark:text-white/50 font-black uppercase tracking-[0.2em]">Email Address</p>
                                <p className="text-espresso dark:text-white font-bold text-lg">{user?.email}</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] text-espresso/40 dark:text-white/50 font-black uppercase tracking-[0.2em]">Phone Number</p>
                                <p className="text-espresso dark:text-white font-bold text-lg">{user?.phone || 'Not provided'}</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] text-espresso/40 dark:text-white/50 font-black uppercase tracking-[0.2em]">Live Location</p>
                                <p className="text-espresso dark:text-white font-bold text-lg">{user?.location || 'Not set'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Account Settings Card */}
                    <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-3xl shadow-xl border border-primary/20 overflow-hidden relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/30 group-hover:bg-espresso transition-colors"></div>
                        <div className="px-8 py-5 border-b border-espresso/10 bg-white/20">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-espresso/60">settings</span>
                                <h3 className="font-bold text-espresso dark:text-white uppercase tracking-widest text-xs">Security & Utility</h3>
                            </div>
                        </div>
                        <div className="divide-y divide-espresso/10 relative z-10">
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="w-full flex items-center justify-between px-8 py-6 hover:bg-white/30 dark:hover:bg-white/5 transition-all group/item"
                            >
                                <div className="flex items-center gap-5 text-left">
                                    <div className="w-12 h-12 rounded-2xl bg-espresso text-white flex items-center justify-center group-hover/item:scale-110 transition-transform shadow-md">
                                        <span className="material-symbols-outlined">lock</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-espresso dark:text-white text-[11px] uppercase tracking-widest leading-none mb-1">Update Password</p>
                                        <p className="text-espresso/50 dark:text-white/50 text-xs font-medium">Reset your secure access key</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-espresso/30 group-hover/item:translate-x-2 transition-transform">arrow_forward</span>
                            </button>

                            <button
                                onClick={() => navigate('../privacy-settings')}
                                className="w-full flex items-center justify-between px-8 py-6 hover:bg-white/30 dark:hover:bg-white/5 transition-all group/item"
                            >
                                <div className="flex items-center gap-5 text-left">
                                    <div className="w-12 h-12 rounded-2xl bg-white/50 text-espresso flex items-center justify-center group-hover/item:scale-110 transition-transform shadow-sm border border-white/20">
                                        <span className="material-symbols-outlined font-bold">shield_person</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-espresso dark:text-white text-[11px] uppercase tracking-widest leading-none mb-1">Privacy Permissions</p>
                                        <p className="text-espresso/50 dark:text-white/50 text-xs font-medium">Control your digital visibility</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-espresso/30 group-hover/item:translate-x-2 transition-transform">arrow_forward</span>
                            </button>

                            <button className="w-full flex items-center justify-between px-8 py-6 hover:bg-white/30 dark:hover:bg-white/5 transition-all group/item">
                                <div className="flex items-center gap-5 text-left">
                                    <div className="w-12 h-12 rounded-2xl bg-white/50 text-espresso flex items-center justify-center group-hover/item:scale-110 transition-transform shadow-sm border border-white/20">
                                        <span className="material-symbols-outlined font-bold">notifications_active</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-espresso dark:text-white text-[11px] uppercase tracking-widest leading-none mb-1">Global Alerts</p>
                                        <p className="text-espresso/50 dark:text-white/50 text-xs font-medium">Set your communication flow</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-espresso/30 group-hover/item:translate-x-2 transition-transform">arrow_forward</span>
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
