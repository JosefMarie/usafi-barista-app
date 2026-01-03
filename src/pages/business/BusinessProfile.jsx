import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { storage, db } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';

export function BusinessProfile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [displayUser, setDisplayUser] = useState(null);
    const [editData, setEditData] = useState({
        phone: '',
        location: '',
        companyName: '',
        position: ''
    });
    const [saving, setSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        if (user) {
            // Fetch latest user data to get company fields if they exist
            getDoc(doc(db, 'users', user.uid)).then(snap => {
                if (snap.exists()) {
                    setDisplayUser({ ...user, ...snap.data() });
                } else {
                    setDisplayUser(user);
                }
            });
        }
    }, [user]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleEditClick = () => {
        setEditData({
            phone: displayUser?.phone || '',
            location: displayUser?.location || '',
            companyName: displayUser?.companyName || '',
            position: displayUser?.position || ''
        });
        setShowEditModal(true);
    };

    const handleSaveInfo = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            const updates = {
                phone: editData.phone,
                location: editData.location,
                companyName: editData.companyName,
                position: editData.position,
                updatedAt: new Date()
            };
            await updateDoc(userRef, updates);

            setDisplayUser(prev => ({ ...prev, ...updates }));
            setShowEditModal(false);
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

            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                avatar: downloadURL
            });

            setDisplayUser(prev => ({ ...prev, avatar: downloadURL }));
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
            navigate('/business/login');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    if (!user) {
        return <Navigate to="/business/login" replace />;
    }

    // Role check - allow admin too for debugging, or just business_student
    if (user.role !== 'business_student' && user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    const displayName = displayUser?.name || displayUser?.fullName || displayUser?.email?.split('@')[0] || 'Business Student';
    const avatarUrl = displayUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=128`;
    const userId = user?.uid?.substring(0, 8).toUpperCase() || 'UNKNOWN';

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            <div className="flex flex-col w-full max-w-5xl mx-auto pb-12 animate-fade-in px-4">
                {/* TopAppBar */}
                <header className="sticky top-0 z-50 bg-[#F5DEB3]/90 dark:bg-[#1c1916]/90 backdrop-blur-md transition-colors duration-200 rounded-b-[2.5rem] shadow-lg mb-12 border-b border-espresso/10">
                    <div className="flex items-center justify-between px-8 py-6">
                        <button
                            onClick={() => navigate('/business/dashboard')}
                            className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/40 hover:bg-white/60 transition-all text-espresso shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                        </button>
                        <h2 className="text-espresso dark:text-white text-2xl font-serif font-black uppercase tracking-widest leading-tight text-center flex-1">
                            Business Profile
                        </h2>
                        <button
                            onClick={handleEditClick}
                            className="flex items-center justify-center h-12 px-8 rounded-2xl bg-espresso text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                        >
                            Edit
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column: Avatar and Quick Info */}
                    <div className="lg:col-span-4 flex flex-col items-center">
                        <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2.5rem] p-10 shadow-xl border border-espresso/10 w-full flex flex-col items-center relative overflow-hidden group">
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
                                        <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-espresso"></div>
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
                            <p className="text-espresso/60 font-black text-[10px] tracking-[0.2em] uppercase mb-4 bg-white/30 px-4 py-1.5 rounded-full border border-white/20">
                                Global ID: {userId}
                            </p>

                            <div className="px-5 py-2 bg-espresso text-white rounded-full mb-8 shadow-md border border-white/10">
                                <p className="text-[10px] font-black tracking-[0.2em] uppercase">
                                    Business Student
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/40 text-espresso border border-espresso/10 hover:bg-white/60 transition-all font-bold text-xs uppercase tracking-widest shadow-sm active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Key Details */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Company Card */}
                        <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2.5rem] shadow-xl border border-espresso/10 overflow-hidden relative group">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/30 group-hover:bg-espresso transition-colors"></div>
                            <div className="px-8 py-5 border-b border-espresso/10 flex items-center justify-between bg-white/20">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-espresso/60">domain</span>
                                    <h3 className="font-bold text-espresso dark:text-white uppercase tracking-widest text-xs">Organization</h3>
                                </div>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] text-espresso/40 dark:text-white/50 font-black uppercase tracking-[0.2em]">Company / Brand</p>
                                    <p className="text-espresso dark:text-white font-bold text-lg">{displayUser?.companyName || 'Not Listed'}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] text-espresso/40 dark:text-white/50 font-black uppercase tracking-[0.2em]">Your Position</p>
                                    <p className="text-espresso dark:text-white font-bold text-lg">{displayUser?.position || 'Not Listed'}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] text-espresso/40 dark:text-white/50 font-black uppercase tracking-[0.2em]">Work Email</p>
                                    <p className="text-espresso dark:text-white font-bold text-lg">{displayUser?.email}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] text-espresso/40 dark:text-white/50 font-black uppercase tracking-[0.2em]">Contact Phone</p>
                                    <p className="text-espresso dark:text-white font-bold text-lg">{displayUser?.phone || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Security Card */}
                        <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2.5rem] shadow-xl border border-espresso/10 overflow-hidden relative group">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/30 group-hover:bg-espresso transition-colors"></div>
                            <div className="px-8 py-5 border-b border-espresso/10 bg-white/20">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-espresso/60">admin_panel_settings</span>
                                    <h3 className="font-bold text-espresso dark:text-white uppercase tracking-widest text-xs">Account Security</h3>
                                </div>
                            </div>
                            <div className="divide-y divide-espresso/10 relative z-10">
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="w-full flex items-center justify-between px-8 py-6 hover:bg-white/30 dark:hover:bg-white/5 transition-all group/item"
                                >
                                    <div className="flex items-center gap-5 text-left">
                                        <div className="w-12 h-12 rounded-2xl bg-espresso text-white flex items-center justify-center group-hover/item:scale-110 transition-transform shadow-md">
                                            <span className="material-symbols-outlined">lock_reset</span>
                                        </div>
                                        <div>
                                            <p className="font-black text-espresso dark:text-white text-[11px] uppercase tracking-widest leading-none mb-1">Update Password</p>
                                            <p className="text-espresso/50 dark:text-white/50 text-xs font-medium">Reset your secure access key</p>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowEditModal(false)}>
                        <div className="bg-[#FAF5E8] dark:bg-[#1e1e1e] rounded-[2rem] p-8 w-full max-w-lg shadow-2xl border border-espresso/10" onClick={e => e.stopPropagation()}>
                            <h3 className="text-2xl font-serif font-bold text-espresso dark:text-white mb-8 border-b border-espresso/10 pb-4">
                                Edit Business Profile
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-espresso/60 dark:text-white/60 mb-2 uppercase tracking-wide">
                                        Company / Organization
                                    </label>
                                    <input
                                        type="text"
                                        value={editData.companyName}
                                        onChange={e => setEditData({ ...editData, companyName: e.target.value })}
                                        placeholder="Company Name"
                                        className="w-full px-5 py-3 rounded-xl border border-espresso/10 bg-white/50 dark:bg-white/5 text-espresso dark:text-white placeholder:text-espresso/30 focus:outline-none focus:ring-2 focus:ring-espresso focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-espresso/60 dark:text-white/60 mb-2 uppercase tracking-wide">
                                        Your Position
                                    </label>
                                    <input
                                        type="text"
                                        value={editData.position}
                                        onChange={e => setEditData({ ...editData, position: e.target.value })}
                                        placeholder="Job Title"
                                        className="w-full px-5 py-3 rounded-xl border border-espresso/10 bg-white/50 dark:bg-white/5 text-espresso dark:text-white placeholder:text-espresso/30 focus:outline-none focus:ring-2 focus:ring-espresso focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-espresso/60 dark:text-white/60 mb-2 uppercase tracking-wide">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={editData.phone}
                                        onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                        className="w-full px-5 py-3 rounded-xl border border-espresso/10 bg-white/50 dark:bg-white/5 text-espresso dark:text-white placeholder:text-espresso/30 focus:outline-none focus:ring-2 focus:ring-espresso focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-espresso/60 dark:text-white/60 mb-2 uppercase tracking-wide">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={editData.location}
                                        onChange={e => setEditData({ ...editData, location: e.target.value })}
                                        className="w-full px-5 py-3 rounded-xl border border-espresso/10 bg-white/50 dark:bg-white/5 text-espresso dark:text-white placeholder:text-espresso/30 focus:outline-none focus:ring-2 focus:ring-espresso focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-3.5 rounded-xl border border-espresso/10 text-espresso dark:text-white font-bold uppercase tracking-wide hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveInfo}
                                    disabled={saving}
                                    className="flex-1 py-3.5 rounded-xl bg-espresso text-white font-bold uppercase tracking-wide hover:bg-espresso/90 transition-all shadow-lg hover:shadow-xl text-xs disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <ChangePasswordModal
                    isOpen={showPasswordModal}
                    onClose={() => setShowPasswordModal(false)}
                />
            </div>
        </div>
    );
}
