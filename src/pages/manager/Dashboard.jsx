import React, { useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function ManagerDashboard() {
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
        <div className="max-w-7xl mx-auto space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-espresso dark:text-white font-serif">
                    Marketing Overview
                </h1>
                <p className="text-espresso/60 dark:text-white/60">
                    Track user growth and engagement
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon="group"
                    color="bg-blue-500"
                />
                <StatCard
                    title="Students"
                    value={stats.students}
                    icon="school"
                    color="bg-primary" // orange
                />
                <StatCard
                    title="Instructors"
                    value={stats.instructors}
                    icon="person_apron"
                    color="bg-purple-500"
                />
                <StatCard
                    title="Newsletter Subs"
                    value={stats.subscribers}
                    icon="mail"
                    color="bg-green-500"
                />
            </div>

            {/* Placeholder for future charts/graphs */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl border border-black/5 dark:border-white/5 h-64 flex items-center justify-center text-espresso/40 dark:text-white/40">
                <p>Engagement Chart Coming Soon</p>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }) {
    return (
        <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-espresso/60 dark:text-white/60 mb-1">
                        {title}
                    </p>
                    <h3 className="text-2xl font-bold text-espresso dark:text-white">
                        {value.toLocaleString()}
                    </h3>
                </div>
                <div className={`h-12 w-12 rounded-full ${color} flex items-center justify-center text-white`}>
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
            </div>
        </div>
    );
}
