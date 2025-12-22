import React from 'react';
import { Link } from 'react-router-dom';

export function Courses() {
    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-10">

            {/* 1. Page Title */}
            <div className="pt-24 pb-12 px-6 text-center bg-espresso text-wedding-white relative overflow-hidden">
                {/* Background Pattern or Overlay could go here */}
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#FAF5E8] mb-4 tracking-tight">
                        Professional Barista Courses
                    </h1>
                    <p className="text-xl text-white/90 font-light">
                        Choose the learning path that fits your lifestyle and career goals.
                    </p>
                </div>
            </div>

            {/* 2. Section 1: Choose Your Learning Method (Comparison/Pricing Style) */}
            <section className="container mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

                    {/* Card 1: Onsite */}
                    <div className="flex flex-col rounded-3xl overflow-hidden bg-white dark:bg-white/5 border border-[#e0dbd6] dark:border-white/10 shadow-xl group hover:border-primary/50 transition-all duration-300">
                        {/* Card Image */}
                        <div className="h-64 bg-gray-200 relative">
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDHGrdFHJ9eE3j63p0CnWhSu2c9gdjURP92ss0xMKkiLXo_gS2ndsYFhFMRzgEdXVwtj4xsrdwZzQRHSoL4-tb13qSXwu9N2hoY7hnL-RFrh146t89ZBjw7RAqr6CU8Bzg6fXI-mK8mVLPk-EXBLnQNcsLXWY9jVA5dz3IaX5v1lt7GAbHfbKdZysOXzmy5Y8MdBAF67NxyxUNyEygPJqqec0ir8_ZMuUyzLnCwq_sqj42fRA7xPHQ0TpXNbdxo9toiBP94kZzgnNni")' }} // Placeholder
                            ></div>
                            <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                                Most Popular
                            </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-8 flex-1 flex flex-col">
                            <h3 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-2">Onsite Training</h3>
                            <p className="text-sm text-espresso/60 dark:text-white/60 font-bold uppercase tracking-wide mb-6">In-Person • Kimironko</p>

                            <p className="text-espresso/80 dark:text-white/80 mb-6 flex-1">
                                Best for students who want intensive, hands-on practice with professional equipment.
                            </p>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
                                    <span className="text-sm text-espresso/80 dark:text-white/80">Direct access to commercial Espresso Machines & Grinders</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
                                    <span className="text-sm text-espresso/80 dark:text-white/80">Face-to-face coaching with instructors</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
                                    <span className="text-sm text-espresso/80 dark:text-white/80">Immediate feedback on Latte Art</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
                                    <span className="text-sm text-espresso/80 dark:text-white/80">Networking with peers in the classroom</span>
                                </li>
                            </ul>

                            <Link to="/enroll" className="w-full py-4 rounded-xl bg-primary text-white font-bold text-center shadow-lg hover:bg-primary/90 transition-all">
                                Choose Onsite
                            </Link>
                        </div>
                    </div>

                    {/* Card 2: Online */}
                    <div className="flex flex-col rounded-3xl overflow-hidden bg-white dark:bg-white/5 border border-[#e0dbd6] dark:border-white/10 shadow-xl group hover:border-primary/50 transition-all duration-300">
                        {/* Card Image */}
                        <div className="h-64 bg-gray-200 relative">
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCtF-XnL_08lHxvP43xR4yC62ZJvv_9c5A7Q8XG0E4wHk3_nL2zO9Qf6_W5p_1rD-4qGZ0e8j7aV6kBMx3tY9uN1i_cR5oF2T6nU8D4yB7vA9sL5X3wK1zJ2mH6qC0r_4P8o9nB7vE5t3xL1zK2jM4yN6oP9qR8sT3vW1uX5yZ0aB2cD4eF6gH8iJ0kL2mNwO4qP6rT8sV9uX1yZ3aB5cD7eG9jK0lM3nO5qQ7sU9w")' }} // Placeholder
                            ></div>
                        </div>

                        {/* Card Content */}
                        <div className="p-8 flex-1 flex flex-col">
                            <h3 className="font-serif text-3xl font-bold text-espresso dark:text-white mb-2">E-Learning</h3>
                            <p className="text-sm text-espresso/60 dark:text-white/60 font-bold uppercase tracking-wide mb-6">Remote • Flexible</p>

                            <p className="text-espresso/80 dark:text-white/80 mb-6 flex-1">
                                Best for students with busy schedules or those living outside Kigali.
                            </p>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
                                    <span className="text-sm text-espresso/80 dark:text-white/80">Study at your own pace</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
                                    <span className="text-sm text-espresso/80 dark:text-white/80">Virtual Classrooms (Zoom / Google Meet)</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
                                    <span className="text-sm text-espresso/80 dark:text-white/80">Access to video lessons & quizzes</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
                                    <span className="text-sm text-espresso/80 dark:text-white/80">Downloadable Course PDFs</span>
                                </li>
                            </ul>

                            <Link to="/enroll" className="w-full py-4 rounded-xl border-2 border-primary text-primary font-bold text-center hover:bg-primary hover:text-white transition-all">
                                Choose Online
                            </Link>
                        </div>
                    </div>

                </div>
            </section>

            {/* 3. Section 2: Core Curriculum */}
            <section className="bg-[#FAF5E8] dark:bg-white/5 py-20 px-6">
                <div className="container mx-auto max-w-5xl">
                    <div className="text-center mb-16">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-espresso dark:text-white mb-4">
                            Comprehensive Module Breakdown
                        </h2>
                        <p className="text-lg text-espresso/70 dark:text-white/70">
                            Whether you study Online or Onsite, our curriculum covers the essential pillars of the coffee industry.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Module 1 */}
                        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-transparent hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-primary text-3xl">coffee</span>
                                <h3 className="font-serif font-bold text-lg text-espresso dark:text-white">Introduction to Coffee</h3>
                            </div>
                            <p className="text-sm text-espresso/70 dark:text-white/70">History of coffee, bean varieties (Arabica vs. Robusta), and processing methods.</p>
                        </div>

                        {/* Module 2 */}
                        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-transparent hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-primary text-3xl">build</span>
                                <h3 className="font-serif font-bold text-lg text-espresso dark:text-white">Barista Basics & Equipment</h3>
                            </div>
                            <p className="text-sm text-espresso/70 dark:text-white/70">Understanding the espresso machine, grinder calibration, and tamping techniques.</p>
                        </div>

                        {/* Module 3 */}
                        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-transparent hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-primary text-3xl">science</span>
                                <h3 className="font-serif font-bold text-lg text-espresso dark:text-white">Espresso & Milk Science</h3>
                            </div>
                            <p className="text-sm text-espresso/70 dark:text-white/70">Perfecting the espresso shot (extraction) and mastering milk steaming (micro-foam).</p>
                        </div>

                        {/* Module 4 */}
                        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-transparent hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-primary text-3xl">palette</span>
                                <h3 className="font-serif font-bold text-lg text-espresso dark:text-white">Latte Art</h3>
                            </div>
                            <p className="text-sm text-espresso/70 dark:text-white/70">Techniques for pouring hearts, rosettas, and tulips.</p>
                        </div>

                        {/* Module 5 */}
                        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-transparent hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-primary text-3xl">cleaning_services</span>
                                <h3 className="font-serif font-bold text-lg text-espresso dark:text-white">Hygiene & Maintenance</h3>
                            </div>
                            <p className="text-sm text-espresso/70 dark:text-white/70">Machine cleaning protocols and workspace safety standards.</p>
                        </div>

                        {/* Module 6 */}
                        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-transparent hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-primary text-3xl">handshake</span>
                                <h3 className="font-serif font-bold text-lg text-espresso dark:text-white">Customer Service</h3>
                            </div>
                            <p className="text-sm text-espresso/70 dark:text-white/70">Building customer loyalty, body language, and service adaptation.</p>
                        </div>

                        {/* Module 7 (Bonus, Full Width) */}
                        <div className="md:col-span-2 lg:col-span-3 bg-primary/5 p-6 rounded-2xl shadow-sm border border-primary/10">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-primary text-3xl">trending_up</span>
                                <h3 className="font-serif font-bold text-lg text-espresso dark:text-white">Bonus: Coffee Shop Business</h3>
                            </div>
                            <p className="text-sm text-espresso/70 dark:text-white/70">Business planning, menu pricing, marketing, and startup tips.</p>
                        </div>
                    </div>
                </div>
            </section>


            {/* 4. Section 3: Learning Materials & Certification */}
            <section className="container mx-auto px-6 py-20">
                <div className="max-w-4xl mx-auto">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-center text-espresso dark:text-white mb-16">
                        Tools for Your Success
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* 1. Student Notes */}
                        <div className="flex flex-col gap-4">
                            <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">book</span>
                                Student Notes
                            </h3>
                            <p className="text-espresso/70 dark:text-white/70">
                                All students receive access to comprehensive PDF Notes covering Barista Basics, Customer Service, Hygiene & Safety, and Business Advice.
                            </p>
                            <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-lg border-l-4 border-primary text-sm">
                                Available for view online or download.
                            </div>
                        </div>

                        {/* 2. Official Certification */}
                        <div className="flex flex-col gap-4">
                            <h3 className="font-serif text-2xl font-bold text-[#4CAF50] flex items-center gap-2">
                                <span className="material-symbols-outlined">workspace_premium</span>
                                Official Certification
                            </h3>
                            <p className="text-espresso/70 dark:text-white/70">
                                Upon successful completion of the course (and passing the final practical/theory tests), you will receive a Certificate of Completion from Usafi Barista Training Center.
                            </p>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-[#4CAF50] text-sm text-green-800 dark:text-green-200">
                                A recognized credential to boost your CV.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Section 4: CTA */}
            <section className="bg-espresso py-20 px-6 text-center">
                <div className="container mx-auto max-w-3xl">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#FAF5E8] mb-6">
                        Ready to Start Brewing?
                    </h2>
                    <p className="text-white/80 text-lg mb-10">
                        Seats fill up quickly for our Onsite classes. Secure your spot today or start learning online immediately.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link to="/enroll" className="inline-flex items-center justify-center w-full sm:w-auto h-14 px-8 rounded-xl bg-primary text-white text-lg font-bold shadow-lg hover:bg-primary/90 hover:scale-105 transition-all">
                            Register Now
                        </Link>
                        <Link to="/contact" className="inline-flex items-center justify-center w-full sm:w-auto h-14 px-8 rounded-xl border border-white/30 text-white text-lg font-bold hover:bg-white/10 transition-all">
                            Contact Us
                        </Link>
                    </div>

                    <p className="mt-6 text-sm text-white/50">
                        Have questions about payment plans? <Link to="/contact" className="text-primary hover:underline">Contact Us</Link>
                    </p>
                </div>
            </section>

        </div>
    );
}
