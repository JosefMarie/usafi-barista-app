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

            // Note: AuthContext might need a way to refresh the local user state if not using onSnapshot
            // However, StudentLayout seems to use onSnapshot for chats/notifications, but AuthContext 
            // uses onAuthStateChanged. onAuthStateChanged won't trigger on Firestore updates.
            // Let's assume the user will see the change on next load or we might need to reload.
            // In a better version, the AuthContext would listen to the user doc.
            window.location.reload(); // Simple way to refresh data for now
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

    const displayName = user?.name || user?.fullName || user?.email?.split('@')[0] || 'Student';
    // Use UI Avatars as fallback if no avatar provided
    const avatarUrl = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=128`;
    const studentId = user?.uid?.substring(0, 8).toUpperCase() || 'UNKNOWN';

    return (
        <div className="flex flex-col w-full max-w-md mx-auto pb-8 animate-fade-in">
            {/* TopAppBar */}
            <header className="sticky top-0 z-50 bg-gray-50/90 dark:bg-[#1c1916]/90 backdrop-blur-sm transition-colors duration-200">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => navigate('/student/dashboard')}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-espresso dark:text-white"
                    >
                        <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                    </button>
                    <h2 className="text-espresso dark:text-white text-lg font-bold leading-tight tracking-tight text-center flex-1">
                        Student Profile
                    </h2>
                    <button
                        onClick={handleEditClick}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <span className="text-primary text-base font-bold leading-normal tracking-wide">Edit</span>
                    </button>
                </div>
            </header>

            {/* ProfileHeader */}
            <section className="flex flex-col items-center pt-6 pb-8 px-6">
                <div
                    onClick={handleAvatarClick}
                    className="relative mb-5 group cursor-pointer"
                >
                    <div
                        className="w-32 h-32 rounded-full border-4 border-white dark:border-[#2c2825] shadow-lg bg-cover bg-center overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-white/5"
                        style={{ backgroundImage: uploading ? 'none' : `url('${avatarUrl}')` }}
                    >
                        {uploading && (
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        )}
                    </div>
                    {/* Camera Badge */}
                    <div className="absolute bottom-1 right-1 bg-primary text-white p-1.5 rounded-full shadow-md flex items-center justify-center border-2 border-gray-50 dark:border-[#1c1916]">
                        <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarUpload}
                        className="hidden"
                        accept="image/*"
                    />
                </div>
                <div className="flex flex-col items-center text-center space-y-1">
                    <h1 className="text-espresso dark:text-white text-2xl font-serif font-bold leading-tight">
                        {displayName}
                    </h1>
                    <p className="text-primary font-medium text-sm tracking-wide uppercase opacity-90">
                        Student ID: {studentId}
                    </p>
                    <div className="mt-2 px-3 py-1 bg-primary/10 dark:bg-primary/20 rounded-full">
                        <p className="text-primary text-xs font-bold tracking-wider uppercase">
                            {user?.role === 'student' ? 'Level 1 Certified' : user?.role || 'Student'}
                        </p>
                    </div>
                </div>
            </section>

            {/* Personal Information Section */}
            <section className="px-4 mb-6">
                <h3 className="text-espresso/70 dark:text-white/60 text-xs font-bold uppercase tracking-wider mb-2 ml-4">
                    Personal Information
                </h3>
                <div className="bg-white dark:bg-[#2c2825] rounded-xl overflow-hidden shadow-sm border border-black/5 dark:border-white/5">
                    {/* List Item: Email */}
                    <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group">
                        <div className="flex items-center justify-center rounded-lg bg-gray-50 dark:bg-white/10 shrink-0 w-10 h-10 text-primary">
                            <span className="material-symbols-outlined">mail</span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <p className="text-espresso dark:text-white text-sm font-medium leading-normal">Email</p>
                            <p className="text-espresso/60 dark:text-white/60 text-sm font-normal truncate">
                                {user?.email}
                            </p>
                        </div>
                        <div className="shrink-0 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                        </div>
                    </div>
                    <div className="h-px bg-black/5 dark:bg-white/5 mx-4"></div>

                    {/* List Item: Phone */}
                    <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group">
                        <div className="flex items-center justify-center rounded-lg bg-gray-50 dark:bg-white/10 shrink-0 w-10 h-10 text-primary">
                            <span className="material-symbols-outlined">call</span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <p className="text-espresso dark:text-white text-sm font-medium leading-normal">Phone Number</p>
                            <p className="text-espresso/60 dark:text-white/60 text-sm font-normal truncate">
                                {user?.phone || 'Not provided'}
                            </p>
                        </div>
                        <div className="shrink-0 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Account Settings Section */}
            <section className="px-4 mb-8">
                <h3 className="text-espresso/70 dark:text-white/60 text-xs font-bold uppercase tracking-wider mb-2 ml-4">
                    Account Settings
                </h3>
                <div className="bg-white dark:bg-[#2c2825] rounded-xl overflow-hidden shadow-sm border border-black/5 dark:border-white/5">
                    {/* Change Password */}
                    <div
                        onClick={() => setShowPasswordModal(true)}
                        className="flex items-center gap-4 px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer border-b border-black/5 dark:border-white/5"
                    >
                        <div className="flex items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 shrink-0 w-8 h-8 text-primary">
                            <span className="material-symbols-outlined text-[18px]">lock</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-espresso dark:text-white text-base font-normal">Change Password</p>
                        </div>
                        <div className="text-espresso/30 dark:text-white/30">
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </div>
                    </div>

                    {/* Privacy */}
                    <div
                        onClick={() => navigate('../privacy-settings')}
                        className="flex items-center gap-4 px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer border-b border-black/5 dark:border-white/5"
                    >
                        <div className="flex items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 shrink-0 w-8 h-8 text-primary">
                            <span className="material-symbols-outlined text-[18px]">shield</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-espresso dark:text-white text-base font-normal">Privacy & Permissions</p>
                        </div>
                        <div className="text-espresso/30 dark:text-white/30">
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div
                        onClick={() => navigate('/student/notifications')}
                        className="flex items-center gap-4 px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                        <div className="flex items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 shrink-0 w-8 h-8 text-primary">
                            <span className="material-symbols-outlined text-[18px]">notifications</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-espresso dark:text-white text-base font-normal">Notifications</p>
                        </div>
                        <div className="text-espresso/30 dark:text-white/30">
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Logout / Danger Zone */}
            <div className="px-4 mt-auto">
                <button
                    onClick={handleLogout}
                    className="w-full bg-white dark:bg-[#2c2825] text-[#D32F2F] font-medium py-3.5 rounded-xl shadow-sm border border-black/5 dark:border-white/5 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    Log Out
                </button>
                <p className="text-center text-espresso/40 dark:text-white/40 text-xs mt-4">
                    Version 2.4.1 (Build 203)
                </p>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white dark:bg-[#2c2825] rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
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
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#1c1916] text-espresso dark:text-white placeholder:text-espresso/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
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
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#1c1916] text-espresso dark:text-white placeholder:text-espresso/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
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
