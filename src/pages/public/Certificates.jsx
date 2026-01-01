import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { Newsletter } from '../../components/ui/Newsletter';

export function Certificates() {
    const { t } = useTranslation();
    const [activeFilter, setActiveFilter] = useState('All');

    const filters = [
        { id: 'All', label: t('certificates.filters.all') },
        { id: 'Barista Skills', label: t('certificates.filters.skills') },
        { id: 'Roasting', label: t('certificates.filters.roasting') },
        { id: 'Brewing', label: t('certificates.filters.brewing') }
    ];

    const certificates = [
        {
            id: 1,
            title: t('certificates.items.milk'),
            date: 'Jan 15, 2024',
            category: 'Barista Skills',
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCxeIO-1V_lQXh0XvxBDdiTS3YsBSmd-NiVNOqcClhTvoYEwI_F40_0hhp8NdjFFanJNk8R-03Tiz3zLm-Myut4A6IW8kYTpkRWc6lynplTG4HJhYu67mllNCtmcz2swEDRI1XKobDUFEKbRiYC43Q0TbjO4jtEpZGwtZT4EEjzhS-rc5jkSTdh9wAUnIlYZ8N-5ljw4hPLW-L7qiPezX0QWxs1LErsUqemCqqC8ayJx5owWrdxQ1KvJI3x6F3DcBuLLd_YkGi_SjSn"
        },
        {
            id: 2,
            title: t('certificates.items.intro_roasting'),
            date: 'Nov 22, 2023',
            category: 'Roasting',
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBZpy9UopxnFXPCbMTrb6HLvTxWkYflNrsoY7JmqV4izTCi5KW6ugmfBYM9wuKYhl_DG1kBId9sDzF0wKppwFKLSpZXvphG1wnOYVdsS56x-UcY5JeI9TAVNESZaeACCeNwu4bm0bELun0vCUxZJfXiFg5YhAodu_S025S43-0DdVe6bOhWKcGbV6mpFD2stT8wGI7SzokqnFwnSdhI4oSh1w-cdz46MIv1ZYzjhhEWoNM_TBgfDPk4HSOZZx8JGXfQCpXgFnROub3G"
        },
        {
            id: 3,
            title: t('certificates.items.green_basics'),
            date: 'Sep 10, 2023',
            category: 'Roasting',
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAV2jmgK2bezZ8hh88r6MfSiNAhfxPa3ceK1x6LYJ5K7ewADCmphSe2WK4tOtkEZzCuxIzaRrUZvCK4qtGNVidg5PPVpbvmZyW0Go6bEMKRBPKQ3b_CuLWsExZiY3ZHPXpC5dEai1sgUf-rg-NH4bsbvNI1vlAeDaifVJhX8rQBuuOa3i2hkKYi9DyYRCSd50ttnYJCOO1A3R1U3ztuGc_V679AtXQflQUqLfNfgTNuMSzqWP4nfxkWn_IA5fqL46nTzPSNSajYyz6s"
        }
    ];

    const filteredCertificates = activeFilter === 'All'
        ? certificates
        : certificates.filter(cert => cert.category === activeFilter);

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-espresso dark:text-white pb-20 pt-24">

            {/* Header */}
            <div className="container mx-auto px-6 mb-8 flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-3xl md:text-4xl font-bold text-espresso dark:text-white tracking-tight">
                        {t('certificates.title')}
                    </h1>
                    <p className="text-espresso/70 dark:text-white/70 mt-2">
                        {t('certificates.subtitle')}
                    </p>
                </div>
                <div className="hidden md:flex items-center justify-center rounded-full h-12 w-12 bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-3xl">workspace_premium</span>
                </div>
            </div>

            {/* Filters */}
            <div className="container mx-auto px-6 mb-8">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={cn(
                                "flex h-10 shrink-0 items-center justify-center px-6 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                activeFilter === filter.id
                                    ? "bg-espresso text-[#FAF5E8] shadow-md"
                                    : "bg-white dark:bg-white/5 border border-primary/30 text-espresso hover:bg-primary/5 dark:text-white"
                            )}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Certificates Grid */}
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCertificates.map((cert) => (
                        <div key={cert.id} className="group flex flex-col gap-4 rounded-xl bg-white dark:bg-white/5 p-4 shadow-sm border border-primary/20 hover:border-primary/50 transition-colors">
                            <div className="flex items-start gap-4">
                                {/* Thumbnail */}
                                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-100 relative">
                                    <div
                                        className="absolute inset-0 bg-center bg-cover bg-no-repeat"
                                        style={{ backgroundImage: `url("${cert.image}")` }}
                                    ></div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col justify-between h-full gap-2">
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="material-symbols-outlined text-green-600 text-[16px] font-bold">verified</span>
                                            <p className="text-green-600 text-xs font-bold uppercase tracking-wide">{t('certificates.certified')}</p>
                                        </div>
                                        <h3 className="text-espresso dark:text-white text-base font-bold leading-tight">{cert.title}</h3>
                                        <p className="text-espresso/70 dark:text-white/70 text-xs font-normal mt-1">{t('certificates.completed')} {cert.date}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action */}
                            <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white gap-2 text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm active:scale-[0.98]">
                                <span className="material-symbols-outlined text-[20px]">download</span>
                                <span>{t('certificates.download')}</span>
                            </button>
                        </div>
                    ))}
                </div>

                {filteredCertificates.length === 0 && (
                    <div className="flex flex-col items-center gap-6 py-20 px-4 text-center">
                        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                            <span className="material-symbols-outlined text-[64px]">local_cafe</span>
                        </div>
                        <div className="flex max-w-[280px] flex-col items-center gap-2">
                            <p className="text-espresso dark:text-white text-lg font-bold leading-tight">{t('certificates.empty.title')}</p>
                            <p className="text-espresso/70 dark:text-white/70 text-sm font-normal leading-relaxed">{t('certificates.empty.description')}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Newsletter Section */}
            <Newsletter />

        </div>
    );
}
