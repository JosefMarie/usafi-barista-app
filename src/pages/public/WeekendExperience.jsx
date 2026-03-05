import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEO } from '../../components/common/SEO';
import { Newsletter } from '../../components/ui/Newsletter';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { usePricing } from '../../hooks/usePricing';

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const COMBO_MODULES = [
    { id: 'coffee_intro', icon: 'history_edu', gradient: 'from-amber-500 to-orange-600', lightGradient: 'from-amber-500/10 to-orange-600/10' },
    { id: 'roasting_profile', icon: 'fire_griddler', gradient: 'from-rose-500 to-red-600', lightGradient: 'from-rose-500/10 to-red-600/10' },
    { id: 'grinding_chart', icon: 'shutter_speed', gradient: 'from-emerald-500 to-teal-600', lightGradient: 'from-emerald-500/10 to-teal-600/10' },
    { id: 'espresso_extraction', icon: 'coffee_maker', gradient: 'from-blue-500 to-indigo-600', lightGradient: 'from-blue-500/10 to-indigo-600/10' },
    { id: 'latte_art', icon: 'local_cafe', gradient: 'from-pink-500 to-rose-600', lightGradient: 'from-pink-500/10 to-rose-600/10' },
    { id: 'espresso_drinks', icon: 'restaurant_menu', gradient: 'from-violet-500 to-purple-600', lightGradient: 'from-violet-500/10 to-purple-600/10' },
    { id: 'manual_brewing', icon: 'humidity_low', gradient: 'from-cyan-500 to-sky-600', lightGradient: 'from-cyan-500/10 to-sky-600/10' }
];


// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function ModuleCard({ module, index }) {
    const { t } = useTranslation();
    return (
        <div className="group relative bg-white dark:bg-white/5 rounded-[2.5rem] border border-espresso/5 shadow-xl overflow-hidden transition-all duration-500 hover:-translate-y-2 flex flex-col p-8">
            <div className={`size-14 rounded-2xl bg-gradient-to-br ${module.gradient} flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-2xl">{module.icon}</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-espresso/30 dark:text-[#F5DEB3]/30 mb-1">Module 0{index + 1}</p>
            <h3 className="font-serif text-xl font-black text-[#4B3832] dark:text-[#F5DEB3] mb-3">{t(`weekendExperience.combo.m${index + 1}.title`)}</h3>
            <p className="text-[#4B3832]/60 dark:text-[#F5DEB3]/60 leading-relaxed text-sm">{t(`weekendExperience.combo.m${index + 1}.desc`)}</p>
            <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${module.gradient} group-hover:w-full transition-all duration-500`}></div>
        </div>
    );
}

function PricingCard({ days, price, perPersonLabel, bookBtnLabel }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="relative p-8 rounded-[3rem] bg-white dark:bg-white/5 border-2 border-espresso/5 shadow-2xl overflow-hidden group hover:border-rose-500/30 transition-colors">
            <div className={`absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-700`}>
                <span className="material-symbols-outlined text-[8rem] text-rose-500">calendar_today</span>
            </div>
            <div className="relative z-10 space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-rose-500">{days} {days === 1 ? 'Day' : 'Days'} Course</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-serif font-black text-espresso dark:text-[#F5DEB3]">{price}</span>
                    <span className="text-sm text-espresso/40 dark:text-[#F5DEB3]/40 uppercase tracking-widest">{perPersonLabel}</span>
                </div>
                <ul className="space-y-3 py-4">
                    <li className="flex items-center gap-3 text-sm font-medium opacity-70">
                        <span className="material-symbols-outlined text-rose-500 text-lg">check_circle</span>
                        All 7 Modules Included
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium opacity-70">
                        <span className="material-symbols-outlined text-rose-500 text-lg">check_circle</span>
                        Hands-on Practice
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium opacity-70">
                        <span className="material-symbols-outlined text-rose-500 text-lg">check_circle</span>
                        Full Barista Kit Use
                    </li>
                </ul>
                <button
                    onClick={() => navigate(`/weekend-experience/book?duration=${days}`)}
                    className="w-full py-4 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                    {bookBtnLabel}
                </button>
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
    const { pricing } = usePricing();

    // Live prices from Firestore, fall back to defaults
    const price1Day = pricing?.weekend?.price1Day ?? 150;
    const price2Days = pricing?.weekend?.price2Days ?? 300;

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
                        {t('weekendExperience.title').split(' ').slice(0, -1).join(' ')}
                        <span className="block bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
                            {t('weekendExperience.title').split(' ').pop()}
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-[#4B3832]/70 dark:text-[#F5DEB3]/70 leading-relaxed max-w-3xl mx-auto font-medium mb-12">
                        {t('weekendExperience.description')}
                    </p>

                    <div className="flex flex-wrap gap-4 justify-center">
                        <a href="#course-modules" className="px-8 py-4 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all outline-none">
                            {t('weekendExperience.explore_btn')}
                        </a>
                        <Link to="/weekend-experience/book" className="px-8 py-4 bg-white dark:bg-white/10 text-espresso dark:text-[#F5DEB3] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all border border-espresso/10 flex items-center gap-2">
                            <span className="material-symbols-outlined text-rose-500 text-sm">event</span>
                            {t('weekendExperience.book_btn')}
                        </Link>
                        <Link to="/guest/login" className="px-8 py-4 bg-transparent text-espresso/40 dark:text-[#F5DEB3]/40 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:text-rose-500 transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">login</span>
                            {t('weekendExperience.guest_login_btn', 'Guest Login')}
                        </Link>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-16 pt-10 border-t border-espresso/5 flex flex-wrap items-center justify-center gap-12">
                        {[
                            { label: t('weekendExperience.stats.modules'), value: '07' },
                            { label: t('weekendExperience.stats.duration'), value: '01-02' },
                            { label: `From $${price1Day}`, value: `$${price1Day}` },
                            { label: t('weekendExperience.stats.days'), value: 'Sat-Sun' }
                        ].map(s => (
                            <div key={s.label} className="text-center">
                                <p className="text-3xl font-serif font-black text-espresso dark:text-[#F5DEB3] mb-1">{s.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">{s.label}</p>
                            </div>
                        ))}
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



            {/* ─── PRICING ─── */}
            <section className="container mx-auto px-6 py-24 max-w-6xl">
                <div className="text-center mb-16">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-4">Pricing & Duration</p>
                    <h2 className="font-serif text-3xl md:text-5xl font-black text-[#4B3832] dark:text-[#F5DEB3] mb-4">Choose Your Intensity</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <PricingCard
                        days={1}
                        price={`$${price1Day}`}
                        perPersonLabel={t('weekendExperience.pricing.per_person')}
                        bookBtnLabel={t('weekendExperience.book_btn')}
                    />
                    <PricingCard
                        days={2}
                        price={`$${price2Days}`}
                        perPersonLabel={t('weekendExperience.pricing.per_person')}
                        bookBtnLabel={t('weekendExperience.book_btn')}
                    />
                </div>
            </section>

            {/* ─── COURSE MODULES ─── */}
            <section id="course-modules" className="container mx-auto px-6 pb-24 max-w-6xl">
                <div className="text-center mb-16">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-4">{t('weekendExperience.combo.title')}</p>
                    <h2 className="font-serif text-3xl md:text-5xl font-black text-[#4B3832] dark:text-[#F5DEB3] mb-4">{t('weekendExperience.combo.subtitle')}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {COMBO_MODULES.map((module, i) => (
                        <ModuleCard key={module.id} module={module} index={i} />
                    ))}
                    <div className="bg-gradient-to-br from-espresso to-[#2A1E1B] rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center text-[#F5DEB3] shadow-2xl overflow-hidden relative group md:col-span-2 xl:col-span-1">
                        <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/10 to-transparent pointer-events-none"></div>
                        <span className="material-symbols-outlined text-5xl mb-4 group-hover:scale-110 transition-transform">star</span>
                        <h3 className="font-serif text-xl font-black mb-2">And Much More!</h3>
                        <p className="text-sm opacity-60">Interactive sessions, networking, and a lifetime coffee community access.</p>
                    </div>
                </div>
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
