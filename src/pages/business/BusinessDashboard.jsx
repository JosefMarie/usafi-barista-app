import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export function BusinessDashboard() {
    const { user, logout } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approvalStatus, setApprovalStatus] = useState(null); // 'pending', 'approved', 'rejected'
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        // Verify Approval Status specifically
        const checkApproval = async () => {
            const userRef = doc(db, 'users', user.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
                const userData = snap.data();
                if (userData.approved) {
                    setApprovalStatus('approved');
                    fetchCourses();
                } else {
                    setApprovalStatus('pending');
                    setLoading(false);
                }
            }
        };

        checkApproval();
    }, [user]);

    const fetchCourses = () => {
        // Fetch published courses sorted by order or date
        const q = query(
            collection(db, 'business_courses'),
            where('status', '==', 'published'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedCourses = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCourses(fetchedCourses);
            setLoading(false);
        });

        return () => unsubscribe();
    };

    const handleLogout = async () => {
        await logout();
        navigate('/business/login');
    };

    if (loading) return <div className="p-8">Loading...</div>;

    if (approvalStatus === 'pending') {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-2xl shadow-xl max-w-md text-center border border-espresso/10 dark:border-white/10">
                    <span className="material-symbols-outlined text-6xl text-yellow-500 mb-4">hourglass_top</span>
                    <h1 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-2">Approval Pending</h1>
                    <p className="text-espresso/70 dark:text-white/70 mb-6">
                        Your account is currently under review by the administrator. You will gain access to the business courses once approved.
                    </p>
                    <button onClick={handleLogout} className="text-primary font-bold hover:underline">
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
            {/* Simple Sidebar */}
            <aside className="w-64 bg-white dark:bg-[#1e1e1e] border-r border-black/5 hidden md:flex flex-col fixed inset-y-0">
                <div className="p-6 border-b border-black/5">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-3xl">domain_verification</span>
                        <span className="font-serif text-lg font-bold text-espresso dark:text-white">Business Class</span>
                    </Link>
                </div>
                <nav className="flex-1 p-4">
                    <Link to="/business/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined">dashboard</span>
                        Dashboard
                    </Link>
                </nav>
                <div className="p-4 border-t border-black/5">
                    <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 font-bold px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg w-full">
                        <span className="material-symbols-outlined">logout</span>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="font-serif text-3xl font-bold text-espresso dark:text-white">Welcome, {user?.displayName || 'Student'}</h1>
                        <p className="text-espresso/60 dark:text-white/60">Access your exclusive business content.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <Link
                            key={course.id}
                            to={`/business/courses/${course.id}`}
                            className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden hover:shadow-xl transition-all group"
                        >
                            <div className="h-48 bg-gray-100 dark:bg-white/5 relative overflow-hidden">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-white/20">menu_book</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-6">
                                <h3 className="font-serif text-xl font-bold text-espresso dark:text-white mb-2">{course.title}</h3>
                                <p className="text-sm text-espresso/70 dark:text-white/70 line-clamp-2 mb-4">{course.description}</p>
                                <span className="text-primary font-bold text-sm flex items-center group-hover:gap-2 transition-all">
                                    Start Learning <span className="material-symbols-outlined text-lg ml-1">arrow_forward</span>
                                </span>
                            </div>
                        </Link>
                    ))}

                    {courses.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <p className="text-espresso/50 dark:text-white/50">No courses available at the moment.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
