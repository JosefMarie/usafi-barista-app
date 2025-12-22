import React from 'react';
import { Link } from 'react-router-dom';

export function Gallery() {
    const photos = [
        {
            url: "https://images.unsplash.com/photo-1574914540608-f1c2b53b7549?q=80&w=2670&auto=format&fit=crop",
            category: "Hands-On Practice",
            desc: "Perfecting the grind"
        },
        {
            url: "https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?q=80&w=2670&auto=format&fit=crop",
            category: "Latte Art Mastery",
            desc: "Pouring a heart"
        },
        {
            url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2670&auto=format&fit=crop",
            category: "Classroom & Theory",
            desc: "Group discussion"
        },
        {
            url: "https://images.unsplash.com/photo-1607619662634-3acce2e03cc1?q=80&w=2670&auto=format&fit=crop",
            category: "Graduation",
            desc: "Class of 2024"
        },
        {
            url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2670&auto=format&fit=crop",
            category: "Hands-On Practice",
            desc: "Tamping technique"
        },
        {
            url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=2837&auto=format&fit=crop",
            category: "Classroom & Theory",
            desc: "Notes and testing"
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

            {/* 1. Page Title */}
            <div className="container mx-auto px-6 text-center mb-16">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white mb-4 tracking-tight">
                    Our Community in Action
                </h1>
                <h2 className="text-xl md:text-2xl text-primary font-medium mb-6">
                    Photos & Videos of Training Sessions
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 leading-relaxed max-w-3xl mx-auto">
                    Get a visual feel for the hands-on learning environment at Usafi Barista Training Center. This gallery captures the passion, focus, and camaraderie shared between our students and instructors.
                </p>
            </div>

            {/* 2. Section 1: Image Gallery (Grid) */}
            <section className="container mx-auto px-6 mb-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {photos.map((photo, index) => (
                        <div key={index} className="group relative break-inside-avoid overflow-hidden rounded-2xl shadow-lg border border-[#e0dbd6] dark:border-white/10 aspect-[4/3]">
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                style={{ backgroundImage: `url("${photo.url}")` }}
                            ></div>
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <p className="text-white font-bold text-sm uppercase tracking-wider">{photo.category}</p>
                                <p className="text-white/80 text-xs">{photo.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Section 2: Video Highlights */}
            <section className="bg-espresso text-[#FAF5E8] py-20 px-6">
                <div className="container mx-auto px-6">
                    <h2 className="font-serif text-3xl font-bold mb-12 text-center">Video Highlights</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Clip 1 */}
                        <div className="flex flex-col gap-4 group cursor-pointer">
                            <div className="aspect-video bg-black/50 rounded-xl relative overflow-hidden ring-2 ring-white/10 group-hover:ring-primary transition-all">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-white/80 bg-black/20 rounded-full p-2 backdrop-blur-sm group-hover:scale-110 transition-transform">play_arrow</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">Daily Life at Usafi</h4>
                                <p className="text-sm text-white/60">A fast-paced montage of the training center.</p>
                            </div>
                        </div>

                        {/* Clip 2 */}
                        <div className="flex flex-col gap-4 group cursor-pointer">
                            <div className="aspect-video bg-black/50 rounded-xl relative overflow-hidden ring-2 ring-white/10 group-hover:ring-primary transition-all">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-white/80 bg-black/20 rounded-full p-2 backdrop-blur-sm group-hover:scale-110 transition-transform">play_arrow</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">Perfect Extraction</h4>
                                <p className="text-sm text-white/60">Instructor demonstrating espresso techniques.</p>
                            </div>
                        </div>

                        {/* Clip 3 */}
                        <div className="flex flex-col gap-4 group cursor-pointer">
                            <div className="aspect-video bg-black/50 rounded-xl relative overflow-hidden ring-2 ring-white/10 group-hover:ring-primary transition-all">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-white/80 bg-black/20 rounded-full p-2 backdrop-blur-sm group-hover:scale-110 transition-transform">play_arrow</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">Student Interview</h4>
                                <p className="text-sm text-white/60">Thoughts on their favorite module.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Section 3: Call to Action */}
            <section className="container mx-auto px-6 py-20 text-center">
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-espresso dark:text-white mb-6">
                    See the Action for Yourself
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 mb-10 max-w-2xl mx-auto">
                    Schedule a visit to our Kimironko center to experience the training environment firsthand.
                </p>
                <Link to="/contact" className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-primary text-primary font-bold text-lg hover:bg-primary hover:text-white transition-all">
                    Schedule a Visit
                </Link>
            </section>

        </div>
    );
}
