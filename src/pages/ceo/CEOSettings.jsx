import React, { useState } from 'react';

export function CEOSettings() {
    const [settings, setSettings] = useState({
        registrationsOpen: true,
        maintenanceMode: false,
        autoApproveStudents: false,
        notifyOnNewUser: true,
        systemVersion: '2.4.0-EXEC'
    });

    const toggleSetting = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#FAF5E8] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-12 custom-scrollbar">
            <div className="w-full max-w-5xl mx-auto px-6 space-y-8">
                <div>
                    <p className="text-[#D4Af37] font-black text-[10px] uppercase tracking-[0.4em] mb-2">Platform Control</p>
                    <h1 className="text-4xl font-serif font-black text-[#4B3832] dark:text-[#F5DEB3]">Global Settings</h1>
                </div>

                <div className="bg-white/40 dark:bg-black/20 rounded-[2rem] border border-[#D4Af37]/20 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-[#D4Af37]/10">
                        <h3 className="text-xl font-bold text-[#4B3832] dark:text-[#F5DEB3]">System Configuration</h3>
                        <p className="text-sm text-[#4B3832]/60 dark:text-[#F5DEB3]/60">Manage platform-wide behaviors and access protocols.</p>
                    </div>

                    <div className="divide-y divide-[#D4Af37]/10">
                        <div className="p-6 flex items-center justify-between hover:bg-white/20 transition-colors">
                            <div>
                                <p className="font-bold text-[#4B3832] dark:text-[#F5DEB3]">Public Registrations</p>
                                <p className="text-xs text-[#4B3832]/50">Allow new users to create accounts</p>
                            </div>
                            <button
                                onClick={() => toggleSetting('registrationsOpen')}
                                className={`w-14 h-8 rounded-full p-1 transition-colors ${settings.registrationsOpen ? 'bg-[#D4Af37]' : 'bg-gray-300'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${settings.registrationsOpen ? 'translate-x-6' : ''}`}></div>
                            </button>
                        </div>

                        <div className="p-6 flex items-center justify-between hover:bg-white/20 transition-colors">
                            <div>
                                <p className="font-bold text-[#4B3832] dark:text-[#F5DEB3]">Maintenance Mode</p>
                                <p className="text-xs text-[#4B3832]/50">Restrict access to Admins & Executives only</p>
                            </div>
                            <button
                                onClick={() => toggleSetting('maintenanceMode')}
                                className={`w-14 h-8 rounded-full p-1 transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${settings.maintenanceMode ? 'translate-x-6' : ''}`}></div>
                            </button>
                        </div>

                        <div className="p-6 flex items-center justify-between hover:bg-white/20 transition-colors">
                            <div>
                                <p className="font-bold text-[#4B3832] dark:text-[#F5DEB3]">Auto-Approve Students</p>
                                <p className="text-xs text-[#4B3832]/50">Automatically activate new student accounts</p>
                            </div>
                            <button
                                onClick={() => toggleSetting('autoApproveStudents')}
                                className={`w-14 h-8 rounded-full p-1 transition-colors ${settings.autoApproveStudents ? 'bg-[#D4Af37]' : 'bg-gray-300'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${settings.autoApproveStudents ? 'translate-x-6' : ''}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-[#4B3832] text-[#F5DEB3] p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                    <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl opacity-10">shield</span>
                    <h3 className="font-bold text-xl mb-4">Security Override</h3>
                    <p className="text-sm opacity-70 mb-6 max-w-md">Initiate a global password reset for all staff accounts. This action is irreversible and requires multi-factor authentication.</p>
                    <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg">
                        Initiate Staff Lockdown
                    </button>
                </div>
            </div>
        </div>
    );
}
