import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export function BusinessDashboard() {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approvalStatus, setApprovalStatus] = useState(null); // 'pending', 'approved', 'rejected'
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

    if (loading) return <div className="p-8">{t('common.loading')}</div>;

    if (approvalStatus === 'pending') {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-2xl shadow-xl max-w-md text-center border border-espresso/10 dark:border-white/10">
                    <span className="material-symbols-outlined text-6xl text-yellow-500 mb-4">hourglass_top</span>
                    <h1 className="font-serif text-2xl font-bold text-espresso dark:text-white mb-2">{t('business.approval_pending')}</h1>
                    <p className="text-espresso/70 dark:text-white/70 mb-6">
                        {t('business.approval_pending_desc')}
                    </p>
                    <button onClick={handleLogout} className="text-primary font-bold hover:underline">
                        {t('business.sign_out')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF5E8] dark:bg-background-dark flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between px-6 py-4 bg-[#F5DEB3] dark:bg-[#1c1916] border-b border-espresso/10 sticky top-0 z-50 shadow-sm">
                <Link to="/" className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-espresso dark:text-white text-2xl">domain_verification</span>
                    <span className="font-serif text-base font-black text-espresso dark:text-white uppercase tracking-wider">{t('business.business_class_title')}</span>
                </Link>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="size-10 flex items-center justify-center text-espresso dark:text-white rounded-xl bg-white/40 shadow-sm"
                >
                    <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                </button>
            </header>

            {/* Mobile Navigation Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-espresso/20 backdrop-blur-sm animate-fade-in" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="absolute right-0 top-0 bottom-0 w-64 bg-[#F5DEB3] dark:bg-[#1c1916] shadow-2xl p-6 flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-10 pb-4 border-b border-espresso/10">
                            <span className="font-serif font-black text-espresso dark:text-white uppercase tracking-widest text-xs">Navigation</span>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-espresso/40"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <nav className="flex-1 space-y-4">
                            <Link
                                to="/business/dashboard"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-espresso text-white shadow-lg"
                            >
                                <span className="material-symbols-outlined">dashboard</span>
                                {t('business.dashboard')}
                            </Link>
                            <Link
                                to="/business/profile"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-espresso/70 dark:text-white/70 hover:bg-white/40 transition-all"
                            >
                                <span className="material-symbols-outlined">person</span>
                                {t('business.my_profile')}
                            </Link>
                        </nav>
                        <div className="mt-auto pt-6 border-t border-espresso/10">
                            <button onClick={handleLogout} className="flex items-center gap-3 text-red-600 font-black px-4 py-3 bg-red-50 dark:bg-red-900/10 rounded-xl w-full text-xs uppercase tracking-widest">
                                <span className="material-symbols-outlined">logout</span>
                                {t('business.sign_out')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-[#F5DEB3] dark:bg-[#1c1916] border-r border-espresso/10 hidden md:flex flex-col fixed inset-y-0 z-20 shadow-xl">
                <div className="p-8 border-b border-espresso/10">
                    <Link to="/" className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-espresso text-4xl dark:text-white">domain_verification</span>
                        <span className="font-serif text-xl font-black text-espresso dark:text-white uppercase tracking-wider">{t('business.business_class_title')}</span>
                    </Link>
                </div>
                <nav className="flex-1 p-6 space-y-3">
                    <Link to="/business/dashboard" className="flex items-center gap-3 px-5 py-4 rounded-[1.25rem] bg-espresso text-white shadow-xl shadow-espresso/20 transform transition-all hover:scale-[1.02]">
                        <span className="material-symbols-outlined">dashboard</span>
                        {t('business.dashboard')}
                    </Link>
                    <Link to="/business/profile" className="flex items-center gap-3 px-5 py-4 rounded-[1.25rem] text-espresso/70 dark:text-white/70 hover:bg-white/40 dark:hover:bg-white/5 transition-all hover:translate-x-1">
                        <span className="material-symbols-outlined">person</span>
                        {t('business.my_profile')}
                    </Link>
                </nav>
                <div className="p-6 border-t border-espresso/10">
                    <button onClick={handleLogout} className="flex items-center gap-3 text-espresso font-black px-5 py-3 hover:bg-white/20 rounded-[1.25rem] w-full transition-all uppercase tracking-widest text-[10px] bg-white/10">
                        <span className="material-symbols-outlined text-lg">logout</span>
                        {t('business.sign_out')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-6 md:p-12 min-h-screen">
                <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 md:mb-16 gap-4">
                    <div className="space-y-2">
                        <h1 className="font-serif text-2xl md:text-5xl font-black text-espresso dark:text-white leading-tight">
                            {t('business.welcome_student', { name: user?.displayName || 'Student' })}
                        </h1>
                        <p className="text-espresso/50 dark:text-white/50 text-sm md:text-xl font-medium">{t('business.exclusive_content')}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10">
                    {courses.map(course => (
                        <Link
                            key={course.id}
                            to={`/business/courses/${course.id}`}
                            className="bg-white/60 dark:bg-[#1c1916] rounded-[2rem] md:rounded-[2.5rem] border border-espresso/5 overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 group transform hover:-translate-y-2 relative"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-espresso/10 group-hover:bg-espresso transition-colors"></div>
                            <div className="h-48 md:h-64 bg-espresso/5 dark:bg-white/5 relative overflow-hidden">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-6xl md:text-8xl text-espresso/5 dark:text-white/5 group-hover:text-espresso/20 transition-colors">menu_book</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-espresso/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="bg-white text-espresso px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transform translate-y-4 group-hover:translate-y-0 transition-transform">{t('business.view_course')}</span>
                                </div>
                            </div>
                            <div className="p-6 md:p-10">
                                <h3 className="font-serif text-xl md:text-2xl font-black text-espresso dark:text-white mb-2 md:mb-4 leading-tight group-hover:text-primary transition-colors">{course.title}</h3>
                                <p className="text-xs md:text-sm text-espresso/60 dark:text-white/60 line-clamp-2 mb-6 md:mb-8 font-medium leading-relaxed">{course.description}</p>
                                <span className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-espresso/5 dark:bg-white/5 text-espresso dark:text-white font-black text-[9px] md:text-[10px] uppercase tracking-widest group-hover:bg-espresso group-hover:text-white transition-all shadow-sm">
                                    {t('business.start_learning')} <span className="material-symbols-outlined text-sm md:text-lg">arrow_right_alt</span>
                                </span>
                            </div>
                        </Link>
                    ))}

                    {courses.length === 0 && (
                        <div className="col-span-full py-20 md:py-32 text-center bg-white/40 dark:bg-white/5 rounded-[2.5rem] md:rounded-[3.5rem] border-2 border-dashed border-espresso/10 shadow-inner">
                            <span className="material-symbols-outlined text-7xl md:text-9xl text-espresso/10 mb-6 block">school</span>
                            <p className="text-espresso/40 dark:text-white/40 font-serif italic text-lg md:text-2xl">{t('business.no_courses')}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
