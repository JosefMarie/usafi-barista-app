import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, startAfter } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function ManagerContacts() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState(new Set());

    useEffect(() => {
        setLoading(true);
        let q = collection(db, 'users');

        if (filterRole !== 'all') {
            q = query(collection(db, 'users'), where('role', '==', filterRole));
        } else {
            q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const filtered = fetchedUsers.filter(user => {
                if (!searchTerm) return true;
                const searchLower = searchTerm.toLowerCase();
                return (
                    (user.name || user.fullName)?.toLowerCase().includes(searchLower) ||
                    user.email?.toLowerCase().includes(searchLower) ||
                    user.phone?.includes(searchTerm) ||
                    user.id?.toLowerCase().includes(searchLower)
                );
            });

            setUsers(filtered);
            setLoading(false);
            setSelectedUsers(new Set()); // Reset selection on filter change
        });

        return () => unsubscribe();
    }, [filterRole, searchTerm]);

    const toggleSelectAll = () => {
        if (selectedUsers.size === users.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(users.map(u => u.id)));
        }
    };

    const toggleSelectUser = (id) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedUsers(newSelected);
    };

    const copyToClipboard = (type) => {
        const selectedData = users
            .filter(u => selectedUsers.has(u.id))
            .map(u => type === 'email' ? u.email : u.phone)
            .filter(Boolean); // Remove empty/null

        if (selectedData.length === 0) {
            alert(`No ${type}s found for selected users.`);
            return;
        }

        const text = selectedData.join(type === 'email' ? ', ' : '\n'); // Emails comma-separated, phones newline
        navigator.clipboard.writeText(text);
        alert(`Copied ${selectedData.length} ${type}s to clipboard!`);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 px-4 md:px-0 py-4 md:py-0">
            <header className="flex flex-col gap-2 md:gap-4 relative pl-4 md:pl-0">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 -ml-4 md:hidden"></div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-espresso dark:text-white font-serif leading-none">
                        Contacts Directory
                    </h1>
                    <p className="text-xs md:text-sm text-espresso/60 dark:text-white/60 mt-2 leading-relaxed">
                        View contact information for all users
                    </p>
                </div>
            </header>

            <div className="bg-[#F5DEB3] dark:bg-[#1c1916] p-4 md:p-6 rounded-[2rem] border border-espresso/10 shadow-xl flex flex-col gap-4 items-stretch relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                <div className="flex-1 relative w-full z-10">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-espresso/40 text-lg md:text-xl">search</span>
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 border border-espresso/10 rounded-xl bg-white/50 dark:bg-white/5 text-sm md:text-base text-espresso dark:text-white focus:outline-none focus:ring-2 focus:ring-espresso transition-all placeholder:text-espresso/30"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full z-10 no-scrollbar">
                    {['all', 'student', 'business_student', 'instructor', 'job_seeker', 'admin'].map((role) => (
                        <button
                            key={role}
                            onClick={() => setFilterRole(role)}
                            className={`px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm active:scale-95 ${filterRole === role
                                ? 'bg-espresso text-white'
                                : 'bg-white/40 dark:bg-white/5 text-espresso/70 dark:text-white/70 hover:bg-white/60 dark:hover:bg-white/10'
                                }`}
                        >
                            {role === 'business_student' ? 'Business' : role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {selectedUsers.size > 0 && (
                <div className="bg-espresso text-white p-4 md:p-5 rounded-[2rem] md:rounded-3xl flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 md:gap-4 animate-in fade-in slide-in-from-top-2 shadow-2xl relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary"></div>
                    <div className="flex items-center gap-2 md:gap-3 relative z-10">
                        <span className="material-symbols-outlined text-primary text-lg md:text-xl">check_circle</span>
                        <span className="font-black uppercase tracking-widest text-xs md:text-sm">{selectedUsers.size} users selected</span>
                    </div>
                    <div className="flex gap-2 md:gap-3 relative z-10 flex-wrap">
                        <button
                            onClick={() => copyToClipboard('email')}
                            className="flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 font-bold text-[10px] md:text-xs uppercase tracking-widest"
                        >
                            <span className="material-symbols-outlined text-[16px] md:text-[18px]">email</span>
                            <span className="hidden sm:inline">Copy Emails</span>
                            <span className="sm:hidden">Emails</span>
                        </button>
                        <button
                            onClick={() => copyToClipboard('phone')}
                            className="flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 font-bold text-[10px] md:text-xs uppercase tracking-widest"
                        >
                            <span className="material-symbols-outlined text-[16px] md:text-[18px]">call</span>
                            <span className="hidden sm:inline">Copy Phones</span>
                            <span className="sm:hidden">Phones</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2rem] border border-espresso/10 shadow-xl overflow-hidden relative group">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/30 dark:bg-white/5 border-b border-espresso/10">
                            <tr>
                                <th className="px-6 py-5 w-12">
                                    <input
                                        type="checkbox"
                                        checked={users.length > 0 && selectedUsers.size === users.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-espresso/20 text-espresso focus:ring-espresso w-4 h-4"
                                    />
                                </th>
                                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-espresso dark:text-white">User Identity</th>
                                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-espresso dark:text-white">Access Role</th>
                                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-espresso dark:text-white">Communication</th>
                                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-espresso dark:text-white">Phone Path</th>
                                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-espresso dark:text-white">Onboarded</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-espresso/10">
                            {users.map((user) => (
                                <tr key={user.id} className={`hover:bg-white/40 dark:hover:bg-white/5 transition-all group/row ${selectedUsers.has(user.id) ? 'bg-white/50 dark:bg-white/10' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.has(user.id)}
                                            onChange={() => toggleSelectUser(user.id)}
                                            className="rounded border-espresso/20 text-espresso focus:ring-espresso w-4 h-4"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center font-bold text-xs text-espresso dark:text-white uppercase">
                                                {(user.name || user.fullName)?.[0] || '?'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-espresso dark:text-white">{user.name || user.fullName || 'N/A'}</span>
                                                <span className="text-[9px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest">ID: {user.id?.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'admin' ? 'bg-red-50 text-red-700 border-red-200' :
                                            user.role === 'instructor' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                user.role === 'student' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                    user.role === 'business_student' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                            {user.role?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-espresso/80 dark:text-white/80 select-all">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 text-espresso/80 dark:text-white/80 select-all">
                                        {user.phone || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-espresso/60 dark:text-white/60">
                                        {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                            {!loading && users.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-espresso/60 dark:text-white/60">
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View (visible only on mobile) */}
            <div className="md:hidden space-y-3">
                {users.map((user) => (
                    <div key={user.id} className={`bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2rem] p-4 border border-espresso/10 shadow-xl relative overflow-hidden transition-all ${selectedUsers.has(user.id) ? 'ring-2 ring-espresso' : ''}`}>
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20"></div>
                        <div className="relative z-10 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.has(user.id)}
                                        onChange={() => toggleSelectUser(user.id)}
                                        className="rounded border-espresso/20 text-espresso focus:ring-espresso w-4 h-4 mt-0.5 shrink-0"
                                    />
                                    <div className="size-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center font-bold text-xs text-espresso dark:text-white shrink-0 uppercase">
                                        {(user.name || user.fullName)?.[0] || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-sm text-espresso dark:text-white truncate leading-none">{user.name || user.fullName || 'N/A'}</h3>
                                        <p className="text-[8px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest mt-1">ID: {user.id?.slice(0, 8)}</p>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border mt-1.5 ${user.role === 'admin' ? 'bg-red-50 text-red-700 border-red-200' :
                                            user.role === 'instructor' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                user.role === 'student' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                    user.role === 'business_student' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                            {user.role?.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="pl-7 space-y-1.5 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-espresso/40 text-[16px]">email</span>
                                    <span className="text-espresso/80 dark:text-white/80 truncate select-all">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-espresso/40 text-[16px]">call</span>
                                    <span className="text-espresso/80 dark:text-white/80 select-all">{user.phone || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-espresso/40 text-[16px]">event</span>
                                    <span className="text-espresso/60 dark:text-white/60">
                                        {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {!loading && users.length === 0 && (
                    <div className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2rem] p-8 border border-espresso/10 shadow-xl text-center">
                        <p className="text-espresso/60 dark:text-white/60 text-sm">No users found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
