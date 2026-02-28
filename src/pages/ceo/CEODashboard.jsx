import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, getCountFromServer, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export function CEODashboard({ settings }) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        projectedGrowth: 15,
        totalUsers: 0,
        staffCount: 0,
        systemHealth: 98
    });

    // Executive Action States
    const [actionModal, setActionModal] = useState(null); // 'appoint', 'announce', 'lockdown'
    const [processing, setProcessing] = useState(false);

    // Appoint Admin Form
    const [adminEmail, setAdminEmail] = useState('');

    // Announcement Form
    const [announcement, setAnnouncement] = useState({ title: '', message: '', priority: 'normal' });

    // Lockdown Check
    const isMaintenanceOn = settings?.maintenanceMode || false;

    // Revenue Data Placeholder (Months)
    const [revenueData, setRevenueData] = useState([]);
    const maxRevenue = Math.max(...revenueData.map(d => d.amount), 1); // Avoid -Infinity

    useEffect(() => {
        const fetchExecutiveData = async () => {
            try {
                // 1. Fetch all students for revenue calculation
                const usersRef = collection(db, 'users');
                const qStudents = query(usersRef, where('role', '==', 'student'));
                const studentSnap = await getDocs(qStudents);
                const students = studentSnap.docs.map(doc => ({ ...doc.data(), createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now()) }));

                // 2. Calculate Total Revenue (Active Online * 200k + Active Onsite * 500k? - defaulting to 200k for all for now or logic from Admin)
                // AdminDashboard uses: onlineActive.length * 200000. Let's start with that but maybe apply to all active for CEO generic view?
                // Let's stick to the Admin logic for consistency: Online students = 200k. Onsite = maybe 300k? 
                // Let's assume average 250,000 for simplicity if specific pricing isn't in DB, 
                // OR better: use the Admin logic strictly to avoid confusion. Admin says: onlineActive * 200k.
                // Let's count ALL active students x 200,000 for a "Total Estimated Revenue"
                const activeStudents = students.filter(s => s.status === 'active');
                const estimatedTotalRevenue = activeStudents.length * 200000;

                // 3. Generate Chart Data (Last 6 Months)
                const today = new Date();
                const last6Months = [];
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const monthName = d.toLocaleString(i18n.language === 'rw' ? 'rw-RW' : (i18n.language === 'en' ? 'en-US' : (i18n.language === 'fr' ? 'fr-FR' : 'sw-TZ')), { month: 'short' });
                    last6Months.push({
                        month: monthName,
                        monthIndex: d.getMonth(),
                        year: d.getFullYear(),
                        amount: 0
                    });
                }

                // Bucket students into months based on createdAt
                // Assuming revenue is recognized at enrollment/activation? Or cumulative?
                // "Revenue Trajectory" usually means revenue COLLECTED in that month.
                // So we sum up 200k for each student enrolled in that month.
                students.forEach(s => {
                    if (s.status === 'active') { // Only count active paying students
                        const d = s.createdAt; // already parsed above
                        const match = last6Months.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
                        if (match) {
                            match.amount += 200000;
                        }
                    }
                });

                // Update Stats
                const usersSnapCount = await getCountFromServer(usersRef);
                const qStaff = query(usersRef, where('role', 'in', ['admin', 'manager', 'instructor']));
                const staffSnap = await getDocs(qStaff);

                setStats(prev => ({
                    ...prev,
                    totalRevenue: estimatedTotalRevenue,
                    totalUsers: usersSnapCount.data().count,
                    staffCount: staffSnap.size
                }));

                setRevenueData(last6Months);
            } catch (e) {
                console.error("Executive Data Fetch Error", e);
            } finally {
                setLoading(false);
            }
        };

        fetchExecutiveData();
    }, []);

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-[#D4Af37]">diamond</span></div>;
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#FAF5E8] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-20">
            <div className="w-full max-w-7xl mx-auto px-6 py-10 space-y-12">

                {/* Executive Header */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                    <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#D4Af37] -ml-4 md:-ml-6"></div>
                        <p className="text-[#D4Af37] font-black text-[10px] uppercase tracking-[0.4em] mb-2">
                            {t('ceo.dashboard.full_spectrum_overview')}
                        </p>
                        <h1 className="text-2xl md:text-5xl font-serif font-black text-[#4B3832] dark:text-[#F5DEB3] uppercase tracking-tight leading-none">
                            {t('ceo.dashboard.executive_board').split(' ')[0]} <span className="text-[#D4Af37]">{t('ceo.dashboard.executive_board').split(' ')[1]}</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 text-left md:text-right">
                        <div>
                            <p className="text-[#4B3832]/60 dark:text-[#F5DEB3]/60 text-[10px] font-black uppercase tracking-widest leading-none">{t('ceo.dashboard.system_status')}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-sm md:text-lg font-bold text-[#4B3832] dark:text-[#F5DEB3] leading-none">{t('ceo.dashboard.operational')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {/* Revenue Card - Gold */}
                    <div className="bg-[#D4Af37] text-[#4B3832] p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-[#D4Af37]/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-700">
                            <span className="material-symbols-outlined text-7xl md:text-9xl">account_balance</span>
                        </div>
                        <p className="text-[#4B3832]/60 font-black text-[10px] uppercase tracking-[0.2em] mb-3 md:mb-4">{t('ceo.dashboard.total_revenue_ytd')}</p>
                        <h3 className="text-3xl md:text-4xl font-serif font-black leading-none mb-2">
                            {new Intl.NumberFormat(i18n.language === 'rw' ? 'rw-RW' : (i18n.language === 'en' ? 'en-US' : (i18n.language === 'fr' ? 'fr-FR' : 'sw-TZ')), { style: 'currency', currency: 'RWF', notation: "compact" }).format(stats.totalRevenue)}
                        </h3>
                        <div className="flex items-center gap-2 mt-4 text-[#4B3832]/80 text-[10px] md:text-xs font-bold">
                            <span className="bg-[#4B3832]/10 px-2 py-1 rounded-lg flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">trending_up</span>+12%
                            </span>
                            <span>{t('ceo.dashboard.vs_last_month')}</span>
                        </div>
                    </div>

                    {/* Users - Espresso */}
                    <div className="bg-[#4B3832] text-[#F5DEB3] p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-[#4B3832]/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
                            <span className="material-symbols-outlined text-7xl md:text-9xl">groups</span>
                        </div>
                        <p className="text-[#F5DEB3]/40 font-black text-[10px] uppercase tracking-[0.2em] mb-3 md:mb-4">{t('ceo.dashboard.active_userbase')}</p>
                        <h3 className="text-3xl md:text-4xl font-serif font-black leading-none mb-2">
                            {stats.totalUsers.toLocaleString()}
                        </h3>
                        <div className="flex items-center gap-2 mt-4 text-[#F5DEB3]/60 text-[10px] md:text-xs font-bold">
                            <span className="bg-[#F5DEB3]/10 px-2 py-1 rounded-lg flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">person_add</span>+54
                            </span>
                            <span>{t('ceo.dashboard.new_this_week')}</span>
                        </div>
                    </div>

                    {/* Staff - Cream */}
                    <div className="bg-[#F5DEB3] text-[#4B3832] p-6 md:p-8 rounded-[2rem] shadow-xl border border-[#D4Af37]/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
                            <span className="material-symbols-outlined text-7xl md:text-9xl">badge</span>
                        </div>
                        <p className="text-[#4B3832]/40 font-black text-[10px] uppercase tracking-[0.2em] mb-3 md:mb-4">{t('ceo.dashboard.total_staff')}</p>
                        <h3 className="text-3xl md:text-4xl font-serif font-black leading-none mb-2">
                            {stats.staffCount}
                        </h3>
                        <Link to="/ceo/staff" className="mt-4 inline-flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-[#D4Af37] hover:underline">
                            {t('ceo.dashboard.manage_access')} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                    </div>

                    {/* Health - White/Glass */}
                    <div className="bg-white/50 dark:bg-black/20 text-[#4B3832] dark:text-[#F5DEB3] p-6 md:p-8 rounded-[2rem] shadow-xl border border-[#4B3832]/5 relative overflow-hidden group backdrop-blur-sm">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-green-500"></div>
                        <p className="text-[#4B3832]/40 dark:text-[#F5DEB3]/40 font-black text-[10px] uppercase tracking-[0.2em] mb-3 md:mb-4">{t('ceo.dashboard.system_health')}</p>
                        <h3 className="text-3xl md:text-4xl font-serif font-black leading-none mb-2">
                            {stats.systemHealth}%
                        </h3>
                        <p className="text-[10px] md:text-xs font-bold text-green-600 mt-2">{t('ceo.dashboard.all_systems_nominal')}</p>
                    </div>
                </div>

                {/* Revenue Chart Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    <div className="lg:col-span-2 bg-white/40 dark:bg-black/20 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-[#D4Af37]/20 shadow-2xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-xl md:text-2xl font-serif font-black text-[#4B3832] dark:text-[#F5DEB3]">{t('ceo.dashboard.revenue_trajectory')}</h3>
                                <p className="text-[#4B3832]/40 text-[10px] font-black uppercase tracking-widest">{t('ceo.dashboard.h1_projection')}</p>
                            </div>
                            <span className="material-symbols-outlined text-[#D4Af37] text-2xl md:text-3xl">show_chart</span>
                        </div>

                        {/* Custom Bar Chart */}
                        <div className="h-48 md:h-64 flex items-end justify-between gap-2 md:gap-4 px-2 md:px-4 relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="border-t border-[#4B3832]/5 w-full h-0"></div>
                                ))}
                            </div>

                            {revenueData.map((d, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 md:gap-3 flex-1 z-10 group cursor-pointer h-full justify-end">
                                    <div
                                        className="w-full max-w-[40px] md:max-w-[50px] bg-gradient-to-t from-[#4B3832] to-[#8B4513] rounded-t-lg md:rounded-t-xl relative transition-all duration-500 group-hover:to-[#D4Af37] shadow-lg"
                                        style={{ height: `${(d.amount / maxRevenue) * 100}%` }}
                                    >
                                        <div className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 bg-[#4B3832] text-[#F5DEB3] text-[9px] md:text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {(d.amount / 1000000).toFixed(1)}M
                                        </div>
                                    </div>
                                    <span className="text-[8px] md:text-[10px] font-black text-[#4B3832]/40 uppercase">{d.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions / Alerts */}
                    <div className="bg-[#4B3832] text-[#F5DEB3] p-6 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between">
                        <div className="space-y-6 md:space-y-8">
                            <h3 className="text-lg md:text-xl font-serif font-black text-[#D4Af37]">{t('ceo.dashboard.executive_actions')}</h3>
                            <ul className="space-y-4 md:space-y-5">
                                <li
                                    onClick={() => setActionModal('appoint')}
                                    className="flex items-center gap-4 group cursor-pointer"
                                >
                                    <div className="size-10 rounded-xl bg-[#F5DEB3]/10 flex items-center justify-center text-[#D4Af37] group-hover:bg-[#D4Af37] group-hover:text-[#4B3832] transition-colors shrink-0 shadow-lg">
                                        <span className="material-symbols-outlined text-xl">add_moderator</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-xs md:text-sm">{t('ceo.dashboard.appoint_admin')}</p>
                                        <p className="text-[9px] md:text-[10px] opacity-50">{t('ceo.dashboard.grant_privileges')}</p>
                                    </div>
                                </li>
                                <li
                                    onClick={() => setActionModal('announce')}
                                    className="flex items-center gap-4 group cursor-pointer"
                                >
                                    <div className="size-10 rounded-xl bg-[#F5DEB3]/10 flex items-center justify-center text-[#D4Af37] group-hover:bg-[#D4Af37] group-hover:text-[#4B3832] transition-colors shrink-0 shadow-lg">
                                        <span className="material-symbols-outlined text-xl">campaign</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-xs md:text-sm">{t('ceo.dashboard.global_announcement')}</p>
                                        <p className="text-[9px] md:text-[10px] opacity-50">{t('ceo.dashboard.broadcast_users')}</p>
                                    </div>
                                </li>
                                <li
                                    onClick={() => setActionModal('lockdown')}
                                    className="flex items-center gap-4 group cursor-pointer"
                                >
                                    <div className={cn(
                                        "size-10 rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-lg",
                                        isMaintenanceOn ? "bg-red-500 text-white" : "bg-[#F5DEB3]/10 text-[#D4Af37] group-hover:bg-[#D4Af37] group-hover:text-[#4B3832]"
                                    )}>
                                        <span className="material-symbols-outlined text-xl">{isMaintenanceOn ? 'lock_open' : 'lock_reset'}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-xs md:text-sm">
                                            {isMaintenanceOn ? 'Lift Lockdown' : t('ceo.dashboard.emergency_lockdown')}
                                        </p>
                                        <p className="text-[9px] md:text-[10px] opacity-50">
                                            {isMaintenanceOn ? 'Resume public operations' : t('ceo.dashboard.restrict_access')}
                                        </p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div className="pt-8 border-t border-[#F5DEB3]/10 mt-8">
                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{t('ceo.dashboard.platform_version')}</p>
                            <p className="font-mono text-[#D4Af37] text-sm">v2.4.0-EXEC</p>
                        </div>
                    </div>
                </div>

                {/* --- MODALS --- */}
                {actionModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4B3832]/90 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-[#FAF5E8] w-full max-w-md rounded-[2.5rem] shadow-2xl border border-[#D4Af37]/20 overflow-hidden relative">
                            {/* Close Button */}
                            <button
                                onClick={() => setActionModal(null)}
                                className="absolute top-6 right-6 text-[#4B3832]/40 hover:text-[#4B3832]"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>

                            {/* Appoint Admin Modal */}
                            {actionModal === 'appoint' && (
                                <div className="p-10 space-y-6">
                                    <div className="text-center">
                                        <div className="size-16 bg-[#D4Af37]/10 rounded-3xl mx-auto flex items-center justify-center text-[#B8860B] mb-4">
                                            <span className="material-symbols-outlined text-3xl">shield_person</span>
                                        </div>
                                        <h3 className="text-2xl font-serif font-black text-[#4B3832]">Appoint Administrator</h3>
                                        <p className="text-xs text-[#4B3832]/60 mt-1 uppercase tracking-widest font-black">Escalate User Privileges</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#4B3832]/40">User Email Address</label>
                                            <input
                                                type="email"
                                                value={adminEmail}
                                                onChange={(e) => setAdminEmail(e.target.value)}
                                                placeholder="e.g. james@usafi.com"
                                                className="w-full px-5 py-4 rounded-2xl bg-white border border-[#4B3832]/10 focus:border-[#D4Af37] outline-none font-bold"
                                            />
                                        </div>
                                        <p className="text-[10px] text-[#4B3832]/60 leading-relaxed">
                                            Warning: This user will gain full access to management tools, student records, and platform settings.
                                        </p>
                                        <button
                                            onClick={async () => {
                                                setProcessing(true);
                                                try {
                                                    const q = query(collection(db, 'users'), where('email', '==', adminEmail));
                                                    const snap = await getDocs(q);
                                                    if (snap.empty) {
                                                        alert("User not found.");
                                                    } else {
                                                        await updateDoc(doc(db, 'users', snap.docs[0].id), { role: 'admin' });
                                                        alert(`${adminEmail} successfully appointed as Admin.`);
                                                        setActionModal(null);
                                                    }
                                                } catch (e) { alert(e.message); }
                                                setProcessing(false);
                                            }}
                                            disabled={processing || !adminEmail}
                                            className="w-full py-4 rounded-2xl bg-[#D4Af37] text-[#4B3832] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-105 transition-transform disabled:opacity-50"
                                        >
                                            {processing ? 'Processing...' : 'Confirm Appointment'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Global Announcement Modal */}
                            {actionModal === 'announce' && (
                                <div className="p-10 space-y-6">
                                    <div className="text-center">
                                        <div className="size-16 bg-[#D4Af37]/10 rounded-3xl mx-auto flex items-center justify-center text-[#B8860B] mb-4">
                                            <span className="material-symbols-outlined text-3xl">broadcast_on_home</span>
                                        </div>
                                        <h3 className="text-2xl font-serif font-black text-[#4B3832]">Global Broadcast</h3>
                                        <p className="text-xs text-[#4B3832]/60 mt-1 uppercase tracking-widest font-black">Notify All Active Users</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#4B3832]/40">Subject</label>
                                            <input
                                                type="text"
                                                value={announcement.title}
                                                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                                                placeholder="Important System Update"
                                                className="w-full px-5 py-3 rounded-2xl bg-white border border-[#4B3832]/10 focus:border-[#D4Af37] outline-none font-bold text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#4B3832]/40">Message</label>
                                            <textarea
                                                value={announcement.message}
                                                onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                                                rows={4}
                                                placeholder="Type your executive message here..."
                                                className="w-full px-5 py-4 rounded-2xl bg-white border border-[#4B3832]/10 focus:border-[#D4Af37] outline-none font-medium text-sm resize-none"
                                            />
                                        </div>
                                        <button
                                            onClick={async () => {
                                                setProcessing(true);
                                                try {
                                                    await addDoc(collection(db, 'announcements'), {
                                                        ...announcement,
                                                        createdAt: serverTimestamp(),
                                                        createdBy: 'ceo',
                                                        type: 'executive'
                                                    });
                                                    alert("Announcement broadcasted successfully.");
                                                    setActionModal(null);
                                                } catch (e) { alert(e.message); }
                                                setProcessing(false);
                                            }}
                                            disabled={processing || !announcement.title || !announcement.message}
                                            className="w-full py-4 rounded-2xl bg-[#4B3832] text-[#F5DEB3] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-105 transition-transform disabled:opacity-50"
                                        >
                                            {processing ? 'Broadcasting...' : 'Launch Broadcast'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Lockdown Modal */}
                            {actionModal === 'lockdown' && (
                                <div className="p-10 space-y-6">
                                    <div className="text-center">
                                        <div className={cn(
                                            "size-16 rounded-3xl mx-auto flex items-center justify-center mb-4 transition-colors",
                                            isMaintenanceOn ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        )}>
                                            <span className="material-symbols-outlined text-3xl">{isMaintenanceOn ? 'key' : 'lock_reset'}</span>
                                        </div>
                                        <h3 className="text-2xl font-serif font-black text-[#4B3832]">
                                            {isMaintenanceOn ? 'Lift Protocol' : 'Emergency Lockdown'}
                                        </h3>
                                        <p className="text-xs text-[#4B3832]/60 mt-1 uppercase tracking-widest font-black">
                                            {isMaintenanceOn ? 'Resume Operations' : 'Restrict Platform Access'}
                                        </p>
                                    </div>
                                    <div className="space-y-6">
                                        <p className="text-xs text-[#4B3832]/60 leading-relaxed text-center">
                                            {isMaintenanceOn
                                                ? "This will restore full access to the platform for all students and public users immediately."
                                                : "This will immediately redirect all non-administrative users to the maintenance page. Use only for critical updates or security breaches."
                                            }
                                        </p>
                                        <button
                                            onClick={async () => {
                                                setProcessing(true);
                                                try {
                                                    await updateDoc(doc(db, 'system_settings', 'global'), {
                                                        maintenanceMode: !isMaintenanceOn,
                                                        updatedAt: serverTimestamp(),
                                                        updatedBy: 'ceo'
                                                    });
                                                    setActionModal(null);
                                                } catch (e) { alert(e.message); }
                                                setProcessing(false);
                                            }}
                                            disabled={processing}
                                            className={cn(
                                                "w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-105 transition-transform disabled:opacity-50",
                                                isMaintenanceOn ? "bg-green-600 text-white" : "bg-red-600 text-white"
                                            )}
                                        >
                                            {processing ? 'Processing...' : (isMaintenanceOn ? 'Confirm Reactivation' : 'Confirm Lockdown')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
}
