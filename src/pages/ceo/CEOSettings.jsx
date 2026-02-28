import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { cn } from '../../lib/utils';

export function CEOSettings({ settings: initialSettings }) {
    const [settings, setSettings] = useState(initialSettings || {
        registrationsOpen: true,
        maintenanceMode: false,
        autoApproveStudents: false,
        notifyOnNewUser: true,
        systemVersion: '2.4.0-EXEC'
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'system_settings', 'global'), (snap) => {
            if (snap.exists()) {
                setSettings(snap.data());
            }
        });
        return () => unsubscribe();
    }, []);

    const toggleSetting = async (key) => {
        try {
            setSaving(true);
            const settingsRef = doc(db, 'system_settings', 'global');
            await updateDoc(settingsRef, {
                [key]: !settings[key],
                updatedAt: new Date(),
                updatedBy: 'ceo'
            });
        } catch (error) {
            console.error("Error updating setting:", error);
            alert("Failed to update setting. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#FAF5E8] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-20 custom-scrollbar">
            <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8">
                <div className="relative pl-4 md:pl-0">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#D4Af37] -ml-4 md:hidden"></div>
                    <p className="text-[#D4Af37] font-black text-[10px] uppercase tracking-[0.4em] mb-2 leading-none">Platform Control</p>
                    <h1 className="text-3xl md:text-4xl font-serif font-black text-[#4B3832] dark:text-[#F5DEB3] leading-none">Global Settings</h1>
                </div>

                <div className="bg-white/40 dark:bg-black/20 rounded-[2rem] border border-[#D4Af37]/20 shadow-xl overflow-hidden">
                    <div className="p-5 md:p-8 border-b border-[#D4Af37]/10">
                        <h3 className="text-lg md:text-xl font-bold text-[#4B3832] dark:text-[#F5DEB3]">System Configuration</h3>
                        <p className="text-xs md:text-sm text-[#4B3832]/60 dark:text-[#F5DEB3]/60">Manage platform-wide behaviors and access protocols.</p>
                    </div>

                    <div className="divide-y divide-[#D4Af37]/10">
                        {[
                            { key: 'registrationsOpen', title: 'Public Registrations', desc: 'Allow new users to create accounts' },
                            { key: 'maintenanceMode', title: 'Maintenance Mode', desc: 'Restrict access to Admins & Executives only', danger: true },
                            { key: 'autoApproveStudents', title: 'Auto-Approve Students', desc: 'Automatically activate new student accounts' }
                        ].map((item) => (
                            <div key={item.key} className="p-4 md:p-6 flex items-center justify-between hover:bg-white/20 transition-colors gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm md:text-base text-[#4B3832] dark:text-[#F5DEB3] truncate">{item.title}</p>
                                    <p className="text-[10px] md:text-xs text-[#4B3832]/50 line-clamp-1 md:line-clamp-none">{item.desc}</p>
                                </div>
                                <button
                                    onClick={() => toggleSetting(item.key)}
                                    className={cn(
                                        "w-12 md:w-14 h-6 md:h-8 rounded-full p-1 transition-colors shrink-0",
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

                <div className="bg-[#4B3832] text-[#F5DEB3] p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
                    <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl md:text-9xl opacity-10 group-hover:scale-110 transition-transform duration-700">shield</span>
                    <h3 className="font-bold text-lg md:text-xl mb-3 leading-none">Security Override</h3>
                    <p className="text-xs md:text-sm opacity-70 mb-6 max-w-md leading-relaxed">Initiate a global password reset for all staff accounts. This action is irreversible and requires multi-factor authentication.</p>
                    <button className="w-full sm:w-auto px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] md:text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95">
                        Initiate Staff Lockdown
                    </button>
                </div>
            </div>
        </div>
    );
}
