import React from 'react';

export function Quizzes() {
    const questions = [
        { id: 1, text: 'What is the ideal extraction time for a standard espresso shot?', answer: '25-30 seconds', options: ['15-20 seconds', '25-30 seconds', '35-40 seconds'] },
        { id: 2, text: 'Which roast level is typically preferred for traditional espresso?', answer: 'Medium-Dark Roast', options: ['Light Roast', 'Medium-Dark Roast', 'Dark Roast'] },
        { id: 3, text: 'What is the correct tamping pressure?', answer: '30 lbs', options: ['10 lbs', '20 lbs', '30 lbs'] },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-24">
            <header className="flex items-center justify-between">
                <h1 className="text-espresso dark:text-white text-lg font-bold leading-tight tracking-tight flex-1">Quiz Management</h1>
                <button className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-espresso dark:text-white transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
            </header>

            {/* Quiz Summary Card */}
            <div className="bg-white dark:bg-[#2c2825] rounded-xl p-4 shadow-sm border border-primary/10 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20 w-fit">Barista 101</span>
                        <h2 className="text-espresso dark:text-white text-xl font-bold leading-tight">Espresso Basics Quiz</h2>
                        <p className="text-espresso/60 dark:text-white/60 text-sm">Created on Oct 24, 2023</p>
                    </div>
                    <div className="size-16 rounded-lg bg-cover bg-center shrink-0 border border-primary/10 bg-gray-200" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80')" }}></div>
                </div>
                <div className="flex items-center gap-4 text-sm text-espresso/60 dark:text-white/60 border-t border-primary/10 pt-3">
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-primary">list_alt</span>
                        <span className="font-medium">12 Questions</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                        <span className="font-medium">15 Mins</span>
                    </div>
                </div>
                <button className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 bg-background-light dark:bg-white/5 text-primary text-sm font-medium border border-primary/20 hover:bg-primary/5 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Edit Quiz Details
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="material-symbols-outlined text-primary/60">search</span>
                </div>
                <input
                    className="block w-full rounded-xl border-0 py-3 pl-10 pr-3 text-espresso dark:text-white ring-1 ring-inset ring-primary/20 placeholder:text-espresso/50 dark:placeholder:text-white/50 focus:ring-2 focus:ring-inset focus:ring-primary bg-white dark:bg-[#2c2825] shadow-sm sm:text-sm sm:leading-6"
                    placeholder="Search questions..."
                    type="text"
                />
            </div>

            {/* Questions List */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-espresso dark:text-white text-lg font-bold">Questions</h3>
                    <button className="text-primary text-sm font-medium hover:text-primary/80">Reorder</button>
                </div>
                {questions.map((q, idx) => (
                    <div key={q.id} className="group bg-white dark:bg-[#2c2825] rounded-xl p-4 shadow-sm border border-primary/10 hover:border-primary/40 transition-all cursor-pointer">
                        <div className="flex gap-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                                {idx + 1}
                            </div>
                            <div className="flex flex-1 flex-col gap-2">
                                <p className="text-espresso dark:text-white font-medium leading-normal">{q.text}</p>
                                <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/5 px-2 py-1 rounded w-fit">
                                    <span className="material-symbols-outlined filled text-[16px]">check_circle</span>
                                    {q.answer}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <button className="text-espresso/60 dark:text-white/60 hover:text-primary"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                                <button className="text-espresso/60 dark:text-white/60 hover:text-red-600"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="fixed bottom-6 right-6 z-30 flex items-center justify-center size-14 rounded-full bg-primary text-white shadow-lg shadow-primary/40 hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95">
                <span className="material-symbols-outlined text-3xl">add</span>
            </button>

        </div>
    );
}
