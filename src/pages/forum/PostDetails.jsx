import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export function PostDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Fetch Post
    useEffect(() => {
        const fetchPost = async () => {
            try {
                const docRef = doc(db, 'forum_posts', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setPost({ id: docSnap.id, ...docSnap.data() });
                } else {
                    alert("Post not found");
                    navigate(-1);
                }
            } catch (err) {
                console.error("Error fetching post:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id, navigate]);

    // Fetch Comments Real-time
    useEffect(() => {
        if (!id) return;
        const q = query(collection(db, 'forum_posts', id, 'comments'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [id]);

    const handleSendComment = async () => {
        if (!newComment.trim()) return;
        setSending(true);
        try {
            // Add Comment
            await addDoc(collection(db, 'forum_posts', id, 'comments'), {
                content: newComment,
                authorId: user.uid,
                authorName: user.fullName || user.email,
                authorAvatar: user.avatar || null,
                createdAt: serverTimestamp()
            });

            // Update Comment Count on Post
            await updateDoc(doc(db, 'forum_posts', id), {
                commentCount: increment(1)
            });

            setNewComment('');
        } catch (error) {
            console.error("Error sending comment:", error);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading discussion...</div>;
    if (!post) return null;

    return (
        <div className="bg-background-light dark:bg-[#1c1916] min-h-screen flex flex-col font-sans text-espresso dark:text-[#FAF5E8] pb-24">

            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-[#1c1916]/95 backdrop-blur-md border-b border-primary/10 dark:border-primary/20">
                <div className="flex items-center justify-between px-4 py-3 h-14">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-espresso dark:text-[#FAF5E8] hover:bg-black/5 dark:hover:bg-white/10 rounded-full p-2 transition-colors active:scale-95"
                    >
                        <span className="material-symbols-outlined block">arrow_back</span>
                    </button>
                    <h1 className="text-espresso dark:text-white text-lg font-serif font-bold tracking-tight">Student Forum</h1>
                    <button className="text-espresso dark:text-[#FAF5E8] hover:bg-black/5 dark:hover:bg-white/10 rounded-full p-2 transition-colors active:scale-95">
                        <span className="material-symbols-outlined block">more_horiz</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-2xl mx-auto">
                <article className="px-5 pt-6 pb-4">
                    {/* Author Info */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm overflow-hidden">
                            {post.authorAvatar ? <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" /> : (post.authorName?.[0] || 'U')}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-espresso dark:text-white">{post.authorName}</span>
                            <span className="text-xs text-espresso/60 dark:text-[#FAF5E8]/60">
                                {post.createdAt?.seconds ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                            </span>
                        </div>
                    </div>

                    {/* Chips */}
                    <div className="flex gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                            {post.topic}
                        </span>
                    </div>

                    {/* Content */}
                    <h2 className="text-2xl font-serif font-bold text-espresso dark:text-white mb-3 leading-tight">
                        {post.title}
                    </h2>
                    <div className="text-base text-espresso/90 dark:text-[#FAF5E8]/90 leading-relaxed space-y-4 whitespace-pre-wrap">
                        {post.content}
                    </div>

                    {/* Stats Bar */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-primary/10 dark:border-primary/20">
                        <div className="flex gap-6">
                            <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors group">
                                <span className="material-symbols-outlined group-active:scale-110 transition-transform">thumb_up</span>
                                <span className="font-bold text-sm">{post.likes || 0}</span>
                            </button>
                            <div className="flex items-center gap-2 text-espresso/60 dark:text-[#FAF5E8]/60">
                                <span className="material-symbols-outlined">chat_bubble</span>
                                <span className="font-bold text-sm">{comments.length}</span>
                            </div>
                        </div>
                        <button className="text-espresso/60 dark:text-[#FAF5E8]/60 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">share</span>
                        </button>
                    </div>
                </article>

                {/* Comments Section */}
                <section className="mt-2 bg-white/50 dark:bg-white/5 rounded-t-3xl border-t border-primary/5 shadow-[0_-1px_3px_rgba(0,0,0,0.02)] min-h-[300px]">
                    <div className="px-5 py-6">
                        <h3 className="font-serif font-bold text-lg text-espresso dark:text-white mb-6">Comments ({comments.length})</h3>
                        <div className="space-y-6">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex gap-3 animate-fade-in">
                                    <div className="shrink-0 h-8 w-8 rounded-full bg-espresso/10 dark:bg-[#FAF5E8]/10 flex items-center justify-center text-espresso dark:text-[#FAF5E8] text-xs font-bold overflow-hidden">
                                        {comment.authorAvatar ? <img src={comment.authorAvatar} alt="" className="w-full h-full object-cover" /> : (comment.authorName?.[0] || 'U')}
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-white dark:bg-white/5 p-3 rounded-2xl rounded-tl-none border border-primary/5 shadow-sm">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-sm font-bold text-espresso dark:text-white">{comment.authorName}</span>
                                                <span className="text-[10px] text-espresso/50 dark:text-[#FAF5E8]/50">
                                                    {comment.createdAt?.seconds ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-espresso/80 dark:text-[#FAF5E8]/80 leading-relaxed whitespace-pre-wrap">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-center text-sm text-espresso/40 dark:text-white/40 italic py-4">No comments yet. Be the first to reply!</p>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Input Footer */}
            <div className="fixed bottom-0 w-full z-50 bg-background-light dark:bg-[#1c1916] border-t border-primary/10 dark:border-primary/20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="flex items-end gap-3 px-4 py-3 max-w-2xl mx-auto">
                    <div className="relative flex-1">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendComment();
                                }
                            }}
                            className="w-full bg-white dark:bg-white/5 border border-primary/30 focus:border-primary text-espresso dark:text-[#FAF5E8] placeholder:text-espresso/40 dark:placeholder:text-[#FAF5E8]/40 rounded-2xl py-3 pl-4 pr-10 text-sm focus:ring-1 focus:ring-primary/50 resize-none overflow-hidden outline-none"
                            placeholder="Add a comment... (Enter to send)"
                            rows="1"
                            style={{ minHeight: '46px' }}
                        ></textarea>
                    </div>
                    <button
                        onClick={handleSendComment}
                        disabled={sending || !newComment.trim()}
                        className="shrink-0 h-[46px] w-[46px] rounded-full bg-primary hover:bg-[#8e6a46] disabled:opacity-50 text-white flex items-center justify-center shadow-lg shadow-primary/25 active:scale-95 transition-all"
                    >
                        {sending ? (
                            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-[20px] ml-0.5">send</span>
                        )}
                    </button>
                </div>
            </div>

        </div>
    );
}
