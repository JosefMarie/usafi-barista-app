import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAioceQwLXQ90p6JXG8vHlhYlXfusjtQYc",
    authDomain: "usafi-barista-web.firebaseapp.com",
    projectId: "usafi-barista-web",
    storageBucket: "usafi-barista-web.firebasestorage.app",
    messagingSenderId: "448773870646",
    appId: "1:448773870646:web:9c48220e74180db2abf497",
    measurementId: "G-14KWZYZS13"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
