import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { GradientButton } from '../../components/ui/GradientButton';

export function CEOStaff() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null); // For promoting/demoting modal

    useEffect(() => {
        // Query users where role is admin, manager, or instructor
        // FireStore 'in' query supports up to 10 comparison values
        const q = query(
            collection(db, 'users'),
            where('role', 'in', ['admin', 'manager', 'instructor', 'ceo'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const staffList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by role hierarchy
            const roleOrder = { ceo: 0, admin: 1, manager: 2, instructor: 3 };
            staffList.sort((a, b) => (roleOrder[a.role] || 4) - (roleOrder[b.role] || 4));

            setStaff(staffList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                role: newRole
            });
            // Ideally show a toast
            console.log(`Updated user ${userId} to ${newRole}`);
        } catch (error) {
            console.error("Error updating role:", error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-[#4B3832] dark:text-[#F5DEB3]"><span className="material-symbols-outlined animate-spin text-4xl">diamond</span></div>;
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#FAF5E8] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-20">
            <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between relative gap-4 pl-4 md:pl-0">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#D4Af37] -ml-4 md:hidden"></div>
                    <div>
                        <h1 className="text-2xl md:text-4xl font-serif font-black text-[#4B3832] dark:text-[#F5DEB3] uppercase tracking-tight leading-none">Command Structure</h1>
                        <p className="text-[10px] font-black text-[#D4Af37] uppercase tracking-[0.3em] mt-2 leading-none">Executive Personnel Management</p>
                    </div>
                </div>

                <div className="grid gap-4 md:gap-6">
                    {staff.map(user => (
                        <div key={user.id} className="bg-white/40 dark:bg-black/20 p-5 md:p-8 rounded-3xl md:rounded-[2rem] border border-[#D4Af37]/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between hover:shadow-2xl hover:bg-white/60 dark:hover:bg-black/30 transition-all group relative overflow-hidden gap-6">
                            <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-2 transition-colors",
                                user.role === 'ceo' ? "bg-[#D4Af37]" :
                                    user.role === 'admin' ? "bg-[#4B3832]" :
                                        "bg-[#4B3832]/40"
                            )}></div>

                            <div className="flex items-center gap-4 md:gap-8 w-full">
                                <div className="relative shrink-0">
                                    <div className={cn(
                                        "size-16 md:size-20 rounded-2xl md:rounded-[1.5rem] overflow-hidden border-2 shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center",
                                        user.role === 'ceo' ? "border-[#D4Af37] bg-[#D4Af37]" : "border-[#4B3832]/20 bg-espresso/5"
                                    )}>
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt={user.fullName || user.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="material-symbols-outlined text-3xl md:text-4xl opacity-30">person</span>
                                        )}
                                    </div>
                                    {user.role === 'ceo' && (
                                        <div className="absolute -top-2 -right-2 bg-[#D4Af37] text-[#4B3832] p-1 rounded-full shadow-md z-10 border border-white">
                                            <span className="material-symbols-outlined text-[10px] md:text-sm font-bold">diamond</span>
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-serif font-black text-lg md:text-2xl text-[#4B3832] dark:text-[#F5DEB3] tracking-tight truncate leading-tight">
                                        {user.fullName || user.name || 'Unnamed Staff'}
                                    </h3>
                                    <p className="text-[9px] font-black text-[#4B3832]/50 dark:text-[#F5DEB3]/40 uppercase tracking-widest mt-1 truncate">
                                        {user.email}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] shadow-sm border",
                                            user.role === 'ceo' ? "bg-[#D4Af37]/20 border-[#D4Af37] text-[#D4Af37]" :
                                                user.role === 'admin' ? "bg-[#4B3832]/10 border-[#4B3832] text-[#4B3832] dark:text-[#F5DEB3] dark:border-[#F5DEB3]/20" :
                                                    "bg-gray-100 border-gray-200 text-gray-500 dark:bg-white/5 dark:border-white/10 dark:text-white/40"
                                        )}>
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-espresso/5">
                                {user.role !== 'ceo' ? (
                                    <>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#4B3832]/40 mb-1 hidden lg:block">Modify Access</p>
                                        <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end md:justify-end">
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleRoleUpdate(user.id, 'admin')}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-[#4B3832] text-[#F5DEB3] text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#D4Af37] hover:text-[#4B3832] transition-colors shadow-lg shadow-espresso/10 active:scale-95 whitespace-nowrap"
                                                >
                                                    Promote to Admin
                                                </button>
                                            )}
                                            {user.role !== 'manager' && (
                                                <button
                                                    onClick={() => handleRoleUpdate(user.id, 'manager')}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-white/5 hover:bg-[#4B3832] hover:text-[#F5DEB3] text-[#4B3832] dark:text-[#F5DEB3]/60 text-[9px] font-black uppercase tracking-widest rounded-xl border border-[#4B3832]/10 transition-colors active:scale-95 whitespace-nowrap"
                                                >
                                                    Set as Manager
                                                </button>
                                            )}
                                            {user.role === 'admin' && (
                                                <button
                                                    onClick={() => handleRoleUpdate(user.id, 'instructor')}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 border border-red-100 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 hover:text-white transition-colors active:scale-95"
                                                >
                                                    Demote
                                                </button>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center md:justify-end opacity-20">
                                        <span className="material-symbols-outlined text-3xl">verified_user</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest ml-2">Executive Access</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
