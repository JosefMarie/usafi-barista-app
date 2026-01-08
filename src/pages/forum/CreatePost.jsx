import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export function CreatePost() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        topic: 'Coffee Talk',
        content: ''
    });

    const topics = [
        { id: "coffee_talk", label: t('forum.topics.coffee_talk') },
        { id: "latte_art", label: t('forum.topics.latte_art') },
        { id: "brewing", label: t('forum.topics.brewing') },
        { id: "beans", label: t('forum.topics.beans') },
        { id: "equipment", label: t('forum.topics.equipment') },
        { id: "roasting", label: t('forum.topics.roasting') },
        { id: "barista_life", label: t('forum.topics.barista_life') }
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
            alert(t('forum.fail_create'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#F5DEB3] dark:bg-[#1c1916] min-h-screen flex flex-col font-display relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-espresso/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-espresso/5 rounded-full blur-[80px] pointer-events-none"></div>

            {/* Top App Bar */}
            <header className="sticky top-0 z-50 bg-white/40 dark:bg-black/40 backdrop-blur-xl border-b border-white/20 dark:border-white/5 shadow-sm">
                <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 h-16 md:h-18">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-espresso dark:text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-full p-2 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[22px] md:text-[24px]">close</span>
                    </button>
                    <h1 className="text-espresso dark:text-white text-base md:text-lg font-serif font-black uppercase tracking-widest">{t('forum.create_title')}</h1>
                    <div className="w-10"></div> {/* Spacer for balance */}
                </div>
            </header>

            <main className="flex-1 flex flex-col w-full max-w-4xl mx-auto relative z-10 p-4 md:p-6 lg:p-8">

                <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-white/5 p-5 md:p-8 flex-1 flex flex-col">
                    {/* Post Title Input */}
                    <div className="mb-6 md:mb-8">
                        <label className="block mb-2 md:mb-3 text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.2em] px-2">{t('forum.title_label')}</label>
                        <input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-transparent border-b-2 border-espresso/10 dark:border-white/10 focus:border-espresso dark:focus:border-white text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-espresso dark:text-white placeholder:text-espresso/20 dark:placeholder:text-white/20 px-2 py-3 md:py-4 focus:ring-0 transition-colors rounded-t-sm outline-none"
                            placeholder={t('forum.title_placeholder')}
                            type="text"
                        />
                    </div>

                    {/* Topic Selection */}
                    <div className="mb-6 md:mb-8">
                        <div className="px-2 flex items-center gap-2 mb-3 md:mb-4">
                            <span className="material-symbols-outlined text-espresso/60 text-base md:text-lg">label</span>
                            <h2 className="text-xs md:text-sm font-black text-espresso/60 dark:text-white/60 uppercase trackingwidest">{t('forum.select_topic')}</h2>
                        </div>
                        <div className="flex gap-2 md:gap-3 overflow-x-auto hide-scrollbar pb-2 px-1">
                            {topics.map(topic => (
                                <button
                                    key={topic.id}
                                    onClick={() => setFormData({ ...formData, topic: topic.id })}
                                    className={`group flex h-9 md:h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl pl-3 pr-3 md:pl-4 md:pr-4 transition-all active:scale-95 whitespace-nowrap border ${formData.topic === topic.id
                                        ? "bg-espresso text-white border-espresso shadow-lg shadow-espresso/20"
                                        : "bg-white/30 dark:bg-white/5 border-espresso/10 dark:border-white/10 hover:border-espresso/30 text-espresso dark:text-white"
                                        }`}
                                >
                                    <span className="text-[11px] md:text-xs font-bold uppercase tracking-wide leading-normal">{topic.label}</span>
                                    {formData.topic === topic.id && <span className="material-symbols-outlined text-[14px] md:text-[16px]">check</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Body Content */}
                    <div className="flex-1 flex flex-col min-h-[250px] md:min-h-[300px]">
                        <label className="block mb-2 md:mb-3 text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.2em] px-2 flex items-center justify-between">
                            <span>{t('forum.discussion_label')}</span>
                            <span className="bg-white/20 dark:bg-white/10 px-2 py-0.5 rounded text-[10px] font-medium opacity-50">{t('forum.markdown')}</span>
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="flex-1 w-full resize-none bg-white/30 dark:bg-white/5 border border-espresso/10 dark:border-white/10 focus:border-espresso/30 rounded-xl md:rounded-2xl text-espresso dark:text-white placeholder:text-espresso/20 dark:placeholder:text-white/20 p-4 md:p-6 text-base md:text-lg leading-relaxed focus:ring-4 focus:ring-espresso/5 transition-all shadow-inner outline-none font-medium"
                            placeholder={t('forum.discussion_placeholder')}
                        ></textarea>
                    </div>

                    {/* Image Upload Preview (Static Placeholder for V1) */}
                    <div className="py-6 px-2">
                        <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
                            <button className="shrink-0 flex items-center justify-center h-20 w-20 rounded-2xl border-2 border-dashed border-espresso/20 dark:border-white/20 text-espresso/40 hover:bg-espresso/5 transition-colors active:scale-95 group">
                                <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">add_a_photo</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Action Bar */}
            <div className="sticky bottom-0 z-50 bg-white/40 dark:bg-black/40 backdrop-blur-xl border-t border-white/20 dark:border-white/5 p-3 md:p-4 pb-6 md:pb-8 shadow-[0_-4px_30px_rgba(0,0,0,0.05)]">
                <div className="max-w-4xl mx-auto flex items-center justify-between w-full gap-3 md:gap-4">
                    {/* Rich Text Tools (Visual Only) */}
                    <div className="flex items-center gap-0.5 md:gap-1 text-espresso/60 dark:text-white/60">
                        <button aria-label="Bold" className="p-1.5 md:p-2 hover:bg-espresso/10 rounded-lg transition-colors active:text-espresso">
                            <span className="material-symbols-outlined text-[18px] md:text-[20px]">format_bold</span>
                        </button>
                        <button aria-label="Italic" className="p-1.5 md:p-2 hover:bg-espresso/10 rounded-lg transition-colors active:text-espresso">
                            <span className="material-symbols-outlined text-[18px] md:text-[20px]">format_italic</span>
                        </button>
                    </div>
                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.title.trim() || !formData.content.trim()}
                        className="group relative flex-1 max-w-xs bg-espresso hover:bg-espresso/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs md:text-sm font-black uppercase tracking-widest h-12 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-espresso/20 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        {loading ? (
                            <span className="material-symbols-outlined animate-spin text-lg md:text-xl">progress_activity</span>
                        ) : (
                            <>
                                <span>{t('forum.post_to_forum')}</span>
                                <span className="material-symbols-outlined text-[18px] md:text-[20px]">send</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
