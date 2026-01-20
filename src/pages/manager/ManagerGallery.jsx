import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { cn } from '../../lib/utils';

export function ManagerGallery() {
    const [galleryItems, setGalleryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        type: 'image', // 'image' or 'video'
        description: '',
        file: null,
        url: ''
    });

    useEffect(() => {
        const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setGalleryItems(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFormData({ ...formData, file: e.target.files[0] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            let fileUrl = formData.url;

            if (formData.file) {
                const folder = formData.type === 'image' ? 'gallery/images' : 'gallery/videos';
                const storageRef = ref(storage, `${folder}/${Date.now()}_${formData.file.name}`);
                const snapshot = await uploadBytes(storageRef, formData.file);
                fileUrl = await getDownloadURL(snapshot.ref);
            }

            const galleryData = {
                type: formData.type,
                description: formData.description,
                url: fileUrl,
                createdAt: serverTimestamp()
            };

            if (editingItem) {
                await updateDoc(doc(db, 'gallery', editingItem.id), {
                    ...galleryData,
                    createdAt: editingItem.createdAt
                });
            } else {
                await addDoc(collection(db, 'gallery'), galleryData);
            }

            resetForm();
        } catch (error) {
            console.error("Error saving gallery item:", error);
            alert("Failed to save item.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm("Delete this memory from the gallery?")) return;
        try {
            if (item.url && item.url.includes('firebase')) {
                const fileRef = ref(storage, item.url);
                await deleteObject(fileRef).catch(e => console.error("Storage delete fail:", e));
            }
            await deleteDoc(doc(db, 'gallery', item.id));
        } catch (error) {
            console.error("Error deleting gallery item:", error);
        }
    };

    const resetForm = () => {
        setFormData({ type: 'image', description: '', file: null, url: '' });
        setEditingItem(null);
        setIsAdding(false);
    };

    if (loading) return <div className="p-8">Syncing Memories...</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-32">
            <div className="w-full px-2 py-10 space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-4 md:-ml-10"></div>
                    <div>
                        <h1 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Visual Archives</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-1 md:mt-2">Managing Institutional Media & Historical Assets</p>
                    </div>
                    <button
                        onClick={() => { setIsAdding(!isAdding); if (isAdding) resetForm(); }}
                        className="h-12 md:h-14 px-8 bg-espresso text-white rounded-2xl font-serif font-black text-sm uppercase tracking-widest shadow-xl hover:shadow-espresso/40 hover:-translate-y-1 transition-all flex items-center gap-3"
                    >
                        <span className="material-symbols-outlined">{isAdding ? 'close' : 'add_photo_alternate'}</span>
                        {isAdding ? 'Close Archive' : 'New Media Post'}
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-white/40 dark:bg-black/20 rounded-[2.5rem] p-8 md:p-12 border border-espresso/10 shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-500">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="flex gap-4 p-1.5 bg-espresso/5 rounded-2xl border border-espresso/10 w-fit">
                                        {['image', 'video'].map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: t })}
                                                className={cn(
                                                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    formData.type === t ? "bg-espresso text-white shadow-lg" : "text-espresso/40 hover:text-espresso"
                                                )}
                                            >
                                                {t === 'image' ? 'Still Frame' : 'Motion Video'}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em] ml-2">Description / Context</label>
                                        <textarea
                                            required
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full p-4 bg-white/60 dark:bg-black/40 border border-espresso/10 rounded-2xl focus:ring-2 focus:ring-espresso focus:border-transparent outline-none min-h-[120px] transition-all"
                                            placeholder="Write about this photo or video..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em] ml-2">Media Asset (Required)</label>
                                        <div className="aspect-video rounded-3xl bg-espresso/5 border-2 border-dashed border-espresso/10 flex items-center justify-center relative overflow-hidden group cursor-pointer transition-all hover:bg-espresso/[0.08]">
                                            {formData.file || formData.url ? (
                                                formData.type === 'image' ? (
                                                    <img
                                                        src={formData.file ? URL.createObjectURL(formData.file) : formData.url}
                                                        className="w-full h-full object-cover"
                                                        alt="Preview"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-espresso">
                                                        <span className="material-symbols-outlined text-4xl">movie</span>
                                                        <span className="text-[10px] font-black">{formData.file?.name || 'Video Linked'}</span>
                                                    </div>
                                                )
                                            ) : (
                                                <div className="text-center space-y-2 opacity-30">
                                                    <span className="material-symbols-outlined text-5xl">upload_file</span>
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Select {formData.type} File</p>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept={formData.type === 'image' ? "image/*" : "video/*"}
                                                onChange={handleFileChange}
                                                required={!editingItem && !formData.url}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="w-full h-16 bg-espresso text-white rounded-2xl font-serif font-black text-xl uppercase tracking-tighter shadow-2xl hover:shadow-espresso/40 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                                    >
                                        {uploading ? (
                                            <><span className="animate-spin material-symbols-outlined">sync</span> STORING ASSET...</>
                                        ) : (
                                            <><span className="material-symbols-outlined">publish</span> ARCHIVE MEDIA</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                    {galleryItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white/20 rounded-[3rem] border-2 border-dashed border-espresso/10 opacity-30 w-full">
                            <span className="material-symbols-outlined text-8xl">photo_library</span>
                            <div className="text-center">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.5em]">Gallery Matrix Empty</h3>
                                <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-2">No visual assets preserved in archive</p>
                            </div>
                        </div>
                    ) : (
                        galleryItems.map(item => (
                            <div key={item.id} className="break-inside-avoid relative bg-white/40 dark:bg-black/20 rounded-[2rem] overflow-hidden border border-espresso/10 shadow-xl transition-all hover:shadow-espresso/10 group">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/5 group-hover:bg-espresso transition-colors z-10"></div>

                                {item.type === 'image' ? (
                                    <img src={item.url} className="w-full h-auto object-cover" alt="Gallery" />
                                ) : (
                                    <div className="aspect-video bg-black flex items-center justify-center relative">
                                        <video className="w-full h-full object-cover opacity-50">
                                            <source src={item.url} type="video/mp4" />
                                        </video>
                                        <span className="absolute material-symbols-outlined text-4xl text-white opacity-40">play_circle</span>
                                    </div>
                                )}

                                <div className="p-6 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-black text-espresso/30 uppercase tracking-[0.3em]">{item.type} NODE</span>
                                        <button
                                            onClick={() => handleDelete(item)}
                                            className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                    <p className="text-espresso/70 dark:text-white/70 text-sm font-medium leading-relaxed italic">
                                        "{item.description}"
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
