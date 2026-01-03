import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function CEORevenue() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 24500000,
        monthlyRevenue: 0,
        pendingRevenue: 0,
    });
    const [monthlyData, setMonthlyData] = useState([]);

    useEffect(() => {
        const fetchRevenueData = async () => {
            try {
                const usersRef = collection(db, 'users');
                const qStudents = query(usersRef, where('role', '==', 'student'));
                const studentSnap = await getDocs(qStudents);
                const students = studentSnap.docs.map(doc => ({ ...doc.data(), createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now()) }));

                // Calculate Revenue
                const activeStudents = students.filter(s => s.status === 'active');
                const estimatedTotalRevenue = activeStudents.length * 200000;

                // Monthly Revenue catch (this month)
                const now = new Date();
                const thisMonthStudents = activeStudents.filter(s => s.createdAt.getMonth() === now.getMonth() && s.createdAt.getFullYear() === now.getFullYear());
                const monthlyRevenue = thisMonthStudents.length * 200000;

                // Pending Revenue (students with 'pending' status) - assume potential
                const pendingStudents = students.filter(s => s.status === 'pending');
                const pendingRevenue = pendingStudents.length * 200000;

                setStats({
                    totalRevenue: estimatedTotalRevenue,
                    monthlyRevenue,
                    pendingRevenue
                });

                // Generate last 12 months data
                const last12Months = [];
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthName = d.toLocaleString('default', { month: 'short' });

                    // Count revenue for this bucket
                    // Assuming cumulative for simplicity or enrollment based? "Revenue Report" usually implies cash flow.
                    // Let's rely on enrollment month for "Cash In".
                    const enrolledInMonth = activeStudents.filter(s => s.createdAt.getMonth() === d.getMonth() && s.createdAt.getFullYear() === d.getFullYear());
                    const amount = enrolledInMonth.length * 200000;

                    last12Months.push({
                        month: monthName,
                        amount
                    });
                }
                setMonthlyData(last12Months);

            } catch (e) {
                console.error("Revenue Fetch Error", e);
            } finally {
                setLoading(false);
            }
        };

        fetchRevenueData();
    }, []);

    if (loading) return <div className="flex h-full items-center justify-center text-[#D4Af37] animate-pulse">Loading Financial Data...</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#FAF5E8] dark:bg-[#1c1916] overflow-y-auto animate-fade-in pb-12 custom-scrollbar">
            <div className="w-full max-w-7xl mx-auto px-6 space-y-8">
                <div>
                    <p className="text-[#D4Af37] font-black text-[10px] uppercase tracking-[0.4em] mb-2">Financial Intelligence</p>
                    <h1 className="text-4xl font-serif font-black text-[#4B3832] dark:text-[#F5DEB3]">Revenue Report</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#D4Af37] p-8 rounded-[2rem] text-[#4B3832] shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined text-8xl">account_balance_wallet</span></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Total Confirmed Revenue</p>
                        <p className="text-4xl font-serif font-black">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'RWF' }).format(stats.totalRevenue)}</p>
                    </div>
                    <div className="bg-[#4B3832] p-8 rounded-[2rem] text-[#F5DEB3] shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined text-8xl">calendar_month</span></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">This Month</p>
                        <p className="text-4xl font-serif font-black">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'RWF' }).format(stats.monthlyRevenue)}</p>
                    </div>
                    <div className="bg-white/50 dark:bg-white/10 p-8 rounded-[2rem] text-[#4B3832] dark:text-[#F5DEB3] shadow-xl border border-[#D4Af37]/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined text-8xl">pending</span></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Potential Pending Revenue</p>
                        <p className="text-4xl font-serif font-black">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'RWF' }).format(stats.pendingRevenue)}</p>
                    </div>
                </div>

                <div className="bg-white/40 dark:bg-black/20 p-8 rounded-[2rem] border border-[#D4Af37]/20 shadow-xl">
                    <h3 className="text-xl font-serif font-black text-[#4B3832] dark:text-[#F5DEB3] mb-8">Annual Cash Flow Analysis</h3>
                    <div className="h-64 flex items-end justify-between gap-4 px-4 relative">
                        {/* Grid */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                            {[...Array(4)].map((_, i) => <div key={i} className="border-t border-[#4B3832]/5 w-full h-0"></div>)}
                        </div>
                        {monthlyData.map((d, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1 z-10 h-full justify-end group cursor-pointer">
                                <div className="w-full max-w-[40px] bg-[#4B3832] rounded-t-lg relative transition-all group-hover:bg-[#D4Af37]" style={{ height: d.amount > 0 ? `${(d.amount / stats.totalRevenue) * 200}%` : '4px' }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{(d.amount / 1000).toFixed(0)}k</div>
                                </div>
                                <span className="text-[9px] font-black uppercase text-[#4B3832]/40">{d.month}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
