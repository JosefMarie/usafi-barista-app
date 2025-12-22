import React from 'react';
import { Link } from 'react-router-dom';

export function CareerSupport() {
    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

            {/* 1. Page Title */}
            <div className="container mx-auto px-6 text-center mb-16">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white mb-4 tracking-tight">
                    Launch Your Career
                </h1>
                <h2 className="text-xl md:text-2xl text-primary font-medium mb-6">
                    Beyond the Certificate: Your Pathway to Professional Success
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 leading-relaxed max-w-3xl mx-auto">
                    At Usafi Barista Training Center, our commitment to you doesn't end when you finish your course. We provide a robust support system designed to transition you directly from training into employment or entrepreneurship.
                </p>
            </div>

            {/* 2. Section 1: Internship Placement Program */}
            <section className="container mx-auto px-6 mb-20">
                <div className="bg-white dark:bg-white/5 rounded-3xl overflow-hidden shadow-lg border border-[#e0dbd6] dark:border-white/10">
                    <div className="grid grid-cols-1 lg:grid-cols-2">

                        {/* Image Side */}
                        <div className="h-64 lg:h-auto bg-gray-200 relative min-h-[300px]">
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCtF-XnL_08lHxvP43xR4yC62ZJvv_9c5A7Q8XG0E4wHk3_nL2zO9Qf6_W5p_1rD-4qGZ0e8j7aV6kBMx3tY9uN1i_cR5oF2T6nU8D4yB7vA9sL5X3wK1zJ2mH6qC0r_4P8o9nB7vE5t3xL1zK2jM4yN6oP9qR8sT3vW1uX5yZ0aB2cD4eF6gH8iJ0kL2mNwO4qP6rT8sV9uX1yZ3aB5cD7eG9jK0lM3nO5qQ7sU9w")' }} // Placeholder
                            ></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent lg:hidden"></div>
                        </div>

                        {/* Content Side */}
                        <div className="p-8 lg:p-12">
                            <h2 className="font-serif text-2xl md:text-3xl font-bold text-espresso dark:text-white mb-6">
                                Gain Essential Work Experience (Internship)
                            </h2>
                            <p className="text-espresso/80 dark:text-white/80 mb-8 leading-relaxed">
                                Hands-on training is complemented by real-world experience. Our program places you directly into working environments where you can apply your skills and build a professional network.
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined">checklist</span> Ibisabwa (Requirements)
                                    </h3>
                                    <ul className="list-disc list-inside text-sm text-espresso/70 dark:text-white/70 space-y-1 ml-2">
                                        <li>Successful completion of the Core Barista Curriculum.</li>
                                        <li>Strong attendance and performance during training.</li>
                                        <li>Professional presentation and attitude.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined">handshake</span> Partnerships
                                    </h3>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 ml-2">
                                        Usafi Barista Training Center actively partners with leading local cafés, hotels, and hospitality groups in Kigali to secure quality placement opportunities.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined">how_to_reg</span> Uburyo bwo Gusaba (How to Apply)
                                    </h3>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 ml-2">
                                        Internship slots are competitive. Students must complete an internal application form and participate in a mock interview to qualify.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Section 2: Job Hunting & Interview Skills */}
            <section className="bg-[#FAF5E8] dark:bg-white/5 py-20 px-6 border-y border-[#e0dbd6] dark:border-white/10">
                <div className="container mx-auto max-w-5xl">
                    <div className="text-center mb-16">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-espresso dark:text-white mb-4">
                            Mastering the Job Market
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Resource 1 */}
                        <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-3xl">description</span>
                            </div>
                            <h3 className="font-serif font-bold text-xl text-espresso dark:text-white mb-3">CV Writing & Recs</h3>
                            <p className="text-sm text-espresso/70 dark:text-white/70 leading-relaxed">
                                Receive personalized coaching on crafting a compelling CV tailored to the hospitality sector. We also provide recommendation letters for top graduates.
                            </p>
                        </div>

                        {/* Resource 2 */}
                        <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-3xl">notifications_active</span>
                            </div>
                            <h3 className="font-serif font-bold text-xl text-espresso dark:text-white mb-3">Job Alert Networks</h3>
                            <p className="text-sm text-espresso/70 dark:text-white/70 leading-relaxed">
                                Access opportunities via our exclusive network and Usafi Community WhatsApp groups. Learn to leverage LinkedIn and Hospitality Jobs.
                            </p>
                        </div>

                        {/* Resource 3 */}
                        <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-3xl">supervisor_account</span>
                            </div>
                            <h3 className="font-serif font-bold text-xl text-espresso dark:text-white mb-3">Interview Preparation</h3>
                            <p className="text-sm text-espresso/70 dark:text-white/70 leading-relaxed">
                                Learn research techniques, proper attire (Uko Wambara), and non-verbal communication. Access sample interview videos to visualize success.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Section 3: The Entrepreneurial Path */}
            <section className="container mx-auto px-6 py-20">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-espresso text-[#FAF5E8] rounded-3xl p-8 md:p-12 relative overflow-hidden">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-primary rounded-xl text-white">
                                    <span className="material-symbols-outlined text-3xl">storefront</span>
                                </div>
                                <h2 className="font-serif text-2xl md:text-3xl font-bold text-white">
                                    Uko Wakora Coffee Shop Business
                                </h2>
                            </div>

                            <p className="text-white/80 text-lg mb-8">
                                For students aspiring to own their business, this module provides the foundational knowledge to turn your vision into a reality.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary mt-1">edit_document</span>
                                    <div>
                                        <h4 className="font-bold text-white">Gutegura Business Plan</h4>
                                        <p className="text-sm text-white/60">Developing a comprehensive plan.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary mt-1">add_location</span>
                                    <div>
                                        <h4 className="font-bold text-white">Guhitomo Location</h4>
                                        <p className="text-sm text-white/60">Selecting the perfect location.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary mt-1">restaurant_menu</span>
                                    <div>
                                        <h4 className="font-bold text-white">Ibiciro & Menu</h4>
                                        <p className="text-sm text-white/60">Strategic pricing and design.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary mt-1">campaign</span>
                                    <div>
                                        <h4 className="font-bold text-white">Gukora Marketing</h4>
                                        <p className="text-sm text-white/60">Effective startup strategies.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center sm:text-left">
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg"
                                >
                                    Get Startup Advice
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section className="container mx-auto px-6 text-center">
                <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-6">Ready to start your journey?</h3>
                <Link to="/enroll" className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-primary text-white text-lg font-bold shadow-lg hover:bg-primary/90 hover:scale-[1.02] transition-all">
                    Enroll Now
                </Link>
            </section>

        </div>
    );
}
