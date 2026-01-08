import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { storage, db } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';
import { useTranslation } from 'react-i18next';

export function Profile() {
    const { t } = useTranslation();
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
            alert(t('profile.fail_update'));
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
            alert(t('profile.fail_avatar'));
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
    const roleKey = user?.role || 'user';
    const idLabel = user?.role === 'student' ? t('profile.id_student') : t('profile.id_staff');

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto w-full max-w-5xl mx-auto pb-12 animate-fade-in px-4 custom-scrollbar">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8 md:mb-10">
                <div>
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-espresso dark:text-white leading-tight">
                        {t('profile.title')}
                    </h2>
                    <p className="text-espresso/60 dark:text-white/60 text-sm font-medium uppercase tracking-wide mt-1">
                        {t('profile.subtitle')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
                {/* Left Column: Avatar and Quick Info */}
                <div className="lg:col-span-4 flex flex-col items-center">
                    <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-xl border border-primary/20 w-full flex flex-col items-center relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/30 group-hover:bg-espresso transition-colors"></div>

                        <div
                            onClick={handleAvatarClick}
                            className="relative mb-6 md:mb-8 group/avatar cursor-pointer"
                        >
                            <div
                                className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white dark:border-[#2c2825] shadow-2xl bg-cover bg-center overflow-hidden flex items-center justify-center bg-white/50 backdrop-blur-sm transition-transform duration-500 group-hover/avatar:scale-105"
                                style={{ backgroundImage: uploading ? 'none' : `url('${avatarUrl}')` }}
                            >
                                {uploading && (
                                    <div className="animate-spin rounded-full h-12 w-12 md:h-14 md:w-14 border-b-2 border-primary"></div>
                                )}
                            </div>
                            <div className="absolute bottom-1.5 right-1.5 md:bottom-2 md:right-2 bg-espresso text-white p-2.5 md:p-3 rounded-full shadow-lg flex items-center justify-center border-4 border-[#F5DEB3] dark:border-[#1c1916] group-hover/avatar:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[18px] md:text-[20px]">photo_camera</span>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        <h1 className="text-xl md:text-2xl font-bold text-espresso dark:text-white text-center mb-1 font-serif">
                            {displayName}
                        </h1>
                        <p className="text-espresso/60 font-black text-[10px] tracking-[0.2em] uppercase mb-4 md:mb-6 bg-white/30 px-3 md:px-4 py-1.5 rounded-full border border-white/20">
                            {idLabel.replace('{{id}}', userId)}
                        </p>

                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 px-5 md:px-6 py-3 md:py-3.5 rounded-xl md:rounded-2xl bg-white/40 text-red-600 border border-red-200/50 hover:bg-red-50 hover:border-red-300 transition-all font-bold text-xs uppercase tracking-widest shadow-sm active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                {t('profile.sign_out')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings and Info */}
                <div className="lg:col-span-8 space-y-6 md:space-y-8">
                    {/* Personal Info Card */}
                    <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-2xl md:rounded-3xl shadow-xl border border-primary/20 overflow-hidden relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/30 group-hover:bg-espresso transition-colors"></div>
                        <div className="px-5 md:px-8 py-4 md:py-5 border-b border-espresso/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/20">
                            <div className="flex items-center gap-2 md:gap-3">
                                <span className="material-symbols-outlined text-espresso/60 text-xl md:text-2xl">badge</span>
                                <h3 className="font-bold text-espresso dark:text-white uppercase tracking-widest text-xs">{t('profile.identity')}</h3>
                            </div>
                            <button
                                onClick={handleEditClick}
                                className="h-9 md:h-10 px-4 md:px-6 rounded-xl bg-espresso text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 w-full sm:w-auto"
                            >
                                {t('profile.edit_info')}
                            </button>
                        </div>
                        <div className="p-5 md:p-8 grid grid-cols-1 gap-6 md:gap-8 relative z-10">
                            <div className="space-y-1.5">
                                <p className="text-[10px] text-espresso/40 dark:text-white/50 font-black uppercase tracking-[0.2em]">{t('profile.full_name')}</p>
                                <p className="text-espresso dark:text-white font-bold text-base md:text-lg">{displayName}</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] text-espresso/40 dark:text-white/50 font-black uppercase tracking-[0.2em]">{t('profile.email')}</p>
                                <p className="text-espresso dark:text-white font-bold text-base md:text-lg break-all">{user?.email}</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] text-espresso/40 dark:text-white/50 font-black uppercase tracking-[0.2em]">{t('profile.phone')}</p>
                                <p className="text-espresso dark:text-white font-bold text-base md:text-lg">{user?.phone || t('profile.not_provided')}</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] text-espresso/40 dark:text-white/50 font-black uppercase tracking-[0.2em]">{t('profile.location')}</p>
                                <p className="text-espresso dark:text-white font-bold text-base md:text-lg">{user?.location || t('profile.not_set')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Account Settings Card */}
                    <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-2xl md:rounded-3xl shadow-xl border border-primary/20 overflow-hidden relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/30 group-hover:bg-espresso transition-colors"></div>
                        <div className="px-5 md:px-8 py-4 md:py-5 border-b border-espresso/10 bg-white/20">
                            <div className="flex items-center gap-2 md:gap-3">
                                <span className="material-symbols-outlined text-espresso/60 text-xl md:text-2xl">settings</span>
                                <h3 className="font-bold text-espresso dark:text-white uppercase tracking-widest text-xs">{t('profile.security')}</h3>
                            </div>
                        </div>
                        <div className="divide-y divide-espresso/10 relative z-10">
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="w-full flex items-center justify-between px-5 md:px-8 py-5 md:py-6 hover:bg-white/30 dark:hover:bg-white/5 transition-all group/item"
                            >
                                <div className="flex items-center gap-4 md:gap-5 text-left">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-espresso text-white flex items-center justify-center group-hover/item:scale-110 transition-transform shadow-md shrink-0">
                                        <span className="material-symbols-outlined text-xl md:text-2xl">lock</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-espresso dark:text-white text-[11px] uppercase tracking-widest leading-none mb-1">{t('profile.update_password')}</p>
                                        <p className="text-espresso/50 dark:text-white/50 text-xs font-medium">{t('profile.update_password_desc')}</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-espresso/30 group-hover/item:translate-x-2 transition-transform">arrow_forward</span>
                            </button>

                            <button
                                onClick={() => navigate('../privacy-settings')}
                                className="w-full flex items-center justify-between px-5 md:px-8 py-5 md:py-6 hover:bg-white/30 dark:hover:bg-white/5 transition-all group/item"
                            >
                                <div className="flex items-center gap-4 md:gap-5 text-left">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/50 text-espresso flex items-center justify-center group-hover/item:scale-110 transition-transform shadow-sm border border-white/20 shrink-0">
                                        <span className="material-symbols-outlined font-bold text-xl md:text-2xl">shield_person</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-espresso dark:text-white text-[11px] uppercase tracking-widest leading-none mb-1">{t('profile.privacy')}</p>
                                        <p className="text-espresso/50 dark:text-white/50 text-xs font-medium">{t('profile.digital_vis')}</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-espresso/30 group-hover/item:translate-x-2 transition-transform">arrow_forward</span>
                            </button>

                            <button className="w-full flex items-center justify-between px-5 md:px-8 py-5 md:py-6 hover:bg-white/30 dark:hover:bg-white/5 transition-all group/item">
                                <div className="flex items-center gap-4 md:gap-5 text-left">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/50 text-espresso flex items-center justify-center group-hover/item:scale-110 transition-transform shadow-sm border border-white/20 shrink-0">
                                        <span className="material-symbols-outlined font-bold text-xl md:text-2xl">notifications_active</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-espresso dark:text-white text-[11px] uppercase tracking-widest leading-none mb-1">{t('profile.alerts')}</p>
                                        <p className="text-espresso/50 dark:text-white/50 text-xs font-medium">{t('profile.comm_flow')}</p>
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
                            {t('profile.edit_title')}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-2">
                                    {t('profile.phone')}
                                </label>
                                <input
                                    type="tel"
                                    value={editData.phone}
                                    onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                    placeholder="+250 712 345 678"
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white placeholder:text-espresso/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-2">
                                    {t('profile.location')}
                                </label>
                                <input
                                    type="text"
                                    value={editData.location}
                                    onChange={e => setEditData({ ...editData, location: e.target.value })}
                                    placeholder="Kigali, Rwanda"
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
                                {t('profile.cancel')}
                            </button>
                            <button
                                onClick={handleSaveInfo}
                                disabled={saving}
                                className="flex-1 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {saving ? t('profile.saving') : t('profile.save')}
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
