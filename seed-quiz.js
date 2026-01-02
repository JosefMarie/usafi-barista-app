import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAioceQwLXQ90p6JXG8vHlhYlXfusjtQYc",
    authDomain: "usafi-barista-web.firebaseapp.com",
    projectId: "usafi-barista-web",
    storageBucket: "usafi-barista-web.firebasestorage.app",
    messagingSenderId: "448773870646",
    appId: "1:448773870646:web:9c48220e74180db2abf497"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const quizData = {
    passMark: 70,
    questions: [
        {
            type: "multiple_choice",
            question: "What is the primary ingredient of coffee?",
            options: ["Bean", "Fruit", "Leaf", "Nut"],
            correctOption: 0,
            duration: 15
        },
        {
            type: "true_false",
            question: "Water quality is essential for good espresso.",
            correctAnswer: true,
            duration: 10
        },
        {
            type: "fill_in",
            question: "The capital of Rwanda is ___.",
            correctAnswer: "Kigali",
            duration: 15
        },
        {
            type: "matching",
            question: "Match the following items",
            pairs: [
                { key: "Espresso", value: "Short & Strong" },
                { key: "Latte", value: "Milky & Smooth" }
            ],
            duration: 25
        }
    ]
};

async function seed() {
    try {
        const docRef = doc(db, 'courses', 'bean-to-brew', 'modules', 'module-1');
        await updateDoc(docRef, { quiz: quizData, status: 'published' });
        console.log("Quiz seeded successfully!");
        process.exit(0);
    } catch (e) {
        console.error("Error seeding quiz:", e);
        process.exit(1);
    }
}

seed();
