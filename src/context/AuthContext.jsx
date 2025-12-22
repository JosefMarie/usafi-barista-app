import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("Auth Provider: Initializing...");

        let unsubscribe;
        try {
            unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                console.log("Auth Provider: State changed", currentUser ? "User Logged In" : "User Logged Out");
                if (currentUser) {
                    try {
                        // Fetch user data from Firestore with a timeout
                        const { doc, getDoc } = await import('firebase/firestore');
                        const { db } = await import('../lib/firebase');

                        const fetchUserData = async () => {
                            const userDocRef = doc(db, 'users', currentUser.uid);
                            return await getDoc(userDocRef);
                        };

                        // Create a timeout promise that rejects after 5 seconds
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error("Firestore fetch timed out")), 5000)
                        );

                        // Race the fetch against the timeout
                        const userDoc = await Promise.race([fetchUserData(), timeoutPromise]);

                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            setUser({
                                ...currentUser,
                                ...userData,
                                id: currentUser.uid,
                                role: userData.role || 'student'
                            });
                        } else {
                            setUser({
                                ...currentUser,
                                id: currentUser.uid,
                                role: 'student',
                                status: 'pending'
                            });
                        }
                    } catch (error) {
                        console.error("Auth Provider: Error fetching user data (or timeout):", error);
                        // Fallback to basic auth user so app loads even if DB fails
                        setUser({
                            ...currentUser,
                            id: currentUser.uid,
                            role: 'student', // Fallback role
                            status: 'unknown'
                        });
                    }
                } else {
                    setUser(null);
                }
                setLoading(false);
            }, (error) => {
                console.error("Auth Provider: Firebase Auth Error", error);
                setLoading(false);
            });
        } catch (err) {
            console.error("Auth Provider: Initialization Error", err);
            setLoading(false);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null); // Explicitly clear state to trigger re-renders immediately
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const value = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="h-screen w-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-espresso dark:text-white">
                    <div className="flex flex-col items-center gap-4">
                        <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></span>
                        <p>Initializing App...</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
