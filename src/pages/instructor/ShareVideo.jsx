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
                    <h1 className="text-2xl font-serif font-bold text-espresso dark:text-white">Share Videos</h1>
                    <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">Share video tutorials and resources with your students</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ title: '', url: '', description: '', thumbnailUrl: '' });
                        setShowAddModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Add Video
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></span>
                </div>
            ) : videos.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-[#2c2825] rounded-xl border border-black/5">
                    <span className="material-symbols-outlined text-5xl text-espresso/30 dark:text-white/30 mb-3 block">video_library</span>
                    <p className="text-espresso/60 dark:text-white/60">No videos yet. Share your first tutorial!</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {videos.map(video => (
                        <div key={video.id} className="bg-white dark:bg-[#2c2825] rounded-xl overflow-hidden shadow-sm border border-black/5 group hover:shadow-md transition-shadow">
                            {video.thumbnailUrl ? (
                                <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 overflow-hidden">
                                    <img
                                        src={video.thumbnailUrl}
                                        alt={video.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <a
                                            href={video.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-white/90 text-espresso rounded-full font-medium hover:bg-white transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">play_circle</span>
                                            Watch
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-5xl text-primary/40">video_library</span>
                                </div>
                            )}
                            <div className="p-4">
                                <h3 className="font-bold text-espresso dark:text-white line-clamp-2 mb-2">{video.title}</h3>
                                {video.description && (
                                    <p className="text-sm text-espresso/60 dark:text-white/60 line-clamp-2 mb-3">{video.description}</p>
                                )}
                                <div className="flex items-center justify-between">
                                    <a
                                        href={video.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-primary font-medium hover:underline text-sm"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">link</span>
                                        View Link
                                    </a>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(video)}
                                            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-espresso/60 dark:text-white/60"
                                            title="Edit"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(video.id)}
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-red-500"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
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
