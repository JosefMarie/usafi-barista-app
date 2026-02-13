# Usafi Barista Training Center App

A comprehensive e-learning and management platform for barista training, designed to provide a seamless experience for students, instructors, and administrators.

## 🚀 Overview

The Usafi Barista App is a sophisticated web application that manages the entire lifecycle of barista training. From public course browsing and registration to specialized student portals, instructor management, and administrative oversight, the platform ensures efficient training delivery and professional development.

## ✨ Key Features

### 🌍 Public Portal
- **Course Discovery**: Browse and search through available barista training modules.
- **Registration**: Streamlined application process for new students.
- **Job Opportunities**: Integrated job board specifically for the barista industry.
- **CV Builder**: Professional CV generation tool for trained baristas.
- **Certificate Verification**: Public-facing tool to verify student certificates via QR codes.

### 🎓 Student Experience
- **Interactive Learning**: Access course materials, modules, and lessons.
- **Quizzes & Assessments**: Real-time knowledge testing with persistent authorization logic.
- **Progress Tracking**: Monitor learning journey and achievement milestones.
- **Student Profile**: Manage personal details, resume, and training history.
- **Multilingual Support**: Available in English, French, and Kinyarwanda.

### 👨‍🏫 Instructor & Staff Management
- **Course Management**: Edit and update curriculum content.
- **Student Monitoring**: Track student progress and performance.
- **Community Engagement**: Forum systems for interaction between students and staff.

### ⚙️ Administrative Oversight
- **System Dashboard**: High-level overview of training activities.
- **Report Generation**: Detailed analytics on student performance and course effectiveness.
- **User Management**: Control access levels for Admins, Instructors, and Students.
- **Business Portal**: Specialized registration and approval flow for business partners.

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/) with [Vite 7](https://vite.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend/Infrastructure**: [Firebase](https://firebase.google.com/)
  - **Firestore**: Real-time NoSQL database
  - **Firebase Functions**: Serverless backend logic
  - **Firebase Hosting**: High-performance web hosting
  - **Firebase Storage**: Secure file management (certificates, CVs, fliers)
- **Key Libraries**:
  - `react-router-dom`: Modern navigation and routing
  - `react-i18next`: Localization and internationalization
  - `@react-pdf/renderer`: Dynamic PDF generation
  - `framer-motion`: Smooth UI animations

## 💻 Local Development

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up Firebase**:
   Ensure you have the Firebase configuration set up in your environment or localized config files.
4. **Run the development server**:
   ```bash
   npm run dev
   ```
5. **Build for production**:
   ```bash
   npm run build
   ```

---
© 2026 Usafi Barista Training Center
