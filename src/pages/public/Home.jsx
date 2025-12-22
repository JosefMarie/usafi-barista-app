import React from 'react';
import { Link } from 'react-router-dom';

export function Home() {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white">

            {/* 1. Hero Section */}
            <section className="relative h-[85vh] w-full shrink-0 overflow-hidden flex items-center justify-center">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-center bg-cover bg-no-repeat"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDHGrdFHJ9eE3j63p0CnWhSu2c9gdjURP92ss0xMKkiLXo_gS2ndsYFhFMRzgEdXVwtj4xsrdwZzQRHSoL4-tb13qSXwu9N2hoY7hnL-RFrh146t89ZBjw7RAqr6CU8Bzg6fXI-mK8mVLPk-EXBLnQNcsLXWY9jVA5dz3IaX5v1lt7GAbHfbKdZysOXzmy5Y8MdBAF67NxyxUNyEygPJqqec0ir8_ZMuUyzLnCwq_sqj42fRA7xPHQ0TpXNbdxo9toiBP94kZzgnNni")' }}
                >
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50"></div>

                {/* Content */}
                <div className="relative z-10 container mx-auto px-6 text-center flex flex-col items-center gap-6 max-w-4xl">
                    <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight text-[#FAF5E8] tracking-tight">
                        Brew Your Future: Master the Art of Coffee
                    </h1>

                    <h2 className="text-white/90 text-lg md:text-xl font-normal leading-relaxed max-w-2xl">
                        From bean to cup, and from training to employment. Join Rwanda’s premier training center to gain world-class barista skills and the career support you need to succeed.
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
                        <Link to="/enroll" className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-primary text-[#fbfaf9] text-lg font-bold tracking-wide shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-105 transition-all duration-300">
                            Enroll Today
                        </Link>
                        <Link to="/courses" className="inline-flex items-center justify-center h-14 px-8 rounded-xl border-2 border-white text-white text-lg font-bold tracking-wide hover:bg-white hover:text-primary transition-all duration-300">
                            Explore Our Courses
                        </Link>
                    </div>
                </div>

                {/* Bottom fade/transition */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent"></div>
            </section>

            {/* 2. Key Benefits Section (Why Choose Us?) */}
            <section className="py-20 px-6 bg-background-light dark:bg-background-dark">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-espresso dark:text-white mb-4">
                            Why Choose Usafi Barista Training Center?
                        </h2>
                        <p className="text-espresso/70 dark:text-white/70 text-lg font-normal">
                            We offer more than just a certificate; we offer a pathway to a career.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Column 1: Comprehensive Curriculum */}
                        <div className="flex flex-col items-center text-center gap-4 group hover:-translate-y-2 transition-transform duration-300">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
                                <span className="material-symbols-outlined text-4xl">school</span>
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white">
                                Comprehensive Curriculum
                            </h3>
                            <p className="text-espresso/70 dark:text-white/70 leading-relaxed">
                                Learn from industry experts like Sandrine Gasarasi and Ishimwe Ebenezer. Our curriculum covers everything from Espresso & Milk techniques to Coffee Shop Business management, ensuring you are ready for the market.
                            </p>
                        </div>

                        {/* Column 2: Flexible Learning Options */}
                        <div className="flex flex-col items-center text-center gap-4 group hover:-translate-y-2 transition-transform duration-300">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
                                <span className="material-symbols-outlined text-4xl">sync_alt</span>
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white">
                                Flexible Learning Options
                            </h3>
                            <p className="text-espresso/70 dark:text-white/70 leading-relaxed">
                                Study on your own terms. Choose our Onsite program in Kimironko for hands-on intensity, or our E-Learning platform to study theory from anywhere at your own pace.
                            </p>
                        </div>

                        {/* Column 3: Real Career Support */}
                        <div className="flex flex-col items-center text-center gap-4 group hover:-translate-y-2 transition-transform duration-300">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
                                <span className="material-symbols-outlined text-4xl">work</span>
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white">
                                Real Career Support
                            </h3>
                            <p className="text-espresso/70 dark:text-white/70 leading-relaxed">
                                We don't just teach; we connect. Gain access to exclusive internship opportunities at top local hotels and cafés, job alerts via the Usafi Community, and professional interview preparation.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
