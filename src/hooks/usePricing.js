import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Default pricing values — used when no Firestore config exists yet
export const DEFAULT_PRICING = {
    courses: {
        'bean-to-brew': { name: 'Barista (Bean to Brew)', fee: 250000 },
        'bar-tender-course': { name: 'Bartender Course', fee: 300000 },
        combo: { name: 'Both Courses (Combo)', fee: 500000 }
    },
    weekend: {
        price1Day: 150,
        price2Days: 300,
        currency: 'USD',
        groupDiscount2: 5,
        groupDiscount4: 10,
        groupDiscount7: 15
    }
};

/**
 * usePricing — reads live pricing from Firestore system_settings/pricing.
 * Falls back to DEFAULT_PRICING if not yet configured.
 */
export function usePricing() {
    const [pricing, setPricing] = useState(DEFAULT_PRICING);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const ref = doc(db, 'system_settings', 'pricing');
        const unsub = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setPricing({
                    courses: data.courses || DEFAULT_PRICING.courses,
                    weekend: data.weekend || DEFAULT_PRICING.weekend,
                });
            } else {
                setPricing(DEFAULT_PRICING);
            }
            setLoading(false);
        }, () => {
            // On error, use defaults silently
            setPricing(DEFAULT_PRICING);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    /**
     * Get the fee for a student given their enrolled courses.
     * enrolledCourseIds: string[] (e.g. ['bean-to-brew', 'bar-tender-course'])
     */
    const getCourseFee = (enrolledCourseIds = []) => {
        const ids = Array.isArray(enrolledCourseIds) ? enrolledCourseIds : [enrolledCourseIds];
        const hasBarista = ids.includes('bean-to-brew') || ids.length === 0; // default to barista
        const hasBartender = ids.includes('bar-tender-course');

        if (hasBarista && hasBartender) return pricing.courses.combo?.fee ?? DEFAULT_PRICING.courses.combo.fee;
        if (hasBartender) return pricing.courses['bar-tender-course']?.fee ?? DEFAULT_PRICING.courses['bar-tender-course'].fee;
        if (hasBarista) return pricing.courses['bean-to-brew']?.fee ?? DEFAULT_PRICING.courses['bean-to-brew'].fee;
        return 0;
    };

    /**
     * Get weekend group discount fraction.
     * numPeople: number
     */
    const getGroupDiscount = (numPeople) => {
        const w = pricing.weekend;
        if (numPeople >= 7) return (w.groupDiscount7 ?? 15) / 100;
        if (numPeople >= 4) return (w.groupDiscount4 ?? 10) / 100;
        if (numPeople >= 2) return (w.groupDiscount2 ?? 5) / 100;
        return 0;
    };

    return { pricing, loading, getCourseFee, getGroupDiscount };
}
