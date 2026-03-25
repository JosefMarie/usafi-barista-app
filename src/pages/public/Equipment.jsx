import React, { useState, useRef, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientButton } from '../../components/ui/GradientButton';
import { Newsletter } from '../../components/ui/Newsletter';
import { SEO } from '../../components/common/SEO';

export function Equipment() {
    const { t } = useTranslation();
    const [selectedImage, setSelectedImage] = useState(null);
    const [dynamicEquipment, setDynamicEquipment] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'equipment'), orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDynamicEquipment(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Helper to filter equipment by category
    const getByCategory = (cat) => dynamicEquipment.filter(item => item.category === cat);

    const machinery = getByCategory('machinery');
    const smallwares = getByCategory('smallwares');
    const serving = getByCategory('serving');
    const hygiene = getByCategory('hygiene');

    if (loading) return <div className="min-h-screen pt-32 text-center font-serif text-2xl uppercase tracking-widest text-espresso opacity-30">Indexing Assets...</div>;

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">
            <SEO 
                title="Professional Equipment & Barista Tools" 
                description="Explore our curated catalog of institutional-grade espresso machines, precision grinders, and professional barista essentials." 
            />

            {/* Page Title */}
            <div className="container mx-auto px-6 text-center mb-16">
                <h1 className="font-serif text-4xl md:text-5xl font-black text-espresso dark:text-white mb-4 tracking-tight uppercase">
                    {t('equipment.title')}
                </h1>
                <h2 className="text-xl md:text-2xl text-primary font-black mb-6 uppercase tracking-widest">
                    {t('equipment.subtitle')}
                </h2>
                <p className="text-lg text-espresso/80 dark:text-white/80 leading-relaxed max-w-3xl mx-auto font-medium">
                    {t('equipment.description')}
                </p>
            </div>

            {/* Section 1: Core Machinery - Premium Spotlight */}
            {machinery.length > 0 && (
                <section className="container mx-auto px-6 mb-24">
                    <div className="mb-12">
                        <h2 className="font-serif text-3xl md:text-5xl font-black text-espresso dark:text-white mb-2 uppercase tracking-tight">
                            {t('equipment.machinery.title')}
                        </h2>
                        <p className="text-primary font-black text-[10px] md:text-xs uppercase tracking-[0.4em] mt-2">
                            Institutional Grade Performance & Strategic Power
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        {machinery.map((item) => (
                            <div key={item.id} className="group bg-white dark:bg-white/5 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl border border-espresso/5 flex flex-col relative transition-all duration-500 hover:-translate-y-2">
                                <div className="absolute top-6 left-6 z-10 flex gap-2">
                                    {(item.tags || []).map((tag, idx) => (
                                        <span key={idx} className="px-4 py-2 bg-espresso text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="h-80 md:h-[28rem] relative cursor-pointer overflow-hidden" onClick={() => setSelectedImage(item.imageUrl)}>
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                        style={{ backgroundImage: `url("${item.imageUrl}")` }}
                                    ></div>
                                    <div className="absolute inset-0 bg-espresso/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                        <span className="material-symbols-outlined text-white text-5xl transform scale-50 group-hover:scale-100 transition-transform">zoom_in</span>
                                    </div>
                                </div>
                                <div className="p-8 md:p-12 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-serif text-3xl md:text-4xl font-black text-espresso dark:text-white mb-3 tracking-tighter uppercase">
                                            {item.name}
                                        </h3>
                                        <p className="text-primary font-black text-xs uppercase tracking-[0.2em] mb-6">{item.price || 'Market Rate Asset'}</p>
                                        <p className="text-sm md:text-base text-espresso/70 dark:text-white/70 leading-relaxed mb-8 font-medium">
                                            {item.description}
                                        </p>
                                        <div className="space-y-4">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40 dark:text-white/40">Technical Considerations</span>
                                            <div className="flex flex-wrap gap-3">
                                                {['Reliability', 'Precision', 'Institutional'].map((tag, idx) => (
                                                    <span key={idx} className="px-4 py-2 bg-espresso/5 text-espresso dark:text-white/60 rounded-xl text-[10px] font-black uppercase tracking-widest border border-espresso/10">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Section 2: Professional Tool Catalog (Unified) */}
            {smallwares.length > 0 && (
                <section className="container mx-auto px-6 py-24 bg-espresso/[0.02] dark:bg-white/[0.01] rounded-[4rem] mb-24">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
                        <div className="relative">
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary/40 -ml-6"></div>
                            <h2 className="font-serif text-3xl md:text-5xl font-black text-espresso dark:text-white mb-2 uppercase tracking-tight">
                                {t('equipment.smallwares.title')}
                            </h2>
                            <p className="text-primary font-black text-[10px] md:text-xs uppercase tracking-[0.4em] mt-2">
                                Certified Barista Essentials & Institutional Smallwares
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-espresso/40">
                            <span className="w-12 h-px bg-espresso/10"></span>
                            {smallwares.length} Assets Indexed
                        </div>
                    </div>
                    
                    {/* Product Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8 lg:gap-10">
                        {smallwares.map((tool) => (
                            <div
                                key={tool.id}
                                className="group bg-white dark:bg-white/5 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-espresso/5 flex flex-col h-full relative"
                            >
                                <div className="absolute top-4 left-4 z-10">
                                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-espresso text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm border border-espresso/5">
                                        {tool.tags?.[0] || tool.tag || 'PRO CHOICE'}
                                    </span>
                                </div>
                                <div 
                                    className="h-48 md:h-64 relative overflow-hidden group/img cursor-pointer"
                                    onClick={() => setSelectedImage(tool.imageUrl)}
                                >
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                        style={{ backgroundImage: `url("${tool.imageUrl}")` }}
                                    ></div>
                                    <div className="absolute inset-0 bg-espresso/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                        <span className="material-symbols-outlined text-white text-4xl transform scale-50 group-hover/img:scale-100 transition-transform">zoom_in</span>
                                    </div>
                                </div>
                                <div className="p-5 md:p-8 flex-1 flex flex-col justify-between gap-4">
                                    <div>
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-espresso/5 text-espresso flex items-center justify-center mb-4 transition-colors group-hover:bg-espresso group-hover:text-white">
                                            <span className="material-symbols-outlined text-base md:text-xl">{tool.icon || 'hardware'}</span>
                                        </div>
                                        <h3 className="font-serif text-lg md:text-xl font-black text-espresso dark:text-white mb-2 leading-tight uppercase tracking-tight">
                                            {tool.name}
                                        </h3>
                                        <p className="text-[10px] md:text-sm text-espresso/60 dark:text-white/60 leading-relaxed line-clamp-2 md:line-clamp-3 font-medium">
                                            {tool.description}
                                        </p>
                                    </div>
                                    <div className="pt-4 border-t border-espresso/5">
                                        {tool.buyUrl ? (
                                            <a
                                                href={tool.buyUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full py-3 md:py-4 bg-espresso text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl hover:bg-black hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                Source This Product
                                                <span className="material-symbols-outlined text-sm">shopping_cart</span>
                                            </a>
                                        ) : (
                                            <button 
                                                onClick={() => setSelectedImage(tool.imageUrl)}
                                                className="w-full py-3 md:py-4 bg-espresso/5 text-espresso text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl hover:bg-espresso hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                View Specifications
                                                <span className="material-symbols-outlined text-sm">visibility</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Section 3: Utility & Operational Infrastructure */}
            {(serving.length > 0 || hygiene.length > 0) && (
                <section className="container mx-auto px-6 py-20 mb-24">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
                        {/* Serving & Inventory */}
                        <div className="space-y-12">
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary/20 -ml-6"></div>
                                <h2 className="font-serif text-3xl md:text-4xl font-black text-espresso dark:text-white uppercase tracking-tighter">
                                    {t('equipment.serving.title')}
                                </h2>
                                <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mt-2">Front-of-House Systems</p>
                            </div>
                            
                            <div className="grid gap-6">
                                {serving.map((item) => (
                                    <div key={item.id} className="group bg-white/40 dark:bg-white/5 p-6 md:p-8 rounded-[2rem] border border-espresso/5 hover:border-primary/20 transition-all hover:shadow-xl flex items-start gap-6">
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-espresso text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-2xl md:text-3xl">{item.icon || 'inventory_2'}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-espresso dark:text-white uppercase tracking-widest text-sm md:text-base mb-2">
                                                {item.name}
                                            </h4>
                                            <p className="text-xs md:text-sm text-espresso/60 dark:text-white/60 leading-relaxed font-medium">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cleaning & Maintenance */}
                        <div className="space-y-12">
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary/20 -ml-6"></div>
                                <h2 className="font-serif text-3xl md:text-4xl font-black text-espresso dark:text-white uppercase tracking-tighter">
                                    {t('equipment.hygiene.title')}
                                </h2>
                                <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mt-2">Operational Integrity & Safety</p>
                            </div>

                            <div className="grid gap-6">
                                {hygiene.map((item) => (
                                    <div key={item.id} className="group bg-white/40 dark:bg-white/5 p-6 md:p-8 rounded-[2rem] border border-espresso/5 hover:border-primary/20 transition-all hover:shadow-xl flex items-start gap-6">
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-2xl md:text-3xl">{item.icon || 'shield'}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-espresso dark:text-white uppercase tracking-widest text-sm md:text-base mb-2">
                                                {item.name}
                                            </h4>
                                            <p className="text-xs md:text-sm text-espresso/60 dark:text-white/60 leading-relaxed font-medium">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Section 5: Purchasing and Pricing - Executive Summary */}
            <section className="bg-espresso text-[#FAF5E8] py-32 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                <div className="container mx-auto max-w-5xl relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="font-serif text-4xl md:text-6xl font-black mb-6 uppercase tracking-tight">
                            {t('equipment.pricing.title')}
                        </h2>
                        <div className="h-1.5 w-24 bg-primary mx-auto mb-8"></div>
                        <p className="text-white/70 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-bold italic">
                            {t('equipment.pricing.description')}
                        </p>
                    </div>
 
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                        {machinery.slice(0, 2).map((item, idx) => (
                            <div key={item.id} className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-10 border border-white/10 hover:border-primary/30 transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="font-black text-2xl uppercase tracking-tighter">{item.name}</h3>
                                    <span className="material-symbols-outlined text-primary text-3xl">{idx === 0 ? 'payments' : 'price_check'}</span>
                                </div>
                                <p className="text-xs text-white/40 uppercase tracking-[0.3em] mb-4">Institutional Benchmark</p>
                                <div className="text-4xl md:text-5xl font-black text-primary tracking-tighter">
                                    {item.price || 'Contact for Quote'}
                                </div>
                            </div>
                        ))}
                    </div>
 
                    <div className="bg-white/5 backdrop-blur-md p-10 rounded-[2.5rem] border border-primary/20 flex flex-col md:flex-row items-center gap-8 mb-20">
                        <div className="w-20 h-20 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-4xl">lightbulb</span>
                        </div>
                        <div>
                            <h4 className="font-black text-white uppercase tracking-widest text-lg mb-2">{t('equipment.pricing.advice.title')}</h4>
                            <p className="text-white/60 leading-relaxed font-medium">
                                {t('equipment.pricing.advice.description')}
                            </p>
                        </div>
                    </div>
 
                    <div className="text-center pt-10 border-t border-white/10">
                        <p className="font-serif text-3xl md:text-4xl italic text-white mb-8 font-black">
                            {t('equipment.pricing.cta_text')}
                        </p>
                        <p className="text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed font-bold">
                            {t('equipment.pricing.cta_sub')}
                        </p>
                        <div className="flex justify-center">
                            <GradientButton
                                to="/enroll"
                                className="!px-12 !py-6 !text-lg !rounded-2xl shadow-2xl hover:scale-105 transition-transform"
                            >
                                {t('equipment.pricing.cta_button')}
                            </GradientButton>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter Section */}
            <Newsletter />

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 md:top-8 md:right-8 text-white/50 hover:text-white transition-colors bg-black/20 p-2 rounded-full backdrop-blur-md"
                        onClick={() => setSelectedImage(null)}
                    >
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </button>
                    <img
                        src={selectedImage}
                        alt="Equipment Full View"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
