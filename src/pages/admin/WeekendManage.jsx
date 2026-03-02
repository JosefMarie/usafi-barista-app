import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import { ShapeCard, SHAPES, ANIMATIONS, GRADIENTS } from '../../components/weekend/ShapeCard';

const MODULES = [
    { id: 'm1', title: 'Introduction to Coffee', icon: 'history_edu', color: 'from-amber-500 to-orange-600' },
    { id: 'm2', title: 'Coffee Roasting Profile', icon: 'local_fire_department', color: 'from-orange-500 to-rose-600' },
    { id: 'm3', title: 'Coffee Grinding Chart', icon: 'grain', color: 'from-rose-500 to-pink-600' },
    { id: 'm4', title: 'Espresso Extraction', icon: 'coffee_maker', color: 'from-pink-500 to-purple-600' },
    { id: 'm5', title: 'Latte Art Practice', icon: 'brush', color: 'from-purple-500 to-indigo-600' },
    { id: 'm6', title: 'Espresso-Based Drinks', icon: 'local_cafe', color: 'from-indigo-500 to-blue-600' },
    { id: 'm7', title: 'Basic Manual Brewing', icon: 'science', color: 'from-blue-500 to-emerald-600' },
];

const DEFAULT_CARD = {
    title: '',
    body: '',
    imageUrl: '',
    shape: 'rectangle',
    animation: 'float',
    color: 'from-amber-500 to-orange-600',
    type: 'text',
};

// ─── Bookings Tab ─────────────────────────────────────────────────────────────
function BookingsTab() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelected] = useState(null);
    const [progress, setProgress] = useState({});

    useEffect(() => {
        const q = query(collection(db, 'weekend_bookings'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snap) => {
            setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!selectedBooking?.userId) return;
        const q = query(collection(db, 'users', selectedBooking.userId, 'weekend_progress'));
        return onSnapshot(q, (snap) => {
            const p = {};
            snap.forEach(d => { p[d.id] = d.data(); });
            setProgress(p);
        });
    }, [selectedBooking]);

    const handleToggleModule = async (moduleId) => {
        if (!selectedBooking?.userId) return;
        const cur = progress[moduleId]?.status || 'locked';
        await setDoc(doc(db, 'users', selectedBooking.userId, 'weekend_progress', moduleId), {
            status: cur === 'completed' ? 'locked' : 'completed',
            updatedAt: serverTimestamp(), updatedBy: 'admin'
        }, { merge: true });
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[300px]">
            <div className="size-10 border-4 border-espresso/20 border-t-espresso rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2">
                <div className="bg-white dark:bg-white/5 rounded-3xl border border-espresso/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-espresso/5 border-b border-espresso/10">
                                    {['Visitor', 'Date & Duration', 'Status', 'Actions'].map(h => (
                                        <th key={h} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest text-espresso/40 ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-espresso/5">
                                {bookings.map(b => (
                                    <tr key={b.id} onClick={() => setSelected(b)} className={`cursor-pointer hover:bg-espresso/5 transition-colors ${selectedBooking?.id === b.id ? 'bg-rose-50 dark:bg-rose-500/5' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-espresso dark:text-white">{b.fullName}</div>
                                            <div className="text-xs text-espresso/40">{b.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-xs">{b.date}</div>
                                            <div className="text-[10px] uppercase font-black text-rose-500">{b.duration} Day(s)</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{b.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="size-8 rounded-lg bg-espresso text-white flex items-center justify-center hover:scale-110 transition-transform ml-auto">
                                                <span className="material-symbols-outlined text-sm">visibility</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!bookings.length && (
                                    <tr><td colSpan="4" className="px-6 py-12 text-center text-espresso/30 italic">No bookings found yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div>
                {selectedBooking ? (
                    <div className="bg-espresso text-[#F5DEB3] p-8 rounded-[3rem] shadow-2xl space-y-6 sticky top-32">
                        <div>
                            <h2 className="font-serif text-2xl font-black uppercase">{selectedBooking.fullName}</h2>
                            <p className="text-[10px] uppercase tracking-widest opacity-40">Journey Progress</p>
                        </div>
                        <div className="space-y-3">
                            {MODULES.map((mod, i) => {
                                const done = progress[mod.id]?.status === 'completed';
                                return (
                                    <button key={mod.id} onClick={() => handleToggleModule(mod.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${done ? 'bg-white/10 border-white/20' : 'border-white/5 hover:border-white/20'}`}>
                                        <div className={`size-10 rounded-xl flex items-center justify-center ${done ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/20'}`}>
                                            <span className="material-symbols-outlined text-xl">{done ? 'check_circle' : 'circle'}</span>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] uppercase tracking-widest opacity-40">Module {i + 1}</p>
                                            <p className={`font-bold text-sm ${done ? 'text-white' : 'text-white/60'}`}>{mod.title}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {!selectedBooking.userId && (
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                                <div className="flex gap-2 items-center mb-1">
                                    <span className="material-symbols-outlined text-sm">warning</span>
                                    <span className="font-black uppercase tracking-widest">Guest Account Missing</span>
                                </div>
                                This visitor hasn't created an account yet.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="min-h-[400px] border-2 border-dashed border-espresso/10 rounded-[3rem] flex flex-col items-center justify-center text-espresso/20 p-8 text-center">
                        <span className="material-symbols-outlined text-6xl mb-4">touch_app</span>
                        <p className="font-bold">Select a booking to manage their journey</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Content Cards Tab ────────────────────────────────────────────────────────
function ContentCardsTab() {
    const [activeModule, setActiveModule] = useState(MODULES[0]);
    const [cards, setCards] = useState([]);
    const [editing, setEditing] = useState(null); // null = closed, {} = new, {id,...} = existing
    const [form, setForm] = useState(DEFAULT_CARD);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    // Load cards for selected module
    useEffect(() => {
        const ref = collection(db, 'weekend_module_cards', activeModule.id, 'cards');
        const q = query(ref, orderBy('order', 'asc'));
        return onSnapshot(q, (snap) => {
            setCards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, () => setCards([]));
    }, [activeModule.id]);

    const openNew = () => { setForm({ ...DEFAULT_CARD, moduleId: activeModule.id, order: cards.length + 1 }); setEditing('new'); };
    const openEdit = (card) => { setForm(card); setEditing(card.id); };
    const closeEditor = () => { setEditing(null); setForm(DEFAULT_CARD); };

    const handleSave = async () => {
        setSaving(true);
        try {
            const ref = collection(db, 'weekend_module_cards', activeModule.id, 'cards');
            const payload = { ...form, moduleId: activeModule.id, updatedAt: serverTimestamp() };
            if (editing === 'new') {
                await addDoc(ref, { ...payload, createdAt: serverTimestamp() });
            } else {
                const { id, ...rest } = payload;
                await setDoc(doc(db, 'weekend_module_cards', activeModule.id, 'cards', editing), rest, { merge: true });
            }
            closeEditor();
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const handleDelete = async (cardId) => {
        setDeleting(cardId);
        await deleteDoc(doc(db, 'weekend_module_cards', activeModule.id, 'cards', cardId));
        setDeleting(null);
    };

    return (
        <div className="space-y-8">
            {/* Module Selector */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {MODULES.map(mod => (
                    <button key={mod.id} onClick={() => { setActiveModule(mod); closeEditor(); }}
                        className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${activeModule.id === mod.id
                            ? `bg-gradient-to-r ${mod.color} text-white border-transparent shadow-lg`
                            : 'bg-white dark:bg-white/5 text-espresso/60 dark:text-white/60 border-espresso/10 hover:border-espresso/20'}`}>
                        <span className="material-symbols-outlined text-base">{mod.icon}</span>
                        {mod.title}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Cards Grid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-serif font-black text-xl text-espresso dark:text-white uppercase">{activeModule.title}</h2>
                            <p className="text-xs text-espresso/40">{cards.length} card{cards.length !== 1 ? 's' : ''} created</p>
                        </div>
                        <button onClick={openNew}
                            className="flex items-center gap-2 px-5 py-3 bg-espresso text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg">
                            <span className="material-symbols-outlined text-base">add</span>
                            New Card
                        </button>
                    </div>

                    {cards.length === 0 && editing !== 'new' && (
                        <div className="border-2 border-dashed border-espresso/10 rounded-3xl py-16 flex flex-col items-center text-espresso/20">
                            <span className="material-symbols-outlined text-5xl mb-3">style</span>
                            <p className="font-bold text-sm">No cards yet — create the first one!</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {cards.map(card => (
                            <div key={card.id} className={`group relative ${editing === card.id ? 'ring-2 ring-rose-500 rounded-3xl' : ''}`}>
                                <div className="flex items-center justify-center p-4 bg-white/60 dark:bg-white/5 rounded-3xl border border-espresso/10">
                                    <ShapeCard card={card} size="small" />
                                </div>
                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(card)}
                                        className="size-8 rounded-xl bg-white shadow-lg text-espresso flex items-center justify-center hover:bg-espresso hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(card.id)} disabled={deleting === card.id}
                                        className="size-8 rounded-xl bg-white shadow-lg text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-50">
                                        <span className="material-symbols-outlined text-sm">{deleting === card.id ? 'hourglass_empty' : 'delete'}</span>
                                    </button>
                                </div>
                                <p className="text-[10px] font-black text-center mt-2 text-espresso/40 uppercase tracking-widest truncate px-2">{card.title || 'Untitled'}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card Editor + Live Preview */}
                {editing !== null ? (
                    <div className="space-y-6 sticky top-32">
                        {/* Live Preview */}
                        <div className="bg-espresso/5 dark:bg-white/5 rounded-3xl p-6 flex items-center justify-center min-h-[220px]">
                            <div className="max-w-[280px] w-full">
                                <ShapeCard card={form} size="normal" />
                            </div>
                        </div>

                        {/* Editor Form */}
                        <div className="bg-white dark:bg-white/5 rounded-3xl border border-espresso/10 p-6 space-y-5">
                            <h3 className="font-serif font-black text-lg text-espresso dark:text-white uppercase">
                                {editing === 'new' ? 'Create Card' : 'Edit Card'}
                            </h3>

                            {/* Content Type */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">Content Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['text', 'text+image'].map(t => (
                                        <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                                            className={`py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${form.type === t ? 'bg-espresso text-white border-espresso' : 'border-espresso/10 text-espresso/50 hover:border-espresso/30'}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">Title</label>
                                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Card title..."
                                    className="w-full px-4 py-3 rounded-xl border border-espresso/10 bg-espresso/5 dark:bg-white/5 text-espresso dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-sm" />
                            </div>

                            {/* Body */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">Body Text</label>
                                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                                    placeholder="Content description..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-espresso/10 bg-espresso/5 dark:bg-white/5 text-espresso dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-sm" />
                            </div>

                            {/* Image URL (only if text+image) */}
                            {form.type === 'text+image' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">Image URL</label>
                                    <input type="url" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                                        placeholder="https://..."
                                        className="w-full px-4 py-3 rounded-xl border border-espresso/10 bg-espresso/5 dark:bg-white/5 text-espresso dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-sm" />
                                </div>
                            )}

                            {/* Shape Picker */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">Shape</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {SHAPES.map(s => (
                                        <button key={s.id} type="button" onClick={() => setForm(f => ({ ...f, shape: s.id }))} title={s.label}
                                            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-[9px] font-black uppercase transition-all ${form.shape === s.id ? 'bg-rose-500 text-white border-rose-500' : 'border-espresso/10 text-espresso/50 hover:border-rose-500/40'}`}>
                                            <span className="material-symbols-outlined text-base">{s.icon}</span>
                                            <span className="truncate w-full text-center">{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Animation Picker */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">Animation</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {ANIMATIONS.map(a => (
                                        <button key={a.id} type="button" onClick={() => setForm(f => ({ ...f, animation: a.id }))}
                                            className={`flex items-center gap-2 py-2 px-3 rounded-xl border text-[10px] font-black uppercase transition-all ${form.animation === a.id ? 'bg-amber-500 text-white border-amber-500' : 'border-espresso/10 text-espresso/50 hover:border-amber-500/40'}`}>
                                            <span className="material-symbols-outlined text-sm">{a.icon}</span>
                                            {a.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {GRADIENTS.map(g => (
                                        <button key={g.id} type="button" onClick={() => setForm(f => ({ ...f, color: g.id }))} title={g.label}
                                            className={`size-9 rounded-xl border-4 transition-all ${form.color === g.id ? 'border-espresso scale-110 shadow-lg' : 'border-transparent'}`}
                                            style={{ background: g.preview }} />
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button onClick={closeEditor}
                                    className="flex-1 py-3 rounded-2xl border border-espresso/10 text-xs font-black uppercase tracking-widest text-espresso/60 hover:border-espresso/30 transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving}
                                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-60">
                                    {saving ? 'Saving...' : editing === 'new' ? 'Create Card' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="min-h-[400px] border-2 border-dashed border-espresso/10 rounded-[3rem] flex flex-col items-center justify-center text-espresso/20 p-8 text-center">
                        <span className="material-symbols-outlined text-6xl mb-4">add_card</span>
                        <p className="font-bold">Click "+ New Card" to create content<br />for this module</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function WeekendManage() {
    const [activeTab, setActiveTab] = useState('cards');

    const TABS = [
        { id: 'cards', label: 'Content Cards', icon: 'style' },
        { id: 'bookings', label: 'Bookings', icon: 'event' },
    ];

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="font-serif text-3xl md:text-4xl font-black text-espresso dark:text-white uppercase tracking-tight">
                        Weekend Experience
                    </h1>
                    <p className="text-espresso/60 dark:text-white/40 font-medium">Create interactive course cards and manage visitor bookings.</p>
                </div>
                {/* Tabs */}
                <div className="flex bg-espresso/5 dark:bg-white/5 p-1.5 rounded-2xl gap-1">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-espresso text-white shadow-lg'
                                : 'text-espresso/40 hover:text-espresso dark:text-white/40 dark:hover:text-white'}`}>
                            <span className="material-symbols-outlined text-base">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'cards' && <ContentCardsTab />}
            {activeTab === 'bookings' && <BookingsTab />}

            <style dangerouslySetInnerHTML={{
                __html: `
                .material-symbols-outlined { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            ` }} />
        </div>
    );
}
