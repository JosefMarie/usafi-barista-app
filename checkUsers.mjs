import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    try {
        console.log("Checking users...");
        let foundUsers = 0;
        const snap = await getDocs(collection(db, 'users'));
        snap.forEach(d => {
            const data = d.data();
            if (data.email && (data.email.includes('lotte') || data.email.includes('thibaut') || data.email.includes('fransis'))) {
                console.log('User found:', d.id, data.email, data.role);
                foundUsers++;
            }
        });
        if (foundUsers === 0) console.log("No matching users found in 'users' collection.");

        console.log("Checking bookings...");
        let foundBookings = 0;
        const bookings = await getDocs(collection(db, 'weekend_bookings'));
        bookings.forEach(d => {
            const data = d.data();
            if (data.email && (data.email.includes('lotte') || data.email.includes('thibaut') || data.email.includes('fransis'))) {
                console.log('Booking found:', d.id, data.email, data.userId);
                foundBookings++;
            }
        });
        if (foundBookings === 0) console.log("No matching bookings found.");
    } catch (err) {
        console.error("Error:", err);
    }
    process.exit(0);
}

run();
