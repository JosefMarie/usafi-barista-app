import React from 'react';
import { Link } from 'react-router-dom';

export function Equipment() {
    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

            {/* Page Title */}
            <div className="container mx-auto px-6 text-center mb-16">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white mb-4 tracking-tight">
                    The Right Tools for the Job
                </h1>
                <h2 className="text-xl md:text-2xl text-primary font-medium mb-6">
                    Essential Equipment for Your Professional Coffee Setup
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 leading-relaxed max-w-3xl mx-auto">
                    Starting a coffee shop requires more than just passion—it requires the right gear. This guide covers the foundational tools needed to ensure efficiency, quality, and consistency, whether you're setting up a full-scale café or a small espresso bar.
                </p>
            </div>

            {/* Section 1: Core Machinery */}
            <section className="container mx-auto px-6 mb-20">
                <h2 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-8 border-b-2 border-primary/20 pb-2 inline-block">
                    The Core Machinery
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Espresso Machine Card */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-lg border border-[#e0dbd6] dark:border-white/10 flex flex-col">
                        <div className="h-64 bg-gray-200 relative">
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1570554807185-5c202029b3fd?q=80&w=2699&auto=format&fit=crop")' }}
                            ></div>
                        </div>
                        <div className="p-8 flex-1">
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-2">Espresso Machine</h3>
                            <p className="text-primary font-medium mb-4">The heart of your business.</p>
                            <p className="text-espresso/80 dark:text-white/80 leading-relaxed mb-4">
                                Choose based on volume needs (single-group vs. multi-group). A reliable machine delivers consistent pressure and temperature for the perfect extraction every time.
                            </p>
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-espresso/60 dark:text-white/60">Key Considerations:</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Reliability</span>
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Boiler Capacity</span>
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Ease of Cleaning</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grinder Card */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-lg border border-[#e0dbd6] dark:border-white/10 flex flex-col">
                        <div className="h-64 bg-gray-200 relative">
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1598516086280-9759368d447a?q=80&w=2574&auto=format&fit=crop")' }}
                            ></div>
                        </div>
                        <div className="p-8 flex-1">
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-2">Coffee Grinder</h3>
                            <p className="text-primary font-medium mb-4">As important as the machine itself.</p>
                            <p className="text-espresso/80 dark:text-white/80 leading-relaxed mb-4">
                                A quality grinder ensures uniform particle size for perfect extraction. Inconsistent grinds lead to uneven flavor and wasted beans.
                            </p>
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-espresso/60 dark:text-white/60">Key Considerations:</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Consistency</span>
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Burr Type (Flat/Conical)</span>
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Dosing</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Section 2: Essential Barista Tools */}
            <section className="bg-[#FAF5E8] dark:bg-white/5 py-20 px-6 border-y border-[#e0dbd6] dark:border-white/10">
                <div className="container mx-auto px-6">
                    <h2 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-8 border-b-2 border-primary/20 pb-2 inline-block">
                        Essential Smallwares
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* Tool 1 */}
                        <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-2xl">hardware</span>
                            </div>
                            <h3 className="font-bold text-lg text-espresso dark:text-white mb-2">Tamper</h3>
                            <p className="text-sm text-espresso/70 dark:text-white/70">
                                Ensures a level and compacted coffee bed for even extraction. Calibrated tampers recommended for consistency.
                            </p>
                        </div>

                        {/* Tool 2 */}
                        <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-2xl">local_cafe</span>
                            </div>
                            <h3 className="font-bold text-lg text-espresso dark:text-white mb-2">Milk Pitcher</h3>
                            <p className="text-sm text-espresso/70 dark:text-white/70">
                                Stainless steel required for steaming milk. Have various sizes (350ml, 600ml) for different drink orders.
                            </p>
                        </div>

                        {/* Tool 3 */}
                        <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-2xl">delete</span>
                            </div>
                            <h3 className="font-bold text-lg text-espresso dark:text-white mb-2">Knock Box</h3>
                            <p className="text-sm text-espresso/70 dark:text-white/70">
                                Used for disposing of used coffee pucks cleanly. Must be durable (stainless steel/rubber) and easy to wash.
                            </p>
                        </div>

                        {/* Tool 4 */}
                        <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-2xl">scale</span>
                            </div>
                            <h3 className="font-bold text-lg text-espresso dark:text-white mb-2">Digital Scales</h3>
                            <p className="text-sm text-espresso/70 dark:text-white/70">
                                Precision is vital. Used for dosing grounds accurately and measuring extraction yield by weight.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* Section 3 & 4 Grid */}
            <section className="container mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                    {/* Serving & Inventory */}
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-3xl">inventory_2</span>
                            Serving & Inventory
                        </h2>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0"></div>
                                <div>
                                    <h4 className="font-bold text-espresso dark:text-white">Cups & Glasses</h4>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">Ceramic mugs for dine-in. Demitasse for espresso. Insulated, eco-friendly cups for takeaway.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0"></div>
                                <div>
                                    <h4 className="font-bold text-espresso dark:text-white">Inventory Storage</h4>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">Airtight containers/hoppers to keep roasted beans fresh and away from moisture.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0"></div>
                                <div>
                                    <h4 className="font-bold text-espresso dark:text-white">Point of Sale (POS)</h4>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">Essential software for managing orders, tracking sales patterns, and accepting payments.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Cleaning & Maintenance */}
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-3xl">cleaning_services</span>
                            Hygiene & Safety
                        </h2>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0"></div>
                                <div>
                                    <h4 className="font-bold text-espresso dark:text-white">Cleaning Kit</h4>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">Dedicated kit for daily back-flushing, group head scrubbing, and steam wand cleaning.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0"></div>
                                <div>
                                    <h4 className="font-bold text-espresso dark:text-white">Specialized Agents</h4>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">Use only approved food-grade detergents and descaling chemicals safe for your machine.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0"></div>
                                <div>
                                    <h4 className="font-bold text-espresso dark:text-white">Safety Gear</h4>
                                    <p className="text-sm text-espresso/70 dark:text-white/70 mt-1">First aid kit immediately accessible. Non-slip floor mats behind the bar.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                </div>
            </section>

            {/* Section 5: Purchasing and Pricing */}
            <section className="bg-espresso text-[#FAF5E8] py-20 px-6">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
                        Price Ranges & Aho Wabigura
                    </h2>
                    <p className="text-white/80 text-lg mb-12">
                        Prices vary widely based on brand, capacity, and condition. Here are general guidelines for budgeting your startup:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                            <h3 className="font-bold text-xl mb-2">Espresso Machine</h3>
                            <p className="text-sm text-white/60 uppercase tracking-widest mb-4">Entry-Level Commercial</p>
                            <p className="text-2xl font-bold text-primary">Rwf 2M - 5M</p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                            <h3 className="font-bold text-xl mb-2">Commercial Grinder</h3>
                            <p className="text-sm text-white/60 uppercase tracking-widest mb-4">Quality Burr Grinder</p>
                            <p className="text-2xl font-bold text-primary">Rwf 300k - 800k</p>
                        </div>
                    </div>

                    <div className="bg-primary/20 p-6 rounded-xl border border-primary/30 inline-block text-left max-w-2xl mb-12">
                        <p className="flex gap-3">
                            <span className="material-symbols-outlined text-primary shrink-0">lightbulb</span>
                            <span className="text-sm text-white/90">
                                <strong>Sourcing Advice:</strong> Consider starting with high-quality refurbished equipment to manage initial costs. We provide students with a list of trusted local and international suppliers.
                            </span>
                        </p>
                    </div>

                    <div>
                        <p className="font-serif text-2xl italic text-white mb-6">
                            "Ready to budget and build?"
                        </p>
                        <p className="text-white/70 mb-8">
                            Learn detailed business planning, sourcing, and cost analysis in our Coffee Shop Business module.
                        </p>
                        <Link
                            to="/enroll"
                            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-white text-lg font-bold shadow-lg hover:bg-primary/90 hover:scale-105 transition-all"
                        >
                            Register for the Course
                        </Link>
                    </div>

                </div>
            </section>

        </div>
    );
}
