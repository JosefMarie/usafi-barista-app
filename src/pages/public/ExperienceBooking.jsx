import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTranslation } from 'react-i18next';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { SEO } from '../../components/common/SEO';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_sample');

// ─── Data (must match WeekendExperience.jsx) ──────────────────────────────────

const ACTIVITIES = [
    { id: 'latte_art', title: 'Latte Art Masterclass', price: 20000, duration: '2hrs', gradient: 'from-pink-500 to-rose-600', icon: 'local_cafe' },
    { id: 'sensory_tasting', title: 'Sensory Cupping Session', price: 25000, duration: '2.5hrs', gradient: 'from-amber-400 to-orange-500', icon: 'temp_preferences_custom' },
    { id: 'bean_to_bag', title: 'Bean to Bag: Roasting Fun', price: 30000, duration: '3hrs', gradient: 'from-emerald-400 to-teal-500', icon: 'fire_griddler' },
    { id: 'espresso_workshop', title: 'Espresso Extraction Workshop', price: 27000, duration: '2hrs', gradient: 'from-violet-500 to-indigo-600', icon: 'coffee_maker' },
    { id: 'equipment_tour', title: 'Equipment & Tools Deep Dive', price: 17000, duration: '1.5hrs', gradient: 'from-sky-400 to-blue-500', icon: 'settings' },
    { id: 'coffee_preparation', title: 'Farm to Cup Experience', price: 23000, duration: '2.5hrs', gradient: 'from-lime-500 to-emerald-600', icon: 'agriculture' },
    { id: 'cold_brew', title: 'Cold Brew & Signature Drinks', price: 22000, duration: '2hrs', gradient: 'from-blue-400 to-violet-500', icon: 'water_drop' },
    { id: 'barista_basics', title: 'Barista Basics Bootcamp', price: 35000, duration: '4hrs', gradient: 'from-fuchsia-500 to-rose-600', icon: 'school' }
];

const COMBOS = {
    coffee_lover: { title: "Coffee Lover's Duo", activities: ['latte_art', 'sensory_tasting'], comboPrice: 44000 },
    barista_journey: { title: 'The Full Barista Journey', activities: ['espresso_workshop', 'latte_art', 'equipment_tour'], comboPrice: 53000 },
    origin_explorer: { title: "Origin Explorer's Pack", activities: ['coffee_preparation', 'sensory_tasting', 'bean_to_bag'], comboPrice: 65000 },
    ultimate: { title: 'The Ultimate Experience', activities: ['barista_basics', 'latte_art', 'sensory_tasting', 'bean_to_bag'], comboPrice: 84000 }
};

function getGroupDiscount(numPeople) {
    if (numPeople >= 7) return 0.15;
    if (numPeople >= 4) return 0.10;
    if (numPeople >= 2) return 0.05;
    return 0;
}

// ─── Stripe Payment Step ──────────────────────────────────────────────────────

function PaymentForm({ formData, totalPrice, finalTotal, bookingDetails, onNext, onBack, loading, setLoading }) {
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
                            name: formData.fullName,
                            email: formData.email,
                            phone: formData.phone
                        }
                    }
                },
                redirect: 'if_required'
            });
            if (result.error) {
                alert(result.error.message);
            } else {
                await addDoc(collection(db, 'weekend_bookings'), {
                    ...formData,
                    ...bookingDetails,
                    totalPrice: finalTotal,
                    status: 'confirmed',
                    paymentMethod: 'stripe',
                    stripePaymentIntentId: result.paymentIntent.id,
                    createdAt: serverTimestamp()
                });
                onNext();
            }
        } catch (err) {
            alert(t('weekendExperience.booking.payment_err', 'Payment error:') + ' ' + err.message);
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
                    <h2 className="font-serif text-3xl font-black text-[#4B3832] dark:text-[#F5DEB3] mb-1">{t('weekendExperience.booking.personal_details', 'Personal Details')}</h2>
                    <p className="text-[#4B3832]/60 dark:text-[#F5DEB3]/60 font-medium text-sm">{t('weekendExperience.booking.personal_desc', 'One last step — fill in your info and complete payment.')}</p>
                </div>
            </div>

            {/* Booking Summary */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-espresso/40 mb-3">{t('weekendExperience.booking.summary', 'Booking Summary')}</p>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-black text-sm text-espresso dark:text-[#F5DEB3]">
                            {bookingDetails.isCombo ? t(`weekendExperience.combos.${bookingDetails.comboId}.title`, bookingDetails.comboTitle) : t(`weekendExperience.activities.${bookingDetails.activityId}.title`, bookingDetails.activityTitle)}
                        </p>
                        <p className="text-xs text-espresso/50">{formData.numPeople} {formData.numPeople > 1 ? t('weekendExperience.booking.people', 'people') : t('weekendExperience.booking.person', 'person')} · {formData.date}</p>
                        {bookingDetails.groupDiscount > 0 && (
                            <p className="text-xs text-emerald-600 font-bold mt-1">✓ {Math.round(bookingDetails.groupDiscount * 100)}% {t('weekendExperience.booking.group_discount_applied', 'group discount applied')}</p>
                        )}
                    </div>
                    <div className="text-right">
                        {totalPrice !== finalTotal && <p className="text-sm line-through text-espresso/30">{totalPrice.toLocaleString()} RWF</p>}
                        <p className="font-serif font-black text-xl text-rose-600">{finalTotal.toLocaleString()} RWF</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{t('weekendExperience.booking.full_name', 'Full Name')}</label>
                    <input type="text" required value={formData.fullName}
                        onChange={e => formData.setFullName(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{t('weekendExperience.booking.email', 'Email Address')}</label>
                    <input type="email" required value={formData.email}
                        onChange={e => formData.setEmail(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{t('weekendExperience.booking.phone', 'Phone Number')}</label>
                    <input type="tel" required value={formData.phone}
                        onChange={e => formData.setPhone(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{t('weekendExperience.booking.country', 'Country / Origin')}</label>
                    <input type="text" placeholder={t('weekendExperience.booking.country_placeholder', 'e.g. USA, France, Kenya...')}
                        value={formData.country}
                        onChange={e => formData.setCountry(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold"
                    />
                </div>
            </div>

            {/* Stripe Card Panel */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-espresso to-[#2A1E1B] text-[#F5DEB3] shadow-2xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 p-20 opacity-5 scale-150 rotate-12 pointer-events-none">
                    <span className="material-symbols-outlined text-[10rem]">verified</span>
                </div>
                <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="size-12 bg-[#F5DEB3]/10 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined">credit_card</span>
                        </div>
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Secured by Stripe</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <PaymentElement options={{ layout: 'tabs' }} />
                    </div>
                </div>
            </div>

            <button
                type="submit" disabled={loading || !stripe}
                className="w-full py-5 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
                {loading ? (
                    <><div className="size-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>{t('weekendExperience.booking.processing', 'Processing...')}</>
                ) : (
                    <>{t('weekendExperience.booking.pay', 'Pay')} {finalTotal.toLocaleString()} RWF <span className="material-symbols-outlined text-sm">lock</span></>
                )}
            </button>
        </form>
    );
}

// ─── Main Booking Page ────────────────────────────────────────────────────────

export function ExperienceBooking() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const activityId = searchParams.get('activity') || 'latte_art';
    const comboId = searchParams.get('combo');

    const selectedActivity = ACTIVITIES.find(a => a.id === activityId);
    const selectedCombo = comboId ? COMBOS[comboId] : null;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState('');

    const [currentActivity, setCurrentActivity] = useState(selectedActivity || ACTIVITIES[0]);
    const [numPeople, setNumPeople] = useState(1);
    const [date, setDate] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('');

    // Price calculations
    const basePrice = selectedCombo ? selectedCombo.comboPrice : currentActivity.price;
    const totalBeforeDiscount = selectedCombo ? basePrice : basePrice * numPeople;
    const groupDiscount = selectedCombo ? 0 : getGroupDiscount(numPeople);
    const discountAmount = Math.round(totalBeforeDiscount * groupDiscount);
    const finalTotal = totalBeforeDiscount - discountAmount;

    const bookingDetails = {
        activityId: currentActivity.id,
        activityTitle: selectedCombo ? null : currentActivity.title,
        comboId: comboId || null,
        comboTitle: selectedCombo ? selectedCombo.title : null,
        isCombo: !!selectedCombo,
        numPeople,
        date,
        specialRequests,
        basePrice,
        groupDiscount,
        discountAmount
    };

    const handleContinue = async () => {
        const day = new Date(date).getDay();
        if (day !== 0 && day !== 6) {
            alert(t('weekendExperience.booking.alert_weekend', 'Please choose a Saturday or Sunday — we only host on weekends!'));
            return;
        }
        setLoading(true);
        try {
            const functions = getFunctions();
            const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
            const { data } = await createPaymentIntent({
                amount: finalTotal,
                currency: 'rwf',
                metadata: {
                    type: selectedCombo ? 'combo_booking' : 'experience_booking',
                    activity: currentActivity.id,
                    combo: comboId || null,
                    numPeople
                }
            });
            setClientSecret(data.clientSecret);
            setStep(2);
        } catch (err) {
            alert(t('weekendExperience.booking.payment_init_err', 'Failed to initialize payment:') + ' ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const progressSteps = [
        t('weekendExperience.booking.step_experience', 'Experience'),
        t('weekendExperience.booking.step_payment', 'Payment'),
        t('weekendExperience.booking.step_confirmed', 'Confirmed')
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#FAF5E8] dark:bg-[#1c1916] font-display text-espresso dark:text-white pb-20 pt-24">
            <SEO title={selectedCombo ? `${t('weekendExperience.book_btn', 'Book')} ${t(`weekendExperience.combos.${selectedCombo.id}.title`, selectedCombo.title)}` : `${t('weekendExperience.book_btn', 'Book')} ${t(`weekendExperience.activities.${currentActivity.id}.title`, currentActivity.title)}`} />

            <div className="container mx-auto px-6 max-w-3xl">
                {/* Progress */}
                <div className="flex items-center justify-between mb-12 relative px-4 md:px-10">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-espresso/10 -z-10"></div>
                    {progressSteps.map((label, i) => {
                        const s = i + 1;
                        return (
                            <div key={s} className="flex flex-col items-center gap-2">
                                <div className={`size-10 md:size-12 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 ${step >= s ? 'bg-gradient-to-br from-rose-500 to-amber-500 text-white scale-110 shadow-lg' : 'bg-white dark:bg-white/10 text-espresso/40 border border-espresso/10'}`}>
                                    {step > s ? <span className="material-symbols-outlined">check</span> : s}
                                </div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-espresso/40 hidden md:block">{label}</p>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white dark:bg-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl border border-espresso/5 overflow-hidden relative">

                    {/* Step 1: Session Details */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4">
                                <button onClick={() => navigate('/weekend-experience')} className="size-10 rounded-full border border-espresso/10 flex items-center justify-center hover:bg-espresso hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <div>
                                    <h2 className="font-serif text-3xl font-black text-[#4B3832] dark:text-[#F5DEB3] mb-1">
                                        {selectedCombo ? t('weekendExperience.booking.combo_package', 'Combo Package') : t('weekendExperience.booking.session_details', 'Session Details')}
                                    </h2>
                                    <p className="text-[#4B3832]/60 dark:text-[#F5DEB3]/60 font-medium text-sm">{t('weekendExperience.booking.session_desc', 'Choose your date, number of participants, and activity.')}</p>
                                </div>
                            </div>

                            {selectedCombo && (
                                <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-2">{t('weekendExperience.booking.selected_combo', 'Selected Combo')}</p>
                                    <p className="font-serif font-black text-xl text-[#4B3832] dark:text-[#F5DEB3]">{t(`weekendExperience.combos.${selectedCombo.id}.title`, selectedCombo.title)}</p>
                                    <p className="text-sm text-espresso/50 dark:text-[#F5DEB3]/50 mt-1">
                                        {selectedCombo.activities.map(id => t(`weekendExperience.activities.${id}.title`, ACTIVITIES.find(a => a.id === id)?.title)).join(' · ')}
                                    </p>
                                </div>
                            )}

                            {/* Activity Selector (for non-combo) */}
                            {!selectedCombo && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{t('weekendExperience.booking.select_activity', 'Select Activity')}</label>
                                    <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2">
                                        {ACTIVITIES.map(a => (
                                            <button
                                                key={a.id}
                                                type="button"
                                                onClick={() => setCurrentActivity(a)}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${currentActivity.id === a.id ? 'border-rose-500 bg-rose-500/5 shadow-md' : 'border-espresso/5 hover:border-espresso/20'}`}
                                            >
                                                <div className={`size-10 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center text-white flex-shrink-0`}>
                                                    <span className="material-symbols-outlined text-lg">{a.icon}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-espresso dark:text-[#F5DEB3]">{t(`weekendExperience.activities.${a.id}.title`, a.title)}</p>
                                                    <p className="text-[10px] text-espresso/40">{t(`weekendExperience.activities.${a.id}.duration`, a.duration)}</p>
                                                </div>
                                                <p className="font-serif font-black text-sm text-rose-600">{a.price.toLocaleString()} RWF</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{t('weekendExperience.booking.weekend_date', 'Weekend Date')}</label>
                                    <input
                                        type="date" required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold"
                                    />
                                    <p className="text-[9px] text-rose-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">event</span>
                                        {t('weekendExperience.booking.weekends_only', 'Saturdays & Sundays only')}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">
                                        {t('weekendExperience.booking.num_people', 'Number of People')}
                                        {numPeople >= 2 && !selectedCombo && (
                                            <span className="ml-2 text-emerald-600">({Math.round(getGroupDiscount(numPeople) * 100)}% {t('weekendExperience.booking.discount_exclaim', 'discount!')})</span>
                                        )}
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setNumPeople(Math.max(1, numPeople - 1))}
                                            className="size-12 rounded-xl border border-espresso/10 flex items-center justify-center hover:bg-espresso hover:text-white transition-colors font-black text-lg"
                                        >−</button>
                                        <div className="flex-1 px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 text-center font-black text-xl">
                                            {numPeople}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setNumPeople(Math.min(20, numPeople + 1))}
                                            className="size-12 rounded-xl border border-espresso/10 flex items-center justify-center hover:bg-espresso hover:text-white transition-colors font-black text-lg"
                                        >+</button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{t('weekendExperience.booking.special_requests', 'Special Requests (optional)')}</label>
                                <textarea
                                    rows={2}
                                    placeholder={t('weekendExperience.booking.special_requests_hint', 'Dietary restrictions, accessibility needs, language preferences...')}
                                    value={specialRequests}
                                    onChange={e => setSpecialRequests(e.target.value)}
                                    className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold resize-none"
                                />
                            </div>

                            {/* Price Breakdown */}
                            <div className="pt-6 border-t border-espresso/5">
                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-espresso/50">
                                            {selectedCombo ? t(`weekendExperience.combos.${selectedCombo.id}.title`, selectedCombo.title) : `${t(`weekendExperience.activities.${currentActivity.id}.title`, currentActivity.title)} × ${numPeople}`}
                                        </span>
                                        <span className="font-bold">{totalBeforeDiscount.toLocaleString()} RWF</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-emerald-600">
                                            <span>{t('weekendExperience.booking.group_discount', 'Group discount')} ({Math.round(groupDiscount * 100)}%)</span>
                                            <span className="font-bold">−{discountAmount.toLocaleString()} RWF</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-black pt-2 border-t border-espresso/5">
                                        <span className="text-[#4B3832] dark:text-[#F5DEB3]">{t('weekendExperience.booking.total', 'Total')}</span>
                                        <span className="text-rose-600 font-serif">{finalTotal.toLocaleString()} RWF</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleContinue}
                                    disabled={!date || loading}
                                    className="w-full py-5 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>{t('weekendExperience.booking.preparing', 'Preparing...')}</>
                                    ) : (
                                        <>{t('weekendExperience.booking.continue_payment', 'Continue to Payment')} <span className="material-symbols-outlined text-sm">arrow_forward</span></>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Payment */}
                    {step === 2 && clientSecret && (
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <PaymentForm
                                formData={{ fullName, email, phone, country, numPeople, date, setFullName, setEmail, setPhone, setCountry }}
                                totalPrice={totalBeforeDiscount}
                                finalTotal={finalTotal}
                                bookingDetails={bookingDetails}
                                onNext={() => setStep(3)}
                                onBack={() => setStep(1)}
                                loading={loading}
                                setLoading={setLoading}
                            />
                        </Elements>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === 3 && (
                        <div className="py-16 text-center space-y-8 animate-in zoom-in-95 fade-in duration-700">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse"></div>
                                <div className="size-28 rounded-[2rem] bg-gradient-to-br from-green-400 to-emerald-600 text-white mx-auto flex items-center justify-center shadow-2xl relative z-10">
                                    <span className="material-symbols-outlined text-6xl">verified</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h2 className="font-serif text-4xl md:text-5xl font-black text-[#4B3832] dark:text-[#F5DEB3]">
                                    {t('weekendExperience.booking.success_title', 'You\'re Booked! 🎉')}
                                </h2>
                                <p className="text-lg text-[#4B3832]/60 dark:text-[#F5DEB3]/60 max-w-md mx-auto leading-relaxed font-medium">
                                    {t('weekendExperience.booking.success_desc1', 'A confirmation has been sent to')} <strong>{email}</strong>. {t('weekendExperience.booking.success_desc2', 'We can\'t wait to see you on')} <strong>{date}</strong>!
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/20 text-left space-y-2 max-w-sm mx-auto">
                                <p className="text-[10px] font-black uppercase tracking-widest text-espresso/40 mb-3">{t('weekendExperience.booking.your_booking', 'Your Booking')}</p>
                                <p className="font-bold text-sm">
                                    {selectedCombo ? t(`weekendExperience.combos.${selectedCombo.id}.title`, selectedCombo.title) : t(`weekendExperience.activities.${currentActivity.id}.title`, currentActivity.title)}
                                </p>
                                <p className="text-xs text-espresso/50">{date} · {numPeople} {numPeople > 1 ? t('weekendExperience.booking.guests', 'guests') : t('weekendExperience.booking.guest', 'guest')}</p>
                                <p className="font-serif font-black text-rose-600">{finalTotal.toLocaleString()} RWF</p>
                            </div>
                            <div className="flex flex-wrap gap-4 justify-center pt-4">
                                <button onClick={() => navigate('/')} className="px-10 py-4 bg-[#4B3832] text-[#F5DEB3] rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl">
                                    {t('weekendExperience.booking.back_home', 'Back to Home')}
                                </button>
                                <button onClick={() => navigate('/weekend-experience')} className="px-10 py-4 border-2 border-espresso/20 text-espresso dark:text-[#F5DEB3] dark:border-[#F5DEB3]/20 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all">
                                    {t('weekendExperience.booking.explore_more', 'Explore More')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 grayscale pointer-events-none">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" className="h-4" alt="Visa" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" className="h-8" alt="Mastercard" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/2560px-Stripe_Logo%2C_revised_2016.svg.png" className="h-6" alt="Stripe" />
                </div>
            </div>
        </div>
    );
}
