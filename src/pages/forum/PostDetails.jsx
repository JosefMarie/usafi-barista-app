import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

export function PostDetails() {
    const { t } = useTranslation();
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
                    alert(t('forum.post_not_found'));
                    navigate(-1);
                }
            } catch (err) {
                console.error("Error fetching post:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id, navigate, t]);

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

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh] bg-[#F5DEB3] dark:bg-[#1c1916]">
            <div className="flex flex-col items-center gap-4">
                <span className="h-10 w-10 border-4 border-espresso/20 border-t-espresso rounded-full animate-spin"></span>
                <p className="text-sm font-black text-espresso/60 uppercase tracking-widest">{t('forum.loading_details')}</p>
            </div>
        </div>
    );
    if (!post) return null;

    return (
        <div className="bg-[#F5DEB3] dark:bg-[#1c1916] min-h-screen flex flex-col font-display text-espresso dark:text-[#FAF5E8] pb-24 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-espresso/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-espresso/5 rounded-full blur-[80px] pointer-events-none"></div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/40 dark:bg-black/40 backdrop-blur-xl border-b border-white/20 dark:border-white/5">
                <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 h-16 md:h-18">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-espresso dark:text-[#FAF5E8] hover:bg-white/20 dark:hover:bg-white/10 rounded-full p-2 transition-colors active:scale-95"
                    >
                        <span className="material-symbols-outlined block text-[22px] md:text-[24px]">arrow_back</span>
                    </button>
                    <h1 className="text-espresso dark:text-white text-base md:text-lg font-serif font-black uppercase tracking-widest">{t('forum.details_title')}</h1>
                    <button className="text-espresso dark:text-[#FAF5E8] hover:bg-white/20 dark:hover:bg-white/10 rounded-full p-2 transition-colors active:scale-95">
                        <span className="material-symbols-outlined block text-[22px] md:text-[24px]">more_horiz</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-4xl mx-auto relative z-10 p-3 md:p-4 lg:p-8 space-y-5 md:space-y-6">

                {/* Main Post Card */}
                <article className="bg-white/60 dark:bg-black/40 backdrop-blur-xl p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-white/20 dark:border-white/5">
                    {/* Author Info */}
                    <div className="flex items-center justify-between mb-4 md:mb-6 flex-wrap gap-3">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-white dark:bg-white/5 shadow-inner flex items-center justify-center text-espresso dark:text-white font-black text-base md:text-lg overflow-hidden border border-white/40">
                                {post.authorAvatar ? <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" /> : (post.authorName?.[0] || 'U')}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm md:text-base font-bold text-espresso dark:text-white">{post.authorName}</span>
                                <span className="text-xs font-bold text-espresso/40 dark:text-[#FAF5E8]/40 uppercase tracking-wider">
                                    {post.createdAt?.seconds ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                </span>
                            </div>
                        </div>
                        <span className="px-2.5 md:px-3 py-1 rounded-full bg-white/50 dark:bg-white/5 text-[9px] md:text-[10px] font-black text-espresso/60 dark:text-white/60 uppercase tracking-widest border border-white/20">
                            {t(`forum.topics.${post.topic}`, { defaultValue: post.topic })}
                        </span>
                    </div>

                    {/* Content */}
                    <h2 className="text-2xl md:text-3xl font-serif font-black text-espresso dark:text-white mb-4 md:mb-6 leading-tight">
                        {post.title}
                    </h2>
                    <div className="text-base md:text-lg text-espresso/80 dark:text-[#FAF5E8]/80 leading-relaxed space-y-4 whitespace-pre-wrap font-medium">
                        {post.content}
                    </div>

                    {/* Stats Bar */}
                    <div className="flex items-center justify-between mt-6 md:mt-8 pt-5 md:pt-6 border-t border-espresso/5 dark:border-white/5">
                        <div className="flex gap-6 md:gap-8">
                            <button className="flex items-center gap-1.5 md:gap-2 text-espresso/40 hover:text-espresso transition-colors group">
                                <span className="material-symbols-outlined group-active:scale-110 transition-transform text-[20px] md:text-[22px]">thumb_up</span>
                                <span className="font-black text-xs md:text-sm uppercase tracking-wide">{post.likes || 0} Likes</span>
                            </button>
                            <div className="flex items-center gap-1.5 md:gap-2 text-espresso/40 dark:text-[#FAF5E8]/40">
                                <span className="material-symbols-outlined text-[20px] md:text-[22px]">chat_bubble</span>
                                <span className="font-black text-xs md:text-sm uppercase tracking-wide">{comments.length} Comments</span>
                            </div>
                        </div>
                        <button className="text-espresso/40 hover:text-espresso transition-colors" title={t('forum.share')}>
                            <span className="material-symbols-outlined text-[20px] md:text-[22px]">share</span>
                        </button>
                    </div>
                </article>

                {/* Comments Section */}
                <section className="bg-white/40 dark:bg-black/20 backdrop-blur-lg rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 border border-white/10 dark:border-white/5">
                    <h3 className="font-serif font-black text-base md:text-lg text-espresso dark:text-white mb-5 md:mb-6 uppercase tracking-widest border-b border-espresso/5 dark:border-white/5 pb-3 md:pb-4">
                        Discussion ({comments.length})
                    </h3>

                    <div className="space-y-5 md:space-y-6">
                        {comments.map(comment => (
                            <div key={comment.id} className="flex gap-3 md:gap-4 animate-fade-in group">
                                <div className="shrink-0 h-9 w-9 md:h-10 md:w-10 rounded-xl bg-white/50 dark:bg-[#FAF5E8]/10 flex items-center justify-center text-espresso dark:text-[#FAF5E8] text-xs font-black overflow-hidden shadow-sm">
                                    {comment.authorAvatar ? <img src={comment.authorAvatar} alt="" className="w-full h-full object-cover" /> : (comment.authorName?.[0] || 'U')}
                                </div>
                                <div className="flex-1">
                                    <div className="bg-white/60 dark:bg-white/5 p-4 md:p-5 rounded-xl md:rounded-2xl rounded-tl-none border border-white/20 dark:border-white/5 shadow-sm group-hover:bg-white/80 dark:group-hover:bg-white/10 transition-colors">
                                        <div className="flex justify-between items-baseline mb-2 gap-2">
                                            <span className="text-sm font-bold text-espresso dark:text-white">{comment.authorName}</span>
                                            <span className="text-[10px] font-bold text-espresso/40 dark:text-[#FAF5E8]/40 uppercase tracking-wider">
                                                {comment.createdAt?.seconds ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-espresso/80 dark:text-[#FAF5E8]/80 leading-relaxed whitespace-pre-wrap font-medium">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {comments.length === 0 && (
                            <div className="text-center py-6 md:py-8">
                                <p className="text-sm text-espresso/40 dark:text-white/40 font-bold uppercase tracking-widest">{t('forum.no_comments')}</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Input Footer */}
            <div className="fixed bottom-0 w-full z-50 bg-white/60 dark:bg-black/90 backdrop-blur-xl border-t border-white/20 dark:border-white/10 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]">
                <div className="max-w-4xl mx-auto flex items-end gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 w-full">
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
                            className="w-full bg-white/50 dark:bg-white/10 border border-espresso/10 dark:border-white/10 focus:border-espresso/30 text-espresso dark:text-[#FAF5E8] placeholder:text-espresso/40 dark:placeholder:text-[#FAF5E8]/40 rounded-xl md:rounded-2xl py-2.5 md:py-3 pl-4 md:pl-5 pr-3 md:pr-4 text-sm font-medium focus:ring-2 focus:ring-espresso/5 resize-none overflow-hidden outline-none transition-all"
                            placeholder={t('forum.add_comment')}
                            rows="1"
                            style={{ minHeight: '44px' }}
                        ></textarea>
                    </div>
                    <button
                        onClick={handleSendComment}
                        disabled={sending || !newComment.trim()}
                        className="shrink-0 h-[44px] w-[44px] md:h-[48px] md:w-[48px] rounded-xl bg-espresso hover:bg-espresso/90 disabled:opacity-50 text-white flex items-center justify-center shadow-lg shadow-espresso/20 active:scale-95 transition-all"
                    >
                        {sending ? (
                            <span className="material-symbols-outlined animate-spin text-[22px] md:text-[24px]">{t('forum.sending')}</span>
                        ) : (
                            <span className="material-symbols-outlined text-[22px] md:text-[24px]">send</span>
                        )}
                    </button>
                </div>
            </div>

        </div>
    );
}
