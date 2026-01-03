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
            <aside className="w-64 bg-[#F5DEB3] dark:bg-[#1c1916] border-r border-espresso/10 hidden md:flex flex-col fixed inset-y-0 relative z-20 shadow-xl">
                <div className="p-6 border-b border-espresso/10">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-espresso text-3xl dark:text-white">domain_verification</span>
                        <span className="font-serif text-lg font-bold text-espresso dark:text-white">Business Class</span>
                    </Link>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/business/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-[1rem] bg-espresso text-white shadow-lg shadow-espresso/20 transform transition-transform hover:scale-[1.02]">
                        <span className="material-symbols-outlined">dashboard</span>
                        Dashboard
                    </Link>
                    <Link to="/business/profile" className="flex items-center gap-3 px-4 py-3 rounded-[1rem] text-espresso/70 dark:text-white/70 hover:bg-white/40 dark:hover:bg-white/5 transition-all hover:translate-x-1">
                        <span className="material-symbols-outlined">person</span>
                        My Profile
                    </Link>
                </nav>
                <div className="p-4 border-t border-espresso/10">
                    <button onClick={handleLogout} className="flex items-center gap-2 text-espresso font-bold px-4 py-2 hover:bg-white/20 rounded-[1rem] w-full transition-colors uppercase tracking-widest text-xs">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.map(course => (
                        <Link
                            key={course.id}
                            to={`/business/courses/${course.id}`}
                            className="bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2rem] border border-espresso/10 overflow-hidden hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-2 relative"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                            <div className="h-56 bg-espresso/5 dark:bg-white/5 relative overflow-hidden">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-7xl text-espresso/10 dark:text-white/10 group-hover:text-espresso/20 transition-colors">menu_book</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-8">
                                <h3 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-3 leading-tight">{course.title}</h3>
                                <p className="text-sm text-espresso/70 dark:text-white/70 line-clamp-2 mb-6 font-medium leading-relaxed">{course.description}</p>
                                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/40 dark:bg-white/5 text-espresso font-black text-[10px] uppercase tracking-widest group-hover:bg-espresso group-hover:text-white transition-all shadow-sm">
                                    Start Learning <span className="material-symbols-outlined text-base">arrow_forward</span>
                                </span>
                            </div>
                        </Link>
                    ))}

                    {courses.length === 0 && (
                        <div className="col-span-full py-24 text-center bg-[#F5DEB3]/50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-espresso/10">
                            <span className="material-symbols-outlined text-6xl text-espresso/20 mb-4 block">school</span>
                            <p className="text-espresso/50 dark:text-white/50 font-medium text-lg">No courses available at the moment.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
