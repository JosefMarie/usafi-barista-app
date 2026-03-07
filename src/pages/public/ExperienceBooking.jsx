import React, { useState, useEffect } from 'react';

import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, setDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useTranslation } from 'react-i18next';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { SEO } from '../../components/common/SEO';
import { addDays, format, startOfToday, nextSaturday, nextSunday, isSaturday, isSunday } from 'date-fns';
import { usePricing } from '../../hooks/usePricing';

// ─── Data (must match WeekendExperience.jsx) ──────────────────────────────────

// ─── Constants ──────────────────────────────────────────────────────────
const DEFAULT_BNR_RATE = 1463; // Current known BNR rate

const WEEKEND_COMBO = {
    id: 'weekend_combo',
    title: '7-Point Combo Coffee Course',
    // Default fallback prices — CEO can override via Pricing Hub
    price1Day: 150,
    price2Days: 300,
    gradient: 'from-rose-500 via-amber-500 to-emerald-500',
    icon: 'workspace_premium'
};

// Static fallback group discount — overridden by usePricing at runtime
function getGroupDiscountFallback(numPeople) {
    if (numPeople >= 7) return 0.15;
    if (numPeople >= 4) return 0.10;
    if (numPeople >= 2) return 0.05;
    return 0;
}

const getUpcomingWeekends = (count = 8) => {
    const weekends = [];
    let current = startOfToday();

    // Find next Saturday
    let sat = isSaturday(current) ? current : nextSaturday(current);

    for (let i = 0; i < count; i++) {
        const saturday = addDays(sat, i * 7);
        const sunday = addDays(saturday, 1);
        weekends.push({
            id: format(saturday, 'yyyy-MM-dd'),
            saturday,
            sunday,
            label: `${format(saturday, 'MMM d')} - ${format(sunday, 'MMM d')}`
        });
    }
    return weekends;
};


// ─── Stripe Payment Step ──────────────────────────────────────────────────────

function PaymentForm({ formData, totalPrice, finalTotal, bookingDetails, onNext, onBack, loading, setLoading }) {
    const { t } = useTranslation();
    const [isLogin, setIsLogin] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create Auth User
            let userId = null;
            try {
                if (isLogin) {
                    // Sign in existing user
                    const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                    userId = userCredential.user.uid;
                } else {
                    // Register new user
                    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                    userId = userCredential.user.uid;

                    // Create User Profile (Pending Admin Approval)
                    await setDoc(doc(db, 'users', userId), {
                        fullName: formData.fullName,
                        email: formData.email,
                        role: 'weekend_guest',
                        status: 'pending',
                        createdAt: serverTimestamp(),
                        phoneNumber: formData.phone,
                        country: formData.country || ''
                    });
                }
            } catch (authErr) {
                console.error("Auth error:", authErr.message);
                const errorMsg = isLogin
                    ? t('weekendExperience.booking.login_failed', 'Login failed. Please check your email and password.')
                    : t('weekendExperience.booking.registration_failed', 'Registration failed. This email might already be in use. Try logging in instead.');
                throw new Error(errorMsg);
            }
            // 3. Save Booking (Always pending arrival payment)
            const { setFullName, setEmail, setPhone, setCountry, setPassword, password, ...cleanFormData } = formData;

            // Only save fullName, phone, and country if they were provided (registration mode)
            const bookingDataToSave = {
                ...cleanFormData,
                ...bookingDetails,
                userId: userId,
                totalPrice: finalTotal,
                status: 'pending',
                paymentMethod: 'arrival',
                createdAt: serverTimestamp()
            };

            if (isLogin) {
                // If login, don't accidentally overwrite or save empty registration fields onto the booking
                delete bookingDataToSave.fullName;
                delete bookingDataToSave.phone;
                delete bookingDataToSave.country;
            }

            await addDoc(collection(db, 'weekend_bookings'), bookingDataToSave);
            onNext();
        } catch (err) {
            alert(t('weekendExperience.booking.payment_err', 'Registration error:') + ' ' + err.message);
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
                            {t('weekendExperience.combo.title')}
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

            <div className="flex bg-[#FAF5E8] dark:bg-white/5 rounded-2xl p-1 border border-espresso/10">
                <button type="button" onClick={() => setIsLogin(false)} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${!isLogin ? 'bg-white shadow-md text-espresso dark:bg-rose-500 dark:text-white' : 'text-espresso/40 hover:text-espresso dark:text-white/40 dark:hover:text-white'}`}>
                    {t('weekendExperience.booking.new_guest', 'New Guest')}
                </button>
                <button type="button" onClick={() => setIsLogin(true)} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${isLogin ? 'bg-white shadow-md text-espresso dark:bg-rose-500 dark:text-white' : 'text-espresso/40 hover:text-espresso dark:text-white/40 dark:hover:text-white'}`}>
                    {t('weekendExperience.booking.returning_guest', 'Returning Guest')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!isLogin && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{t('weekendExperience.booking.full_name', 'Full Name')}</label>
                        <input type="text" required={!isLogin} value={formData.fullName}
                            onChange={e => formData.setFullName(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold"
                        />
                    </div>
                )}
                <div className={`space-y-2 ${isLogin ? 'md:col-span-2' : ''}`}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{t('weekendExperience.booking.email', 'Email Address')}</label>
                    <input type="email" required value={formData.email}
                        onChange={e => formData.setEmail(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold"
                    />
                </div>
                {!isLogin && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{t('weekendExperience.booking.phone', 'Phone Number')}</label>
                        <input type="tel" required={!isLogin} value={formData.phone}
                            onChange={e => formData.setPhone(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold"
                        />
                    </div>
                )}
                <div className={`space-y-2 ${isLogin ? 'md:col-span-2' : ''}`}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{t('weekendExperience.booking.password', 'Password')}</label>
                    <input type="password" required value={formData.password}
                        onChange={e => formData.setPassword(e.target.value)}
                        minLength={6}
                        className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold"
                        placeholder={isLogin ? "Enter your password" : "Min. 6 characters"}
                    />
                </div>
                {!isLogin && (
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40">{t('weekendExperience.booking.country', 'Country / Origin')}</label>
                        <input type="text" placeholder={t('weekendExperience.booking.country_placeholder', 'e.g. USA, France, Kenya...')}
                            value={formData.country}
                            onChange={e => formData.setCountry(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-[#FAF5E8] dark:bg-white/5 border border-espresso/10 focus:border-rose-500 outline-none font-bold"
                        />
                    </div>
                )}
            </div>

            {/* Pay on Arrival element */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-espresso to-[#2A1E1B] text-[#F5DEB3] shadow-2xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 p-20 opacity-5 scale-150 rotate-12 pointer-events-none">
                    <span className="material-symbols-outlined">payments</span>
                </div>
                <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="size-12 bg-[#F5DEB3]/10 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Pay on Arrival</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center space-y-2">
                        <p className="font-serif font-black text-xl text-emerald-400">Online Payments Coming Soon</p>
                        <p className="text-sm opacity-80">For now, you can secure your spot by completing registration and safely paying in person when you arrive at our center.</p>
                    </div>
                </div>
            </div>

            <button
                type="submit" disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
                {loading ? (
                    <><div className="size-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>{t('weekendExperience.booking.processing', 'Processing...')}</>
                ) : (
                    <>{isLogin ? "Login & Secure Spot" : "Complete Registration & Secure Spot"}</>
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
    const { pricing, getGroupDiscount } = usePricing();

    const initialDuration = parseInt(searchParams.get('duration')) || 1;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState('');

    const [duration, setDuration] = useState(initialDuration); // 1 or 2
    const [numPeople, setNumPeople] = useState(1);
    const [date, setDate] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');

    const [exchangeRate, setExchangeRate] = useState(DEFAULT_BNR_RATE);
    const [isRateLoading, setIsRateLoading] = useState(true);

    // Reset date when duration changes to prevent invalid states
    useEffect(() => {
        setDate('');
    }, [duration]);

    useEffect(() => {
        const fetchRate = async () => {
            try {
                const response = await fetch('https://open.er-api.com/v6/latest/USD');
                const data = await response.json();
                if (data && data.rates && data.rates.RWF) {
                    setExchangeRate(Math.round(data.rates.RWF));
                }
            } catch (err) {
                console.error('Failed to fetch BNR rate, using fallback:', err);
                // Fallback is already set as DEFAULT_BNR_RATE
            } finally {
                setIsRateLoading(false);
            }
        };
        fetchRate();
    }, []);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('');
    const [password, setPassword] = useState('');

    // Price calculations — use dynamic Firestore prices if available, fallback to WEEKEND_COMBO constants
    const p1Day = pricing?.weekend?.price1Day ?? WEEKEND_COMBO.price1Day;
    const p2Days = pricing?.weekend?.price2Days ?? WEEKEND_COMBO.price2Days;
    const pricePerPersonUSD = duration === 1 ? p1Day : p2Days;
    const groupDiscount = getGroupDiscount(numPeople);
    const finalTotalUSD = Math.round(pricePerPersonUSD * numPeople * (1 - groupDiscount));
    const finalTotal = Math.round(finalTotalUSD * exchangeRate); // Convert to RWF for Stripe using dynamic rate


    const bookingDetails = {
        activityId: WEEKEND_COMBO.id,
        activityTitle: t('weekendExperience.combo.title'),
        duration,
        numPeople,
        date,
        specialRequests,
        pricePerPersonUSD,
        finalTotalUSD,
    };



    const handleContinue = async () => {
        const day = new Date(date).getDay();
        if (day !== 0 && day !== 6) {
            alert(t('weekendExperience.booking.alert_weekend', 'Please choose a Saturday or Sunday — we only host on weekends!'));
            return;
        }

        setStep(2);
    };

    const progressSteps = [
        t('weekendExperience.booking.step_experience', 'Experience'),
        t('weekendExperience.booking.step_payment', 'Payment'),
        t('weekendExperience.booking.step_confirmed', 'Confirmed')
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#FAF5E8] dark:bg-[#1c1916] font-display text-espresso dark:text-white pb-20 pt-24">
            <SEO title={`${t('weekendExperience.book_btn', 'Book')} ${WEEKEND_COMBO.title}`} />

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
                                        {t('weekendExperience.booking.combo_package', 'Combo Package')}
                                    </h2>
                                    <p className="text-[#4B3832]/60 dark:text-[#F5DEB3]/60 font-medium text-sm">{t('weekendExperience.booking.session_desc', 'Choose your date, number of participants, and activity.')}</p>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20">
                                <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-2">{t('weekendExperience.booking.selected_combo', 'Selected Combo')}</p>
                                <p className="font-serif font-black text-xl text-[#4B3832] dark:text-[#F5DEB3]">{WEEKEND_COMBO.title}</p>
                                <p className="text-sm text-espresso/50 dark:text-[#F5DEB3]/50 mt-1">
                                    {t('weekendExperience.booking.combo_description', 'A comprehensive 7-point coffee course covering everything from bean to cup.')}
                                </p>
                            </div>

                            {/* Duration Selection */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40 dark:text-[#F5DEB3]/40">
                                    Course Duration
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { val: 1, label: '1 Day', price: `$${pricing?.weekend?.price1Day ?? 150}` },
                                        { val: 2, label: '2 Days', price: `$${pricing?.weekend?.price2Days ?? 300}` }
                                    ].map(d => (
                                        <button
                                            key={d.val}
                                            type="button"
                                            onClick={() => setDuration(d.val)}
                                            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-1 ${duration === d.val ? 'border-rose-500 bg-rose-500/5 shadow-inner' : 'border-espresso/5 bg-white dark:bg-white/5 hover:border-espresso/20'}`}
                                        >
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${duration === d.val ? 'text-rose-500' : 'text-espresso/40'}`}>{d.label}</span>
                                            <span className={`text-xl font-serif font-black ${duration === d.val ? 'text-espresso dark:text-white' : 'text-espresso/20'}`}>{d.price}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Weekend Date Selection */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40 dark:text-[#F5DEB3]/40">
                                    {t('weekendExperience.weekend_picker.label', 'Select Weekend Date')}
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-2 no-scrollbar">
                                    {getUpcomingWeekends(8).map((wk) => {
                                        if (duration === 1) {
                                            // Show individual Saturday and Sunday buttons
                                            return [wk.saturday, wk.sunday].map(d => {
                                                const dateStr = format(d, 'yyyy-MM-dd');
                                                const isSelected = date === dateStr;
                                                return (
                                                    <button
                                                        key={dateStr}
                                                        type="button"
                                                        onClick={() => setDate(dateStr)}
                                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${isSelected ? 'border-rose-500 bg-rose-500/5 shadow-md scale-105' : 'border-espresso/5 bg-white dark:bg-white/5 hover:border-espresso/20'}`}
                                                    >
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-rose-500' : 'text-espresso/30'}`}>
                                                            {format(d, 'EEEE')}
                                                        </span>
                                                        <span className="font-serif font-black text-lg">{format(d, 'MMM d')}</span>
                                                        <span className="text-[9px] opacity-40">{format(d, 'yyyy')}</span>
                                                    </button>
                                                );
                                            });
                                        } else {
                                            // Show combined Weekend Button
                                            const isSelected = date === wk.id;
                                            return (
                                                <button
                                                    key={wk.id}
                                                    type="button"
                                                    onClick={() => setDate(wk.id)}
                                                    className={`col-span-2 p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${isSelected ? 'border-rose-500 bg-rose-500/5 shadow-md scale-105' : 'border-espresso/5 bg-white dark:bg-white/5 hover:border-espresso/20'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-rose-500 text-sm">calendar_view_week</span>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-rose-500' : 'text-espresso/30'}`}>
                                                            {t('weekendExperience.weekend_picker.grouped_label', 'Full Weekend Experience')}
                                                        </span>
                                                    </div>
                                                    <span className="font-serif font-black text-xl">{wk.label}</span>
                                                    <span className="text-[10px] opacity-40 uppercase tracking-tighter">
                                                        {t('weekendExperience.weekend_picker.sat_sun', 'Saturday & Sunday')}
                                                    </span>
                                                </button>
                                            );
                                        }
                                    }).flat()}
                                </div>
                                <p className="text-[10px] text-rose-500/60 font-medium italic text-center">
                                    {duration === 2
                                        ? t('weekendExperience.weekend_picker.duration_note', 'For 2-day courses, sessions begin on the selected date.')
                                        : t('weekendExperience.weekend_picker.helper', 'Only Saturdays & Sundays are available for booking.')
                                    }
                                </p>
                            </div>


                            {/* Group Size selection (moved below date for better flow) */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-espresso/40 dark:text-[#F5DEB3]/40">Number of People</label>
                                <div className="flex items-center gap-4 bg-white dark:bg-white/5 border border-espresso/10 rounded-2xl p-3 transition-all focus-within:ring-2 focus-within:ring-rose-500/20 max-w-xs mx-auto md:mx-0">
                                    <button onClick={() => setNumPeople(Math.max(1, numPeople - 1))} className="size-12 rounded-xl bg-espresso/5 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><span className="material-symbols-outlined">remove</span></button>
                                    <span className="flex-1 text-center font-serif font-black text-2xl">{numPeople}</span>
                                    <button onClick={() => setNumPeople(Math.min(10, numPeople + 1))} className="size-12 rounded-xl bg-espresso/5 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><span className="material-symbols-outlined">add</span></button>
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

                            <div className="p-8 rounded-[2rem] bg-espresso/5 dark:bg-white/5 border border-espresso/10 space-y-6">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40">
                                    <span>Summary</span>
                                    <span>Amount</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="font-serif font-black text-xl">{t('weekendExperience.combo.title')}</p>
                                            <p className="text-xs opacity-50">{duration === 1 ? '1 Day' : '2 Day'} Course for {numPeople} {numPeople > 1 ? 'people' : 'person'}</p>
                                        </div>
                                        <p className="font-serif font-black text-xl">${finalTotalUSD}</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-espresso/10 flex justify-between items-center">
                                    <span className="text-xs font-black uppercase tracking-widest">Total to Pay (RWF)</span>
                                    <div className="text-right">
                                        {isRateLoading ? (
                                            <div className="flex items-center justify-end gap-2 text-rose-500/50">
                                                <div className="size-3 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
                                                <span className="text-sm font-serif font-black">Fetching BNR Rate...</span>
                                            </div>
                                        ) : (
                                            <p className="text-3xl font-serif font-black text-rose-500">{finalTotal.toLocaleString()} RWF</p>
                                        )}
                                        <p className="text-[10px] opacity-40 uppercase tracking-widest">BNR Exchange Rate: $1 = {exchangeRate.toLocaleString()} RWF</p>
                                    </div>
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
                    )}


                    {/* Step 2: Payment/Registration */}
                    {step === 2 && (
                        <PaymentForm
                            formData={{ fullName, email, phone, country, password, numPeople, date, setFullName, setEmail, setPhone, setCountry, setPassword }}
                            totalPrice={finalTotalUSD}
                            finalTotal={finalTotal}
                            bookingDetails={bookingDetails}
                            onNext={() => setStep(3)}
                            onBack={() => setStep(1)}
                            loading={loading}
                            setLoading={setLoading}
                        />
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
                                    {t('weekendExperience.combo.title')}
                                </p>
                                <p className="text-xs text-espresso/50">
                                    {duration === 2 ? getUpcomingWeekends(8).find(w => w.id === date)?.label || 'Full Weekend' : date} · {numPeople} {numPeople > 1 ? t('weekendExperience.booking.guests', 'guests') : t('weekendExperience.booking.guest', 'guest')} · {duration === 1 ? '1 Day' : '2 Days'}
                                </p>
                                <p className="font-serif font-black text-rose-600">{finalTotal.toLocaleString()} RWF</p>
                            </div>

                            <div className="flex flex-wrap gap-4 justify-center pt-4">
                                <button onClick={() => navigate('/guest/dashboard')} className="px-10 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">dashboard</span>
                                    {t('weekendExperience.booking.go_to_dashboard', 'Go to Dashboard')}
                                </button>
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
                    <span className="material-symbols-outlined text-4xl">verified_user</span>
                    <span className="text-sm font-bold uppercase tracking-widest">Usafi Encrypted Booking</span>
                </div>
            </div>
        </div>
    );
}

