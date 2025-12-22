import React from 'react';
import { Link } from 'react-router-dom';

export function Contact() {
    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

            {/* Page Header */}
            <div className="container mx-auto px-6 text-center mb-16">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white mb-4 tracking-tight">
                    Get in Touch
                </h1>
                <h2 className="text-xl md:text-2xl text-primary font-medium mb-6">
                    We'd Love to Hear From You
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 leading-relaxed max-w-2xl mx-auto">
                    Whether you have questions about our courses, need support with enrollment, or want to schedule a visit, our team is here to help.
                </p>
            </div>

            <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">

                {/* Contact Information & Map */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-sm border border-[#e0dbd6] dark:border-white/10">
                        <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-6">Contact Info</h3>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                    <span className="material-symbols-outlined">location_on</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-espresso dark:text-white mb-1">Visit Us</h4>
                                    <p className="text-espresso/70 dark:text-white/70">
                                        Kimironko, Kigali<br />
                                        Near Kimironko Market
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                    <span className="material-symbols-outlined">call</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-espresso dark:text-white mb-1">Call Us</h4>
                                    <p className="text-espresso/70 dark:text-white/70">
                                        <a href="tel:+250788123456" className="hover:text-primary transition-colors">+250 788 123 456</a>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                    <span className="material-symbols-outlined">mail</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-espresso dark:text-white mb-1">Email Us</h4>
                                    <p className="text-espresso/70 dark:text-white/70">
                                        <a href="mailto:info@usafibarista.com" className="hover:text-primary transition-colors">info@usafibarista.com</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Placeholder */}
                    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-sm border border-[#e0dbd6] dark:border-white/10 relative bg-gray-200">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.5327096677!2d30.1039!3d-1.9567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca655d9d95f85%3A0x49f5747444747!2sKimironko%20Market!5e0!3m2!1sen!2srw!4v1620000000000!5m2!1sen!2srw"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            className="absolute inset-0"
                            title="Usafi Location"
                        ></iframe>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-lg border border-[#e0dbd6] dark:border-white/10">
                    <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-6">Send a Message</h3>
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="firstName" className="text-sm font-bold text-espresso dark:text-white">First Name</label>
                                <input type="text" id="firstName" className="w-full px-4 py-3 rounded-lg bg-background-light dark:bg-white/10 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="John" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="lastName" className="text-sm font-bold text-espresso dark:text-white">Last Name</label>
                                <input type="text" id="lastName" className="w-full px-4 py-3 rounded-lg bg-background-light dark:bg-white/10 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Doe" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-bold text-espresso dark:text-white">Email Address</label>
                            <input type="email" id="email" className="w-full px-4 py-3 rounded-lg bg-background-light dark:bg-white/10 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="john@example.com" />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="subject" className="text-sm font-bold text-espresso dark:text-white">Subject</label>
                            <select id="subject" className="w-full px-4 py-3 rounded-lg bg-background-light dark:bg-white/10 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                                <option value="">Select a topic</option>
                                <option value="enrollment">Course Enrollment</option>
                                <option value="visit">Schedule a Visit</option>
                                <option value="consultation">Disability Support Consultation</option>
                                <option value="partnership">Partnership Inquiry</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="message" className="text-sm font-bold text-espresso dark:text-white">Message</label>
                            <textarea id="message" rows="5" className="w-full px-4 py-3 rounded-lg bg-background-light dark:bg-white/10 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" placeholder="How can we help you?"></textarea>
                        </div>

                        <button type="submit" className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            Send Message
                        </button>
                    </form>
                </div>

            </div>

        </div>
    );
}
