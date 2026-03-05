import React, { useState, useEffect, useRef } from 'react';
import {
    collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

export function WeekendMedia() {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        type: 'photo',
        file: null,
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

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, file, type: file.type.startsWith('video/') ? 'video' : 'photo' });
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.file && !form.url) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            let finalUrl = form.url;

            if (form.file) {
                const folder = form.type === 'photo' ? 'weekend_media/photos' : 'weekend_media/videos';
                const fileRef = ref(storage, `${folder}/${Date.now()}_${form.file.name}`);

                const uploadTask = uploadBytesResumable(fileRef, form.file);

                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(progress);
                        },
                        (error) => reject(error),
                        async () => {
                            finalUrl = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve();
                        }
                    );
                });
            }

            await addDoc(collection(db, 'weekend_media'), {
                type: form.type,
                url: finalUrl,
                caption: form.caption,
                date: form.date,
                activity: form.activity,
                createdAt: serverTimestamp()
            });

            setForm({
                type: 'photo',
                file: null,
                url: '',
                caption: '',
                date: new Date().toISOString().split('T')[0],
                activity: ''
            });
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err) {
            console.error("Upload error:", err);
            alert('Error adding media: ' + err.message);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDelete = async (item) => {
        try {
            // Delete from Storage if it's a storage URL
            if (item.url && item.url.includes('firebasestorage.googleapis.com')) {
                const storageRef = ref(storage, item.url);
                await deleteObject(storageRef).catch(err => console.error("Storage delete fail:", err));
            }

            // Delete from Firestore
            await deleteDoc(doc(db, 'weekend_media', item.id));
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
        <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-espresso/10 pb-10">
                <div>
                    <h1 className="font-serif text-4xl font-black text-[#4B3832] dark:text-[#F5DEB3] tracking-tight">Weekend Media Archive</h1>
                    <p className="text-sm text-espresso/50 dark:text-[#F5DEB3]/50 mt-1 uppercase tracking-widest font-black">Streaming Real Moments to the Public</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black uppercase text-espresso/40">Archive Capacity</p>
                        <p className="text-xs font-bold text-espresso/60">{media.length} Published Items</p>
                    </div>
                    <div className="size-14 rounded-3xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-2xl">
                        <span className="material-symbols-outlined text-3xl">photo_library</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Add Form (LHS) */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="sticky top-10">
                        <div className="bg-white dark:bg-white/5 rounded-[3rem] p-10 border border-espresso/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-rose-500 to-amber-500"></div>

                            <h2 className="font-black text-xl text-[#4B3832] dark:text-[#F5DEB3] mb-8 flex items-center gap-3">
                                <span className="material-symbols-outlined text-rose-500 font-bold">add_circle</span>
                                Upload New Session
                            </h2>

                            <form onSubmit={handleAdd} className="space-y-8">
                                {/* Upload Area */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 ml-4">Media File</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`h-48 rounded-[2.5rem] border-2 border-dashed border-espresso/10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all hover:bg-espresso/5 relative overflow-hidden ${form.file ? 'border-amber-500 bg-amber-500/5' : ''}`}
                                    >
                                        {form.file ? (
                                            <div className="text-center p-6 w-full">
                                                <span className="material-symbols-outlined text-4xl text-amber-600 mb-2">
                                                    {form.type === 'photo' ? 'image' : 'movie'}
                                                </span>
                                                <p className="text-xs font-black text-amber-800 truncate px-4">{form.file.name}</p>
                                                <p className="text-[10px] font-bold text-amber-600/60 mt-1">{(form.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="size-14 rounded-2xl bg-espresso/5 flex items-center justify-center text-espresso/30 group-hover:scale-110 transition-transform">
                                                    <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                                                </div>
                                                <div className="text-center px-4">
                                                    <p className="text-xs font-black uppercase tracking-widest text-espresso">Select Assets</p>
                                                    <p className="text-[9px] font-bold text-espresso/40 mt-1">Photos (JPG/PNG) or MP4 Videos</p>
                                                </div>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            accept="image/*,video/*"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40 ml-2">Activity Tag</label>
                                        <select
                                            value={form.activity}
                                            onChange={e => setForm({ ...form, activity: e.target.value })}
                                            className="w-full px-5 h-14 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">— Choose session activity —</option>
                                            {activityOptions.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40 ml-2">Caption / Context</label>
                                        <input
                                            type="text"
                                            placeholder="Write a brief story/caption..."
                                            value={form.caption}
                                            onChange={e => setForm({ ...form, caption: e.target.value })}
                                            className="w-full px-5 h-14 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40 ml-2">Session Date</label>
                                        <input
                                            type="date"
                                            value={form.date}
                                            onChange={e => setForm({ ...form, date: e.target.value })}
                                            className="w-full px-5 h-14 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold text-sm appearance-none"
                                        />
                                    </div>
                                </div>

                                {uploading && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-rose-500">
                                            <span>Broadcasting Asset...</span>
                                            <span>{Math.round(uploadProgress)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-rose-100 dark:bg-rose-900/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={uploading || (!form.file && !form.url)}
                                    className="w-full h-16 bg-espresso text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group/btn"
                                >
                                    {uploading ? (
                                        <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-xl group-hover/btn:translate-y-[-2px] transition-transform">publish</span>
                                            Capture & Publish
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Media Grid (RHS) */}
                <div className="lg:col-span-7 space-y-8 pb-32">
                    <div className="flex items-center justify-between">
                        <h2 className="font-black text-2xl text-[#4B3832] dark:text-[#F5DEB3] uppercase tracking-tighter">Live Highlights</h2>
                        <div className="flex items-center gap-2 px-4 py-2 bg-espresso/5 rounded-full border border-espresso/10">
                            <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-espresso/60">Synchronized</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 animate-pulse">
                            <div className="size-12 border-4 border-rose-500/10 border-t-rose-500 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-espresso/40">Loading Archive...</p>
                        </div>
                    ) : media.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-6 bg-white dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-espresso/5 opacity-40 grayscale text-center">
                            <span className="material-symbols-outlined text-8xl text-espresso/20">camera_outdoor</span>
                            <div>
                                <h3 className="text-xl font-serif font-black text-espresso">Archive is Empty</h3>
                                <p className="text-sm font-medium text-espresso/60 mt-2 max-w-xs mx-auto">Managers: start by uploading the first photos or videos from recent weekend workshops.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="columns-1 md:columns-2 gap-6 space-y-6">
                            {media.map(item => (
                                <div key={item.id} className="break-inside-avoid group relative bg-white dark:bg-white/5 rounded-[2rem] overflow-hidden border border-espresso/5 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                                    {/* Thumbnail */}
                                    <div className="aspect-[4/5] bg-espresso/5 relative overflow-hidden">
                                        {item.type === 'video' ? (
                                            <video
                                                src={item.url}
                                                className="w-full h-full object-cover"
                                                muted loop onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()}
                                            />
                                        ) : (
                                            <img
                                                src={item.url}
                                                alt={item.caption}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        )}

                                        <div className="absolute top-4 left-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${item.type === 'video' ? 'bg-indigo-600' : 'bg-rose-500'}`}>
                                                <span className="material-symbols-outlined text-[12px]">{item.type === 'video' ? 'movie' : 'image'}</span>
                                                {item.type}
                                            </span>
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                            <button
                                                onClick={() => setDeleteConfirm(item.id)}
                                                className="size-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all self-end"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        {item.activity && (
                                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">{item.activity}</p>
                                        )}
                                        <p className="text-sm font-bold text-espresso dark:text-white leading-tight mb-4 italic line-clamp-2">
                                            "{item.caption || 'Live Moment'}"
                                        </p>
                                        <div className="flex items-center justify-between pt-4 border-t border-espresso/5">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm text-espresso/30">event</span>
                                                <span className="text-[10px] font-bold text-espresso/40 uppercase">{item.date}</span>
                                            </div>
                                            <a
                                                href={item.url} target="_blank" rel="noreferrer"
                                                className="text-[9px] font-black uppercase tracking-wider text-amber-600 hover:text-amber-500 transition-colors"
                                            >
                                                View Asset →
                                            </a>
                                        </div>
                                    </div>

                                    {/* Delete Modal Overlay */}
                                    {deleteConfirm === item.id && (
                                        <div className="absolute inset-0 z-20 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                                            <span className="material-symbols-outlined text-5xl text-red-500 mb-4 animate-bounce">warning</span>
                                            <h4 className="text-white font-black text-lg uppercase tracking-tight">Delete Asset?</h4>
                                            <p className="text-white/60 text-xs mt-2 mb-8">This will permanently remove the media from the public gallery. This cannot be undone.</p>
                                            <div className="flex gap-4 w-full">
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all"
                                                >PERMANENTLY DELETE</button>
                                                <button
                                                    onClick={() => setDeleteConfirm(null)}
                                                    className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
                                                >CANCEL</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
