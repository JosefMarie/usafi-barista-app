import React from 'react';
import { useNavigate } from 'react-router-dom';

export function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-[#2c2825] p-8 sm:p-12 rounded-2xl shadow-xl">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-primary font-bold hover:underline mb-8"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                </button>

                <div className="prose prose-espresso dark:prose-invert max-w-none">
                    <h1 className="text-4xl font-serif font-bold text-espresso dark:text-white mb-6">
                        Privacy Policy
                    </h1>
                    <p className="text-espresso/70 dark:text-white/70 mb-8">
                        Last updated: January 20, 2025
                    </p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-espresso dark:text-white mb-4">1. Introduction</h2>
                        <p className="text-espresso/80 dark:text-white/80">
                            Welcome to Usafi Barista Training Center ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our application.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-espresso dark:text-white mb-4">2. Information We Collect</h2>
                        <p className="text-espresso/80 dark:text-white/80 mb-4">
                            We collect personal information that you voluntarily provide to us when you register on the application, express an interest in obtaining information about us or our products and services, or otherwise when you contact us.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-espresso/80 dark:text-white/80">
                            <li><strong>Personal Identity Information:</strong> Name, email address, phone number, and location.</li>
                            <li><strong>Professional Information:</strong> Education history, work experience, and CV details (for Job Seekers and Students).</li>
                            <li><strong>Account Credentials:</strong> Passwords and other security information used for authentication and account access.</li>
                            <li><strong>Usage Data:</strong> Information about how you use our application, including course progress, quiz results, and forum interactions.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-espresso dark:text-white mb-4">3. How We Use Your Information</h2>
                        <p className="text-espresso/80 dark:text-white/80 mb-4">
                            We use personal information collected via our application for a variety of business purposes described below:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-espresso/80 dark:text-white/80">
                            <li>To facilitate account creation and logon process.</li>
                            <li>To provide you with the services you requested.</li>
                            <li>To send you administrative information.</li>
                            <li>To facilitate communication between students and instructors.</li>
                            <li>To match Job Seekers with potential employers.</li>
                            <li>To improve our application and user experience.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-espresso dark:text-white mb-4">4. Sharing Your Information</h2>
                        <p className="text-espresso/80 dark:text-white/80 mb-4">
                            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-espresso/80 dark:text-white/80">
                            <li><strong>Instructors:</strong> Can see student progress and profiles.</li>
                            <li><strong>Potential Employers:</strong> Can see Job Seeker profiles and CVs if the seeker has opted to be visible.</li>
                            <li><strong>Service Providers:</strong> We may share data with third-party vendors who perform services for us (e.g., Firebase for hosting and authentication).</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-espresso dark:text-white mb-4">5. Your Privacy Choices</h2>
                        <p className="text-espresso/80 dark:text-white/80 mb-4">
                            You have control over your data. In your Profile Settings, you can:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-espresso/80 dark:text-white/80">
                            <li>Change your profile visibility (Public, Connections, or Private).</li>
                            <li>Toggle visibility for your email and phone number.</li>
                            <li>Enable or disable various notifications.</li>
                            <li>Request account deletion by contacting support.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-espresso dark:text-white mb-4">6. Security of Your Information</h2>
                        <p className="text-espresso/80 dark:text-white/80">
                            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any type of misuse or interception.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h3 className="text-xl font-bold text-espresso dark:text-white mb-4">Contact Us</h3>
                        <p className="text-espresso/80 dark:text-white/80">
                            If you have questions or comments about this policy, you may email us at <strong>support@usafi.com</strong>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
