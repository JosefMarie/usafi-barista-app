import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAioceQwLXQ90p6JXG8vHlhYlXfusjtQYc",
    authDomain: "usafi-barista-web.firebaseapp.com",
    projectId: "usafi-barista-web",
    storageBucket: "usafi-barista-web.firebasestorage.app",
    messagingSenderId: "448773870646",
    appId: "1:448773870646:web:9c48220e74180db2abf497",
    measurementId: "G-14KWZYZS13"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BUSINESS_COURSE_ID = 'business-101'; // Example ID

async function seedBusinessQuiz() {
    console.log("Seeding Business Quiz...");

    // 1. Create Course if not exists
    await setDoc(doc(db, 'business_courses', BUSINESS_COURSE_ID), {
        title: "Business 101: Cafe Management",
        description: "Learn how to manage your cafe.",
        status: "published",
        price: 50000
    }, { merge: true });

    // 2. Create Chapter 1 with Quiz
    const chapter1Ref = doc(collection(db, 'business_courses', BUSINESS_COURSE_ID, 'chapters'));
    // We want a specific ID or just let it auto-gen? 
    // For verification, it's easier if we know the ID or just rely on 'order'.
    // Let's force an ID for Chapter 1 to be safe, or just use auto-id and rely on the app loading it.
    // The app loads by order, so auto-id is fine.

    // Actually, to avoid duplicates on re-runs, let's use fixed IDs for the seed.
    await setDoc(doc(db, 'business_courses', BUSINESS_COURSE_ID, 'chapters', 'chapter-1'), {
        title: "Chapter 1: Financial Basics",
        order: 1,
        content: "<p>Welcome to financial basics. Understanding P&L is crucial.</p>",
        status: "published",
        quiz: {
            enabled: true,
            passMark: 50,
            questions: [
                {
                    type: "true_false",
                    question: "Profit = Revenue - Expenses?",
                    correctAnswer: true,
                    duration: 30
                },
                {
                    type: "multiple_choice",
                    question: "What is ROI?",
                    options: ["Return on Investment", "Rate of Interest", "Risk of Inflation", "None"],
                    correctOption: 0,
                    duration: 30
                }
            ]
        }
    });

    // 3. Create Chapter 2 (Locked initially)
    await setDoc(doc(db, 'business_courses', BUSINESS_COURSE_ID, 'chapters', 'chapter-2'), {
        title: "Chapter 2: Marketing Strategies",
        order: 2,
        content: "<p>Marketing is key to growth.</p>",
        status: "published",
        quiz: { enabled: false, passMark: 70, questions: [] }
    });

    console.log("Seeding Complete. Course ID:", BUSINESS_COURSE_ID);
}

seedBusinessQuiz().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
