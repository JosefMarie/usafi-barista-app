import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export function CreatePost() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        topic: 'Coffee Talk',
        content: ''
    });

    const topics = [
        "Coffee Talk", "Latte Art", "Brewing", "Beans", "Equipment", "Roasting", "Barista Life"
    ];

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.content.trim()) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'forum_posts'), {
                title: formData.title,
                topic: formData.topic,
                content: formData.content,
                authorId: user.uid,
                authorName: user.fullName || user.email,
                authorAvatar: user.avatar || null,
                createdAt: serverTimestamp(),
                likes: 0,
                commentCount: 0
            });
            navigate(-1); // Go back
        } catch (error) {
            console.error("Error creating post:", error);
            alert("Failed to create post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-[#1c1916] min-h-screen flex flex-col font-sans transition-colors duration-200">
            {/* Top App Bar */}
            <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-[#1c1916]/95 backdrop-blur-md border-b border-primary/10 dark:border-primary/20">
                <div className="flex items-center justify-between px-4 py-3 h-14">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-primary hover:text-primary/80 transition-colors text-base font-medium active:scale-95 transform"
                    >
                        Cancel
                    </button>
                    <h1 className="text-espresso dark:text-white text-lg font-serif font-bold tracking-tight">Create Post</h1>
                    <button className="text-primary hover:text-primary/80 transition-colors text-base font-bold active:scale-95 transform opacity-50 cursor-not-allowed">
                        Drafts
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col w-full">
                {/* Post Title Input */}
                <div className="px-5 pt-6 pb-2">
                    <label className="block mb-2 text-sm font-bold text-espresso/80 dark:text-white/80 uppercase tracking-wider">Title</label>
                    <input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-transparent border-b-2 border-primary/20 focus:border-primary text-2xl font-serif font-bold text-espresso dark:text-white placeholder:text-espresso/30 dark:placeholder:text-white/30 px-0 py-2 focus:ring-0 transition-colors rounded-t-sm outline-none"
                        placeholder="What's brewing today?"
                        type="text"
                    />
                </div>

                {/* Topic Selection */}
                <div className="py-4">
                    <div className="px-5 flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-primary text-lg">label</span>
                        <h2 className="text-espresso dark:text-white text-base font-bold font-serif">Select a Topic</h2>
                    </div>
                    <div className="flex gap-3 px-5 overflow-x-auto hide-scrollbar pb-2">
                        {topics.map(topic => (
                            <button
                                key={topic}
                                onClick={() => setFormData({ ...formData, topic })}
                                className={`group flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full pl-4 pr-4 transition-all active:scale-95 whitespace-nowrap ${formData.topic === topic
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "bg-white dark:bg-white/5 border border-primary/30 hover:border-primary hover:bg-primary/5 text-espresso dark:text-white"
                                    }`}
                            >
                                <span className="text-sm font-medium leading-normal">{topic}</span>
                                {formData.topic === topic && <span className="material-symbols-outlined text-[18px]">check</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body Content */}
                <div className="px-5 flex-1 flex flex-col min-h-[300px]">
                    <label className="block mb-2 text-sm font-bold text-espresso/80 dark:text-white/80 uppercase tracking-wider flex items-center justify-between">
                        <span>Discussion</span>
                        <span className="text-xs font-normal text-espresso/50 dark:text-white/50">Markdown supported</span>
                    </label>
                    <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="flex-1 w-full resize-none bg-white/50 dark:bg-white/5 border border-primary/20 focus:border-primary rounded-xl text-espresso dark:text-white placeholder:text-espresso/40 dark:placeholder:text-white/30 p-4 text-base leading-relaxed focus:ring-1 focus:ring-primary/50 transition-all shadow-sm outline-none"
                        placeholder="Share your thoughts, recipe, or question here. Be descriptive!"
                    ></textarea>
                </div>

                {/* Image Upload Preview (Static Placeholder for V1) */}
                <div className="px-5 py-4">
                    <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
                        <button className="shrink-0 flex items-center justify-center size-20 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-colors active:scale-95">
                            <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                        </button>
                    </div>
                </div>
            </main>

            {/* Bottom Action Bar */}
            <div className="sticky bottom-0 z-50 bg-background-light dark:bg-[#1c1916] border-t border-primary/10 dark:border-primary/20 p-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between w-full gap-4">
                    {/* Rich Text Tools (Visual Only for V1) */}
                    <div className="flex items-center gap-1 text-espresso/60 dark:text-white/60">
                        <button aria-label="Bold" className="p-2 hover:bg-primary/10 rounded-lg transition-colors active:text-primary">
                            <span className="material-symbols-outlined text-[20px]">format_bold</span>
                        </button>
                        <button aria-label="Italic" className="p-2 hover:bg-primary/10 rounded-lg transition-colors active:text-primary">
                            <span className="material-symbols-outlined text-[20px]">format_italic</span>
                        </button>
                    </div>
                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.title.trim() || !formData.content.trim()}
                        className="flex-1 bg-primary hover:bg-[#8e6a46] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-95 active:shadow-sm transition-all"
                    >
                        {loading ? (
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        ) : (
                            <>
                                <span>Post to Forum</span>
                                <span className="material-symbols-outlined text-[20px]">send</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
