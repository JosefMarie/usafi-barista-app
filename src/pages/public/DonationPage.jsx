import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTranslation } from 'react-i18next';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { SEO } from '../../components/common/SEO';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_sample');

function DonationForm({ formData, finalAmount, onNext, onBack, loading, setLoading }) {
    const { t } = useTranslation();
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        try {
            const result = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/thank-you`,
                    payment_method_data: {
                        billing_details: {
                            name: formData.fullName || 'Anonymous Donor',
                            email: formData.email
                        }
                    }
                },
                redirect: 'if_required'
            });

            if (result.error) {
                alert(result.error.message);
            } else {
                await addDoc(collection(db, 'donations'), {
                    amount: finalAmount,
                    ...formData,
                    status: 'completed',
                    type: 'scholarship',
                    stripePaymentIntentId: result.paymentIntent.id,
                    createdAt: serverTimestamp()
                });
                onNext();
            }
        } catch (error) {
            console.error("Donation Error:", error);
            alert("An error occurred during donation: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-4 mb-2">
                <button type="button" onClick={onBack} className="size-10 rounded-full border border-espresso/10 flex items-center justify-center hover:bg-espresso hover:text-white transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h2 className="font-serif text-3xl font-black text-[#4B3832] dark:text-[#F5DEB3] mb-1">{t('donations.scholarship_gift')}</h2>
                    <p className="text-[#4B3832]/60 dark:text-[#F5DEB3]/60 font-medium text-sm">{t('donations.choose_amount_desc')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{t('booking.full_name')}</label>
                    <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => formData.setFullName(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{t('booking.email')}</label>
                    <input
                        type="email" required
                        value={formData.email}
                        onChange={(e) => formData.setEmail(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 py-2">
                <input
                    type="checkbox" id="anonymous"
                    checked={formData.anonymous}
                    onChange={(e) => formData.setAnonymous(e.target.checked)}
                    className="size-5 rounded-lg accent-rose-500"
                />
                <label htmlFor="anonymous" className="text-sm font-bold text-espresso/60">{t('donations.anonymous')}</label>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-espresso to-[#2A1E1B] text-[#F5DEB3] shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 p-20 opacity-5 scale-150 rotate-12 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
                    <span className="material-symbols-outlined text-[10rem]">verified</span>
                </div>
                <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="size-12 bg-[#F5DEB3]/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <span className="material-symbols-outlined">credit_card</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">{t('booking.secure_checkout')}</p>
                        </div>
                    </div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <PaymentElement options={{ layout: 'tabs' }} />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || !stripe}
                className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
            >
                {loading ? (
                    <>
                        <div className="size-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined text-rose-500 group-hover:scale-150 transition-transform">favorite</span>
                        {t('donations.confirm_donation')}
                    </>
                )}
            </button>
        </form>
    );
}

export function DonationPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [amount, setAmount] = useState(10000);
    const [customAmount, setCustomAmount] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        anonymous: false
    });

    const donationLevels = [
        { id: 'supporter', label: 'Supporter', value: 5000, desc: 'Covers essential materials for a student.' },
        { id: 'catalyst', label: 'Scholarship Catalyst', value: 25000, desc: 'Funds a full month of intensive training.' },
        { id: 'maker', label: 'Future Maker', value: 100000, desc: 'Supports a student through their entire course.' }
    ];

    const finalAmount = customAmount ? parseInt(customAmount) : amount;

    return (
        <div className="flex flex-col min-h-screen bg-[#FAF5E8] dark:bg-[#1c1916] font-display text-espresso dark:text-white pb-20 pt-24">
            <SEO title="Empower a Future Barista" />

            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-16">
                    <div className="inline-flex size-16 rounded-3xl bg-rose-500/10 text-rose-500 items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-4xl">volunteer_activism</span>
                    </div>
                    <h1 className="font-serif text-4xl md:text-5xl font-black text-[#4B3832] dark:text-[#F5DEB3] mb-4">
                        {t('donations.header_title')}
                    </h1>
                    <p className="text-[#4B3832]/80 dark:text-[#F5DEB3]/80 leading-relaxed max-w-2xl mx-auto font-medium">
                        {t('donations.header_desc')}
                    </p>
                </div>

                <div className="bg-white dark:bg-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl border border-espresso/5 overflow-hidden">
                    {step === 1 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4">
                                <button onClick={() => navigate('/weekend-experience')} className="size-10 rounded-full border border-espresso/10 flex items-center justify-center hover:bg-espresso hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <div>
                                    <h2 className="font-serif text-3xl font-black text-[#4B3832] dark:text-[#F5DEB3] mb-1">{t('donations.select_amount')}</h2>
                                    <p className="text-[#4B3832]/60 dark:text-[#F5DEB3]/60 font-medium text-sm">{t('donations.choose_amount_desc')}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {donationLevels.map((lvl) => (
                                    <button
                                        key={lvl.id}
                                        onClick={() => { setAmount(lvl.value); setCustomAmount(''); }}
                                        className={`p-6 rounded-3xl border-2 text-left transition-all duration-300 ${amount === lvl.value && !customAmount ? 'border-rose-500 bg-rose-500/5 shadow-lg' : 'border-espresso/5 hover:border-espresso/20'}`}
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">{t(`donations.${lvl.id}.label`)}</p>
                                        <p className="text-2xl font-serif font-black mb-2">{lvl.value.toLocaleString()} RWF</p>
                                        <p className="text-xs text-[#4B3832]/60 dark:text-[#F5DEB3]/60 leading-tight">{t(`donations.${lvl.id}.desc`)}</p>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('donations.custom_amount')}</label>
                                <div className="relative">
                                    <input
                                        type="number" placeholder={t('donations.enter_amount_placeholder')}
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        className="w-full px-8 py-6 rounded-[2rem] bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none text-3xl font-serif font-black"
                                    />
                                    <span className="absolute right-8 top-1/2 -translate-y-1/2 font-serif font-black text-espresso/20">RWF</span>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={async () => {
                                        setLoading(true);
                                        try {
                                            const functions = getFunctions();
                                            const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
                                            const { data } = await createPaymentIntent({ amount: finalAmount, currency: 'rwf', metadata: { type: 'donation', donorEmail: formData.email } });
                                            setClientSecret(data.clientSecret);
                                            setStep(2);
                                        } catch (err) { alert("Failed to initialize payment: " + err.message); }
                                        finally { setLoading(false); }
                                    }}
                                    disabled={!finalAmount || finalAmount < 1000 || loading}
                                    className="px-12 py-5 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : null}
                                    {t('donations.proceed_payment')} <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && clientSecret && (
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <DonationForm
                                formData={{
                                    ...formData,
                                    setFullName: (val) => setFormData(prev => ({ ...prev, fullName: val })),
                                    setEmail: (val) => setFormData(prev => ({ ...prev, email: val })),
                                    setAnonymous: (val) => setFormData(prev => ({ ...prev, anonymous: val }))
                                }}
                                finalAmount={finalAmount}
                                onNext={() => setStep(3)}
                                onBack={() => setStep(1)}
                                loading={loading}
                                setLoading={setLoading}
                            />
                        </Elements>
                    )}

                    {step === 3 && (
                        <div className="py-20 text-center space-y-10 animate-in zoom-in-95 fade-in duration-1000">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-rose-500 blur-2xl opacity-20 animate-pulse"></div>
                                <div className="size-32 rounded-[2.5rem] bg-rose-500 text-white mx-auto flex items-center justify-center shadow-2xl relative z-10">
                                    <span className="material-symbols-outlined text-7xl">volunteer_activism</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h2 className="font-serif text-5xl font-black text-[#4B3832] dark:text-[#F5DEB3]">{t('donations.thank_you')}</h2>
                                <p className="text-xl text-[#4B3832]/60 dark:text-[#F5DEB3]/60 max-w-lg mx-auto leading-relaxed font-medium">
                                    {t('donations.confirmation', { amount: finalAmount.toLocaleString() })}
                                </p>
                            </div>
                            <div className="pt-6">
                                <button onClick={() => navigate('/')} className="px-12 py-5 bg-[#4B3832] text-[#F5DEB3] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-transform">
                                    {t('donations.close_btn')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
