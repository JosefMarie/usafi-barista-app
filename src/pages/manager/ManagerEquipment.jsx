import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { GradientButton } from '../../components/ui/GradientButton';
import { cn } from '../../lib/utils';

export function ManagerEquipment() {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        description: '',
        price: '',
        buyUrl: '',
        image: null,
        imageUrl: ''
    });

    useEffect(() => {
        const q = query(collection(db, 'equipment'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEquipment(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setFormData({ ...formData, image: e.target.files[0] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            let imageUrl = formData.imageUrl;

            if (formData.image) {
                const storageRef = ref(storage, `equipment/${Date.now()}_${formData.image.name}`);
                const snapshot = await uploadBytes(storageRef, formData.image);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            const equipmentData = {
                description: formData.description,
                price: formData.price,
                buyUrl: formData.buyUrl,
                imageUrl,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            if (editingItem) {
                await updateDoc(doc(db, 'equipment', editingItem.id), {
                    ...equipmentData,
                    createdAt: editingItem.createdAt // preserve original creation date
                });
            } else {
                await addDoc(collection(db, 'equipment'), equipmentData);
            }

            resetForm();
        } catch (error) {
            console.error("Error saving equipment:", error);
            alert("Failed to save equipment. Check console for details.");
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            description: item.description,
            price: item.price || '',
            buyUrl: item.buyUrl || '',
            image: null,
            imageUrl: item.imageUrl
        });
        setIsAdding(true);
    };

    const handleDelete = async (item) => {
        if (!window.confirm("Are you sure you want to delete this tool?")) return;

        try {
            // Delete image from storage
            if (item.imageUrl) {
                const imageRef = ref(storage, item.imageUrl);
                await deleteObject(imageRef).catch(err => console.error("Storage delete error:", err));
            }
            await deleteDoc(doc(db, 'equipment', item.id));
        } catch (error) {
            console.error("Error deleting equipment:", error);
            alert("Failed to delete item.");
        }
    };

    const resetForm = () => {
        setFormData({
            description: '',
            price: '',
            buyUrl: '',
            image: null,
            imageUrl: ''
        });
        setEditingItem(null);
        setIsAdding(false);
    };

    if (loading) return <div className="p-8">Loading Ledger...</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-32">
            <div className="w-full px-2 py-10 space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-4 md:-ml-10"></div>
                    <div>
                        <h1 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">Equipment Inventory</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-1 md:mt-2">Managing Institutional Tools & Professional Smallwares</p>
                    </div>
                    <button
                        onClick={() => { setIsAdding(!isAdding); if (isAdding) resetForm(); }}
                        className="h-12 md:h-14 px-8 bg-espresso text-white rounded-2xl font-serif font-black text-sm uppercase tracking-widest shadow-xl hover:shadow-espresso/40 hover:-translate-y-1 transition-all flex items-center gap-3"
                    >
                        <span className="material-symbols-outlined">{isAdding ? 'close' : 'add'}</span>
                        {isAdding ? 'Cancel Entry' : 'Add New Tool'}
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-white/40 dark:bg-black/20 rounded-[2.5rem] p-8 md:p-12 border border-espresso/10 shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-500">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em] ml-2">Tool Description (Required)</label>
                                        <textarea
                                            required
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full p-4 bg-white/60 dark:bg-black/40 border border-espresso/10 rounded-2xl focus:ring-2 focus:ring-espresso focus:border-transparent outline-none min-h-[120px] transition-all"
                                            placeholder="Detailed description of the tool and its utility..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em] ml-2">Price Estimate (Optional)</label>
                                            <input
                                                type="text"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className="w-full p-4 bg-white/60 dark:bg-black/40 border border-espresso/10 rounded-2xl focus:ring-2 focus:ring-espresso focus:border-transparent outline-none transition-all"
                                                placeholder="e.g. 50,000 RWF"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em] ml-2">Purchase Link (Optional)</label>
                                            <input
                                                type="url"
                                                value={formData.buyUrl}
                                                onChange={(e) => setFormData({ ...formData, buyUrl: e.target.value })}
                                                className="w-full p-4 bg-white/60 dark:bg-black/40 border border-espresso/10 rounded-2xl focus:ring-2 focus:ring-espresso focus:border-transparent outline-none transition-all"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-espresso/40 uppercase tracking-[0.3em] ml-2">Visual Documentation (Required)</label>
                                        <div className="aspect-video rounded-3xl bg-espresso/5 border-2 border-dashed border-espresso/10 flex items-center justify-center relative overflow-hidden group cursor-pointer transition-all hover:bg-espresso/[0.08]">
                                            {formData.image || formData.imageUrl ? (
                                                <img
                                                    src={formData.image ? URL.createObjectURL(formData.image) : formData.imageUrl}
                                                    className="w-full h-full object-cover"
                                                    alt="Preview"
                                                />
                                            ) : (
                                                <div className="text-center space-y-2 opacity-30">
                                                    <span className="material-symbols-outlined text-5xl">cloud_upload</span>
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Select Image Asset</p>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                required={!editingItem}
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
                                            <><span className="animate-spin material-symbols-outlined">sync</span> SYNCING LEDGER...</>
                                        ) : (
                                            <><span className="material-symbols-outlined">{editingItem ? 'update' : 'inventory'}</span> {editingItem ? 'AUTHORIZE UPDATE' : 'AUTHORIZE ENTRY'}</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {equipment.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 gap-6 bg-white/20 rounded-[3rem] border-2 border-dashed border-espresso/10 opacity-30">
                            <span className="material-symbols-outlined text-8xl">inventory_2</span>
                            <div className="text-center">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.5em]">Inventory Stream Empty</h3>
                                <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-2">No custom equipment protocols detected</p>
                            </div>
                        </div>
                    ) : (
                        equipment.map(item => (
                            <div key={item.id} className="group relative bg-white/40 dark:bg-black/20 rounded-[2.5rem] overflow-hidden border border-espresso/10 shadow-xl transition-all hover:-translate-y-2">
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover:bg-espresso transition-colors z-10"></div>

                                <div className="h-56 relative overflow-hidden">
                                    <img src={item.imageUrl} alt="Tool" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-6">
                                        <div className="flex gap-2 w-full">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="flex-1 h-10 bg-white/20 backdrop-blur-md rounded-xl text-white text-[9px] font-black uppercase tracking-widest border border-white/20 hover:bg-white/40 transition-all flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-base">edit</span> MODIFY
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item)}
                                                className="h-10 w-10 bg-red-500/80 backdrop-blur-md rounded-xl text-white border border-red-400 hover:bg-red-600 transition-all flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined text-base">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <p className="text-[8px] font-black text-espresso/30 uppercase tracking-[0.4em]">SPECIFICATION</p>
                                        {item.price && (
                                            <span className="px-3 py-1 bg-espresso/5 border border-espresso/10 rounded-lg text-espresso text-[9px] font-black uppercase tracking-widest">
                                                {item.price}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-espresso/70 dark:text-white/70 text-sm font-medium leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                                        {item.description}
                                    </p>

                                    {item.buyUrl && (
                                        <div className="pt-4 border-t border-espresso/5">
                                            <a
                                                href={item.buyUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[9px] font-black text-espresso/40 hover:text-espresso uppercase tracking-[0.2em] flex items-center gap-2 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">local_mall</span>
                                                PROCUREMENT NODE: {new URL(item.buyUrl).hostname.replace('www.', '')}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
