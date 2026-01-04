import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy, collectionGroup } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

export function GlobalSearch({ isOpen, onClose }) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState({
        courses: [],
        curriculum: [],
        forum: [],
        opportunities: [],
        pages: [],
        equipment: [],
        testimonials: []
    });
    const [loading, setLoading] = useState(false);
    const modalRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setSearchTerm('');
            setResults({ courses: [], forum: [], opportunities: [], pages: [], equipment: [], testimonials: [] });
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && searchTerm.length >= 2) {
                const firstResult = Object.values(results).flat()[0];
                if (firstResult) handleResultClick(firstResult);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, results, searchTerm]);


    useEffect(() => {
        if (searchTerm.length < 2) {
            setResults({ courses: [], curriculum: [], forum: [], opportunities: [], pages: [], equipment: [], testimonials: [] });
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const term = searchTerm.toLowerCase();
                console.log('DEBUG: OmniSearch Initiated for:', term);

                // 1. Static Pages Data (Guaranteed Fallback)
                const STATIC_DATA = [
                    { id: 'onsite', title: t('courses.onsite.title'), content: t('courses.onsite.description'), type: 'course', path: '/courses', tags: 'onsite class barista training' },
                    { id: 'online', title: t('courses.online.title'), content: t('courses.online.description'), type: 'course', path: '/courses', tags: 'online e-learning digital academy' },
                    { id: 'quizzes', title: 'Evaluation Matrix & Quizzes', content: 'Manage and take barista certification quizzes.', type: 'course', path: '/admin/quizzes', tags: 'quiz testing assessment evaluation exams' },
                    { id: 'about', title: t('about.title'), content: t('about.hero.description'), type: 'public', path: '/about', tags: 'about us center' },
                    { id: 'equipment', title: t('equipment.title'), content: t('equipment.description'), type: 'equipment', path: '/equipment', tags: 'machinery gear' },
                    { id: 'contact', title: t('contact.title'), content: t('contact.description'), type: 'public', path: '/contact', tags: 'contact email' },
                ];

                // 2. Fetch Dynamic Data
                const dynamicResults = [];
                let forumResults = [];
                let oppsResults = [];

                try {
                    // Optimized fetching: Limit to 100 docs per group to prevent timeout
                    const coursesSnap = await getDocs(query(collectionGroup(db, 'modules'), limit(100)));
                    const businessSnap = await getDocs(query(collectionGroup(db, 'chapters'), limit(50)));
                    const forumSnap = await getDocs(query(collection(db, 'forum_posts'), limit(20)));
                    const oppsSnap = await getDocs(query(collection(db, 'opportunities'), limit(20)));

                    console.log(`DEBUG: Search Scanned ${coursesSnap.size + businessSnap.size} core/business docs.`);

                    // Standard Modules
                    coursesSnap.docs.forEach(doc => {
                        const data = doc.data();
                        if (!data) return;

                        // Path construction
                        const parentDoc = doc.ref.parent?.parent;
                        const courseId = parentDoc ? parentDoc.id : null;
                        if (!courseId) return;

                        const moduleTitle = String(data.title || '');
                        const slidesText = Array.isArray(data.content)
                            ? data.content.map(s => `${s.title} ${s.text}`).join(' ')
                            : '';
                        const quizText = Array.isArray(data.quiz?.questions)
                            ? data.quiz.questions.map(q => q.question || q.text || '').join(' ')
                            : '';

                        if (moduleTitle.toLowerCase().includes(term) || slidesText.toLowerCase().includes(term) || quizText.toLowerCase().includes(term)) {
                            dynamicResults.push({
                                id: doc.id,
                                title: moduleTitle,
                                content: slidesText.length > 0 ? (slidesText.substring(0, 100) + '...') : 'Module Content',
                                type: 'curriculum',
                                source: 'Core Course',
                                path: `/student/courses/${courseId}?module=${doc.id}`
                            });
                        }
                    });

                    // Business Chapters
                    businessSnap.docs.forEach(doc => {
                        const data = doc.data();
                        if (!data) return;

                        const parentDoc = doc.ref.parent?.parent;
                        const courseId = parentDoc ? parentDoc.id : null;
                        if (!courseId) return;

                        const title = String(data.title || '');
                        const quizText = Array.isArray(data.quiz?.questions)
                            ? data.quiz.questions.map(q => q.question || q.text || '').join(' ')
                            : '';

                        if (title.toLowerCase().includes(term) || quizText.toLowerCase().includes(term)) {
                            dynamicResults.push({
                                id: doc.id,
                                title,
                                content: `Business Strategy Chapter`,
                                type: 'curriculum',
                                source: 'Business Class',
                                path: `/business/courses/${courseId}`
                            });
                        }
                    });

                    forumResults = forumSnap.docs
                        .map(doc => ({ id: doc.id, ...doc.data(), type: 'forum' }))
                        .filter(post => String(post.title || '').toLowerCase().includes(term) || String(post.content || '').toLowerCase().includes(term));

                    oppsResults = oppsSnap.docs
                        .map(doc => ({ id: doc.id, ...doc.data(), type: 'opportunity' }))
                        .filter(opp => String(opp.title || '').toLowerCase().includes(term) || String(opp.description || '').toLowerCase().includes(term));

                } catch (dbErr) {
                    console.error("Firebase Search Execution Interrupted:", dbErr);
                }

                // Static Filtering
                const matchedPages = STATIC_DATA.filter(item =>
                    item.title.toLowerCase().includes(term) ||
                    item.content.toLowerCase().includes(term) ||
                    (item.tags && item.tags.toLowerCase().includes(term))
                );

                console.log(`DEBUG: Static matches: ${matchedPages.length}, Dynamic matches: ${dynamicResults.length}`);

                setResults({
                    forum: forumResults.slice(0, 5),
                    opportunities: oppsResults.slice(0, 5),
                    curriculum: dynamicResults.slice(0, 10),
                    courses: matchedPages.filter(p => p.type === 'course'),
                    pages: matchedPages.filter(p => p.type === 'public'),
                    equipment: matchedPages.filter(p => p.type === 'equipment'),
                    testimonials: matchedPages.filter(p => p.type === 'testimonial')
                });
            } catch (error) {
                console.error("Deep search master error:", error);
            } finally {
                setLoading(false);
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleResultClick = (result) => {
        onClose();
        if (result.type === 'forum') {
            navigate(`/student/forum/${result.id}`);
        } else if (result.type === 'opportunity') {
            navigate(`/student/opportunities`);
        } else if (result.path) {
            navigate(result.path);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 sm:px-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div
                ref={modalRef}
                className="relative w-full max-w-2xl bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200"
            >
                {/* Search Input */}
                <div className="flex items-center p-4 border-b border-black/5 dark:border-white/5">
                    <span className="material-symbols-outlined text-espresso/40 dark:text-white/40 mr-3">search</span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={t('search.placeholder', 'Search everything...')}
                        className="flex-1 bg-transparent border-none outline-none text-espresso dark:text-white text-lg placeholder:text-espresso/30 dark:placeholder:text-white/30"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {loading && (
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                    )}
                    <button
                        onClick={onClose}
                        className="ml-3 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-espresso/40 dark:text-white/40"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                    {searchTerm.length < 2 ? (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined text-4xl text-espresso/10 dark:text-white/10 mb-2">manage_search</span>
                            <p className="text-espresso/40 dark:text-white/40 text-sm">
                                {t('search.type_to_begin', 'Type at least 2 characters to search')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Curriculum Results */}
                            {results.curriculum.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-espresso/40 dark:text-white/40 mb-3 px-2">
                                        Curriculum & Study Material
                                    </h3>
                                    <div className="space-y-1">
                                        {results.curriculum.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleResultClick(item)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left group"
                                            >
                                                <div className="h-10 w-10 rounded-lg bg-espresso/10 flex items-center justify-center text-espresso">
                                                    <span className="material-symbols-outlined">menu_book</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-espresso dark:text-white group-hover:text-espresso transition-colors">
                                                            {item.title}
                                                        </p>
                                                        <span className="px-2 py-0.5 rounded-md bg-espresso/5 text-[9px] font-black uppercase tracking-tight text-espresso/40">{item.source}</span>
                                                    </div>
                                                    <p className="text-xs text-espresso/50 dark:text-white/50 line-clamp-1 italic">
                                                        {item.content}
                                                    </p>
                                                </div>
                                                <span className="material-symbols-outlined text-espresso/10 dark:text-white/10 group-hover:text-espresso transition-colors">arrow_forward</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Course Results */}
                            {results.courses.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-espresso/40 dark:text-white/40 mb-3 px-2">
                                        {t('search.courses', 'Training Programs')}
                                    </h3>
                                    <div className="space-y-1">
                                        {results.courses.map(course => (
                                            <button
                                                key={course.id}
                                                onClick={() => handleResultClick(course)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group"
                                            >
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    <span className="material-symbols-outlined">school</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-espresso dark:text-white group-hover:text-primary transition-colors">
                                                        {course.title}
                                                    </p>
                                                    <p className="text-xs text-espresso/50 dark:text-white/50 line-clamp-1">
                                                        {course.content}
                                                    </p>
                                                </div>
                                                <span className="material-symbols-outlined text-espresso/10 dark:text-white/10 group-hover:text-primary/40 transition-colors">arrow_forward</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Equipment Results */}
                            {results.equipment.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-espresso/40 dark:text-white/40 mb-3 px-2">
                                        Technical Equipment
                                    </h3>
                                    <div className="space-y-1">
                                        {results.equipment.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleResultClick(item)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group"
                                            >
                                                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                    <span className="material-symbols-outlined">settings_suggest</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-espresso dark:text-white group-hover:text-blue-500 transition-colors">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-xs text-espresso/50 dark:text-white/50 line-clamp-1">
                                                        {item.content}
                                                    </p>
                                                </div>
                                                <span className="material-symbols-outlined text-espresso/10 dark:text-white/10 group-hover:text-blue-500/40 transition-colors">arrow_forward</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Forum Results */}
                            {results.forum.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-espresso/40 dark:text-white/40 mb-3 px-2">
                                        {t('search.forum', 'Community Forum')}
                                    </h3>
                                    <div className="space-y-1">
                                        {results.forum.map(post => (
                                            <button
                                                key={post.id}
                                                onClick={() => handleResultClick(post)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group"
                                            >
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    <span className="material-symbols-outlined">forum</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-espresso dark:text-white group-hover:text-primary transition-colors">
                                                        {post.title}
                                                    </p>
                                                    <p className="text-xs text-espresso/50 dark:text-white/50 line-clamp-1">
                                                        {post.content}
                                                    </p>
                                                </div>
                                                <span className="material-symbols-outlined text-espresso/10 dark:text-white/10 group-hover:text-primary/40 transition-colors">arrow_forward</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Opportunity Results */}
                            {results.opportunities.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-espresso/40 dark:text-white/40 mb-3 px-2">
                                        {t('search.opportunities', 'Jobs & Opportunities')}
                                    </h3>
                                    <div className="space-y-1">
                                        {results.opportunities.map(opp => (
                                            <button
                                                key={opp.id}
                                                onClick={() => handleResultClick(opp)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group"
                                            >
                                                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                                    <span className="material-symbols-outlined">work</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-espresso dark:text-white group-hover:text-orange-500 transition-colors">
                                                        {opp.title}
                                                    </p>
                                                    <p className="text-xs text-espresso/50 dark:text-white/50 line-clamp-1">
                                                        {opp.company} • {opp.location}
                                                    </p>
                                                </div>
                                                <span className="material-symbols-outlined text-espresso/10 dark:text-white/10 group-hover:text-orange-500/40 transition-colors">arrow_forward</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Testimonial Results */}
                            {results.testimonials.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-espresso/40 dark:text-white/40 mb-3 px-2">
                                        Alumni Success Stories
                                    </h3>
                                    <div className="space-y-1">
                                        {results.testimonials.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleResultClick(item)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group"
                                            >
                                                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                                    <span className="material-symbols-outlined">format_quote</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-espresso dark:text-white group-hover:text-green-500 transition-colors">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-xs text-espresso/50 dark:text-white/50 line-clamp-1">
                                                        {item.content}
                                                    </p>
                                                </div>
                                                <span className="material-symbols-outlined text-espresso/10 dark:text-white/10 group-hover:text-green-500/40 transition-colors">arrow_forward</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Public Page Results */}
                            {results.pages.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-espresso/40 dark:text-white/40 mb-3 px-2">
                                        Company Information
                                    </h3>
                                    <div className="space-y-1">
                                        {results.pages.map(page => (
                                            <button
                                                key={page.id}
                                                onClick={() => handleResultClick(page)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group"
                                            >
                                                <div className="h-10 w-10 rounded-lg bg-gray-500/10 flex items-center justify-center text-gray-500">
                                                    <span className="material-symbols-outlined">info</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-espresso dark:text-white group-hover:text-primary transition-colors">
                                                        {page.title}
                                                    </p>
                                                    <p className="text-xs text-espresso/50 dark:text-white/50 line-clamp-1">
                                                        {page.content}
                                                    </p>
                                                </div>
                                                <span className="material-symbols-outlined text-espresso/10 dark:text-white/10 group-hover:text-primary/40 transition-colors">arrow_forward</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* No Results Fallback */}
                            {!loading &&
                                results.curriculum.length === 0 &&
                                results.forum.length === 0 &&
                                results.opportunities.length === 0 &&
                                results.courses.length === 0 &&
                                results.pages.length === 0 &&
                                results.equipment.length === 0 &&
                                results.testimonials.length === 0 && (
                                    <div className="text-center py-10">
                                        <p className="text-espresso/40 dark:text-white/40 text-sm">
                                            {t('search.no_results', `No results found for "{{term}}"`).replace('{{term}}', searchTerm)}
                                        </p>
                                    </div>
                                )}
                        </div>
                    )}
                </div>

                {/* Footer Tip */}
                <div className="p-4 bg-black/5 dark:bg-white/5 flex items-center justify-between text-[10px] font-bold text-espresso/40 dark:text-white/40 uppercase tracking-widest border-t border-black/5 dark:border-white/5">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="bg-white dark:bg-[#2c2825] px-1.5 py-0.5 rounded shadow-sm">ESC</kbd> to close
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="bg-white dark:bg-[#2c2825] px-1.5 py-0.5 rounded shadow-sm">Enter</kbd> to select
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
