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
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <h1 className="text-xl font-bold tracking-tight text-espresso dark:text-white">Manage Categories</h1>
                <button className="flex items-center justify-center p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-espresso dark:text-white">
                    <span className="material-symbols-outlined">more_horiz</span>
                </button>
            </header>

            {/* Search Bar */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <span className="material-symbols-outlined text-primary/70 text-[22px]">search</span>
                </div>
                <input
                    className="block w-full p-4 pl-12 text-base text-espresso dark:text-white bg-white dark:bg-[#2c2825] rounded-2xl border-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-gray-400"
                    placeholder="Search categories..."
                    type="text"
                />
            </div>

            {/* Categories List */}
            <div className="space-y-4 pb-20">
                {categories.map((category) => (
                    <div key={category.id} className="group relative flex items-center justify-between bg-white dark:bg-[#2c2825] p-3 rounded-2xl shadow-sm border border-transparent hover:border-primary/20 transition-all active:scale-[0.99] duration-200">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-[#F4EFEA] dark:bg-white/10 text-primary shrink-0">
                                <span className="material-symbols-outlined text-[24px]">{category.icon}</span>
                            </div>
                            <div className="flex flex-col truncate">
                                <span className="text-base font-semibold text-espresso dark:text-white truncate">{category.name}</span>
                                <span className="text-xs text-gray-500 dark:text-white/60 font-medium">{category.count} Courses</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 pl-2">
                            <button aria-label="Edit" className="flex items-center justify-center w-9 h-9 rounded-full text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors">
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button aria-label="Delete" className="flex items-center justify-center w-9 h-9 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Action Area */}
            <div className="fixed bottom-6 right-6 md:absolute md:bottom-0 md:right-0 md:p-0 z-10 w-full md:w-auto p-4 pointer-events-none md:pointer-events-auto flex justify-end">
                <button className="pointer-events-auto w-full md:w-auto bg-primary hover:bg-[#8F6A46] text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                    <span className="material-symbols-outlined text-[24px]">add</span>
                    <span className="text-lg">Add New Category</span>
                </button>
            </div>
        </div>
    );
}
