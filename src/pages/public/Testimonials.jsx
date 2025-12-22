import React from 'react';
import { Link } from 'react-router-dom';

export function Testimonials() {
    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

            {/* 1. Page Title */}
            <div className="container mx-auto px-6 text-center mb-16">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white mb-4 tracking-tight">
                    Success Stories
                </h1>
                <h2 className="text-xl md:text-2xl text-primary font-medium mb-6">
                    Hear From Our Graduates
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 leading-relaxed max-w-3xl mx-auto">
                    The true measure of our training is the success of our alumni. Read and watch how Usafi Barista Training Center helped turn passion into a profitable profession, landing graduates jobs in top hospitality establishments or launching their own businesses.
                </p>
            </div>

            {/* 2. Section 1: Featured Video Testimonial */}
            <section className="container mx-auto px-6 mb-20">
                <div className="bg-espresso text-[#FAF5E8] rounded-3xl overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* Video Player Placeholder */}
                        <div className="aspect-video lg:aspect-auto bg-black relative flex items-center justify-center group cursor-pointer">
                            {/* This would be an iframe in production */}
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-70"></div>
                            <div className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-4xl text-white ml-2">play_arrow</span>
                            </div>
                        </div>

                        {/* Video Description */}
                        <div className="p-8 lg:p-12 flex flex-col justify-center">
                            <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm font-bold uppercase tracking-wider rounded-full mb-4 w-fit">
                                Featured Story
                            </span>
                            <h3 className="font-serif text-3xl font-bold text-white mb-4">
                                From Student to Shop Owner: Alex's Story
                            </h3>
                            <p className="text-white/80 leading-relaxed mb-6">
                                Alex shares how the Coffee Shop Business module provided the practical framework and supplier connections needed to open their café just six months after graduation.
                            </p>
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <span className="material-symbols-outlined">verified</span>
                                <span>Class of 2024</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Section 2: Written Testimonials */}
            <section className="container mx-auto px-6 mb-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Testimonial 1 */}
                    <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm border border-[#e0dbd6] dark:border-white/10 relative">
                        <span className="material-symbols-outlined text-6xl text-primary/20 absolute top-4 right-4">format_quote</span>

                        {/* Tag */}
                        <div className="mb-6">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider rounded-full">
                                Internship & Job Placement
                            </span>
                        </div>

                        <p className="text-espresso/80 dark:text-white/80 italic mb-8 relative z-10">
                            "Before Usafi, I knew nothing about coffee science. After the Onsite course, I was confident enough to apply for the internship. Usafi placed me at a partner hotel, and they hired me full-time two months later. The career support was invaluable."
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gray-300 bg-[url('https://randomuser.me/api/portraits/women/44.jpg')] bg-cover"></div>
                            <div>
                                <h4 className="font-bold text-espresso dark:text-white">Grace Mutesi</h4>
                                <p className="text-xs text-espresso/60 dark:text-white/60 uppercase tracking-wide">Lead Barista</p>
                            </div>
                        </div>
                    </div>

                    {/* Testimonial 2 */}
                    <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm border border-[#e0dbd6] dark:border-white/10 relative">
                        <span className="material-symbols-outlined text-6xl text-primary/20 absolute top-4 right-4">format_quote</span>

                        {/* Tag */}
                        <div className="mb-6">
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-bold uppercase tracking-wider rounded-full">
                                Technical Skills
                            </span>
                        </div>

                        <p className="text-espresso/80 dark:text-white/80 italic mb-8 relative z-10">
                            "The attention to detail on espresso extraction and milk texturing was phenomenal. I can now consistently produce high-quality drinks, which is noticed by my customers. My Latte Art skills alone set me apart from other candidates."
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gray-300 bg-[url('https://randomuser.me/api/portraits/men/32.jpg')] bg-cover"></div>
                            <div>
                                <h4 className="font-bold text-espresso dark:text-white">Kevin Mugisha</h4>
                                <p className="text-xs text-espresso/60 dark:text-white/60 uppercase tracking-wide">Freelance Consultant</p>
                            </div>
                        </div>
                    </div>

                    {/* Testimonial 3 */}
                    <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm border border-[#e0dbd6] dark:border-white/10 relative">
                        <span className="material-symbols-outlined text-6xl text-primary/20 absolute top-4 right-4">format_quote</span>

                        {/* Tag */}
                        <div className="mb-6">
                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-bold uppercase tracking-wider rounded-full">
                                Online Learning
                            </span>
                        </div>

                        <p className="text-espresso/80 dark:text-white/80 italic mb-8 relative z-10">
                            "I completed the E-Learning course while working my night shift. The video lessons and downloadable PDFs were perfect for self-study. I highly recommend Usafi for anyone who needs flexibility but doesn't want to compromise on quality."
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gray-300 bg-[url('https://randomuser.me/api/portraits/women/65.jpg')] bg-cover"></div>
                            <div>
                                <h4 className="font-bold text-espresso dark:text-white">Patience Uwamahoro</h4>
                                <p className="text-xs text-espresso/60 dark:text-white/60 uppercase tracking-wide">Certified Barista</p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* 4. Section 3: Call to Action */}
            <section className="bg-espresso text-[#FAF5E8] py-20 px-6 text-center">
                <div className="container mx-auto max-w-3xl">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">
                        Ready to Write Your Own Success Story?
                    </h2>
                    <Link to="/enroll" className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-white text-lg font-bold shadow-lg hover:bg-primary/90 hover:scale-105 transition-all">
                        Begin Your Enrollment
                    </Link>
                </div>
            </section>

        </div>
    );
}
