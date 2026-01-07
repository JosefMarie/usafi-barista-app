import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';


export function ForumList() {
    const { t } = useTranslation();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'forum_posts'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
                <span className="h-10 w-10 border-4 border-espresso/20 border-t-espresso rounded-full animate-spin"></span>
                <p className="text-sm font-black text-espresso/60 uppercase tracking-widest">{t('forum.loading')}</p>
            </div>
        </div>
    );

    return (
        <div className="w-full pb-20 space-y-8 relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-espresso dark:text-white font-serif uppercase tracking-tight leading-none mb-2">
                        {t('forum.list_title')}
                    </h2>
                    <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em]">
                        Community Discussions
                    </p>
                </div>

                <Link
                    to="create"
                    className="group relative flex items-center justify-center gap-2 px-6 py-4 bg-espresso text-white rounded-2xl overflow-hidden shadow-xl shadow-espresso/20 hover:shadow-2xl hover:shadow-espresso/30 hover:-translate-y-0.5 transition-all"
                >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span className="text-sm font-black uppercase tracking-widest">{t('forum.new_post')}</span>
                </Link>
            </div>

            {/* Posts Grid */}
            <div className="space-y-4 relative z-10">
                {posts.length === 0 ? (
                    <div className="text-center py-20 bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl">
                        <div className="inline-flex h-20 w-20 rounded-full bg-white/20 items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-4xl text-espresso/20 dark:text-white/20">forum</span>
                        </div>
                        <h3 className="text-xl font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest">
                            {t('forum.no_posts')}
                        </h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {posts.map(post => (
                            <Link to={`${post.id}`} key={post.id} className="block group">
                                <article className="bg-white/40 dark:bg-black/40 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-lg border border-white/20 dark:border-white/5 hover:border-espresso/20 dark:hover:border-white/20 transition-all hover:shadow-2xl hover:shadow-espresso/10 hover:-translate-y-1 relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/0 group-hover:bg-espresso transition-colors"></div>

                                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                                        {/* Avatar Column */}
                                        <div className="shrink-0">
                                            <div className="h-16 w-16 rounded-2xl bg-white dark:bg-white/5 shadow-inner flex items-center justify-center text-espresso dark:text-white text-xl font-black overflow-hidden border border-white/40">
                                                {post.authorAvatar ? <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" /> : (post.authorName?.[0] || 'U')}
                                            </div>
                                        </div>

                                        {/* Content Column */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-3 py-1 rounded-full bg-white/50 dark:bg-white/5 text-[10px] font-black text-espresso/60 dark:text-white/60 uppercase tracking-widest border border-white/20">
                                                        {t(`forum.topics.${post.topic}`, { defaultValue: post.topic })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-espresso/40 dark:text-white/40 uppercase tracking-wider">
                                                        {post.createdAt?.seconds ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                                    </span>
                                                </div>
                                            </div>

                                            <h3 className="text-2xl font-serif font-bold text-espresso dark:text-white mb-3 group-hover:text-primary transition-colors leading-tight">
                                                {post.title}
                                            </h3>

                                            <p className="text-sm font-medium text-espresso/70 dark:text-white/70 line-clamp-2 mb-6 leading-relaxed max-w-3xl">
                                                {post.content}
                                            </p>

                                            <div className="flex items-center justify-between border-t border-espresso/5 dark:border-white/5 pt-4 mt-auto">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-espresso/80 dark:text-white/80">
                                                        {post.authorName}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2 text-espresso/40 dark:text-white/40 group-hover:text-espresso/60 dark:group-hover:text-white/60 transition-colors">
                                                        <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                                                        <span className="text-xs font-black">{t('forum.likes', { count: post.likes || 0 })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-espresso/40 dark:text-white/40 group-hover:text-espresso/60 dark:group-hover:text-white/60 transition-colors">
                                                        <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                                                        <span className="text-xs font-black">{t('forum.comments', { count: post.commentCount || 0 })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

