import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { Newsletter } from '../../components/ui/Newsletter';

export function Blog() {
    const { t } = useTranslation();
    const [activeCategory, setActiveCategory] = useState(t('blog.categories.all'));

    const categories = [
        t('blog.categories.all'),
        t('blog.categories.tips'),
        t('blog.categories.life'),
        t('blog.categories.business'),
        t('blog.categories.news')
    ];

    // Translated Data
    const posts = [
        {
            id: 1,
            title: t('blog.posts.p1.title'),
            category: t('blog.categories.tips'),
            date: "Dec 12, 2024",
            image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=2574&auto=format&fit=crop",
            snippet: t('blog.posts.p1.snippet')
        },
        {
            id: 2,
            title: t('blog.posts.p2.title'),
            category: t('blog.categories.business'),
            date: "Nov 28, 2024",
            image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2694&auto=format&fit=crop",
            snippet: t('blog.posts.p2.snippet')
        },
        {
            id: 3,
            title: t('blog.posts.p3.title'),
            category: t('blog.categories.news'),
            date: "Nov 15, 2024",
            image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2670&auto=format&fit=crop",
            snippet: t('blog.posts.p3.snippet')
        },
        {
            id: 4,
            title: t('blog.posts.p4.title'),
            category: t('blog.categories.life'),
            date: "Oct 30, 2024",
            image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2670&auto=format&fit=crop",
            snippet: t('blog.posts.p4.snippet')
        }
    ];

    const filteredPosts = activeCategory === t('blog.categories.all')
        ? posts
        : posts.filter(post => post.category === activeCategory);

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

            {/* 1. Page Title */}
            <div className="container mx-auto px-6 text-center mb-12">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white mb-4 tracking-tight">
                    {t('blog.title')}
                </h1>
                <h2 className="text-xl md:text-2xl text-primary font-medium mb-6">
                    {t('blog.subtitle')}
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 leading-relaxed max-w-3xl mx-auto">
                    {t('blog.description')}
                </p>
            </div>

            {/* 2. Section 1: Categories */}
            <section className="container mx-auto px-6 mb-12">
                <div className="flex flex-wrap justify-center gap-4">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-6 py-2 rounded-full text-sm font-bold transition-all",
                                activeCategory === cat
                                    ? "bg-espresso text-white shadow-lg scale-105"
                                    : "bg-[#F5DEB3] dark:bg-white/5 border border-espresso/10 dark:border-white/10 text-espresso/70 dark:text-white/70 hover:bg-espresso/10 hover:text-espresso"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </section>

            {/* 3. Section 2 & 3: Posts (Featured & Archive mixed for now) */}
            <section className="container mx-auto px-6 mb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.map((post) => (
                        <article key={post.id} className="bg-[#F5DEB3] dark:bg-white/5 rounded-2xl overflow-hidden shadow-xl border border-espresso/10 hover:-translate-y-2 transition-all duration-300 relative group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20 group-hover:bg-espresso transition-colors z-10"></div>
                            <div className="h-56 overflow-hidden">
                                <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-3 text-[10px] text-espresso uppercase tracking-[0.2em] font-black">
                                    <span className="bg-espresso text-white px-2 py-0.5 rounded-md">{post.category}</span>
                                    <span className="opacity-50">{post.date}</span>
                                </div>
                                <h3 className="font-serif text-xl font-bold text-espresso dark:text-white mb-3 hover:text-primary transition-colors cursor-pointer leading-tight">
                                    {post.title}
                                </h3>
                                <p className="text-sm text-espresso/70 dark:text-white/70 mb-4 line-clamp-3 leading-relaxed">
                                    {post.snippet}
                                </p>
                                <Link to="#" className="inline-flex items-center text-espresso font-black text-[11px] uppercase tracking-widest group/link">
                                    {t('blog.posts.read_more')}
                                    <span className="material-symbols-outlined text-lg ml-2 group-hover/link:translate-x-1 transition-transform">arrow_right_alt</span>
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
                {filteredPosts.length === 0 && (
                    <div className="text-center py-20 text-espresso/50">
                        {t('blog.posts.empty')}
                    </div>
                )}
            </section>

            {/* 4. Section 4: Newsletter */}
            <Newsletter />

        </div>
    );
}
