import React, { useState, useEffect } from 'react';
import {
    collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function WeekendMedia() {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [form, setForm] = useState({
        type: 'photo',
        url: '',
        caption: '',
        date: new Date().toISOString().split('T')[0],
        activity: ''
    });

    useEffect(() => {
        const q = query(collection(db, 'weekend_media'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            setMedia(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.url) return;
        setUploading(true);
        try {
            await addDoc(collection(db, 'weekend_media'), {
                ...form,
                createdAt: serverTimestamp()
            });
            setForm({ type: 'photo', url: '', caption: '', date: new Date().toISOString().split('T')[0], activity: '' });
        } catch (err) {
            alert('Error adding media: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, 'weekend_media', id));
            setDeleteConfirm(null);
        } catch (err) {
            alert('Error deleting: ' + err.message);
        }
    };

    const activityOptions = [
        'Latte Art Masterclass', 'Sensory Cupping Session', 'Bean to Bag: Roasting Fun',
        'Espresso Extraction Workshop', 'Equipment & Tools Deep Dive', 'Farm to Cup Experience',
        'Cold Brew & Signature Drinks', 'Barista Basics Bootcamp', 'General / Other'
    ];

    return (
        <div className="p-6 md:p-10 space-y-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-3xl font-black text-[#4B3832] dark:text-[#F5DEB3]">Weekend Media Manager</h1>
                    <p className="text-sm text-espresso/50 dark:text-[#F5DEB3]/50 mt-1">Post photos & videos that appear on the public Weekend Experience page.</p>
                </div>
                <div className="size-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined">photo_library</span>
                </div>
            </div>

            {/* Add Form */}
            <div className="bg-white dark:bg-white/5 rounded-[2rem] p-8 border border-espresso/5 shadow-xl">
                <h2 className="font-black text-lg text-[#4B3832] dark:text-[#F5DEB3] mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500">add_photo_alternate</span>
                    Add New Media
                </h2>

                <form onSubmit={handleAdd} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Type */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">Media Type</label>
                            <div className="flex gap-3">
                                {['photo', 'video'].map(t => (
                                    <button
                                        key={t} type="button"
                                        onClick={() => setForm({ ...form, type: t })}
                                        className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${form.type === t ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg' : 'bg-[#FAF5E8] dark:bg-white/5 text-espresso/50 border border-espresso/10'}`}
                                    >
                                        <span className="material-symbols-outlined text-sm block mb-0.5">{t === 'photo' ? 'image' : 'play_circle'}</span>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Activity Tag */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">Activity (optional)</label>
                            <select
                                value={form.activity}
                                onChange={e => setForm({ ...form, activity: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold text-sm"
                            >
                                <option value="">— Select activity —</option>
                                {activityOptions.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>

                        {/* URL */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">
                                {form.type === 'video' ? 'Video URL (.mp4 or hosted link)' : 'Image URL (Firebase Storage, Cloudinary, etc.)'}
                            </label>
                            <input
                                type="url" required
                                placeholder={form.type === 'video' ? 'https://storage.googleapis.com/...' : 'https://res.cloudinary.com/...'}
                                value={form.url}
                                onChange={e => setForm({ ...form, url: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold"
                            />
                        </div>

                        {/* Caption */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">Caption</label>
                            <input
                                type="text"
                                placeholder="e.g. Saturday morning latte art session..."
                                value={form.caption}
                                onChange={e => setForm({ ...form, caption: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold"
                            />
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">Session Date</label>
                            <input
                                type="date" required
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    {form.url && form.type === 'photo' && (
                        <div className="rounded-2xl overflow-hidden h-48 relative">
                            <img src={form.url} alt="Preview" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                        </div>
                    )}

                    <button
                        type="submit" disabled={uploading || !form.url}
                        className="px-10 py-4 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-3"
                    >
                        {uploading ? (
                            <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Publishing...</>
                        ) : (
                            <><span className="material-symbols-outlined text-sm">publish</span>Publish to Weekend Page</>
                        )}
                    </button>
                </form>
            </div>

            {/* Media Grid */}
            <div>
                <h2 className="font-black text-lg text-[#4B3832] dark:text-[#F5DEB3] mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500">grid_view</span>
                    Published Media ({media.length})
                </h2>

                {loading && (
                    <div className="flex items-center justify-center h-32">
                        <div className="size-8 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
                    </div>
                )}

                {!loading && media.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 gap-4 bg-white dark:bg-white/5 rounded-3xl border border-espresso/5">
                        <span className="material-symbols-outlined text-4xl text-espresso/20">photo_library</span>
                        <p className="text-espresso/40 font-black">No media published yet. Add your first photo or video above!</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {media.map(item => (
                        <div key={item.id} className="bg-white dark:bg-white/5 rounded-[1.5rem] overflow-hidden border border-espresso/5 shadow-lg group">
                            {/* Thumbnail */}
                            <div className="aspect-video bg-[#FAF5E8] dark:bg-white/5 relative overflow-hidden">
                                {item.type === 'video' ? (
                                    <div className="w-full h-full flex items-center justify-center bg-espresso/10">
                                        <span className="material-symbols-outlined text-5xl text-espresso/30">play_circle</span>
                                    </div>
                                ) : (
                                    <img
                                        src={item.url}
                                        alt={item.caption}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={e => { e.target.src = ''; e.target.className = 'hidden'; }}
                                    />
                                )}
                                <div className="absolute top-3 left-3">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white ${item.type === 'video' ? 'bg-violet-600' : 'bg-rose-500'}`}>
                                        <span className="material-symbols-outlined text-[10px]">{item.type === 'video' ? 'play_arrow' : 'image'}</span>
                                        {item.type}
                                    </span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <p className="font-bold text-sm text-[#4B3832] dark:text-[#F5DEB3] truncate">{item.caption || 'No caption'}</p>
                                {item.activity && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{item.activity}</p>}
                                <p className="text-[10px] text-espresso/40 mt-1">{item.date || '—'}</p>

                                <div className="flex gap-2 mt-4">
                                    <a
                                        href={item.url} target="_blank" rel="noopener noreferrer"
                                        className="flex-1 py-2 text-center rounded-xl bg-[#FAF5E8] dark:bg-white/5 text-espresso/60 font-bold text-[10px] uppercase tracking-widest hover:bg-espresso hover:text-white transition-all flex items-center justify-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-sm">open_in_new</span>View
                                    </a>
                                    {deleteConfirm === item.id ? (
                                        <div className="flex gap-1 flex-1">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all"
                                            >Confirm</button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="px-3 rounded-xl bg-gray-200 dark:bg-white/10 text-espresso/50 font-bold text-[10px] hover:bg-gray-300 transition-all"
                                            >✕</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteConfirm(item.id)}
                                            className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-500 font-bold text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
