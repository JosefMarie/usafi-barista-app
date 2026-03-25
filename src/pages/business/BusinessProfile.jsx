import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storage, db } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';

export function BusinessProfile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [displayUser, setDisplayUser] = useState(null);
    const [editData, setEditData] = useState({
        phone: '',
        location: '',
        companyName: '',
        position: '',
        bio: '',
        linkedInUrl: ''
    });
    const [learningStats, setLearningStats] = useState({
        enrolled: 0,
        completed: 0,
        badges: []
    });
    const [saving, setSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (user) {
            // Fetch latest user data
            getDoc(doc(db, 'users', user.uid)).then(snap => {
                if (snap.exists()) {
                    setDisplayUser({ ...user, ...snap.data() });
                } else {
                    setDisplayUser(user);
                }
            });

            // Fetch learning stats
            const fetchStats = async () => {
                try {
                    const progSnap = await getDocs(collection(db, 'users', user.uid, 'business_progress'));
                    let enrolled = 0;
                    let completed = 0;
                    let badgesSet = new Set();
                    
                    progSnap.forEach(d => {
                        const data = d.data();
                        enrolled++;
                        if (data.status === 'completed') completed++;
                        if (data.badges) data.badges.forEach(b => badgesSet.add(b));
                    });
                    
                    setLearningStats({
                        enrolled,
                        completed,
                        badges: Array.from(badgesSet)
                    });
                } catch (err) {
                    console.error("Error fetching learning stats:", err);
                }
            };
            fetchStats();
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
            position: displayUser?.position || '',
            bio: displayUser?.bio || '',
            linkedInUrl: displayUser?.linkedInUrl || ''
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
                bio: editData.bio,
                linkedInUrl: editData.linkedInUrl,
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
                        {/* Left Column: Digital Membership Card & Actions */}
                        <div className="lg:col-span-5 flex flex-col items-center">
                            {/* The Card */}
                            <div className="relative w-full max-w-[340px] aspect-[5/8] rounded-[2.5rem] bg-gradient-to-br from-[#1c1916] to-black p-1 shadow-2xl overflow-hidden group perspective-1000 mb-8 transform hover:-translate-y-2 transition-transform duration-500">
                                <div className="absolute inset-0 bg-gradient-to-br from-espresso/40 via-transparent to-espresso/10 opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/40 transition-colors duration-700"></div>
                                
                                <div className="relative h-full w-full bg-[#1c1916]/80 backdrop-blur-xl rounded-[2.4rem] p-8 flex flex-col items-center border border-white/10 group-hover:border-white/20 transition-colors duration-500 overflow-hidden shadow-inner">
                                    
                                    {/* Top Branding */}
                                    <div className="w-full flex justify-between items-start mb-10">
                                        <span className="material-symbols-outlined text-white text-3xl opacity-80">domain_verification</span>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.3em] leading-none mb-1">USAFI Barista</p>
                                            <p className="text-[10px] font-black text-[#F5DEB3] uppercase tracking-[0.2em] leading-none">Business Class</p>
                                        </div>
                                    </div>

                                    {/* Avatar */}
                                    <div 
                                        onClick={handleAvatarClick}
                                        className="relative mb-6 group/avatar cursor-pointer shrink-0"
                                    >
                                        <div 
                                            className="size-32 md:size-36 rounded-full border-4 border-[#F5DEB3]/20 shadow-2xl bg-cover bg-center overflow-hidden flex items-center justify-center transition-transform duration-500 group-hover/avatar:scale-105"
                                            style={{ backgroundImage: uploading ? 'none' : `url('${avatarUrl}')` }}
                                        >
                                            {uploading && (
                                                <div className="animate-spin rounded-full size-8 border-b-2 border-[#F5DEB3]"></div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 right-0 size-10 bg-[#F5DEB3] text-[#1c1916] rounded-full shadow-xl flex items-center justify-center border-[3px] border-[#1c1916] group-hover/avatar:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                                    </div>

                                    {/* Identity */}
                                    <div className="text-center w-full mt-auto flex flex-col items-center">
                                        <h1 className="text-2xl md:text-3xl font-black text-white mb-2 font-serif leading-tight truncate px-2 w-full">
                                            {displayName}
                                        </h1>
                                        <p className="text-[#F5DEB3]/80 font-bold text-xs uppercase tracking-widest mb-8 truncate px-2 w-full">
                                            {displayUser?.position || displayUser?.companyName || 'Business Student'}
                                        </p>
                                        
                                        {/* ID Strip */}
                                        <div className="w-full bg-black/50 rounded-2xl p-4 border border-white/5 backdrop-blur-md flex justify-between items-center group-hover:bg-black/70 transition-colors mt-auto">
                                            <div className="text-left">
                                                <p className="text-[8px] text-white/40 font-black uppercase tracking-[0.2em] mb-1">Global ID</p>
                                                <p className="text-xs text-white font-mono tracking-widest">{userId}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-white/20 text-3xl rotate-90">qr_code_2</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="w-full max-w-[340px] flex flex-col gap-3">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/60 dark:bg-white/5 text-espresso dark:text-white border border-espresso/10 hover:bg-white transition-all font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 group/logout"
                                >
                                    <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform text-red-500">logout</span>
                                    {t('business.sign_out')}
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Key Details & Stats */}
                        <div className="lg:col-span-7 space-y-6 md:space-y-8">
                            
                            {/* Learning & Achievements */}
                            <div className="bg-white/60 dark:bg-[#1c1916] rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-espresso/5 overflow-hidden relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-gradient-to-b from-amber-400 to-amber-600 transition-colors"></div>
                                <div className="px-8 md:px-10 py-5 md:py-6 border-b border-espresso/10 flex items-center justify-between bg-white/30 dark:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-amber-500">school</span>
                                        <h3 className="font-black text-espresso dark:text-white uppercase tracking-widest text-[10px] md:text-xs">Learning & Achievements</h3>
                                    </div>
                                </div>
                                <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 relative z-10 w-full">
                                    {/* Stats */}
                                    <div className="flex gap-8 md:w-1/2">
                                        <div className="space-y-2 flex-1 text-center md:text-left">
                                            <p className="text-[9px] md:text-[10px] text-espresso/40 dark:text-white/40 font-black uppercase tracking-[0.2em]">Enrolled</p>
                                            <p className="text-espresso dark:text-white font-black text-4xl md:text-5xl font-serif">{learningStats.enrolled}</p>
                                        </div>
                                        <div className="space-y-2 flex-1 text-center md:text-left">
                                            <p className="text-[9px] md:text-[10px] text-espresso/40 dark:text-white/40 font-black uppercase tracking-[0.2em]">Completed</p>
                                            <p className="text-espresso dark:text-white font-black text-4xl md:text-5xl font-serif">{learningStats.completed}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Badges */}
                                    <div className="md:w-1/2 md:border-l border-espresso/10 dark:border-white/10 md:pl-8 flex flex-col items-center md:items-start pt-6 md:pt-0 border-t md:border-t-0">
                                        <p className="text-[9px] md:text-[10px] text-espresso/40 dark:text-white/40 font-black uppercase tracking-[0.2em] mb-4">Earned Badges</p>
                                        <div className="flex flex-wrap gap-3">
                                            {learningStats.badges.length > 0 ? (
                                                learningStats.badges.map((badge, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 bg-gradient-to-br from-amber-400 to-amber-600 px-3 py-1.5 rounded-full shadow-lg group cursor-pointer relative hover:-translate-y-1 transition-transform" title="Business Visionary">
                                                        <span className="material-symbols-outlined text-white text-base">diamond</span>
                                                        <span className="text-white font-black text-[9px] uppercase tracking-widest leading-none">Visionary</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-[10px] font-bold text-espresso/40 dark:text-white/40 italic flex items-center gap-2"><span className="material-symbols-outlined text-sm">info</span>Complete courses to earn badges</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Professional Identity Card */}
                            <div className="bg-white/60 dark:bg-[#1c1916] rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-espresso/5 overflow-hidden relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-espresso/10 group-hover:bg-primary transition-colors"></div>
                                <div className="px-8 md:px-10 py-5 md:py-6 border-b border-espresso/10 flex items-center justify-between bg-white/30 dark:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-espresso/40 dark:text-white/40">assignment_ind</span>
                                        <h3 className="font-black text-espresso dark:text-white uppercase tracking-widest text-[10px] md:text-xs">Professional Details</h3>
                                    </div>
                                    <button onClick={handleEditClick} className="text-[9px] font-black tracking-[0.2em] uppercase text-primary hover:text-primary/70 transition-colors">Edit</button>
                                </div>
                                <div className="p-8 md:p-10 space-y-8 relative z-10">
                                    {/* Bio */}
                                    <div>
                                        <p className="text-[9px] md:text-[10px] text-espresso/40 dark:text-white/40 font-black uppercase tracking-[0.2em] mb-3">Professional Bio</p>
                                        <p className="text-sm md:text-base text-espresso/80 dark:text-white/80 font-medium leading-relaxed italic border-l-2 border-espresso/20 dark:border-white/20 pl-4 py-1.5 bg-white/20 dark:bg-white/5 rounded-r-xl pr-4">
                                            {displayUser?.bio ? `"${displayUser.bio}"` : 'No professional summary provided.'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
                                        <div className="space-y-2">
                                            <p className="text-[9px] md:text-[10px] text-espresso/40 dark:text-white/40 font-black uppercase tracking-[0.2em]">{t('business.organization')}</p>
                                            <p className="text-espresso dark:text-white font-black text-sm md:text-lg font-serif">{displayUser?.companyName || 'Not Listed'}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[9px] md:text-[10px] text-espresso/40 dark:text-white/40 font-black uppercase tracking-[0.2em]">{t('business.work_email')}</p>
                                            <p className="text-espresso dark:text-white font-black text-sm md:text-lg font-serif truncate">{displayUser?.email}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[9px] md:text-[10px] text-espresso/40 dark:text-white/40 font-black uppercase tracking-[0.2em]">{t('business.contact_phone')}</p>
                                            <p className="text-espresso dark:text-white font-black text-sm md:text-lg font-serif">{displayUser?.phone || 'Not provided'}</p>
                                        </div>
                                        <div className="space-y-2 flex flex-col">
                                            <p className="text-[9px] md:text-[10px] text-espresso/40 dark:text-white/40 font-black uppercase tracking-[0.2em]">LinkedIn</p>
                                            {displayUser?.linkedInUrl ? (
                                                <a href={displayUser.linkedInUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-0.5 text-primary hover:text-primary/70 font-black text-xs md:text-sm uppercase tracking-widest transition-colors w-fit">
                                                    <span className="material-symbols-outlined text-base">link</span> View Profile
                                                </a>
                                            ) : (
                                                <p className="text-espresso/50 dark:text-white/50 font-black text-sm md:text-lg font-serif italic">Not Linked</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Security Card */}
                            <div className="bg-white/60 dark:bg-[#1c1916] rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-espresso/5 overflow-hidden relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-espresso/10 group-hover:bg-primary transition-colors"></div>
                                <div className="px-8 md:px-10 py-5 md:py-6 border-b border-espresso/10 bg-white/30 dark:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-espresso/40 dark:text-white/40">admin_panel_settings</span>
                                        <h3 className="font-black text-espresso dark:text-white uppercase tracking-widest text-[10px] md:text-xs">{t('business.security')}</h3>
                                    </div>
                                </div>
                                <div className="divide-y divide-espresso/5 relative z-10 w-full">
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        className="w-full flex items-center justify-between px-8 md:px-10 py-6 md:py-8 hover:bg-white/40 dark:hover:bg-white/5 transition-all group/item"
                                    >
                                        <div className="flex items-center gap-5 md:gap-6 text-left">
                                            <div className="size-12 md:size-14 rounded-2xl bg-espresso text-white flex items-center justify-center group-hover/item:scale-110 group-hover/item:rotate-12 transition-all shadow-xl shadow-espresso/20 shrink-0">
                                                <span className="material-symbols-outlined text-2xl md:text-3xl">lock_reset</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-espresso dark:text-white text-[11px] md:text-[13px] uppercase tracking-[0.1em] md:tracking-[0.2em] leading-none mb-1 md:mb-2">{t('profile.update_password')}</p>
                                                <p className="text-espresso/50 dark:text-white/40 text-xs md:text-sm font-medium">{t('profile.reset_security_desc')}</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-espresso/20 group-hover/item:translate-x-2 transition-all text-2xl md:text-3xl">arrow_right_alt</span>
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
                                        Professional Bio
                                    </label>
                                    <textarea
                                        value={editData.bio}
                                        onChange={e => setEditData({ ...editData, bio: e.target.value })}
                                        placeholder="A short summary of your professional background..."
                                        rows="3"
                                        className="w-full px-5 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border border-espresso/10 bg-white dark:bg-black/20 text-espresso dark:text-white placeholder:text-espresso/20 focus:outline-none focus:ring-2 focus:ring-espresso focus:border-transparent transition-all font-bold text-sm md:text-base shadow-inner resize-none"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1.5 md:space-y-2">
                                    <label className="block text-[10px] font-black text-espresso/40 dark:text-white/60 mb-1 md:mb-2 uppercase tracking-widest">
                                        LinkedIn Profile URL
                                    </label>
                                    <input
                                        type="url"
                                        value={editData.linkedInUrl}
                                        onChange={e => setEditData({ ...editData, linkedInUrl: e.target.value })}
                                        placeholder="https://linkedin.com/in/..."
                                        className="w-full px-5 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border border-espresso/10 bg-white dark:bg-black/20 text-espresso dark:text-white placeholder:text-espresso/20 focus:outline-none focus:ring-2 focus:ring-espresso focus:border-transparent transition-all font-bold text-sm md:text-base shadow-inner"
                                    />
                                </div>
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
