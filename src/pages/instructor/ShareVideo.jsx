import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export function InstructorShareVideo() {
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', url: '', description: '', thumbnailUrl: '' });
    const [formLoading, setFormLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (user) fetchVideos();
    }, [user]);

    const fetchVideos = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'videos'),
                where('instructorId', '==', user.uid)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs
                .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
                .sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                    return dateB - dateA;
                });
            setVideos(data);
        } catch (err) {
            console.error('Error fetching videos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const videoData = {
                ...formData,
                instructorId: user.uid,
                instructorName: user.name || user.email,
                updatedAt: serverTimestamp()
            };

            if (editingId) {
                await updateDoc(doc(db, 'videos', editingId), videoData);
            } else {
                await addDoc(collection(db, 'videos'), {
                    ...videoData,
                    createdAt: serverTimestamp()
                });

                // Trigger notifications for assigned students
                if (user.assignedStudentIds?.length > 0) {
                    for (const studentId of user.assignedStudentIds) {
                        try {
                            await addDoc(collection(db, 'notifications'), {
                                recipientId: studentId,
                                title: 'New Video Tutorial',
                                desc: `Instructor ${user.name || 'your instructor'} shared a new video: ${formData.title}`,
                                type: 'course',
                                read: false,
                                timestamp: serverTimestamp()
                            });
                        } catch (nErr) {
                            console.error("Failed to send notification:", nErr);
                        }
                    }
                }
            }

            setShowAddModal(false);
            setEditingId(null);
            setFormData({ title: '', url: '', description: '', thumbnailUrl: '' });
            fetchVideos();
        } catch (err) {
            console.error('Error saving video:', err);
            alert('Failed to save video: ' + err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = (video) => {
        setEditingId(video.id);
        setFormData({
            title: video.title || '',
            url: video.url || '',
            description: video.description || '',
            thumbnailUrl: video.thumbnailUrl || ''
        });
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this video?')) return;
        try {
            await deleteDoc(doc(db, 'videos', id));
            fetchVideos();
        } catch (err) {
            console.error('Error deleting video:', err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-espresso dark:text-white">Instructional Media</h1>
                    <p className="text-espresso/60 dark:text-white/60 font-medium mt-1">Distribute high-fidelity video tutorials and strategic resources</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ title: '', url: '', description: '', thumbnailUrl: '' });
                        setShowAddModal(true);
                    }}
                    className="flex items-center gap-3 px-6 py-3 bg-espresso text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-2xl transition-all shadow-xl active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    Broadcast Media
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></span>
                </div>
            ) : videos.length === 0 ? (
                <div className="text-center py-20 bg-[#F5DEB3] dark:bg-white/5 rounded-3xl border border-espresso/10 shadow-xl relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    <span className="material-symbols-outlined text-6xl text-espresso/20 dark:text-white/20 mb-4 block group-hover:scale-110 transition-transform">video_library</span>
                    <p className="text-espresso/40 dark:text-white/40 font-black uppercase tracking-widest text-sm">Media library is empty. Start broadcasting tutorials.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {videos.map(video => (
                        <div key={video.id} className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl overflow-hidden shadow-xl border border-espresso/10 group transition-all hover:-translate-y-1 relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <div className="relative z-10">
                                <div className="relative aspect-video bg-espresso/5 dark:bg-gray-800 overflow-hidden">
                                    <img
                                        src={video.thumbnailUrl}
                                        alt={video.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <div className="absolute inset-0 bg-espresso/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <a
                                            href={video.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 px-6 py-3 bg-white text-espresso rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-110 transition-transform shadow-2xl"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">play_circle</span>
                                            Stream Now
                                        </a>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-serif font-bold text-lg text-espresso dark:text-white line-clamp-2 mb-2 min-h-[3.5rem] leading-snug">{video.title}</h3>
                                    {video.description && (
                                        <p className="text-sm font-medium text-espresso/60 dark:text-white/60 line-clamp-2 mb-4 leading-relaxed">{video.description}</p>
                                    )}
                                    <div className="flex items-center justify-between pt-4 border-t border-espresso/5">
                                        <a
                                            href={video.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-espresso/40 hover:text-espresso transition-colors group/link"
                                        >
                                            <span className="material-symbols-outlined text-[16px] group-hover/link:rotate-12 transition-transform">open_in_new</span>
                                            Strategic Link
                                        </a>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(video)}
                                                className="p-2.5 bg-white/40 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-xl text-espresso/40 hover:text-espresso transition-all shadow-sm active:scale-95"
                                                title="Edit Insights"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(video.id)}
                                                className="p-2.5 bg-red-500/5 hover:bg-red-500 hover:text-white rounded-xl text-red-500 transition-all shadow-sm active:scale-95"
                                                title="Archive Media"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white dark:bg-[#2c2825] rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-espresso dark:text-white mb-4">
                            {editingId ? 'Edit Video' : 'Add New Video'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Video Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., How to Pour Latte Art"
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white placeholder:text-espresso/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Video URL *</label>
                                <input
                                    type="url"
                                    required
                                    value={formData.url}
                                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="https://youtube.com/... or https://vimeo.com/..."
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white placeholder:text-espresso/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <p className="text-xs text-espresso/50 dark:text-white/50 mt-1">YouTube, Vimeo, or any video link</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Thumbnail URL (optional)</label>
                                <input
                                    type="url"
                                    value={formData.thumbnailUrl}
                                    onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white placeholder:text-espresso/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Description (optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of what students will learn..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white placeholder:text-espresso/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 rounded-full border border-black/10 dark:border-white/10 text-espresso dark:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {formLoading ? 'Saving...' : editingId ? 'Update Video' : 'Add Video'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
