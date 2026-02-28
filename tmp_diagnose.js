import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function diagnose() {
    try {
        console.log('--- DIAGNOSIS START ---');

        // 1. Check Courses
        const coursesSnap = await getDocs(collection(db, 'courses'));
        console.log(`Total Courses: ${coursesSnap.size}`);
        coursesSnap.forEach(doc => {
            console.log(`Course Found: ID=${doc.id}, Title=${doc.data().title}`);
        });

        // 2. Check specific user if possible (requires UID, but we can search by name from screenshot)
        const nameToSearch = "KAISI IRIRASHE";
        const userQuery = query(collection(db, 'users'), where('name', '==', nameToSearch));
        const userSnap = await getDocs(userQuery);

        if (userSnap.empty) {
            console.log(`User "${nameToSearch}" not found in Firestore.`);
            // Try searching by fullName or email if name fails
            const userQuery2 = query(collection(db, 'users'), where('fullName', '==', nameToSearch));
            const userSnap2 = await getDocs(userQuery2);
            if (!userSnap2.empty) {
                userSnap2.forEach(doc => {
                    console.log(`User Found (fullName): ID=${doc.id}, Role=${doc.data().role}, EnrolledCourses:`, doc.data().enrolledCourses);
                });
            } else {
                console.log("Searching all users to find a match...");
                const allUsers = await getDocs(collection(db, 'users'));
                allUsers.forEach(doc => {
                    const data = doc.data();
                    if ((data.name || data.fullName || "").toUpperCase().includes(nameToSearch.toUpperCase())) {
                        console.log(`Potential Match: ID=${doc.id}, Name=${data.name || data.fullName}, Role=${data.role}, Enrolled:`, data.enrolledCourses);
                    }
                });
            }
        } else {
            userSnap.forEach(doc => {
                console.log(`User Found: ID=${doc.id}, Role=${doc.data().role}, EnrolledCourses:`, doc.data().enrolledCourses);
            });
        }

        console.log('--- DIAGNOSIS END ---');
    } catch (e) {
        console.error('Diagnosis error:', e);
    }
}

diagnose();
