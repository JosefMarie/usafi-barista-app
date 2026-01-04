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

    const displayName = user?.name || user?.fullName || user?.email?.split('@')[0] || 'Student';
    const avatarUrl = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=128`;
    const studentId = user?.uid?.substring(0, 8).toUpperCase() || 'UNKNOWN';

    const getRoleBadge = () => {
        if (user?.role === 'student') return t('profile.role_student');
        return user?.role || t('profile.role_executive');
    };

    return (
        <div className="flex flex-col w-full pb-16 animate-fade-in px-4">
            {/* TopAppBar - Enhanced for Wheat Theme */}
            <header className="sticky top-0 z-50 bg-[#F5DEB3]/90 dark:bg-[#1c1916]/90 backdrop-blur-md transition-colors duration-200 rounded-b-3xl shadow-sm mb-12 border-b border-espresso/10">
                <div className="flex items-center justify-between px-8 py-5">
                    <button
                        onClick={() => navigate('/student/dashboard')}
                        className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/40 hover:bg-white transition-all text-espresso shadow-sm active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                    </button>
                    <h2 className="text-espresso dark:text-white text-2xl font-serif font-black uppercase tracking-[0.2em] leading-tight text-center flex-1">
                        {t('profile.title')}
                    </h2>
                    <button
                        onClick={handleEditClick}
                        className="flex items-center justify-center h-12 px-8 rounded-2xl bg-espresso text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-espresso/40 hover:-translate-y-0.5 active:scale-95 transition-all"
                    >
                        {t('profile.edit_info')}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Avatar and Quick Info */}
                <div className="lg:col-span-4 flex flex-col items-center">
                    <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2.5rem] p-12 shadow-2xl border border-espresso/10 w-full flex flex-col items-center relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>

                        <div
                            onClick={handleAvatarClick}
                            className="relative mb-8 group/avatar cursor-pointer"
                        >
                            <div
                                className="w-48 h-48 rounded-3xl border-4 border-white dark:border-[#2c2825] shadow-2xl bg-cover bg-center overflow-hidden flex items-center justify-center bg-white/50 backdrop-blur-sm transition-all duration-700 group-hover/avatar:scale-105 group-hover/avatar:rotate-2"
                                style={{ backgroundImage: uploading ? 'none' : `url('${avatarUrl}')` }}
                            >
                                {uploading && (
                                    <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-espresso"></div>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-espresso text-white p-4 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-[#F5DEB3] dark:border-[#1c1916] group-hover/avatar:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        <h1 className="text-3xl font-serif font-bold text-espresso dark:text-white text-center mb-1">
                            {displayName}
                        </h1>
                        <p className="text-espresso/40 dark:text-white/40 font-black text-[10px] tracking-[0.2em] uppercase mb-6 bg-white/30 dark:bg-black/20 px-4 py-2 rounded-full border border-white/20">
                            {t('profile.id_student', { id: studentId })}
                        </p>

                        <div className="px-6 py-2 bg-espresso text-white rounded-2xl mb-10 shadow-xl border border-white/10">
                            <p className="text-[10px] font-black tracking-[0.3em] uppercase">
                                {getRoleBadge()}
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/40 text-red-600 border border-red-200/50 hover:bg-red-50 hover:border-red-300 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            {t('profile.sign_out')}
                        </button>
                    </div>
                </div>

                {/* Right Column: Settings and Info */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Personal Info Card */}
                    <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-3xl shadow-xl border border-espresso/10 overflow-hidden relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                        <div className="px-10 py-6 border-b border-espresso/10 bg-white/20">
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-espresso/40">contact_mail</span>
                                <h3 className="font-black text-espresso dark:text-white uppercase tracking-[0.2em] text-[10px]">{t('profile.identity')}</h3>
                            </div>
                        </div>
                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                            <div className="space-y-2 hover:translate-x-1 transition-transform">
                                <p className="text-[10px] text-espresso/40 dark:text-white/50 font-black uppercase tracking-[0.2em]">{t('profile.email')}</p>
                                <p className="text-espresso dark:text-white font-serif font-bold text-xl truncate">{user?.email}</p>
                            </div>
                            <div className="space-y-2 hover:translate-x-1 transition-transform">
                                <p className="text-[10px] text-espresso/40 dark:text-white/50 font-black uppercase tracking-[0.2em]">{t('profile.phone')}</p>
                                <p className="text-espresso dark:text-white font-serif font-bold text-xl">{user?.phone || t('profile.not_set')}</p>
                            </div>
                            <div className="space-y-2 hover:translate-x-1 transition-transform">
                                <p className="text-[10px] text-espresso/40 dark:text-white/50 font-black uppercase tracking-[0.2em]">{t('profile.location')}</p>
                                <p className="text-espresso dark:text-white font-serif font-bold text-xl">{user?.location || t('profile.not_provided')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Account Settings Card */}
                    <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-3xl shadow-xl border border-espresso/10 overflow-hidden relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                        <div className="px-10 py-6 border-b border-espresso/10 bg-white/20">
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-espresso/40">fingerprint</span>
                                <h3 className="font-black text-espresso dark:text-white uppercase tracking-[0.2em] text-[10px]">{t('profile.security')}</h3>
                            </div>
                        </div>
                        <div className="divide-y divide-espresso/10 relative z-10">
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="w-full flex items-center justify-between px-10 py-8 hover:bg-white/30 dark:hover:bg-white/5 transition-all group/item active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-6 text-left">
                                    <div className="w-14 h-14 rounded-2xl bg-espresso text-white flex items-center justify-center group-hover/item:scale-110 transition-transform shadow-xl rotate-2 group-hover/item:rotate-0">
                                        <span className="material-symbols-outlined text-2xl">key</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-espresso dark:text-white text-[12px] uppercase tracking-widest leading-none mb-2">{t('profile.update_password')}</p>
                                        <p className="text-espresso/40 dark:text-white/40 text-[10px] font-black uppercase tracking-widest">{t('profile.update_password_desc')}</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-espresso/30 group-hover/item:translate-x-2 transition-transform">arrow_forward_ios</span>
                            </button>

                            <button
                                onClick={() => navigate('../privacy-settings')}
                                className="w-full flex items-center justify-between px-10 py-8 hover:bg-white/30 dark:hover:bg-white/5 transition-all group/item active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-6 text-left">
                                    <div className="w-14 h-14 rounded-2xl bg-white/50 text-espresso flex items-center justify-center group-hover/item:scale-110 transition-transform shadow-sm border border-white/20">
                                        <span className="material-symbols-outlined text-2xl">policy</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-espresso dark:text-white text-[12px] uppercase tracking-widest leading-none mb-2">{t('profile.privacy')}</p>
                                        <p className="text-espresso/40 dark:text-white/40 text-[10px] font-black uppercase tracking-widest">{t('profile.digital_vis')}</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-espresso/30 group-hover/item:translate-x-2 transition-transform">arrow_forward_ios</span>
                            </button>

                            <button
                                onClick={() => navigate('/student/notifications')}
                                className="w-full flex items-center justify-between px-10 py-8 hover:bg-white/30 dark:hover:bg-white/5 transition-all group/item active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-6 text-left">
                                    <div className="w-14 h-14 rounded-2xl bg-white/50 text-espresso flex items-center justify-center group-hover/item:scale-110 transition-transform shadow-sm border border-white/20">
                                        <span className="material-symbols-outlined text-2xl">notifications_active</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-espresso dark:text-white text-[12px] uppercase tracking-widest leading-none mb-2">{t('profile.alerts')}</p>
                                        <p className="text-espresso/40 dark:text-white/40 text-[10px] font-black uppercase tracking-widest">{t('profile.comm_flow')}</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-espresso/30 group-hover/item:translate-x-2 transition-transform">arrow_forward_ios</span>
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-espresso/20 dark:text-white/20 text-[10px] font-black uppercase tracking-[0.5em] py-8">
                        Usafi Strategic Systems • V2.4.1 • BUILD 203
                    </p>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowEditModal(false)}>
                    <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl border border-espresso/10 relative overflow-hidden group" onClick={e => e.stopPropagation()}>
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>

                        <h3 className="text-3xl font-serif font-bold text-espresso dark:text-white mb-8">
                            {t('profile.edit_title')}
                        </h3>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest">
                                    {t('profile.phone')}
                                </label>
                                <input
                                    type="tel"
                                    value={editData.phone}
                                    onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                    placeholder="+250 000 000 000"
                                    className="w-full px-6 py-4 rounded-2xl bg-white/40 dark:bg-black/20 border border-espresso/10 text-espresso dark:text-white font-bold placeholder:text-espresso/20 focus:outline-none focus:ring-2 focus:ring-espresso transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest">
                                    {t('profile.location')}
                                </label>
                                <input
                                    type="text"
                                    value={editData.location}
                                    onChange={e => setEditData({ ...editData, location: e.target.value })}
                                    placeholder="City, Country"
                                    className="w-full px-6 py-4 rounded-2xl bg-white/40 dark:bg-black/20 border border-espresso/10 text-espresso dark:text-white font-bold placeholder:text-espresso/20 focus:outline-none focus:ring-2 focus:ring-espresso transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 py-4 rounded-2xl border border-espresso/10 text-espresso/60 dark:text-white/60 font-black text-[10px] uppercase tracking-widest hover:bg-white/40 transition-all active:scale-95"
                            >
                                {t('profile.cancel')}
                            </button>
                            <button
                                onClick={handleSaveInfo}
                                disabled={saving}
                                className="flex-2 py-4 px-10 rounded-2xl bg-espresso text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:shadow-espresso/40 transition-all disabled:opacity-50 active:scale-95"
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
