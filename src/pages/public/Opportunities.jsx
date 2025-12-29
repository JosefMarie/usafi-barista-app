import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientButton } from '../../components/ui/GradientButton';

export function Opportunities() {
    // TOD: Add translations later. Using hardcoded English for now as per plan.
    // const { t } = useTranslation();

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

            {/* Hero Section */}
            <div className="container mx-auto px-6 text-center mb-16">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso dark:text-white mb-6 tracking-tight">
                    Usafi Opportunities
                </h1>
                <p className="text-xl text-espresso/80 dark:text-white/80 leading-relaxed max-w-3xl mx-auto mb-10">
                    Connecting talented professionals with top hospitality businesses. Whether you're hiring or looking for your next career move, we've got you covered.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-4xl mx-auto">

                    {/* For Organizations */}
                    <div className="flex-1 w-full bg-white dark:bg-white/5 p-8 rounded-3xl shadow-xl border border-espresso/5 hover:border-primary/30 transition-all group">
                        <div className="h-16 w-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-4xl">business_center</span>
                        </div>
                        <h2 className="font-serif text-2xl font-bold mb-4">Hiring?</h2>
                        <p className="text-espresso/70 dark:text-white/70 mb-8">
                            Post your job openings and find skilled Baristas, Bartenders, and Service staff trained by Usafi.
                        </p>
                        <GradientButton to="/opportunities/post" className="w-full">
                            Post an Opportunity
                        </GradientButton>
                    </div>

                    {/* For Job Seekers */}
                    <div className="flex-1 w-full bg-white dark:bg-white/5 p-8 rounded-3xl shadow-xl border border-espresso/5 hover:border-primary/30 transition-all group">
                        <div className="h-16 w-16 mx-auto bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-4xl">person_search</span>
                        </div>
                        <h2 className="font-serif text-2xl font-bold mb-4">Job Seeker?</h2>
                        <p className="text-espresso/70 dark:text-white/70 mb-8">
                            Register now to access exclusive job listings in the hospitality industry.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link
                                to="/opportunities/register"
                                className="flex items-center justify-center w-full h-14 rounded-xl border-2 border-green-600 text-green-700 dark:text-green-400 font-bold hover:bg-green-50 dark:hover:bg-green-900/10 transition-all"
                            >
                                Register to Find a Job
                            </Link>
                            <Link
                                to="/seeker/login"
                                className="flex items-center justify-center w-full h-10 text-sm font-bold text-green-600 hover:underline"
                            >
                                Already have an account? Login
                            </Link>
                        </div>
                    </div>

                </div>
            </div>

            {/* Stats / Info Section */}
            <div className="bg-[#FAF5E8] dark:bg-white/5 py-16">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="font-serif text-4xl font-bold text-primary mb-2">500+</div>
                            <div className="text-espresso/70 dark:text-white/70 font-medium">Graduates Placed</div>
                        </div>
                        <div>
                            <div className="font-serif text-4xl font-bold text-primary mb-2">50+</div>
                            <div className="text-espresso/70 dark:text-white/70 font-medium">Partner Venues</div>
                        </div>
                        <div>
                            <div className="font-serif text-4xl font-bold text-primary mb-2">24/7</div>
                            <div className="text-espresso/70 dark:text-white/70 font-medium">Support</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
