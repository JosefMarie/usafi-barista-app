import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { seedSystemData } from '../../lib/dataSeeder';

export function CEOSettings({ settings: initialSettings }) {
    const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'broadcasts' | 'audit'
    const [settings, setSettings] = useState(initialSettings || {
        registrationsOpen: true,
        maintenanceMode: false,
        autoApproveStudents: false,
        notifyOnNewUser: true,
        disableStudentLogin: false,
        disableStaffLogin: false,
        disableStudentCourses: false,
        systemVersion: '2.4.0-EXEC',
        maxActiveSessions: 'unlimited',
        ipWhitelistEnabled: false,
        allowedIPs: '',
        sessionTimeoutMinutes: '60',
        requireSpecialCharPassword: true,
        passwordResetDays: '0'
    });
    
    const [saving, setSaving] = useState(false);
    const [savingPolicies, setSavingPolicies] = useState(false);
    
    // Security policy state form values
    const [policyForm, setPolicyForm] = useState({
        maxActiveSessions: 'unlimited',
        ipWhitelistEnabled: false,
        allowedIPs: '',
        sessionTimeoutMinutes: '60',
        requireSpecialCharPassword: true,
        passwordResetDays: '0'
    });

    // Broadcasts state
    const [announcements, setAnnouncements] = useState([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
    const [newBroadcast, setNewBroadcast] = useState({ subject: '', message: '', durationHours: '24' });
    const [creatingBroadcast, setCreatingBroadcast] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Audit logs state
    const [auditLogs, setAuditLogs] = useState([]);
    const [logFilter, setLogFilter] = useState('All');
    const [logSearch, setLogSearch] = useState('');
    const [loadingLogs, setLoadingLogs] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'system_settings', 'global'), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setSettings(data);
                setPolicyForm({
                    maxActiveSessions: data.maxActiveSessions || 'unlimited',
                    ipWhitelistEnabled: !!data.ipWhitelistEnabled,
                    allowedIPs: data.allowedIPs || '',
                    sessionTimeoutMinutes: data.sessionTimeoutMinutes || '60',
                    requireSpecialCharPassword: data.requireSpecialCharPassword !== false,
                    passwordResetDays: data.passwordResetDays || '0'
                });
            }
        });
        return () => unsubscribe();
    }, []);

    // Load broadcasts when switching to broadcasts tab
    useEffect(() => {
        if (activeTab === 'broadcasts') {
            setLoadingAnnouncements(true);
            const q = query(collection(db, 'system_announcements'), orderBy('createdAt', 'desc'), limit(50));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const list = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data(),
                    createdAtDate: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date(d.data().createdAt || Date.now()),
                    expiresAtDate: d.data().expiresAt?.toDate ? d.data().expiresAt.toDate() : (d.data().expiresAt ? new Date(d.data().expiresAt) : null)
                }));
                setAnnouncements(list);
                setLoadingAnnouncements(false);
            }, (err) => {
                console.error("Error loading system announcements:", err);
                setLoadingAnnouncements(false);
            });
            return () => unsubscribe();
        }
    }, [activeTab]);

    // Load audit logs when switching to audit tab
    useEffect(() => {
        if (activeTab === 'audit') {
            setLoadingLogs(true);
            const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const logs = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data(),
                    timestamp: d.data().timestamp?.toDate ? d.data().timestamp.toDate() : new Date(d.data().timestamp || Date.now())
                }));
                setAuditLogs(logs);
                setLoadingLogs(false);
            }, (error) => {
                console.error("Error fetching audit logs:", error);
                setLoadingLogs(false);
            });
            return () => unsubscribe();
        }
    }, [activeTab]);

    const logAuditAction = async (action, details, category = 'Security') => {
        try {
            await addDoc(collection(db, 'audit_logs'), {
                timestamp: new Date(),
                action,
                details,
                category,
                performedBy: 'CEO',
                performedByRole: 'ceo'
            });
        } catch (error) {
            console.error("Error recording audit log:", error);
        }
    };

    const toggleSetting = async (key, itemTitle) => {
        try {
            setSaving(true);
            const settingsRef = doc(db, 'system_settings', 'global');
            const newValue = !settings[key];
            
            await updateDoc(settingsRef, {
                [key]: newValue,
                updatedAt: new Date(),
                updatedBy: 'ceo'
            });

            await logAuditAction(
                `TOGGLE_${key.toUpperCase()}`,
                `Changed setting "${itemTitle}" to ${newValue ? 'ENABLED' : 'DISABLED'}`,
                'Access Control'
            );
        } catch (error) {
            console.error("Error updating setting:", error);
            alert("Failed to update setting. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleSavePolicies = async (e) => {
        e.preventDefault();
        try {
            setSavingPolicies(true);
            const settingsRef = doc(db, 'system_settings', 'global');
            
            await updateDoc(settingsRef, {
                ...policyForm,
                updatedAt: new Date(),
                updatedBy: 'ceo'
            });

            await logAuditAction(
                'UPDATE_SECURITY_POLICIES',
                `Updated security policies: Max Sessions=${policyForm.maxActiveSessions}, IP Whitelist=${policyForm.ipWhitelistEnabled ? 'ON' : 'OFF'}, Session Timeout=${policyForm.sessionTimeoutMinutes}m`,
                'Security'
            );

            alert("Security Policies updated successfully!");
        } catch (error) {
            console.error("Error updating security policies:", error);
            alert("Failed to save security policies. Please try again.");
        } finally {
            setSavingPolicies(false);
        }
    };

    // Broadcast Handlers
    const handleCreateBroadcast = async (e) => {
        e.preventDefault();
        if (!newBroadcast.subject || !newBroadcast.message) {
            alert("Please provide both subject and message.");
            return;
        }

        try {
            setCreatingBroadcast(true);
            let expiresAt = null;
            if (newBroadcast.durationHours !== 'never') {
                const hours = parseInt(newBroadcast.durationHours, 10);
                expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
            }

            await addDoc(collection(db, 'system_announcements'), {
                subject: newBroadcast.subject,
                message: newBroadcast.message,
                active: true,
                createdAt: serverTimestamp(),
                expiresAt: expiresAt,
                durationHours: newBroadcast.durationHours,
                createdBy: 'CEO',
                type: 'broadcast'
            });

            await logAuditAction(
                'LAUNCH_BROADCAST',
                `Launched global broadcast: "${newBroadcast.subject}" (Duration: ${newBroadcast.durationHours}h)`,
                'Broadcast'
            );

            setNewBroadcast({ subject: '', message: '', durationHours: '24' });
            setShowCreateForm(false);
            alert("Global Broadcast launched successfully!");
        } catch (err) {
            console.error("Error creating broadcast:", err);
            alert("Failed to launch broadcast: " + err.message);
        } finally {
            setCreatingBroadcast(false);
        }
    };

    const handleToggleBroadcastActive = async (id, currentActive, subject) => {
        try {
            const ref = doc(db, 'system_announcements', id);
            await updateDoc(ref, {
                active: !currentActive,
                updatedAt: new Date()
            });

            await logAuditAction(
                'TOGGLE_BROADCAST',
                `${!currentActive ? 'Activated' : 'Deactivated'} broadcast "${subject}"`,
                'Broadcast'
            );
        } catch (err) {
            console.error("Error toggling broadcast:", err);
            alert("Failed to update broadcast status.");
        }
    };

    const handleDeleteBroadcast = async (id, subject) => {
        if (!window.confirm(`Are you sure you want to delete the broadcast "${subject}"?`)) return;
        try {
            await deleteDoc(doc(db, 'system_announcements', id));
            await logAuditAction(
                'DELETE_BROADCAST',
                `Deleted broadcast "${subject}"`,
                'Broadcast'
            );
        } catch (err) {
            console.error("Error deleting broadcast:", err);
            alert("Failed to delete broadcast.");
        }
    };

    const handleExtendBroadcast = async (id, subject, addHours = 24) => {
        try {
            const newExpiry = new Date(Date.now() + addHours * 60 * 60 * 1000);
            await updateDoc(doc(db, 'system_announcements', id), {
                expiresAt: newExpiry,
                active: true,
                updatedAt: new Date()
            });
            await logAuditAction(
                'EXTEND_BROADCAST',
                `Extended broadcast "${subject}" by ${addHours} hours`,
                'Broadcast'
            );
            alert(`Broadcast extended by ${addHours} hours!`);
        } catch (err) {
            console.error("Error extending broadcast:", err);
            alert("Failed to extend broadcast.");
        }
    };

    const filteredLogs = auditLogs.filter(log => {
        const matchesCategory = logFilter === 'All' || log.category === logFilter;
        const matchesSearch = !logSearch || 
            log.action?.toLowerCase().includes(logSearch.toLowerCase()) ||
            log.details?.toLowerCase().includes(logSearch.toLowerCase()) ||
            log.performedBy?.toLowerCase().includes(logSearch.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="flex-1 flex flex-col h-full bg-[#FAF5E8] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-20 custom-scrollbar">
            <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="relative pl-4 md:pl-0">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#D4Af37] -ml-4 md:hidden"></div>
                        <p className="text-[#D4Af37] font-black text-[10px] uppercase tracking-[0.4em] mb-2 leading-none">Platform Governance</p>
                        <h1 className="text-3xl md:text-4xl font-serif font-black text-[#4B3832] dark:text-[#F5DEB3] leading-none">Global Settings & Security</h1>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex bg-white/60 dark:bg-black/40 p-1.5 rounded-2xl border border-[#D4Af37]/20 self-start md:self-auto overflow-x-auto max-w-full">
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={cn(
                                "px-3.5 py-2 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap",
                                activeTab === 'settings' 
                                    ? "bg-[#D4Af37] text-white shadow-md" 
                                    : "text-[#4B3832]/70 dark:text-[#F5DEB3]/70 hover:text-[#4B3832] dark:hover:text-[#F5DEB3]"
                            )}
                        >
                            <span className="material-symbols-outlined text-base">tune</span>
                            Controls & Policies
                        </button>
                        <button
                            onClick={() => setActiveTab('broadcasts')}
                            className={cn(
                                "px-3.5 py-2 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap",
                                activeTab === 'broadcasts' 
                                    ? "bg-[#D4Af37] text-white shadow-md" 
                                    : "text-[#4B3832]/70 dark:text-[#F5DEB3]/70 hover:text-[#4B3832] dark:hover:text-[#F5DEB3]"
                            )}
                        >
                            <span className="material-symbols-outlined text-base">campaign</span>
                            Global Broadcasts
                        </button>
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={cn(
                                "px-3.5 py-2 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap",
                                activeTab === 'audit' 
                                    ? "bg-[#D4Af37] text-white shadow-md" 
                                    : "text-[#4B3832]/70 dark:text-[#F5DEB3]/70 hover:text-[#4B3832] dark:hover:text-[#F5DEB3]"
                            )}
                        >
                            <span className="material-symbols-outlined text-base">history</span>
                            System Audit Logs
                        </button>
                    </div>
                </div>

                {activeTab === 'settings' && (
                    <div className="space-y-6 md:space-y-8">
                        {/* System Configuration Toggles */}
                        <div className="bg-white/40 dark:bg-black/20 rounded-[2rem] border border-[#D4Af37]/20 shadow-xl overflow-hidden">
                            <div className="p-5 md:p-8 border-b border-[#D4Af37]/10">
                                <h3 className="text-lg md:text-xl font-bold text-[#4B3832] dark:text-[#F5DEB3]">System Access Controls</h3>
                                <p className="text-xs md:text-sm text-[#4B3832]/60 dark:text-[#F5DEB3]/60">Manage platform-wide registration, maintenance, and role access restrictions.</p>
                            </div>

                            <div className="divide-y divide-[#D4Af37]/10">
                                {[
                                    { key: 'registrationsOpen', title: 'Public Registrations', desc: 'Allow new users to create accounts' },
                                    { key: 'maintenanceMode', title: 'Maintenance Mode', desc: 'Restrict access to Admins & Executives only', danger: true },
                                    { key: 'autoApproveStudents', title: 'Auto-Approve Students', desc: 'Automatically activate new student accounts' },
                                    { key: 'disableStudentLogin', title: 'Disable Student Login', desc: 'Block students from logging in and show insufficient permission error', danger: true },
                                    { key: 'disableStaffLogin', title: 'Disable Staff Login', desc: 'Block login and portal access for Admins, Managers, & Instructors', danger: true },
                                    { key: 'disableStudentCourses', title: 'Disable Student Course Access', desc: 'Block student access to courses and learning pages', danger: true }
                                ].map((item) => (
                                    <div key={item.key} className="p-4 md:p-6 flex items-center justify-between hover:bg-white/20 transition-colors gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-sm md:text-base text-[#4B3832] dark:text-[#F5DEB3] truncate">{item.title}</p>
                                            <p className="text-[10px] md:text-xs text-[#4B3832]/50 line-clamp-1 md:line-clamp-none">{item.desc}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleSetting(item.key, item.title)}
                                            disabled={saving}
                                            className={cn(
                                                "w-12 md:w-14 h-6 md:h-8 rounded-full p-1 transition-colors shrink-0 disabled:opacity-50",
                                                settings[item.key] ? (item.danger ? 'bg-red-500' : 'bg-[#D4Af37]') : 'bg-gray-300 dark:bg-white/10'
                                            )}
                                        >
                                            <div className={cn(
                                                "size-4 md:size-6 bg-white rounded-full shadow-md transform transition-transform",
                                                settings[item.key] ? 'translate-x-6' : ''
                                            )}></div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security & Access Policies Form */}
                        <div className="bg-white/40 dark:bg-black/20 rounded-[2rem] border border-[#D4Af37]/20 shadow-xl overflow-hidden">
                            <div className="p-5 md:p-8 border-b border-[#D4Af37]/10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold text-[#4B3832] dark:text-[#F5DEB3]">Security & Session Policies</h3>
                                    <p className="text-xs md:text-sm text-[#4B3832]/60 dark:text-[#F5DEB3]/60">Configure concurrent sessions, IP restrictions, and authentication rules.</p>
                                </div>
                                <span className="material-symbols-outlined text-3xl text-[#D4Af37] opacity-80 hidden sm:block">verified_user</span>
                            </div>

                            <form onSubmit={handleSavePolicies} className="p-5 md:p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    
                                    {/* Max Active Sessions */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#4B3832] dark:text-[#F5DEB3]">
                                            Max Active Concurrent Sessions
                                        </label>
                                        <select
                                            value={policyForm.maxActiveSessions}
                                            onChange={(e) => setPolicyForm({ ...policyForm, maxActiveSessions: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/70 dark:bg-black/40 border border-[#D4Af37]/30 rounded-xl text-sm font-semibold text-[#4B3832] dark:text-[#F5DEB3] focus:outline-none focus:ring-2 focus:ring-[#D4Af37]"
                                        >
                                            <option value="1">1 Session (Strict)</option>
                                            <option value="2">2 Sessions</option>
                                            <option value="3">3 Sessions</option>
                                            <option value="5">5 Sessions</option>
                                            <option value="unlimited">Unlimited Sessions</option>
                                        </select>
                                        <p className="text-[10px] text-[#4B3832]/60 dark:text-[#F5DEB3]/60">Limits how many devices a single user can log in with simultaneously.</p>
                                    </div>

                                    {/* Session Idle Timeout */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#4B3832] dark:text-[#F5DEB3]">
                                            Session Idle Timeout
                                        </label>
                                        <select
                                            value={policyForm.sessionTimeoutMinutes}
                                            onChange={(e) => setPolicyForm({ ...policyForm, sessionTimeoutMinutes: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/70 dark:bg-black/40 border border-[#D4Af37]/30 rounded-xl text-sm font-semibold text-[#4B3832] dark:text-[#F5DEB3] focus:outline-none focus:ring-2 focus:ring-[#D4Af37]"
                                        >
                                            <option value="15">15 Minutes</option>
                                            <option value="30">30 Minutes</option>
                                            <option value="60">1 Hour (Default)</option>
                                            <option value="240">4 Hours</option>
                                            <option value="1440">24 Hours</option>
                                        </select>
                                        <p className="text-[10px] text-[#4B3832]/60 dark:text-[#F5DEB3]/60">Automatically log out inactive users after specified idle period.</p>
                                    </div>

                                    {/* Password Reset Frequency */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#4B3832] dark:text-[#F5DEB3]">
                                            Mandatory Password Expiry
                                        </label>
                                        <select
                                            value={policyForm.passwordResetDays}
                                            onChange={(e) => setPolicyForm({ ...policyForm, passwordResetDays: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/70 dark:bg-black/40 border border-[#D4Af37]/30 rounded-xl text-sm font-semibold text-[#4B3832] dark:text-[#F5DEB3] focus:outline-none focus:ring-2 focus:ring-[#D4Af37]"
                                        >
                                            <option value="0">Disabled (Never Expire)</option>
                                            <option value="30">Every 30 Days</option>
                                            <option value="60">Every 60 Days</option>
                                            <option value="90">Every 90 Days</option>
                                        </select>
                                        <p className="text-[10px] text-[#4B3832]/60 dark:text-[#F5DEB3]/60">Force users to update credentials periodically.</p>
                                    </div>

                                    {/* Password Complexity Toggle */}
                                    <div className="space-y-2 flex flex-col justify-center">
                                        <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/30 rounded-xl border border-[#D4Af37]/20">
                                            <div>
                                                <span className="text-xs font-bold uppercase tracking-wider text-[#4B3832] dark:text-[#F5DEB3]">Strict Password Complexity</span>
                                                <p className="text-[10px] text-[#4B3832]/60 dark:text-[#F5DEB3]/60">Require numbers & special characters</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setPolicyForm({ ...policyForm, requireSpecialCharPassword: !policyForm.requireSpecialCharPassword })}
                                                className={cn(
                                                    "w-12 h-6 rounded-full p-1 transition-colors shrink-0",
                                                    policyForm.requireSpecialCharPassword ? 'bg-[#D4Af37]' : 'bg-gray-300 dark:bg-white/10'
                                                )}
                                            >
                                                <div className={cn(
                                                    "size-4 bg-white rounded-full shadow-md transform transition-transform",
                                                    policyForm.requireSpecialCharPassword ? 'translate-x-6' : ''
                                                )}></div>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* IP Whitelisting Sub-Section */}
                                <div className="p-4 md:p-6 bg-white/50 dark:bg-black/30 rounded-2xl border border-[#D4Af37]/20 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-sm text-[#4B3832] dark:text-[#F5DEB3]">IP Whitelisting Policy</h4>
                                            <p className="text-xs text-[#4B3832]/60 dark:text-[#F5DEB3]/60">Restrict administrative access to specified IP addresses or CIDR blocks.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setPolicyForm({ ...policyForm, ipWhitelistEnabled: !policyForm.ipWhitelistEnabled })}
                                            className={cn(
                                                "w-12 h-6 rounded-full p-1 transition-colors shrink-0",
                                                policyForm.ipWhitelistEnabled ? 'bg-[#D4Af37]' : 'bg-gray-300 dark:bg-white/10'
                                            )}
                                        >
                                            <div className={cn(
                                                "size-4 bg-white rounded-full shadow-md transform transition-transform",
                                                policyForm.ipWhitelistEnabled ? 'translate-x-6' : ''
                                            )}></div>
                                        </button>
                                    </div>

                                    {policyForm.ipWhitelistEnabled && (
                                        <div className="space-y-2 pt-2 border-t border-[#D4Af37]/10 animate-fade-in">
                                            <label className="block text-xs font-bold text-[#4B3832] dark:text-[#F5DEB3]">
                                                Allowed IP Addresses / Ranges (Comma-separated)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 192.168.1.1, 10.0.0.0/24, 41.200.12.5"
                                                value={policyForm.allowedIPs}
                                                onChange={(e) => setPolicyForm({ ...policyForm, allowedIPs: e.target.value })}
                                                className="w-full px-4 py-3 bg-white/80 dark:bg-black/50 border border-[#D4Af37]/30 rounded-xl text-sm text-[#4B3832] dark:text-[#F5DEB3] focus:outline-none focus:ring-2 focus:ring-[#D4Af37]"
                                            />
                                            <p className="text-[10px] text-[#4B3832]/50 dark:text-[#F5DEB3]/50">Leave empty to allow all IP addresses when whitelisting is active.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={savingPolicies}
                                        className="px-6 py-3.5 bg-[#D4Af37] hover:bg-[#b08d26] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#D4Af37]/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-base">save</span>
                                        {savingPolicies ? 'Saving Policies...' : 'Save Security Policies'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* System Action Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            <div className="bg-[#4B3832] text-[#F5DEB3] p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
                                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl md:text-9xl opacity-10 group-hover:scale-110 transition-transform duration-700">shield</span>
                                <h3 className="font-bold text-lg md:text-xl mb-3 leading-none">Security Override</h3>
                                <p className="text-xs md:text-sm opacity-70 mb-6 max-w-sm leading-relaxed">Initiate a global password reset for all staff accounts. This action is irreversible.</p>
                                <button 
                                    onClick={async () => {
                                        if (!window.confirm("ARE YOU SURE? This will log security audit logs and flag staff accounts for password resets.")) return;
                                        await logAuditAction("STAFF_LOCKDOWN_TRIGGERED", "CEO initiated staff lockdown security override", "Security");
                                        alert("Staff Lockdown signal emitted and recorded in System Audit Logs.");
                                    }}
                                    className="w-full sm:w-auto px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] md:text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95"
                                >
                                    Staff Lockdown
                                </button>
                            </div>

                            <div className="bg-white/40 dark:bg-black/20 p-6 md:p-8 rounded-[2rem] border border-[#D4Af37]/20 shadow-xl relative overflow-hidden group">
                                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl md:text-9xl opacity-5 group-hover:scale-110 transition-transform duration-700 text-[#D4Af37]">sync</span>
                                <h3 className="font-bold text-lg md:text-xl mb-3 leading-none text-[#4B3832] dark:text-[#F5DEB3]">Data Integrity</h3>
                                <p className="text-xs md:text-sm text-[#4B3832]/60 dark:text-[#F5DEB3]/60 mb-6 max-w-sm leading-relaxed">Force a system-wide synchronization of core curricula and platform configuration.</p>
                                <button
                                    onClick={async () => {
                                        if (!window.confirm("Force System Sync? This will overwrite or ensure all default courses and modules exist.")) return;
                                        try {
                                            setSaving(true);
                                            const res = await seedSystemData(true);
                                            await logAuditAction("SYSTEM_SYNC", `Force system sync completed. Courses: ${res.courses}, Modules: ${res.modules}`, "System Sync");
                                            alert(`Sync Complete! \nCourses updated: ${res.courses}\nModules added: ${res.modules}`);
                                        } catch (e) {
                                            console.error(e);
                                            alert("Sync failed.");
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                    disabled={saving}
                                    className="w-full sm:w-auto px-6 py-3.5 bg-[#D4Af37] hover:bg-[#b08d26] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#D4Af37]/20 active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? 'Syncing...' : 'Force System Sync'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Global Broadcasts Tab */}
                {activeTab === 'broadcasts' && (
                    <div className="space-y-6">
                        <div className="bg-white/40 dark:bg-black/20 rounded-[2rem] border border-[#D4Af37]/20 shadow-xl p-5 md:p-8 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4Af37]/10">
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold text-[#4B3832] dark:text-[#F5DEB3]">Global Broadcasts & Announcements</h3>
                                    <p className="text-xs md:text-sm text-[#4B3832]/60 dark:text-[#F5DEB3]/60">Manage active top-banner announcements, expiration times, and broadcast history.</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateForm(!showCreateForm)}
                                    className="px-4 py-2.5 bg-[#D4Af37] hover:bg-[#b08d26] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 self-start sm:self-auto"
                                >
                                    <span className="material-symbols-outlined text-base">{showCreateForm ? 'close' : 'add'}</span>
                                    {showCreateForm ? 'Cancel' : 'Launch New Broadcast'}
                                </button>
                            </div>

                            {/* Create Broadcast Form */}
                            {showCreateForm && (
                                <form onSubmit={handleCreateBroadcast} className="p-5 bg-white/60 dark:bg-black/40 rounded-2xl border border-[#D4Af37]/30 space-y-4 animate-fade-in">
                                    <h4 className="font-bold text-sm text-[#4B3832] dark:text-[#F5DEB3] flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#D4Af37]">campaign</span>
                                        Create Global Broadcast Banner
                                    </h4>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-[#4B3832] dark:text-[#F5DEB3]">Subject / Heading</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. System Maintenance Notice"
                                            value={newBroadcast.subject}
                                            onChange={(e) => setNewBroadcast({ ...newBroadcast, subject: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-black/60 border border-[#D4Af37]/30 rounded-xl text-sm font-semibold text-[#4B3832] dark:text-[#F5DEB3] focus:outline-none focus:ring-2 focus:ring-[#D4Af37]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-[#4B3832] dark:text-[#F5DEB3]">Announcement Message</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Type message visible to all active users..."
                                            value={newBroadcast.message}
                                            onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-black/60 border border-[#D4Af37]/30 rounded-xl text-sm text-[#4B3832] dark:text-[#F5DEB3] focus:outline-none focus:ring-2 focus:ring-[#D4Af37] resize-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-[#4B3832] dark:text-[#F5DEB3]">Auto-Expiration Duration</label>
                                        <select
                                            value={newBroadcast.durationHours}
                                            onChange={(e) => setNewBroadcast({ ...newBroadcast, durationHours: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-black/60 border border-[#D4Af37]/30 rounded-xl text-sm font-semibold text-[#4B3832] dark:text-[#F5DEB3] focus:outline-none focus:ring-2 focus:ring-[#D4Af37]"
                                        >
                                            <option value="1">Expire in 1 Hour</option>
                                            <option value="6">Expire in 6 Hours</option>
                                            <option value="24">Expire in 24 Hours (Default)</option>
                                            <option value="72">Expire in 3 Days</option>
                                            <option value="168">Expire in 7 Days</option>
                                            <option value="never">Permanent (No Auto-Expiration)</option>
                                        </select>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={creatingBroadcast}
                                            className="px-6 py-2.5 bg-[#4B3832] dark:bg-[#D4Af37] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                                        >
                                            {creatingBroadcast ? 'Launching...' : 'Publish Broadcast'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Broadcast List */}
                            {loadingAnnouncements ? (
                                <div className="py-12 text-center text-sm font-bold text-[#4B3832]/60 dark:text-[#F5DEB3]/60 flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined animate-spin text-xl text-[#D4Af37]">sync</span>
                                    Loading announcements...
                                </div>
                            ) : announcements.length === 0 ? (
                                <div className="py-12 text-center text-sm text-[#4B3832]/60 dark:text-[#F5DEB3]/60">
                                    No global broadcasts found. Click "Launch New Broadcast" to create one.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {announcements.map((item) => {
                                        const now = Date.now();
                                        const expTime = item.expiresAtDate ? item.expiresAtDate.getTime() : null;
                                        const isExpired = expTime && expTime < now;
                                        const isCurrentlyActive = item.active && !isExpired;

                                        return (
                                            <div key={item.id} className="p-4 md:p-6 bg-white/50 dark:bg-black/30 rounded-2xl border border-[#D4Af37]/20 space-y-3 relative group">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4Af37]/10 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                            isCurrentlyActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" :
                                                            isExpired ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" :
                                                            "bg-gray-500/10 text-gray-500 dark:text-gray-400 border border-gray-500/20"
                                                        )}>
                                                            {isCurrentlyActive ? 'ACTIVE BROADCAST' : isExpired ? 'EXPIRED' : 'DEACTIVATED'}
                                                        </span>
                                                        <span className="text-[11px] text-[#4B3832]/50 dark:text-[#F5DEB3]/50">
                                                            Launched: {item.createdAtDate?.toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {/* Active Switch */}
                                                        <button
                                                            onClick={() => handleToggleBroadcastActive(item.id, item.active, item.subject)}
                                                            className={cn(
                                                                "px-3 py-1 text-[10px] font-bold uppercase rounded-lg border transition-all flex items-center gap-1",
                                                                item.active 
                                                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20" 
                                                                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                                                            )}
                                                        >
                                                            <span className="material-symbols-outlined text-xs">
                                                                {item.active ? 'pause' : 'play_arrow'}
                                                            </span>
                                                            {item.active ? 'Deactivate' : 'Activate'}
                                                        </button>

                                                        {/* Extend Expiration */}
                                                        <button
                                                            onClick={() => handleExtendBroadcast(item.id, item.subject, 24)}
                                                            className="px-3 py-1 text-[10px] font-bold uppercase rounded-lg border border-[#D4Af37]/30 text-[#D4Af37] hover:bg-[#D4Af37]/10 transition-all flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-xs">update</span>
                                                            +24h
                                                        </button>

                                                        {/* Delete */}
                                                        <button
                                                            onClick={() => handleDeleteBroadcast(item.id, item.subject)}
                                                            className="p-1 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Delete Broadcast"
                                                        >
                                                            <span className="material-symbols-outlined text-base">delete</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-bold text-sm md:text-base text-[#4B3832] dark:text-[#F5DEB3]">{item.subject}</h4>
                                                    <p className="text-xs md:text-sm text-[#4B3832]/70 dark:text-[#F5DEB3]/70 mt-1 leading-relaxed">{item.message}</p>
                                                </div>

                                                <div className="flex items-center gap-4 text-[10px] text-[#4B3832]/50 dark:text-[#F5DEB3]/50 pt-1">
                                                    <span>
                                                        Expiration: {item.expiresAtDate ? item.expiresAtDate.toLocaleString() : 'Permanent (No Expiry)'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* System Audit Logs Tab */}
                {activeTab === 'audit' && (
                    <div className="bg-white/40 dark:bg-black/20 rounded-[2rem] border border-[#D4Af37]/20 shadow-xl overflow-hidden space-y-4 p-5 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4Af37]/10">
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-[#4B3832] dark:text-[#F5DEB3]">Audit Trail & Activity Logs</h3>
                                <p className="text-xs md:text-sm text-[#4B3832]/60 dark:text-[#F5DEB3]/60">Real-time log of security events, settings updates, and system operations.</p>
                            </div>

                            {/* Search & Filter Controls */}
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <div className="relative w-full sm:w-64">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#4B3832]/40 dark:text-[#F5DEB3]/40">search</span>
                                    <input
                                        type="text"
                                        placeholder="Search logs..."
                                        value={logSearch}
                                        onChange={(e) => setLogSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white/70 dark:bg-black/40 border border-[#D4Af37]/30 rounded-xl text-xs text-[#4B3832] dark:text-[#F5DEB3] focus:outline-none focus:ring-2 focus:ring-[#D4Af37]"
                                    />
                                </div>

                                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
                                    {['All', 'Security', 'Access Control', 'Broadcast', 'System Sync'].map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setLogFilter(cat)}
                                            className={cn(
                                                "px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-lg whitespace-nowrap transition-all",
                                                logFilter === cat
                                                    ? "bg-[#4B3832] text-[#F5DEB3] dark:bg-[#D4Af37] dark:text-white"
                                                    : "bg-white/40 dark:bg-white/10 text-[#4B3832]/70 dark:text-[#F5DEB3]/70 hover:bg-white/80"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Logs List Table */}
                        {loadingLogs ? (
                            <div className="py-12 text-center text-sm font-bold text-[#4B3832]/60 dark:text-[#F5DEB3]/60 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined animate-spin text-xl text-[#D4Af37]">sync</span>
                                Loading audit logs...
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="py-12 text-center text-sm text-[#4B3832]/60 dark:text-[#F5DEB3]/60">
                                No audit records found matching your criteria.
                            </div>
                        ) : (
                            <div className="divide-y divide-[#D4Af37]/10 overflow-x-auto">
                                <div className="min-w-[600px]">
                                    <div className="grid grid-cols-12 text-[10px] uppercase font-black tracking-wider text-[#4B3832]/50 dark:text-[#F5DEB3]/50 pb-2 px-3">
                                        <div className="col-span-3">Timestamp</div>
                                        <div className="col-span-3">Category / Action</div>
                                        <div className="col-span-4">Details</div>
                                        <div className="col-span-2 text-right">User</div>
                                    </div>

                                    {filteredLogs.map((log) => (
                                        <div key={log.id} className="grid grid-cols-12 items-center py-3.5 px-3 text-xs hover:bg-white/30 dark:hover:bg-white/5 transition-colors gap-2">
                                            <div className="col-span-3 text-[#4B3832]/70 dark:text-[#F5DEB3]/70 font-mono text-[11px]">
                                                {log.timestamp instanceof Date ? log.timestamp.toLocaleString() : 'N/A'}
                                            </div>
                                            <div className="col-span-3 flex flex-col items-start gap-1">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider",
                                                    log.category === 'Security' ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20" :
                                                    log.category === 'Access Control' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" :
                                                    log.category === 'Broadcast' ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20" :
                                                    "bg-[#D4Af37]/10 text-[#D4Af37] border border-[#D4Af37]/20"
                                                )}>
                                                    {log.category || 'General'}
                                                </span>
                                                <span className="font-bold text-[#4B3832] dark:text-[#F5DEB3] text-[11px] font-mono">
                                                    {log.action}
                                                </span>
                                            </div>
                                            <div className="col-span-4 text-[#4B3832]/80 dark:text-[#F5DEB3]/80 font-medium text-[11px] leading-relaxed">
                                                {log.details}
                                            </div>
                                            <div className="col-span-2 text-right font-bold text-[#D4Af37]">
                                                {log.performedBy || 'System'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
