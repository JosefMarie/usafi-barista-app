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

    if (loading) return <div className="p-8 text-center">{t('forum.loading')}</div>;

    return (
        <div className="w-full pb-20 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-espresso dark:text-white text-2xl font-serif font-bold">{t('forum.list_title')}</h2>
                <Link to="create" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full font-bold shadow-md hover:bg-primary/90 transition-transform active:scale-95">
                    <span className="material-symbols-outlined">add</span>
                    {t('forum.new_post')}
                </Link>
            </div>

            {/* Filter / Search Bar Placeholder */}
            {/* <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                {['All', 'Coffee Talk', 'Latte Art', 'Brewing'].map(chip => (
                    <button key={chip} className="px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-primary/10 text-sm font-medium hover:border-primary transition-colors whitespace-nowrap">
                        {chip}
                    </button>
                ))}
            </div> */}

            <div className="space-y-4">
                {posts.length === 0 ? (
                    <div className="text-center py-12 text-espresso/50 dark:text-white/50 border border-dashed border-primary/20 rounded-xl">
                        {t('forum.no_posts')}
                    </div>
                ) : (
                    posts.map(post => (
                        <Link to={`${post.id}`} key={post.id} className="block group">
                            <article className="bg-[#F5DEB3] dark:bg-[#1c1916] p-6 rounded-2xl shadow-md border border-primary/20 hover:border-espresso transition-all hover:shadow-lg relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/30"></div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-espresso text-sm font-bold overflow-hidden shadow-inner border border-white/20">
                                            {post.authorAvatar ? <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" /> : (post.authorName?.[0] || 'U')}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-espresso dark:text-white">{post.authorName}</span>
                                            <span className="text-xs text-espresso/60 dark:text-white/50 font-medium">
                                                {post.createdAt?.seconds ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full bg-espresso text-white dark:bg-primary/20 dark:text-primary text-[10px] font-bold border border-white/10 uppercase tracking-widest shadow-sm">
                                        {t(`forum.topics.${post.topic}`, { defaultValue: post.topic })}
                                    </span>
                                </div>
                                <h3 className="text-xl font-serif font-bold text-espresso dark:text-white mb-2 group-hover:text-espresso/80 dark:group-hover:text-primary transition-colors leading-tight">
                                    {post.title}
                                </h3>
                                <p className="text-sm text-espresso/80 dark:text-white/70 line-clamp-2 mb-5 font-medium leading-relaxed">
                                    {post.content}
                                </p>
                                <div className="flex items-center gap-6 text-[11px] text-espresso/70 dark:text-white/50 font-bold border-t border-espresso/10 pt-4">
                                    <div className="flex items-center gap-1.5 hover:text-espresso transition-colors">
                                        <span className="material-symbols-outlined text-[18px] filled text-espresso/40">thumb_up</span>
                                        {t('forum.likes', { count: post.likes || 0 })}
                                    </div>
                                    <div className="flex items-center gap-1.5 hover:text-espresso transition-colors">
                                        <span className="material-symbols-outlined text-[18px] text-espresso/40">chat_bubble</span>
                                        {t('forum.comments', { count: post.commentCount || 0 })}
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
