import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function Blog() {
    const [activeCategory, setActiveCategory] = useState("All");

    const categories = [
        "All",
        "Coffee Tips",
        "Barista Life",
        "Business Advice",
        "Community News"
    ];

    // Dummy Data
    const posts = [
        {
            id: 1,
            title: "The Secret to Perfect Micro-Foam",
            category: "Coffee Tips",
            date: "Dec 12, 2024",
            image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=2574&auto=format&fit=crop",
            snippet: "Mastering the vortex is key to creating that silky, paint skills needed for latte art."
        },
        {
            id: 2,
            title: "Must-Know Startup Tips for Your First Coffee Shop",
            category: "Business Advice",
            date: "Nov 28, 2024",
            image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2694&auto=format&fit=crop",
            snippet: "From location scouting to menu pricing, here are the 5 pillars of a successful café launch."
        },
        {
            id: 3,
            title: "Spotlight on Our Latest Graduating Class",
            category: "Community News",
            date: "Nov 15, 2024",
            image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2670&auto=format&fit=crop",
            snippet: "Celebrating the hard work and dedication of the Batch 12 graduates."
        },
        {
            id: 4,
            title: "How to Ace Your First Barista Interview",
            category: "Barista Life",
            date: "Oct 30, 2024",
            image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2670&auto=format&fit=crop",
            snippet: "Confidence, hygiene, and coffee knowledge. Here is what employers are really looking for."
        }
    ];

    const filteredPosts = activeCategory === "All"
        ? posts
        : posts.filter(post => post.category.includes(activeCategory.split(" ")[0])); // Simple filter match

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

            {/* 1. Page Title */}
            <div className="container mx-auto px-6 text-center mb-12">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white mb-4 tracking-tight">
                    Usafi Insights
                </h1>
                <h2 className="text-xl md:text-2xl text-primary font-medium mb-6">
                    Your Source for Coffee Tips, Industry News, and Business Advice
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 leading-relaxed max-w-3xl mx-auto">
                    The Usafi Blog is where passion meets expertise. Stay updated on the latest trends in the coffee world, get valuable advice for your career, and find inspiration for your entrepreneurial journey.
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
                                    ? "bg-primary text-white shadow-lg scale-105"
                                    : "bg-white dark:bg-white/5 border border-[#e0dbd6] dark:border-white/10 text-espresso/70 dark:text-white/70 hover:bg-primary/10 hover:text-primary"
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
                        <article key={post.id} className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-md border border-[#e0dbd6] dark:border-white/10 hover:-translate-y-1 transition-transform duration-300">
                            <div className="h-56 overflow-hidden">
                                <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-3 text-xs text-espresso/50 dark:text-white/50 uppercase tracking-widest font-bold">
                                    <span className="text-primary">{post.category}</span>
                                    <span>{post.date}</span>
                                </div>
                                <h3 className="font-serif text-xl font-bold text-espresso dark:text-white mb-3 hover:text-primary transition-colors cursor-pointer">
                                    {post.title}
                                </h3>
                                <p className="text-sm text-espresso/70 dark:text-white/70 mb-4 line-clamp-3">
                                    {post.snippet}
                                </p>
                                <Link to="#" className="inline-flex items-center text-primary font-bold text-sm group">
                                    Read Article <span className="material-symbols-outlined text-lg ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
                {filteredPosts.length === 0 && (
                    <div className="text-center py-20 text-espresso/50">
                        No posts found in this category.
                    </div>
                )}
            </section>

            {/* 4. Section 4: Newsletter */}
            <section className="bg-espresso text-[#FAF5E8] py-20 px-6">
                <div className="container mx-auto max-w-xl text-center">
                    <span className="material-symbols-outlined text-5xl text-primary mb-4">mail</span>
                    <h2 className="font-serif text-3xl font-bold mb-4">Don't Miss an Update!</h2>
                    <p className="text-white/80 mb-8">
                        Subscribe to the Usafi mailing list to receive our latest insights and job alerts directly in your inbox.
                    </p>

                    <form className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            className="flex-1 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button type="submit" className="px-8 py-4 rounded-xl bg-primary text-white font-bold shadow-lg hover:bg-primary/90 transition-all">
                            Subscribe
                        </button>
                    </form>
                </div>
            </section>

        </div>
    );
}
