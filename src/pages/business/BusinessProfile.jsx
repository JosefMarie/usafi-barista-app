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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <div className="min-h-screen bg-[#FAF5E8] dark:bg-background-dark flex flex-col md:flex-row">
            {/* Mobile Navigation Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[60] bg-espresso/20 backdrop-blur-sm animate-fade-in" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="absolute right-0 top-0 bottom-0 w-64 bg-[#F5DEB3] dark:bg-[#1c1916] shadow-2xl p-6 flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-10 pb-4 border-b border-espresso/10">
                            <span className="font-serif font-black text-espresso dark:text-white uppercase tracking-widest text-xs">Navigation</span>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-espresso/40"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <nav className="flex-1 space-y-4">
                            <Link
                                to="/business/dashboard"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-espresso/70 dark:text-white/70 hover:bg-white/40 transition-all font-bold"
                            >
                                <span className="material-symbols-outlined">dashboard</span>
                                {t('business.dashboard')}
                            </Link>
                            <Link
                                to="/business/profile"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-espresso text-white shadow-lg font-bold"
                            >
                                <span className="material-symbols-outlined">person</span>
                                {t('business.my_profile')}
                            </Link>
                        </nav>
                        <div className="mt-auto pt-6 border-t border-espresso/10">
                            <button onClick={handleLogout} className="flex items-center gap-3 text-red-600 font-black px-4 py-3 bg-red-50 dark:bg-red-900/10 rounded-xl w-full text-xs uppercase tracking-widest">
                                <span className="material-symbols-outlined">logout</span>
                                {t('business.sign_out')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar (Optional, for consistency with Dashboard) */}
            <aside className="w-64 bg-[#F5DEB3] dark:bg-[#1c1916] border-r border-espresso/10 hidden md:flex flex-col fixed inset-y-0 z-20 shadow-xl">
                <div className="p-8 border-b border-espresso/10">
                    <Link to="/" className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-espresso text-4xl dark:text-white">domain_verification</span>
                        <span className="font-serif text-xl font-black text-espresso dark:text-white uppercase tracking-wider">{t('business.business_class_title')}</span>
                    </Link>
                </div>
                <nav className="flex-1 p-6 space-y-3">
                    <Link to="/business/dashboard" className="flex items-center gap-3 px-5 py-4 rounded-[1.25rem] text-espresso/70 dark:text-white/70 hover:bg-white/40 dark:hover:bg-white/5 transition-all hover:translate-x-1">
                        <span className="material-symbols-outlined">dashboard</span>
                        {t('business.dashboard')}
                    </Link>
                    <Link to="/business/profile" className="flex items-center gap-3 px-5 py-4 rounded-[1.25rem] bg-espresso text-white shadow-xl shadow-espresso/20 transform transition-all hover:scale-[1.02]">
                        <span className="material-symbols-outlined">person</span>
                        {t('business.my_profile')}
                    </Link>
                </nav>
                <div className="p-6 border-t border-espresso/10">
                    <button onClick={handleLogout} className="flex items-center gap-3 text-espresso font-black px-5 py-3 hover:bg-white/20 rounded-[1.25rem] w-full transition-all uppercase tracking-widest text-[10px] bg-white/10">
                        <span className="material-symbols-outlined text-lg">logout</span>
                        {t('business.sign_out')}
                    </button>
                </div>
            </aside>

            <div className="flex-1 md:ml-64 flex flex-col w-full animate-fade-in overflow-y-auto">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-[#F5DEB3]/90 dark:bg-[#1c1916]/90 backdrop-blur-md transition-shadow duration-200 border-b border-espresso/10 shadow-sm">
                    <div className="flex items-center justify-between px-4 md:px-12 py-4 md:py-8 gap-4">
                        <div className="flex items-center gap-3 md:gap-4">
                            <button
                                onClick={() => navigate('/business/dashboard')}
                                className="flex items-center justify-center size-10 md:size-12 rounded-xl md:rounded-2xl bg-white/40 hover:bg-white/60 transition-all text-espresso shrink-0 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[20px] md:text-[24px]">arrow_back_ios_new</span>
                            </button>
                            <h2 className="text-espresso dark:text-white text-base md:text-3xl font-serif font-black uppercase tracking-widest leading-tight truncate">
                                {t('business.my_profile')}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4">
                            <button
                                onClick={handleEditClick}
                                className="flex items-center justify-center h-10 md:h-12 px-4 md:px-8 rounded-xl md:rounded-2xl bg-espresso text-white text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all shrink-0"
                            >
                                {t('common.edit')}
                            </button>
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden size-10 flex items-center justify-center text-espresso dark:text-white rounded-xl bg-white/40 shadow-sm shrink-0"
                            >
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="p-6 md:p-12 w-full max-w-6xl mx-auto space-y-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                        {/* Left Column: Avatar and Quick Info */}
                        <div className="lg:col-span-4 flex flex-col items-center">
                            <div className="bg-white/60 dark:bg-[#1c1916] rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 shadow-xl border border-espresso/5 w-full flex flex-col items-center relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-espresso/10 group-hover:bg-espresso transition-colors"></div>

                                <div
                                    onClick={handleAvatarClick}
                                    className="relative mb-6 md:mb-10 group/avatar cursor-pointer"
                                >
                                    <div
                                        className="size-36 md:size-52 rounded-2xl md:rounded-3xl border-4 md:border-8 border-white dark:border-[#2c2825] shadow-2xl bg-cover bg-center overflow-hidden flex items-center justify-center bg-white/50 backdrop-blur-sm transition-transform duration-500 group-hover/avatar:scale-105"
                                        style={{ backgroundImage: uploading ? 'none' : `url('${avatarUrl}')` }}
                                    >
                                        {uploading && (
                                            <div className="animate-spin rounded-full size-10 md:size-14 border-b-2 border-espresso"></div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 size-10 md:size-14 bg-espresso text-white rounded-xl md:rounded-2xl shadow-xl flex items-center justify-center border-4 border-[#F5DEB3] dark:border-[#1c1916] group-hover/avatar:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-[20px] md:text-[24px]">photo_camera</span>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                                </div>

                                <h1 className="text-xl md:text-3xl font-black text-espresso dark:text-white text-center mb-1 font-serif leading-tight">
                                    {displayName}
                                </h1>
                                <p className="text-espresso/40 font-black text-[8px] md:text-[10px] tracking-[0.2em] uppercase mb-6 bg-white dark:bg-black/20 px-4 py-1.5 rounded-full border border-espresso/5">
                                    Global ID: {userId}
                                </p>

                                <div className="px-5 py-2 bg-espresso text-white rounded-full mb-10 shadow-lg">
                                    <p className="text-[9px] md:text-[10px] font-black tracking-[0.2em] uppercase">
                                        {t('business.business_class_title')}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 w-full">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/40 dark:bg-white/5 text-espresso dark:text-white border border-espresso/10 hover:bg-white/60 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 group/logout"
                                    >
                                        <span className="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform">logout</span>
                                        {t('business.sign_out')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Key Details */}
                        <div className="lg:col-span-8 space-y-6 md:space-y-10">
                            {/* Company Card */}
                            <div className="bg-white/60 dark:bg-[#1c1916] rounded-[2rem] md:rounded-[3rem] shadow-xl border border-espresso/5 overflow-hidden relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-espresso/10 group-hover:bg-primary transition-colors"></div>
                                <div className="px-8 md:px-10 py-5 md:py-6 border-b border-espresso/10 flex items-center justify-between bg-white/30">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-espresso/40">domain</span>
                                        <h3 className="font-black text-espresso dark:text-white uppercase tracking-widest text-[10px] md:text-xs">{t('business.organization')}</h3>
                                    </div>
                                </div>
                                <div className="p-8 md:p-12 grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 relative z-10">
                                    <div className="space-y-2">
                                        <p className="text-[9px] md:text-[10px] text-espresso/40 dark:text-white/40 font-black uppercase tracking-[0.2em]">{t('business.company_name')}</p>
                                        <p className="text-espresso dark:text-white font-black text-base md:text-xl font-serif">{displayUser?.companyName || 'Not Listed'}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] md:text-[10px] text-espresso/40 dark:text-white/40 font-black uppercase tracking-[0.2em]">{t('business.position')}</p>
                                        <p className="text-espresso dark:text-white font-black text-base md:text-xl font-serif">{displayUser?.position || 'Not Listed'}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] md:text-[10px] text-espresso/40 dark:text-white/40 font-black uppercase tracking-[0.2em]">{t('business.work_email')}</p>
                                        <p className="text-espresso dark:text-white font-black text-base md:text-xl font-serif truncate">{displayUser?.email}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] md:text-[10px] text-espresso/40 dark:text-white/40 font-black uppercase tracking-[0.2em]">{t('business.contact_phone')}</p>
                                        <p className="text-espresso dark:text-white font-black text-base md:text-xl font-serif">{displayUser?.phone || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Security Card */}
                            <div className="bg-white/60 dark:bg-[#1c1916] rounded-[2rem] md:rounded-[3rem] shadow-xl border border-espresso/5 overflow-hidden relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-espresso/10 group-hover:bg-primary transition-colors"></div>
                                <div className="px-8 md:px-10 py-5 md:py-6 border-b border-espresso/10 bg-white/30">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-espresso/40">admin_panel_settings</span>
                                        <h3 className="font-black text-espresso dark:text-white uppercase tracking-widest text-[10px] md:text-xs">{t('business.security')}</h3>
                                    </div>
                                </div>
                                <div className="divide-y divide-espresso/5 relative z-10">
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        className="w-full flex items-center justify-between px-8 md:px-12 py-6 md:py-10 hover:bg-white/40 dark:hover:bg-white/5 transition-all group/item"
                                    >
                                        <div className="flex items-center gap-5 md:gap-8 text-left">
                                            <div className="size-12 md:size-16 rounded-2xl md:rounded-3xl bg-espresso text-white flex items-center justify-center group-hover/item:scale-110 group-hover/item:rotate-12 transition-all shadow-xl shadow-espresso/20 shrink-0">
                                                <span className="material-symbols-outlined text-2xl md:text-3xl">lock_reset</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-espresso dark:text-white text-[11px] md:text-[13px] uppercase tracking-[0.1em] md:tracking-[0.2em] leading-none mb-1 md:mb-2">{t('profile.update_password')}</p>
                                                <p className="text-espresso/50 dark:text-white/40 text-xs md:text-base font-medium">{t('profile.reset_security_desc')}</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-espresso/20 group-hover/item:translate-x-3 transition-all text-2xl md:text-4xl">arrow_right_alt</span>
                                    </button>
                                </div>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                                <div className="md:col-span-2 space-y-1.5 md:space-y-2">
                                    <label className="block text-[10px] font-black text-espresso/40 dark:text-white/60 mb-1 md:mb-2 uppercase tracking-widest">
                                        {t('business.company_name') || 'Company / Organization'}
                                    </label>
                                    <input
                                        type="text"
                                        value={editData.companyName}
                                        onChange={e => setEditData({ ...editData, companyName: e.target.value })}
                                        placeholder="Company Name"
                                        className="w-full px-5 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border border-espresso/10 bg-white dark:bg-black/20 text-espresso dark:text-white placeholder:text-espresso/20 focus:outline-none focus:ring-2 focus:ring-espresso focus:border-transparent transition-all font-bold text-sm md:text-base shadow-inner"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1.5 md:space-y-2">
                                    <label className="block text-[10px] font-black text-espresso/40 dark:text-white/60 mb-1 md:mb-2 uppercase tracking-widest">
                                        {t('business.position') || 'Your Position'}
                                    </label>
                                    <input
                                        type="text"
                                        value={editData.position}
                                        onChange={e => setEditData({ ...editData, position: e.target.value })}
                                        placeholder="Job Title"
                                        className="w-full px-5 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border border-espresso/10 bg-white dark:bg-black/20 text-espresso dark:text-white placeholder:text-espresso/20 focus:outline-none focus:ring-2 focus:ring-espresso focus:border-transparent transition-all font-bold text-sm md:text-base shadow-inner"
                                    />
                                </div>
                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="block text-[10px] font-black text-espresso/40 dark:text-white/60 mb-1 md:mb-2 uppercase tracking-widest">
                                        {t('business.contact_phone') || 'Phone Number'}
                                    </label>
                                    <input
                                        type="tel"
                                        value={editData.phone}
                                        onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                        className="w-full px-5 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border border-espresso/10 bg-white dark:bg-black/20 text-espresso dark:text-white placeholder:text-espresso/20 focus:outline-none focus:ring-2 focus:ring-espresso focus:border-transparent transition-all font-bold text-sm md:text-base shadow-inner"
                                    />
                                </div>
                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="block text-[10px] font-black text-espresso/40 dark:text-white/60 mb-1 md:mb-2 uppercase tracking-widest">
                                        {t('profile.location') || 'Location'}
                                    </label>
                                    <input
                                        type="text"
                                        value={editData.location}
                                        onChange={e => setEditData({ ...editData, location: e.target.value })}
                                        className="w-full px-5 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border border-espresso/10 bg-white dark:bg-black/20 text-espresso dark:text-white placeholder:text-espresso/20 focus:outline-none focus:ring-2 focus:ring-espresso focus:border-transparent transition-all font-bold text-sm md:text-base shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8 md:mt-12">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-4 md:py-5 rounded-xl md:rounded-2xl border border-espresso/10 text-espresso dark:text-white font-black uppercase tracking-widest hover:bg-black/5 transition-all text-[10px] md:text-xs active:scale-95"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleSaveInfo}
                                    disabled={saving}
                                    className="flex-1 py-4 md:py-5 rounded-xl md:rounded-2xl bg-espresso text-white font-black uppercase tracking-widest hover:shadow-xl hover:-translate-y-1 transition-all text-[10px] md:text-xs disabled:opacity-50 active:scale-95"
                                >
                                    {saving ? '...' : t('common.save')}
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
