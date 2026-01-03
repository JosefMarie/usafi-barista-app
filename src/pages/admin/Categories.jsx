import React from 'react';

export function Categories() {
    const categories = [
        { id: 1, name: 'Espresso Techniques', count: 12, icon: 'coffee' },
        { id: 2, name: 'Latte Art Fundamentals', count: 8, icon: 'local_cafe' },
        { id: 3, name: 'Bean Sourcing 101', count: 5, icon: 'grain' },
        { id: 4, name: 'Brewing Methods', count: 15, icon: 'coffee_maker' },
        { id: 5, name: 'Customer Service', count: 4, icon: 'support_agent' },
        { id: 6, name: 'Machine Maintenance', count: 9, icon: 'build' },
    ];

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F5DEB3] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-32">
            <div className=" w-full px-2 py-10 space-y-10">
                {/* Header Section */}
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-10"></div>
                    <div>
                        <h1 className="text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">System Taxonomy</h1>
                        <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-2">Content Classification & Organizational Hierarchy</p>
                    </div>
                </div>

                {/* Classification Search Array */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-espresso/30">
                        <span className="material-symbols-outlined text-[28px]">filter_alt</span>
                    </div>
                    <input
                        className="w-full h-16 pl-20 pr-8 bg-white/40 dark:bg-black/20 border border-espresso/10 rounded-[1.5rem] text-espresso dark:text-white font-serif text-lg focus:outline-none focus:ring-2 focus:ring-espresso transition-all shadow-inner placeholder:text-espresso/20 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.4em] placeholder:text-[10px]"
                        placeholder="Filter classification nodes..."
                        type="text"
                    />
                </div>

                {/* Taxonomy Matrix */}
                <div className="grid gap-6">
                    {categories.map((category) => (
                        <div key={category.id} className="group relative bg-white/40 dark:bg-black/20 rounded-[2.5rem] p-8 border border-espresso/10 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden flex items-center justify-between">
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/5 group-hover:bg-espresso transition-colors"></div>

                            <div className="flex items-center gap-8 flex-1 min-w-0">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-espresso to-espresso/80 text-white flex items-center justify-center shadow-lg shadow-espresso/20 group-hover:scale-110 transition-transform shrink-0">
                                    <span className="material-symbols-outlined text-[40px]">{category.icon}</span>
                                </div>

                                <div className="flex flex-col flex-1 min-w-0">
                                    <h3 className="text-2xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none group-hover:text-espresso/70 transition-colors truncate">
                                        {category.name}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-2 px-4 py-1.5 bg-espresso/5 rounded-xl border border-espresso/10 shadow-inner">
                                            <span className="material-symbols-outlined text-[16px] text-espresso/40">dataset</span>
                                            <span className="text-[10px] font-black text-espresso/60 uppercase tracking-[0.2em]">
                                                {category.count} MODULES
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 ml-8 shrink-0">
                                <button
                                    aria-label="Edit"
                                    className="w-12 h-12 rounded-2xl bg-white/60 hover:bg-espresso text-espresso/40 hover:text-white transition-all flex items-center justify-center shadow-sm group-hover:scale-110"
                                >
                                    <span className="material-symbols-outlined text-[24px]">edit</span>
                                </button>
                                <button
                                    aria-label="Delete"
                                    className="w-12 h-12 rounded-2xl bg-white/60 hover:bg-red-600 text-red-400 hover:text-white transition-all flex items-center justify-center shadow-sm group-hover:scale-110"
                                >
                                    <span className="material-symbols-outlined text-[24px]">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Expansion Trigger */}
                <div className="fixed bottom-12 right-12 z-50">
                    <button className="group flex items-center gap-4 bg-espresso hover:bg-espresso/90 text-white rounded-[2rem] shadow-2xl hover:shadow-espresso/40 transition-all p-2 pr-10 hover:scale-105 active:scale-95">
                        <div className="h-16 w-16 rounded-[1.75rem] border-2 border-white/20 flex items-center justify-center bg-white/10 group-hover:rotate-90 transition-transform duration-500">
                            <span className="material-symbols-outlined text-[32px]">add</span>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Initialize</span>
                            <span className="font-serif font-black text-xl uppercase tracking-tight">New Node</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}



