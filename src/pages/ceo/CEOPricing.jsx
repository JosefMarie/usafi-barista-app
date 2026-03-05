import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_PRICING } from '../../hooks/usePricing';
import { cn } from '../../lib/utils';

function PriceInput({ label, value, onChange, prefix = '', suffix = '', description }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#4B3832]/40">{label}</label>
            {description && <p className="text-xs text-[#4B3832]/50">{description}</p>}
            <div className="relative flex items-center">
                {prefix && (
                    <span className="absolute left-4 text-[#4B3832]/50 font-black text-sm">{prefix}</span>
                )}
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className={cn(
                        "w-full py-4 rounded-2xl bg-white border border-[#4B3832]/10 focus:border-[#D4Af37] outline-none font-bold text-[#4B3832] shadow-sm transition-all focus:shadow-md",
                        prefix ? "pl-10 pr-5" : "px-5",
                        suffix ? "pr-16" : ""
                    )}
                    min={0}
                />
                {suffix && (
                    <span className="absolute right-4 text-[#4B3832]/50 font-black text-xs">{suffix}</span>
                )}
            </div>
        </div>
    );
}

export function CEOPricing() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null); // 'courses' | 'weekend' | null
    const [lastUpdated, setLastUpdated] = useState(null);

    // Course fees state
    const [courseFees, setCourseFees] = useState({
        'bean-to-brew': { name: 'Barista (Bean to Brew)', fee: 250000 },
        'bar-tender-course': { name: 'Bartender Course', fee: 300000 },
        combo: { name: 'Both Courses (Combo)', fee: 500000 }
    });

    // Weekend pricing state
    const [weekendPricing, setWeekendPricing] = useState({
        price1Day: 150,
        price2Days: 300,
        currency: 'USD',
        groupDiscount2: 5,
        groupDiscount4: 10,
        groupDiscount7: 15
    });

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const snap = await getDoc(doc(db, 'system_settings', 'pricing'));
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.courses) setCourseFees(data.courses);
                    if (data.weekend) setWeekendPricing(data.weekend);
                    if (data.updatedAt) {
                        const ts = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
                        setLastUpdated(ts);
                    }
                }
            } catch (e) {
                console.error('Error fetching pricing:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchPricing();
    }, []);

    const saveCourses = async () => {
        setSaving('courses');
        try {
            await setDoc(doc(db, 'system_settings', 'pricing'), {
                courses: courseFees,
                weekend: weekendPricing,
                updatedAt: serverTimestamp(),
                updatedBy: user?.uid || 'ceo'
            }, { merge: true });
            setLastUpdated(new Date());
            alert('✅ Course fees updated successfully!');
        } catch (e) {
            alert('Error saving: ' + e.message);
        }
        setSaving(null);
    };

    const saveWeekend = async () => {
        setSaving('weekend');
        try {
            await setDoc(doc(db, 'system_settings', 'pricing'), {
                courses: courseFees,
                weekend: weekendPricing,
                updatedAt: serverTimestamp(),
                updatedBy: user?.uid || 'ceo'
            }, { merge: true });
            setLastUpdated(new Date());
            alert('✅ Weekend pricing updated successfully!');
        } catch (e) {
            alert('Error saving: ' + e.message);
        }
        setSaving(null);
    };

    const updateCourse = (courseId, value) => {
        setCourseFees(prev => ({
            ...prev,
            [courseId]: { ...prev[courseId], fee: value }
        }));
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-4xl text-[#D4Af37]">diamond</span>
            </div>
        );
    }

    const courseList = [
        { id: 'bean-to-brew', icon: 'coffee', color: 'from-amber-500 to-amber-700', label: 'Barista · Bean to Brew' },
        { id: 'bar-tender-course', icon: 'sports_bar', color: 'from-blue-500 to-blue-700', label: 'Bartender Course' },
        { id: 'combo', icon: 'workspace_premium', color: 'from-purple-500 to-purple-700', label: 'Combo (Both Courses)' },
    ];

    return (
        <div className="flex-1 flex flex-col h-full bg-[#FAF5E8] dark:bg-[#1c1916] overflow-y-auto animate-in fade-in pb-20">
            <div className="w-full max-w-5xl mx-auto px-6 py-10 space-y-12">

                {/* Header */}
                <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#D4Af37] -ml-6"></div>
                    <p className="text-[#D4Af37] font-black text-[10px] uppercase tracking-[0.4em] mb-2">Executive Control</p>
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-[#4B3832] dark:text-[#F5DEB3] uppercase tracking-tight leading-none">
                        Pricing <span className="text-[#D4Af37]">Hub</span>
                    </h1>
                    <p className="text-[#4B3832]/50 dark:text-[#F5DEB3]/50 text-sm font-medium mt-3">
                        Control all program fees and weekend experience prices from here. Changes apply immediately across the entire system.
                    </p>
                    {lastUpdated && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#4B3832]/30 mt-2">
                            Last updated: {lastUpdated.toLocaleDateString()} at {lastUpdated.toLocaleTimeString()}
                        </p>
                    )}
                </div>

                {/* Course Fees */}
                <div className="bg-white/60 dark:bg-black/20 rounded-[2rem] border border-[#D4Af37]/10 shadow-xl overflow-hidden">
                    {/* Section header */}
                    <div className="bg-gradient-to-r from-[#4B3832] to-[#6b5248] p-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-[#D4Af37]/20 flex items-center justify-center text-[#D4Af37]">
                                <span className="material-symbols-outlined text-3xl">school</span>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-[#D4Af37] uppercase tracking-[0.3em]">Section 1</p>
                                <h2 className="text-2xl font-serif font-black text-[#F5DEB3] tracking-tight">Course Program Fees</h2>
                                <p className="text-xs text-[#F5DEB3]/50 mt-0.5">Set tuition fees for each training program</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Course cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {courseList.map(course => (
                                <div key={course.id} className="bg-[#FAF5E8] dark:bg-white/5 rounded-3xl p-6 border border-[#4B3832]/5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className={cn(
                                        "size-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg",
                                        course.color
                                    )}>
                                        <span className="material-symbols-outlined text-xl">{course.icon}</span>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#4B3832]/40 mb-1">{course.label}</p>
                                        <p className="text-2xl font-serif font-black text-[#4B3832] dark:text-[#F5DEB3]">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'RWF', notation: 'compact' }).format(courseFees[course.id]?.fee || 0)}
                                        </p>
                                    </div>
                                    <PriceInput
                                        label="Fee (RWF)"
                                        value={courseFees[course.id]?.fee || 0}
                                        onChange={(val) => updateCourse(course.id, val)}
                                        suffix="RWF"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Preview */}
                        <div className="bg-[#4B3832]/5 rounded-2xl p-6 border border-[#4B3832]/5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#4B3832]/40 mb-4">Fee Summary Preview</p>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                {courseList.map(c => (
                                    <div key={c.id}>
                                        <p className="text-[9px] text-[#4B3832]/40 font-black uppercase tracking-widest mb-1">{c.label.split('·')[0].trim()}</p>
                                        <p className="font-serif font-black text-xl text-[#D4Af37]">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'RWF', notation: 'compact', maximumSignificantDigits: 4 }).format(courseFees[c.id]?.fee || 0)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={saveCourses}
                            disabled={saving === 'courses'}
                            className="w-full py-5 rounded-2xl bg-[#4B3832] text-[#F5DEB3] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-[#3d2d27] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {saving === 'courses' ? (
                                <><span className="material-symbols-outlined animate-spin text-sm">sync</span> Saving...</>
                            ) : (
                                <><span className="material-symbols-outlined text-sm">save</span> Save Course Fees</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Weekend Experience Pricing */}
                <div className="bg-white/60 dark:bg-black/20 rounded-[2rem] border border-[#D4Af37]/10 shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-700 to-amber-700 p-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                <span className="material-symbols-outlined text-3xl">weekend</span>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em]">Section 2</p>
                                <h2 className="text-2xl font-serif font-black text-white tracking-tight">Weekend Experience Pricing</h2>
                                <p className="text-xs text-white/60 mt-0.5">Set prices for the 7-Point Combo Coffee Course</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Per-day pricing */}
                        <div>
                            <h3 className="text-sm font-black text-[#4B3832] dark:text-[#F5DEB3] mb-1 uppercase tracking-widest">Base Prices (Per Person)</h3>
                            <p className="text-xs text-[#4B3832]/50 mb-5">Prices in USD, converted to RWF at booking time using the live BNR rate.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#FAF5E8] dark:bg-white/5 rounded-3xl p-6 border border-rose-200/40 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                                            <span className="material-symbols-outlined text-lg">today</span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-[#4B3832]/40 uppercase tracking-widest">1-Day Session</p>
                                            <p className="font-serif font-black text-2xl text-rose-600">${weekendPricing.price1Day} USD</p>
                                        </div>
                                    </div>
                                    <PriceInput
                                        label="1-Day Price"
                                        value={weekendPricing.price1Day}
                                        onChange={(val) => setWeekendPricing(p => ({ ...p, price1Day: val }))}
                                        prefix="$"
                                        suffix="USD"
                                        description="Per person, per day"
                                    />
                                </div>
                                <div className="bg-[#FAF5E8] dark:bg-white/5 rounded-3xl p-6 border border-amber-200/40 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                            <span className="material-symbols-outlined text-lg">date_range</span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-[#4B3832]/40 uppercase tracking-widest">2-Day Session</p>
                                            <p className="font-serif font-black text-2xl text-amber-600">${weekendPricing.price2Days} USD</p>
                                        </div>
                                    </div>
                                    <PriceInput
                                        label="2-Day Price"
                                        value={weekendPricing.price2Days}
                                        onChange={(val) => setWeekendPricing(p => ({ ...p, price2Days: val }))}
                                        prefix="$"
                                        suffix="USD"
                                        description="Per person, full weekend"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Group Discounts */}
                        <div>
                            <h3 className="text-sm font-black text-[#4B3832] dark:text-[#F5DEB3] mb-1 uppercase tracking-widest">Group Discounts</h3>
                            <p className="text-xs text-[#4B3832]/50 mb-5">Automatic discounts based on number of people in a booking.</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { key: 'groupDiscount2', label: '2–3 People', icon: 'group', min: 2 },
                                    { key: 'groupDiscount4', label: '4–6 People', icon: 'groups', min: 4 },
                                    { key: 'groupDiscount7', label: '7+ People', icon: 'groups_3', min: 7 },
                                ].map(({ key, label, icon, min }) => (
                                    <div key={key} className="bg-[#FAF5E8] dark:bg-white/5 rounded-2xl p-5 border border-[#4B3832]/5 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg text-[#4B3832]/40">{icon}</span>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#4B3832]/50">{label}</p>
                                        </div>
                                        <p className="font-serif font-black text-3xl text-emerald-600">{weekendPricing[key] ?? 0}%</p>
                                        <PriceInput
                                            label={`Discount %`}
                                            value={weekendPricing[key] ?? 0}
                                            onChange={(val) => setWeekendPricing(p => ({ ...p, [key]: Math.min(val, 100) }))}
                                            suffix="%"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Live preview */}
                        <div className="bg-gradient-to-r from-rose-500/10 to-amber-500/10 rounded-2xl p-6 border border-rose-500/20">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#4B3832]/40 mb-4">Sample Pricing Preview (at BNR 1,463 RWF/USD)</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                {[
                                    { label: '1 person · 1 day', val: weekendPricing.price1Day * 1463 },
                                    { label: '1 person · 2 days', val: weekendPricing.price2Days * 1463 },
                                    { label: '4 people · 1 day', val: Math.round(weekendPricing.price1Day * 4 * 1463 * (1 - (weekendPricing.groupDiscount4 ?? 10) / 100)) },
                                    { label: '7 people · 2 days', val: Math.round(weekendPricing.price2Days * 7 * 1463 * (1 - (weekendPricing.groupDiscount7 ?? 15) / 100)) },
                                ].map(({ label, val }) => (
                                    <div key={label}>
                                        <p className="text-[9px] text-[#4B3832]/40 font-black uppercase tracking-widest mb-1">{label}</p>
                                        <p className="font-serif font-black text-lg text-rose-600">
                                            {new Intl.NumberFormat('en-US', { notation: 'compact', style: 'currency', currency: 'RWF' }).format(val)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={saveWeekend}
                            disabled={saving === 'weekend'}
                            className="w-full py-5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:from-rose-700 hover:to-amber-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {saving === 'weekend' ? (
                                <><span className="material-symbols-outlined animate-spin text-sm">sync</span> Saving...</>
                            ) : (
                                <><span className="material-symbols-outlined text-sm">save</span> Save Weekend Pricing</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Info note */}
                <div className="bg-[#D4Af37]/10 border border-[#D4Af37]/20 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-[#D4Af37] mt-0.5">info</span>
                        <div>
                            <p className="text-sm font-black text-[#4B3832] dark:text-[#F5DEB3]">How pricing works</p>
                            <p className="text-xs text-[#4B3832]/60 dark:text-[#F5DEB3]/60 mt-1 leading-relaxed">
                                Changes saved here take effect immediately. New enrollments will use the updated fees automatically.
                                Existing student records will keep their manually set fees; you can re-sync them from the Admin → Students page using <strong>Sync Global Fees</strong>.
                                Weekend prices are in USD and converted to RWF at the current BNR exchange rate at the time of booking.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
