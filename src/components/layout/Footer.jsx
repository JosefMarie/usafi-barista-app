import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function Footer() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const year = new Date().getFullYear();

    const toggleModal = (e) => {
        if (e) e.preventDefault();
        setIsModalOpen(!isModalOpen);
    };

    return (
        <footer className="bg-espresso text-white/80 py-8 border-t border-white/10 mt-auto">
            <div className="container mx-auto px-6 text-center space-y-4">
                <p>&copy; {year} Usafi Barista International Training Center. All rights reserved.</p>

                <p className="text-sm">
                    <button
                        onClick={toggleModal}
                        className="hover:text-primary transition-colors hover:underline decoration-primary/50 underline-offset-4"
                    >
                        Made by AJM digital solution
                    </button>
                </p>
            </div>

            {/* Contact Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-white dark:bg-espresso border border-espresso/10 dark:border-white/10 rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative text-left animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={toggleModal}
                            className="absolute right-4 top-4 text-espresso/40 dark:text-white/40 hover:text-espresso dark:hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-6 pr-8">
                            AJM Digital Solution
                        </h3>

                        <div className="space-y-4 text-espresso/80 dark:text-white/80">
                            <div>
                                <h4 className="font-bold text-espresso dark:text-white mb-1 text-sm uppercase tracking-wide">Location</h4>
                                <p>Kigali, Rwanda</p>
                            </div>

                            <div>
                                <h4 className="font-bold text-espresso dark:text-white mb-1 text-sm uppercase tracking-wide">Phone Numbers</h4>
                                <ul className="space-y-1">
                                    <li>
                                        <a href="tel:+250783309973" className="hover:text-primary transition-colors flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">call</span>
                                            +250 783 309 973
                                        </a>
                                    </li>
                                    <li>
                                        <a href="tel:+250784039011" className="hover:text-primary transition-colors flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">call</span>
                                            +250 784 039 011
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold text-espresso dark:text-white mb-1 text-sm uppercase tracking-wide">Email</h4>
                                <ul className="space-y-1">
                                    <li>
                                        <a href="mailto:ashimirwejoseph@gmail.com" className="hover:text-primary transition-colors flex items-center gap-2 break-all">
                                            <span className="material-symbols-outlined text-[18px]">mail</span>
                                            ashimirwejoseph@gmail.com
                                        </a>
                                    </li>
                                    <li>
                                        <a href="mailto:niyonizeyezamshaban@gmail.com" className="hover:text-primary transition-colors flex items-center gap-2 break-all">
                                            <span className="material-symbols-outlined text-[18px]">mail</span>
                                            niyonizeyezamshaban@gmail.com
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </footer>
    );
}
