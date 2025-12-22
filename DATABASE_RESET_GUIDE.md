# How to Reset Your Database (Start Fresh)

Since we are using secure Cloud Authentication, "Delete All" requires access to the **Firebase Console**. I cannot delete your users' passwords/accounts from the code for security reasons.

### Step 1: Delete Authentication Records
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Open your project **usafi-barista-web**.
3.  Click on **Authentication** in the left sidebar.
4.  In the **Users** tab, check the box at the top to **Select All Users**.
5.  Click **Delete**. 
    *   *This ensures you can re-register with the same email addresses.*

### Step 2: Delete Firestore Profiles
1.  Click on **Firestore Database** in the left sidebar.
2.  In the **Data** tab, look for the `users` collection.
3.  Click the **3-dots icon (⋮)** next to `users`.
4.  Select **Delete collection**.
5.  Type `users` to confirm and delete.

### Step 3: Refresh App
1.  Go back to your app (`localhost:5173`).
2.  Refresh the page.
3.  You can now **Enroll** as a fresh Student or **Register** as a fresh Admin/Instructor using the Staff Portal.
