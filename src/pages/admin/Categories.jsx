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
                <div className="flex flex-col md:flex-row md:items-center justify-between relative gap-4">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 -ml-2 md:-ml-10"></div>
                    <div className="pl-4 md:pl-0">
                        <h1 className="text-2xl md:text-4xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none">System Taxonomy</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.3em] mt-2">Content Classification & Organizational Hierarchy</p>
                    </div>
                </div>

                {/* Classification Search Array */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 md:left-6 flex items-center pointer-events-none text-espresso/30">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">filter_alt</span>
                    </div>
                    <input
                        className="w-full h-12 md:h-16 pl-12 md:pl-20 pr-6 md:pr-8 bg-white/40 dark:bg-black/20 border border-espresso/10 rounded-xl md:rounded-[1.5rem] text-espresso dark:text-white font-serif text-sm md:text-lg focus:outline-none focus:ring-2 focus:ring-espresso transition-all shadow-inner placeholder:text-espresso/20 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.2em] md:placeholder:tracking-[0.4em] placeholder:text-[8px] md:placeholder:text-[10px]"
                        placeholder="Filter classification nodes..."
                        type="text"
                    />
                </div>

                {/* Taxonomy Matrix */}
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                    {categories.map((category) => (
                        <div key={category.id} className="group relative bg-white/40 dark:bg-black/20 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 border border-espresso/10 shadow-lg md:shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-espresso/5 group-hover:bg-espresso transition-colors"></div>

                            <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
                                <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-espresso to-espresso/80 text-white flex items-center justify-center shadow-lg shadow-espresso/20 group-hover:scale-110 transition-transform shrink-0">
                                    <span className="material-symbols-outlined text-[28px] md:text-[40px]">{category.icon}</span>
                                </div>

                                <div className="flex flex-col flex-1 min-w-0">
                                    <h3 className="text-lg md:text-2xl font-serif font-black text-espresso dark:text-white uppercase tracking-tight leading-none group-hover:text-espresso/70 transition-colors truncate">
                                        {category.name}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-espresso/5 rounded-lg md:rounded-xl border border-espresso/10 shadow-inner">
                                            <span className="material-symbols-outlined text-[14px] md:text-[16px] text-espresso/40">dataset</span>
                                            <span className="text-[8px] md:text-[10px] font-black text-espresso/60 uppercase tracking-[0.2em]">
                                                {category.count} NODES
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-none border-espresso/5 justify-end">
                                <button
                                    aria-label="Edit"
                                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/60 hover:bg-espresso text-espresso/40 hover:text-white transition-all flex items-center justify-center shadow-sm group-hover:scale-105"
                                >
                                    <span className="material-symbols-outlined text-[20px] md:text-[24px]">edit</span>
                                </button>
                                <button
                                    aria-label="Delete"
                                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/60 hover:bg-red-600 text-red-400 hover:text-white transition-all flex items-center justify-center shadow-sm group-hover:scale-105"
                                >
                                    <span className="material-symbols-outlined text-[20px] md:text-[24px]">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Expansion Trigger */}
                <div className="fixed bottom-6 right-6 md:bottom-12 md:right-12 z-50">
                    <button className="group flex items-center gap-3 md:gap-4 bg-espresso hover:bg-espresso/90 text-white rounded-2xl md:rounded-[2rem] shadow-2xl hover:shadow-espresso/40 transition-all p-1.5 md:p-2 pr-6 md:pr-10 hover:scale-105 active:scale-95">
                        <div className="h-10 w-10 md:h-16 md:w-16 rounded-xl md:rounded-[1.75rem] border-2 border-white/20 flex items-center justify-center bg-white/10 group-hover:rotate-90 transition-transform duration-500">
                            <span className="material-symbols-outlined text-xl md:text-[32px]">add</span>
                        </div>
                        <div className="flex flex-col items-start translate-y-0.5">
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-60">Initialize</span>
                            <span className="font-serif font-black text-sm md:text-xl uppercase tracking-tight">New Node</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}



