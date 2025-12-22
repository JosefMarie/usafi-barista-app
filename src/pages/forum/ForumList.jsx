import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatDistanceToNow } from 'date-fns';

export function ForumList() {
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

    if (loading) return <div className="p-8 text-center">Loading forum...</div>;

    return (
        <div className="max-w-3xl mx-auto pb-20 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-espresso dark:text-white text-2xl font-serif font-bold">Community Forum</h2>
                <Link to="create" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full font-bold shadow-md hover:bg-primary/90 transition-transform active:scale-95">
                    <span className="material-symbols-outlined">add</span>
                    New Post
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
                        No discussion topics yet. Start one!
                    </div>
                ) : (
                    posts.map(post => (
                        <Link to={`${post.id}`} key={post.id} className="block group">
                            <article className="bg-white dark:bg-[#1c1916] p-5 rounded-2xl shadow-sm border border-primary/10 hover:border-primary/40 transition-all hover:shadow-md">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold overflow-hidden">
                                            {post.authorAvatar ? <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" /> : (post.authorName?.[0] || 'U')}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-espresso dark:text-white">{post.authorName}</span>
                                            <span className="text-[10px] text-espresso/50 dark:text-white/50">
                                                {post.createdAt?.seconds ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/5 text-primary text-[10px] font-bold border border-primary/10 uppercase tracking-wide">
                                        {post.topic}
                                    </span>
                                </div>
                                <h3 className="text-lg font-serif font-bold text-espresso dark:text-white mb-2 group-hover:text-primary transition-colors leading-tight">
                                    {post.title}
                                </h3>
                                <p className="text-sm text-espresso/70 dark:text-white/70 line-clamp-2 mb-4">
                                    {post.content}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-espresso/50 dark:text-white/50 font-medium border-t border-primary/5 pt-3">
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                                        {post.likes || 0} Likes
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                                        {post.commentCount || 0} Comments
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
