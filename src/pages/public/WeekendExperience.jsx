import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEO } from '../../components/common/SEO';
import { Newsletter } from '../../components/ui/Newsletter';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVITIES = [
    {
        id: 'latte_art', title: 'Latte Art Masterclass', subtitle: 'Pour & Create',
        description: 'Pour hearts, rosettas, and tulips under the guidance of our professional baristas. From milk-steaming science to freehand designs, you\'ll leave with a new skill to impress.',
        icon: 'local_cafe', gradient: 'from-pink-500 via-rose-500 to-red-600', lightGradient: 'from-pink-500/10 via-rose-500/10 to-red-600/10',
        price: 20000, duration: '2 hours', maxPeople: 8,
        highlights: ['Milk steaming science', 'Basic pour designs', 'Heart & tulip patterns', 'Take-home artisan coffee'], badge: 'Most Popular'
    },
    {
        id: 'sensory_tasting', title: 'Sensory Cupping Session', subtitle: 'Taste & Discover',
        description: 'Explore the complex terroir of Rwandan specialty coffee. Learn to identify flavor notes — from fruity highlands to chocolate lowlands — using professional tasting protocols.',
        icon: 'temp_preferences_custom', gradient: 'from-amber-400 via-orange-500 to-yellow-600', lightGradient: 'from-amber-400/10 via-orange-500/10 to-yellow-600/10',
        price: 25000, duration: '2.5 hours', maxPeople: 10,
        highlights: ['5 specialty origins', 'Flavor wheel training', 'Aroma identification', 'Expert guided tasting'], badge: 'Crowd Favourite'
    },
    {
        id: 'bean_to_bag', title: 'Bean to Bag: Roasting Fun', subtitle: 'Roast & Take Home',
        description: 'Witness the transformation of green coffee beans into aromatic perfection. You\'ll hand-roast a batch using traditional methods and take home a personalized bag of your creation.',
        icon: 'fire_griddler', gradient: 'from-emerald-400 via-teal-500 to-green-600', lightGradient: 'from-emerald-400/10 via-teal-500/10 to-green-600/10',
        price: 30000, duration: '3 hours', maxPeople: 6,
        highlights: ['Green bean selection', 'Roast level control', 'Cooling & sorting', 'Personalized bag to take home'], badge: 'Hands-On'
    },
    {
        id: 'espresso_workshop', title: 'Espresso Extraction Workshop', subtitle: 'Pull & Perfect',
        description: 'Learn the engineering behind a perfect espresso shot — grind size, pressure, temperature, and timing. Pull real shots on our professional La Marzocco machines.',
        icon: 'coffee_maker', gradient: 'from-violet-500 via-purple-600 to-indigo-700', lightGradient: 'from-violet-500/10 via-purple-600/10 to-indigo-700/10',
        price: 27000, duration: '2 hours', maxPeople: 6,
        highlights: ['Machine calibration', 'Grind & dose mastery', 'Shot timing & extraction', 'Espresso tasting flight'], badge: 'Barista Level'
    },
    {
        id: 'equipment_tour', title: 'Equipment & Tools Deep Dive', subtitle: 'Learn & Understand',
        description: 'A guided tour through professional barista equipment — grinders, scales, tampers, portafilters, and brewing devices. Understand what you need to build your home setup.',
        icon: 'settings', gradient: 'from-sky-400 via-cyan-500 to-blue-600', lightGradient: 'from-sky-400/10 via-cyan-500/10 to-blue-600/10',
        price: 17000, duration: '1.5 hours', maxPeople: 12,
        highlights: ['Pro vs home grinders', 'Espresso machine anatomy', 'Brewing device comparison', 'Home setup consultation'], badge: 'Best for Beginners'
    },
    {
        id: 'coffee_preparation', title: 'Farm to Cup Experience', subtitle: 'Process & Brew',
        description: 'Follow the entire coffee preparation journey — from understanding the washing station process to manually brewing. Experience every step from cherry to your cup.',
        icon: 'agriculture', gradient: 'from-lime-500 via-green-500 to-emerald-600', lightGradient: 'from-lime-500/10 via-green-500/10 to-emerald-600/10',
        price: 23000, duration: '2.5 hours', maxPeople: 8,
        highlights: ['Cherry to parchment', 'Wet & natural processing', 'Manual brewing methods', 'Rwanda origin story'], badge: 'Immersive'
    },
    {
        id: 'cold_brew', title: 'Cold Brew & Signature Drinks', subtitle: 'Mix & Chill',
        description: 'Craft your own cold brew, learn the chemistry behind it, then create signature coffee cocktails (non-alcoholic). Perfect for the creative mind and the coffee lover.',
        icon: 'water_drop', gradient: 'from-blue-400 via-indigo-500 to-violet-600', lightGradient: 'from-blue-400/10 via-indigo-500/10 to-violet-600/10',
        price: 22000, duration: '2 hours', maxPeople: 10,
        highlights: ['Cold brew ratios', 'Nitro techniques', 'Signature drink creation', 'Shake & serve skills'], badge: 'Creative'
    },
    {
        id: 'barista_basics', title: 'Barista Basics Bootcamp', subtitle: 'Learn & Practice',
        description: 'A condensed version of our professional Barista Course. Get the core fundamentals — milk, espresso, hygiene, and customer service etiquette — in a single morning session.',
        icon: 'school', gradient: 'from-fuchsia-500 via-pink-500 to-rose-600', lightGradient: 'from-fuchsia-500/10 via-pink-500/10 to-rose-600/10',
        price: 40000, duration: '4 hours', maxPeople: 6,
        highlights: ['Espresso fundamentals', 'Milk steaming & texturing', 'Hygiene standards', 'Basic customer etiquette'], badge: 'Premium'
    }
];

const COMBOS = [
    // coffee_lover: latte_art(20k) + sensory_tasting(25k) = 45k original → combo 44k → saves 1k
    {
        id: 'coffee_lover', title: "Coffee Lover's Duo", activities: ['latte_art', 'sensory_tasting'],
        originalPrice: 45000, comboPrice: 44000, savings: 1000,
        gradient: 'from-rose-600 to-amber-500', icon: 'favorite', tagline: 'The perfect starter combo — taste & create.'
    },
    // barista_journey: espresso(27k) + latte_art(20k) + equipment_tour(17k) = 64k original → combo 53k → saves 11k
    {
        id: 'barista_journey', title: 'The Full Barista Journey', activities: ['espresso_workshop', 'latte_art', 'equipment_tour'],
        originalPrice: 64000, comboPrice: 53000, savings: 11000,
        gradient: 'from-violet-600 to-pink-500', icon: 'workspace_premium', tagline: 'Everything a barista needs to know in one day.'
    },
    // origin_explorer: coffee_preparation(23k) + sensory_tasting(25k) + bean_to_bag(30k) = 78k original → combo 65k → saves 13k
    {
        id: 'origin_explorer', title: "Origin Explorer's Pack", activities: ['coffee_preparation', 'sensory_tasting', 'bean_to_bag'],
        originalPrice: 78000, comboPrice: 65000, savings: 13000,
        gradient: 'from-emerald-600 to-cyan-500', icon: 'travel_explore', tagline: 'Trace Rwanda coffee from farm to your cup.'
    },
    // ultimate: barista_basics(35k) + latte_art(20k) + sensory_tasting(25k) + bean_to_bag(30k) = 110k original → combo 84k → saves 26k
    {
        id: 'ultimate', title: 'The Ultimate Experience', activities: ['barista_basics', 'latte_art', 'sensory_tasting', 'bean_to_bag'],
        originalPrice: 110000, comboPrice: 84000, savings: 26000,
        gradient: 'from-yellow-500 via-orange-500 to-rose-600', icon: 'stars', tagline: 'The absolute best of everything we offer. Unforgettable.'
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function ActivityCard({ activity, onBook }) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className={`group relative bg-white dark:bg-white/5 rounded-[2.5rem] border border-espresso/5 shadow-xl overflow-hidden transition-all duration-500 hover:-translate-y-2 cursor-pointer flex flex-col`}
            onClick={() => setExpanded(!expanded)}
        >
            {/* Gradient Header */}
            <div className={`h-2 w-full bg-gradient-to-r ${activity.gradient}`}></div>

            {/* Ambient Glow */}
            <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${activity.gradient} opacity-5 rounded-bl-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700 pointer-events-none`}></div>

            <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-6">
                    <div className={`size-14 rounded-2xl bg-gradient-to-br ${activity.gradient} flex items-center justify-center text-white shadow-lg`}>
                        <span className="material-symbols-outlined text-2xl">{activity.icon}</span>
                    </div>
                    <div className="text-right">
                        {activity.badge && (
                            <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-gradient-to-r ${activity.gradient} text-white mb-1`}>
                                {t(`weekendExperience.activities.${activity.id}.badge`, activity.badge)}
                            </span>
                        )}
                        <p className="text-xl font-serif font-black text-espresso dark:text-[#F5DEB3]">
                            {activity.price.toLocaleString()} <span className="text-sm">RWF</span>
                        </p>
                        <p className="text-[9px] text-espresso/40 uppercase tracking-widest">{t('weekendExperience.per_person')}</p>
                    </div>
                </div>

                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-espresso/30 dark:text-[#F5DEB3]/30 mb-1">{t(`weekendExperience.activities.${activity.id}.subtitle`, activity.subtitle)}</p>
                <h3 className="font-serif text-xl font-black text-[#4B3832] dark:text-[#F5DEB3] mb-3">{t(`weekendExperience.activities.${activity.id}.title`, activity.title)}</h3>
                <p className="text-[#4B3832]/60 dark:text-[#F5DEB3]/60 leading-relaxed text-sm mb-4 flex-1">{t(`weekendExperience.activities.${activity.id}.description`, activity.description)}</p>

                {/* Expandable Highlights */}
                <div className={`overflow-hidden transition-all duration-500 ${expanded ? 'max-h-48 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${activity.lightGradient} border border-espresso/5`}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-espresso/40 mb-3">{t('weekendExperience.what_youll_do')}</p>
                        <ul className="space-y-2">
                            {activity.highlights.map((h, i) => (
                                <li key={i} className="flex items-center gap-2 text-xs font-bold text-espresso dark:text-[#F5DEB3]">
                                    <span className={`size-5 rounded-full bg-gradient-to-br ${activity.gradient} flex items-center justify-center flex-shrink-0`}>
                                        <span className="material-symbols-outlined text-white text-[10px]">check</span>
                                    </span>
                                    {t(`weekendExperience.activities.${activity.id}.highlights.${i}`, h)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-espresso/5">
                    <div className="flex items-center gap-3 text-xs text-espresso/40">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span>{activity.duration}</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">group</span>Max {activity.maxPeople}</span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onBook(activity.id); }}
                        className={`px-5 py-2.5 bg-gradient-to-r ${activity.gradient} text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all`}
                    >
                        {t('weekendExperience.book_btn')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ComboCard({ combo, onBook }) {
    const { t } = useTranslation();
    const comboActivities = combo.activities.map(id => ACTIVITIES.find(a => a.id === id)).filter(Boolean);
    const savingsPct = Math.round((combo.savings / combo.originalPrice) * 100);

    return (
        <div className={`relative rounded-[2.5rem] overflow-hidden group hover:-translate-y-2 transition-all duration-500`}>
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${combo.gradient} opacity-90`}></div>
            <div className="absolute inset-0 bg-black/10"></div>

            {/* Savings Badge */}
            <div className="absolute top-6 right-6 z-10">
                <div className="bg-white text-espresso rounded-2xl px-3 py-1.5 font-black text-xs shadow-xl">
                    -{savingsPct}% OFF
                </div>
            </div>

            <div className="relative z-10 p-8 md:p-10 text-white">
                <div className="size-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-2xl">{combo.icon}</span>
                </div>

                <h3 className="font-serif text-2xl font-black mb-2">{t(`weekendExperience.combos.${combo.id}.title`, combo.title)}</h3>
                <p className="text-white/70 text-sm mb-6 leading-relaxed">{t(`weekendExperience.combos.${combo.id}.tagline`, combo.tagline)}</p>

                <div className="flex flex-wrap gap-2 mb-8">
                    {comboActivities.map(a => (
                        <span key={a.id} className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[9px] font-black uppercase tracking-wider border border-white/20">
                            {t(`weekendExperience.activities.${a.id}.title`, a.title)}
                        </span>
                    ))}
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-white/50 text-sm line-through">{combo.originalPrice.toLocaleString()} {t('weekendExperience.original_price', 'RWF')}</p>
                        <p className="text-3xl font-serif font-black">{combo.comboPrice.toLocaleString()} <span className="text-lg">RWF</span></p>
                        <p className="text-[9px] text-white/50 uppercase tracking-widest">{t('weekendExperience.combos.you_save', 'You save')} {combo.savings.toLocaleString()} RWF</p>
                    </div>
                    <button
                        onClick={() => onBook(combo.activities[0], combo)}
                        className="px-6 py-3 bg-white text-espresso rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                        {t('weekendExperience.combos.book_combo', 'Book Combo')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PeopleDiscountBanner() {
    const { t } = useTranslation();
    return (
        <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 md:p-10 border border-espresso/5 shadow-xl overflow-hidden relative">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-rose-500/5 to-transparent pointer-events-none"></div>
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="size-20 rounded-[1.5rem] bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shrink-0 shadow-xl shadow-rose-500/30">
                    <span className="material-symbols-outlined text-4xl">group</span>
                </div>
                <div className="flex-1 text-center md:text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-2">{t('weekendExperience.group_discount.badge')}</p>
                    <h3 className="font-serif text-2xl font-black text-[#4B3832] dark:text-[#F5DEB3] mb-2">{t('weekendExperience.group_discount.title')}</h3>
                    <p className="text-espresso/60 dark:text-[#F5DEB3]/60 text-sm">{t('weekendExperience.group_discount.desc')}</p>
                </div>
                <div className="flex flex-wrap gap-4 shrink-0">
                    {[
                        { people: t('weekendExperience.group_discount.tier1', '2-3 people'), discount: '5%', color: 'from-amber-400 to-orange-500' },
                        { people: t('weekendExperience.group_discount.tier2', '4-6 people'), discount: '10%', color: 'from-emerald-400 to-teal-500' },
                        { people: t('weekendExperience.group_discount.tier3', '7+ people'), discount: '15%', color: 'from-violet-500 to-purple-600' }
                    ].map((tier, i) => (
                        <div key={i} className={`p-4 rounded-2xl bg-gradient-to-br ${tier.color} text-white text-center min-w-[80px] shadow-lg`}>
                            <p className="text-2xl font-serif font-black">{tier.discount}</p>
                            <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">{tier.people}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MediaGallery() {
    const { t } = useTranslation();
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        const q = query(
            collection(db, 'weekend_media'),
            orderBy('createdAt', 'desc'),
            limit(12)
        );
        const unsub = onSnapshot(q, snap => {
            setMedia(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, () => setLoading(false));
        return () => unsub();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="size-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
        </div>
    );

    if (media.length === 0) return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
            <div className="size-20 rounded-3xl bg-[#F5DEB3]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-[#F5DEB3]/40">photo_library</span>
            </div>
            <div>
                <p className="font-black text-lg text-[#F5DEB3]/60">{t('weekendExperience.gallery_coming_soon', 'Gallery Coming Soon')}</p>
                <p className="text-sm text-[#F5DEB3]/30">{t('weekendExperience.gallery_coming_soon_desc', 'Our manager will post real photos & videos of weekend sessions.')}</p>
            </div>
        </div>
    );

    return (
        <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide -mx-6 px-6 cursor-grab active:cursor-grabbing"
        >
            {media.map((item) => (
                item.type === 'video' ? (
                    <div key={item.id} className="min-w-[300px] md:min-w-[400px] aspect-video bg-black rounded-[2rem] overflow-hidden relative group shrink-0 shadow-2xl">
                        <video
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500"
                            muted loop playsInline
                            onMouseOver={e => e.target.play()}
                            onMouseOut={e => e.target.pause()}
                        >
                            <source src={item.url} type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-white/60">play_circle</span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                            <p className="text-white font-bold text-sm text-[#D4AF37]">{item.caption || t('weekendExperience.live_highlight', 'Weekend Highlight')}</p>
                            <p className="text-white/50 text-[10px]">{item.date || t('weekendExperience.gallery.subtitle').split('!')[0] || 'Recent Session'}</p>
                        </div>
                    </div>
                ) : (
                    <div key={item.id} className="min-w-[280px] md:min-w-[360px] aspect-[4/5] bg-[#F5DEB3]/10 rounded-[2rem] overflow-hidden relative group shrink-0 shadow-xl">
                        <img
                            src={item.url}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                            alt={item.caption || t('weekendExperience.title', 'Weekend Experience')}
                        />
                        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white font-bold text-sm">{item.caption || t('weekendExperience.guest_highlight', 'Guest Highlight')}</p>
                            <p className="text-white/50 text-[10px]">{item.date || t('weekendExperience.hero_badge', 'Weekend Session')}</p>
                        </div>
                    </div>
                )
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export function WeekendExperience() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('activities'); // 'activities' | 'combos'
    const [filter, setFilter] = useState('all');

    const handleBook = (activityId, combo = null) => {
        if (combo) {
            navigate(`/weekend-experience/book?combo=${combo.id}&activity=${activityId}`);
        } else {
            navigate(`/weekend-experience/book?activity=${activityId}`);
        }
    };

    const filters = [
        { id: 'all', label: 'All Experiences' },
        { id: 'beginner', label: 'Beginner Friendly', ids: ['latte_art', 'sensory_tasting', 'equipment_tour', 'cold_brew'] },
        { id: 'hands_on', label: 'Hands-On', ids: ['bean_to_bag', 'espresso_workshop', 'coffee_preparation', 'barista_basics'] },
        { id: 'short', label: 'Under 2 Hours', ids: ['latte_art', 'espresso_workshop', 'equipment_tour', 'cold_brew'] }
    ];

    const filteredActivities = filter === 'all'
        ? ACTIVITIES
        : ACTIVITIES.filter(a => (filters.find(f => f.id === filter)?.ids || []).includes(a.id));

    return (
        <div className="flex flex-col min-h-screen bg-[#FAF5E8] dark:bg-[#1c1916] font-display text-espresso dark:text-white">
            <SEO title="Weekend Coffee Experiences | USAFFI" description="Join us every Saturday & Sunday for hands-on coffee workshops, tastings, and barista training sessions in Rwanda." />

            {/* ─── HERO ─── */}
            <section className="relative pt-32 pb-24 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-5%] w-[50rem] h-[50rem] rounded-full bg-gradient-to-br from-rose-500/10 to-amber-500/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-[-5%] w-[30rem] h-[30rem] rounded-full bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 blur-3xl"></div>
                </div>

                <div className="container mx-auto px-6 text-center relative z-10 max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-5 py-2 bg-white dark:bg-white/10 rounded-full border border-espresso/10 text-[10px] font-black uppercase tracking-[0.3em] text-rose-600 mb-8 shadow-lg">
                        <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                        {t('weekendExperience.hero_badge', 'Every Saturday & Sunday')}
                    </div>
                    <h1 className="font-serif text-5xl md:text-7xl font-black text-[#4B3832] dark:text-[#F5DEB3] mb-6 tracking-tight leading-none">
                        {t('weekendExperience.title', 'Weekend Coffee Experiences').split(' ').slice(0, -1).join(' ')}
                        <span className="block bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
                            {t('weekendExperience.title', 'Weekend Coffee Experiences').split(' ').pop()}
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-[#4B3832]/70 dark:text-[#F5DEB3]/70 leading-relaxed max-w-3xl mx-auto font-medium mb-10">
                        {t('weekendExperience.description')}
                    </p>

                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
                        {[
                            { value: '8+', label: t('weekendExperience.stats.activities', 'Unique Activities'), icon: 'local_activity' },
                            { value: '4', label: t('weekendExperience.stats.combos', 'Combo Packages'), icon: 'workspace_premium' },
                            { value: '15%', label: t('weekendExperience.stats.discount', 'Group Discount'), icon: 'group' },
                            { value: '2', label: t('weekendExperience.stats.days', 'Open Weekends'), icon: 'event' }
                        ].map(stat => (
                            <div key={stat.label} className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-rose-500 text-lg">{stat.icon}</span>
                                </div>
                                <div className="text-left">
                                    <p className="font-serif font-black text-xl text-[#4B3832] dark:text-[#F5DEB3]">{stat.value}</p>
                                    <p className="text-[9px] text-espresso/40 uppercase tracking-widest">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center">
                        <a href="#activities" className="px-8 py-4 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all">
                            {t('weekendExperience.explore_btn', 'Explore Activities')}
                        </a>
                        <Link to="/donate" className="px-8 py-4 bg-white dark:bg-white/10 text-espresso dark:text-[#F5DEB3] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all border border-espresso/10 flex items-center gap-2">
                            <span className="material-symbols-outlined text-rose-500 text-sm">favorite</span>
                            {t('weekendExperience.donate_btn', 'Donate a Scholarship')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── WHAT YOU'LL EXPERIENCE ─── */}
            <section className="container mx-auto px-6 py-16 max-w-6xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: 'local_cafe', title: t('weekendExperience.highlights.brew.title', 'Brew Your Own'), desc: t('weekendExperience.highlights.brew.desc', 'With real equipment'), gradient: 'from-rose-500 to-pink-600' },
                        { icon: 'temp_preferences_custom', title: t('weekendExperience.highlights.taste.title', 'Taste & Discover'), desc: t('weekendExperience.highlights.taste.desc', 'Explore terroir'), gradient: 'from-amber-500 to-orange-600' },
                        { icon: 'school', title: t('weekendExperience.highlights.learn.title', 'Learn from Pros'), desc: t('weekendExperience.highlights.learn.desc', 'Expert baristas'), gradient: 'from-violet-500 to-purple-600' },
                        { icon: 'photo_camera', title: t('weekendExperience.highlights.capture.title', 'Capture Moments'), desc: t('weekendExperience.highlights.capture.desc', 'Share experience'), gradient: 'from-emerald-500 to-teal-600' }
                    ].map(item => (
                        <div key={item.title} className="bg-white dark:bg-white/5 rounded-3xl p-6 border border-espresso/5 shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <div className={`size-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
                                <span className="material-symbols-outlined">{item.icon}</span>
                            </div>
                            <p className="font-black text-sm text-[#4B3832] dark:text-[#F5DEB3]">{item.title}</p>
                            <p className="text-[10px] text-espresso/50 dark:text-[#F5DEB3]/50 mt-1">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── GROUP DISCOUNT BANNER ─── */}
            <section className="container mx-auto px-6 pb-12 max-w-6xl">
                <PeopleDiscountBanner />
            </section>

            {/* ─── ACTIVITIES / COMBOS ─── */}
            <section id="activities" className="container mx-auto px-6 pb-24 max-w-6xl">
                {/* Tab Switcher */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-2">{t('weekendExperience.choose_adventure', 'Choose Your Adventure')}</p>
                        <h2 className="font-serif text-3xl md:text-5xl font-black text-[#4B3832] dark:text-[#F5DEB3]">
                            {activeTab === 'activities' ? t('weekendExperience.tabs.all_experiences', 'All Experiences') : t('weekendExperience.tabs.combo_packages', 'Combo Packages')}
                        </h2>
                    </div>
                    <div className="flex bg-white dark:bg-white/5 rounded-2xl p-1.5 border border-espresso/5 shadow-lg">
                        <button
                            onClick={() => setActiveTab('activities')}
                            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'activities' ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg' : 'text-espresso/40 dark:text-[#F5DEB3]/40'}`}
                        >
                            {t('weekendExperience.tabs.single_activities', 'Single Activities')}
                        </button>
                        <button
                            onClick={() => setActiveTab('combos')}
                            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'combos' ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg' : 'text-espresso/40 dark:text-[#F5DEB3]/40'}`}
                        >
                            {t('weekendExperience.tabs.combos_and_save', 'Combos & Save')}
                        </button>
                    </div>
                </div>

                {activeTab === 'activities' && (
                    <>
                        {/* Activity Filters */}
                        <div className="flex flex-wrap gap-3 mb-10">
                            {filters.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilter(f.id)}
                                    className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filter === f.id ? 'bg-espresso text-white dark:bg-[#F5DEB3] dark:text-espresso shadow-lg' : 'bg-white dark:bg-white/5 text-espresso/50 dark:text-[#F5DEB3]/50 border border-espresso/10 hover:border-espresso/30'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <p className="text-xs text-espresso/40 dark:text-[#F5DEB3]/40 mb-8 italic">💡 {t('weekendExperience.click_card_hint', 'Click any card to see what you\'ll do in that experience.')}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredActivities.map(activity => (
                                <ActivityCard key={activity.id} activity={activity} onBook={handleBook} />
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'combos' && (
                    <>
                        <p className="text-espresso/60 dark:text-[#F5DEB3]/60 mb-10 leading-relaxed max-w-2xl">
                            {t('weekendExperience.combos_description', 'Our curated combo packages bundle the best experiences together at a special price. Perfect if you want to make a full day of it — or come back again knowing there\'s more to discover.')}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {COMBOS.map(combo => (
                                <ComboCard key={combo.id} combo={combo} onBook={handleBook} />
                            ))}
                        </div>
                    </>
                )}
            </section>

            {/* ─── MEDIA GALLERY ─── */}
            <section className="bg-[#4B3832] text-[#F5DEB3] py-24 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined text-[20rem]">camera_outdoor</span>
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
                        <div className="max-w-2xl">
                            <p className="text-[#D4AF37] font-black text-[10px] uppercase tracking-[0.4em] mb-4">{t('weekendExperience.gallery.badge', 'Live Moments')}</p>
                            <h2 className="font-serif text-3xl md:text-5xl font-black mb-4 leading-tight" dangerouslySetInnerHTML={{ __html: t('weekendExperience.gallery.title', 'Real Weekends,<br />Real Stories') }} />
                            <p className="text-[#F5DEB3]/60 text-lg">
                                {t('weekendExperience.gallery.subtitle', 'Photos and videos posted directly by our team from real weekend sessions. Every frame is a moment that happened here.')}
                            </p>
                        </div>
                        <Link
                            to="/gallery"
                            className="px-8 py-4 bg-[#D4AF37] text-[#4B3832] rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-transform shrink-0"
                        >
                            {t('weekendExperience.gallery.btn', 'Full Gallery')}
                        </Link>
                    </div>

                    <MediaGallery />
                </div>
            </section>

            {/* ─── WHAT TO EXPECT ─── */}
            <section className="container mx-auto px-6 py-24 max-w-6xl">
                <div className="text-center mb-16">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-4">{t('weekendExperience.what_to_expect.badge', 'Be Prepared')}</p>
                    <h2 className="font-serif text-3xl md:text-5xl font-black text-[#4B3832] dark:text-[#F5DEB3] mb-4">{t('weekendExperience.what_to_expect.title', 'What to Expect')}</h2>
                    <p className="text-espresso/60 dark:text-[#F5DEB3]/60 max-w-xl mx-auto">{t('weekendExperience.what_to_expect.desc', 'Everything you need to know before your visit so you can focus on enjoying every sip.')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            step: '01',
                            icon: 'book_online',
                            title: t('weekendExperience.what_to_expect.steps.book.title', 'Book Online'),
                            desc: t('weekendExperience.what_to_expect.steps.book.desc', 'Choose your activity or combo, select a Saturday or Sunday, and securely pay online.'),
                            gradient: 'from-rose-500 to-pink-600'
                        },
                        {
                            step: '02',
                            icon: 'location_on',
                            title: t('weekendExperience.what_to_expect.steps.arrive.title', 'Arrive & Meet Your Barista'),
                            desc: t('weekendExperience.what_to_expect.steps.arrive.desc', 'Come to our school 15 minutes early. Your expert barista instructor will welcome you, brief you, and make sure you\'re comfortable before you begin.'),
                            gradient: 'from-amber-500 to-orange-600'
                        },
                        {
                            step: '03',
                            icon: 'local_cafe',
                            title: t('weekendExperience.what_to_expect.steps.enjoy.title', 'Create, Learn & Enjoy'),
                            desc: t('weekendExperience.what_to_expect.steps.enjoy.desc', 'Dive in! Everything is provided — aprons, equipment, ingredients. Your only job is to enjoy, learn, and take great memories (and coffee!) home.'),
                            gradient: 'from-emerald-500 to-teal-600'
                        }
                    ].map(item => (
                        <div key={item.step} className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 border border-espresso/5 shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-6 right-8 font-serif font-black text-6xl text-espresso/5 dark:text-white/5 pointer-events-none">{item.step}</div>
                            <div className={`size-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white mb-6 shadow-lg`}>
                                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                            </div>
                            <h3 className="font-serif text-xl font-black text-[#4B3832] dark:text-[#F5DEB3] mb-3">{item.title}</h3>
                            <p className="text-espresso/60 dark:text-[#F5DEB3]/60 leading-relaxed text-sm">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── DONATION CTA ─── */}
            <section className="container mx-auto px-6 pb-24 max-w-6xl">
                <div className="bg-white dark:bg-white/5 rounded-[3rem] p-8 md:p-20 border border-espresso/10 relative overflow-hidden flex flex-col md:flex-row items-center gap-12 text-center md:text-left shadow-2xl">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-rose-500 to-amber-500"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/3 to-transparent pointer-events-none"></div>

                    <div className="size-32 md:size-40 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0 relative z-10">
                        <span className="material-symbols-outlined text-6xl md:text-7xl">volunteer_activism</span>
                    </div>

                    <div className="flex-1 space-y-6 relative z-10">
                        <h2 className="font-serif text-3xl md:text-4xl font-black text-[#4B3832] dark:text-[#F5DEB3]">
                            {t('weekendExperience.donate_cta.title', 'Turn Your Fun Into Someone\'s Future')}
                        </h2>
                        <p className="text-lg text-[#4B3832]/70 dark:text-[#F5DEB3]/70 leading-relaxed font-medium">
                            {t('weekendExperience.donate_cta.desc', 'Your visit already helps us run these sessions. But a donation goes further — it funds scholarships for talented Rwandans who cannot afford professional barista training. A few thousand RWF changes a life.')}
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <Link to="/donate" className="px-10 py-5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-transform flex items-center gap-3">
                                <span className="material-symbols-outlined text-sm">favorite</span>
                                {t('weekendExperience.donate_cta.btn_give', 'Give a Scholarship')}
                            </Link>
                            <Link to="/about" className="px-10 py-5 bg-transparent text-espresso dark:text-[#F5DEB3] rounded-2xl font-black text-xs uppercase tracking-[0.2em] border-2 border-espresso/20 dark:border-[#F5DEB3]/20 hover:scale-105 transition-transform">
                                {t('weekendExperience.donate_cta.btn_mission', 'Our Mission')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Newsletter />
        </div>
    );
}
