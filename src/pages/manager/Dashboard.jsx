import React, { useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTranslation } from 'react-i18next';

export function ManagerDashboard() {
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        totalUsers: 0,
        subscribers: 0,
        students: 0,
        instructors: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Get counts for each role
                // Note: getCountFromServer is cheaper than getting all docs
                const usersColl = collection(db, 'users');

                const studentQuery = query(usersColl, where('role', '==', 'student'));
                const studentSnapshot = await getCountFromServer(studentQuery);

                const instructorQuery = query(usersColl, where('role', '==', 'instructor'));
                const instructorSnapshot = await getCountFromServer(instructorQuery);

                const allUsersSnapshot = await getCountFromServer(usersColl);

                // Subscribers count (we'll implement this collection next)
                // For now assuming a 'subscribers' collection exists or will exist
                let subscribersCount = 0;
                try {
                    const subColl = collection(db, 'subscribers');
                    const subSnapshot = await getCountFromServer(subColl);
                    subscribersCount = subSnapshot.data().count;
                } catch (e) {
                    // Collection might not exist yet
                    console.log("Subscribers collection not found yet");
                }

                setStats({
                    totalUsers: allUsersSnapshot.data().count,
                    subscribers: subscribersCount,
                    students: studentSnapshot.data().count,
                    instructors: instructorSnapshot.data().count
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 px-4 md:px-0 py-4 md:py-0">
            <header className="mb-6 md:mb-8 relative pl-4 md:pl-0">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 -ml-4 md:hidden"></div>
                <h1 className="text-2xl md:text-3xl font-black font-serif text-espresso dark:text-white leading-none">
                    {t('manager.dashboard.marketing_overview')}
                </h1>
                <p className="text-xs md:text-sm text-espresso/60 dark:text-white/60 mt-2 leading-relaxed">
                    {t('manager.dashboard.track_growth')}
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title={t('manager.dashboard.total_users')}
                    value={stats.totalUsers}
                    icon="group"
                    color="bg-blue-500"
                />
                <StatCard
                    title={t('manager.dashboard.students')}
                    value={stats.students}
                    icon="school"
                    color="bg-primary" // orange
                />
                <StatCard
                    title={t('manager.dashboard.instructors')}
                    value={stats.instructors}
                    icon="person_apron"
                    color="bg-purple-500"
                />
                <StatCard
                    title={t('manager.dashboard.newsletter_subs')}
                    value={stats.subscribers}
                    icon="mail"
                    color="bg-green-500"
                />
            </div>

            {/* Placeholder for future charts/graphs */}
            <div className="bg-[#F5DEB3] dark:bg-[#1c1916] p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-espresso/10 h-56 md:h-72 flex items-center justify-center text-espresso/40 dark:text-white/40 shadow-xl relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                <p className="font-black uppercase tracking-[0.2em] text-xs md:text-sm">{t('manager.dashboard.engagement_chart_soon')}</p>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }) {
    return (
        <div className="bg-[#F5DEB3] dark:bg-[#1c1916] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-espresso/10 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all hover:-translate-y-1">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
            <div className="flex items-center justify-between relative z-10">
                <div>
                    <p className="text-[10px] font-black text-espresso/50 dark:text-white/50 uppercase tracking-[0.2em] mb-2">
                        {title}
                    </p>
                    <h3 className="text-3xl md:text-4xl font-serif font-bold text-espresso dark:text-white leading-none">
                        {value.toLocaleString()}
                    </h3>
                </div>
                <div className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-espresso flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
            </div>
        </div>
    );
}
