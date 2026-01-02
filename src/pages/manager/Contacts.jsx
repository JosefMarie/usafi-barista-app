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
                    user.name?.toLowerCase().includes(searchLower) ||
                    user.email?.toLowerCase().includes(searchLower) ||
                    user.phone?.includes(searchTerm)
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
        <div className="max-w-7xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-espresso dark:text-white font-serif">
                        Contacts Directory
                    </h1>
                    <p className="text-espresso/60 dark:text-white/60">
                        View contact information for all users
                    </p>
                </div>
            </header>

            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl border border-black/5 dark:border-white/5 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative w-full">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                    {['all', 'student', 'business_student', 'instructor', 'job_seeker', 'admin'].map((role) => (
                        <button
                            key={role}
                            onClick={() => setFilterRole(role)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterRole === role
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-white/5 text-espresso/70 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/10'
                                }`}
                        >
                            {role === 'business_student' ? 'Business Student' : role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedUsers.size > 0 && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">check_circle</span>
                        <span className="font-bold text-primary">{selectedUsers.size} users selected</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => copyToClipboard('email')}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black/20 text-espresso dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-black/40 transition-colors border border-black/5 dark:border-white/10 font-medium text-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">mail</span>
                            Copy Emails
                        </button>
                        <button
                            onClick={() => copyToClipboard('phone')}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black/20 text-espresso dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-black/40 transition-colors border border-black/5 dark:border-white/10 font-medium text-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">call</span>
                            Copy Phones
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-black/5 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        checked={users.length > 0 && selectedUsers.size === users.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </th>
                                <th className="px-6 py-4 font-bold text-espresso dark:text-white">User</th>
                                <th className="px-6 py-4 font-bold text-espresso dark:text-white">Role</th>
                                <th className="px-6 py-4 font-bold text-espresso dark:text-white">Email</th>
                                <th className="px-6 py-4 font-bold text-espresso dark:text-white">Phone</th>
                                <th className="px-6 py-4 font-bold text-espresso dark:text-white">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {users.map((user) => (
                                <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${selectedUsers.has(user.id) ? 'bg-primary/5' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.has(user.id)}
                                            onChange={() => toggleSelectUser(user.id)}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center font-bold text-xs text-espresso dark:text-white">
                                                {user.name?.[0] || '?'}
                                            </div>
                                            <span className="font-medium text-espresso dark:text-white">{user.name || 'N/A'}</span>
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
        </div>
    );
}
