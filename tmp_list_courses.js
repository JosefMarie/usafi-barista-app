import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function listCourses() {
    try {
        const querySnapshot = await getDocs(collection(db, 'courses'));
        console.log('--- Courses Collection ---');
        querySnapshot.forEach((doc) => {
            console.log(`ID: ${doc.id}, Title: ${doc.data().title}`);
        });
        if (querySnapshot.empty) {
            console.log('Courses collection is empty!');
        }
        console.log('-------------------------');
    } catch (e) {
        console.error('Error listing courses:', e);
    }
}

listCourses();
