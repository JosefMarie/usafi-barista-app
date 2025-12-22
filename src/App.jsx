import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { StudentLayout } from './components/layout/StudentLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { InstructorLayout } from './components/layout/InstructorLayout'; // New import
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { Courses } from './pages/public/Courses';
import { Enrollment } from './pages/public/Enrollment';
import { ThankYou } from './pages/public/ThankYou';
import { CareerSupport } from './pages/public/CareerSupport';
import { Equipment } from './pages/public/Equipment';
import { Testimonials } from './pages/public/Testimonials';
import { Gallery } from './pages/public/Gallery';
import { Blog } from './pages/public/Blog';
import { Inclusion } from './pages/public/Inclusion';
import { Contact } from './pages/public/Contact';
import { Certificates } from './pages/public/Certificates';

// Auth Pages
import { Login } from './pages/auth/Login';

// Student Pages
import { Dashboard as StudentDashboard } from './pages/student/Dashboard';
import { MyCourses } from './pages/student/MyCourses';
import { Profile } from './pages/student/Profile';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { Instructors } from './pages/admin/Instructors';
import { Students } from './pages/admin/Students';
import { StudentDetails } from './pages/admin/StudentDetails';
import { Categories } from './pages/admin/Categories';
import { Quizzes } from './pages/admin/Quizzes';
import { Announcements } from './pages/admin/Announcements';
import { Testimonials as AdminTestimonials } from './pages/admin/Testimonials';
import { ActivityLog } from './pages/admin/ActivityLog';
import { Notifications } from './pages/admin/Notifications';
import { SetupAdmin } from './pages/admin/SetupAdmin';
import { ForumList } from './pages/forum/ForumList';
import { CreatePost } from './pages/forum/CreatePost';
import { PostDetails } from './pages/forum/PostDetails';

import { AdminCourses } from './pages/admin/AdminCourses';
import { ManageCourse } from './pages/admin/ManageCourse';
import { ManageModule } from './pages/admin/ManageModule';
import { ManageLesson } from './pages/admin/ManageLesson';
import { StudentChatList } from './pages/student/StudentChatList';
import { ChatWindow } from './pages/student/ChatWindow';
import { StudentNotifications } from './pages/student/StudentNotifications';
import { StudentCourseView } from './pages/student/StudentCourseView';
import { ELearning } from './pages/student/ELearning';

// Instructor Pages (placeholders)
import { InstructorDashboard } from './pages/instructor/Dashboard';
import { InstructorCourses } from './pages/instructor/Courses';
import { InstructorStudents } from './pages/instructor/Students';
import { InstructorChat } from './pages/instructor/Chat';
import { InstructorSchedule } from './pages/instructor/Schedule';
import { InstructorShareVideo } from './pages/instructor/ShareVideo';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="courses" element={<Courses />} />
            <Route path="career" element={<CareerSupport />} />
            <Route path="equipment" element={<Equipment />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="blog" element={<Blog />} />
            <Route path="inclusion" element={<Inclusion />} />
            <Route path="contact" element={<Contact />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="enroll" element={<Enrollment />} />
            <Route path="thank-you" element={<ThankYou />} />
            <Route path="login" element={<Login />} />
            <Route path="setup-admin" element={<SetupAdmin />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="courses" element={<MyCourses />} />
            <Route path="e-learning" element={<ELearning />} />
            <Route path="profile" element={<Profile />} />
            <Route path="forum" element={<ForumList />} />
            <Route path="forum/create" element={<CreatePost />} />
            <Route path="forum/:id" element={<PostDetails />} />
            <Route path="chat" element={<StudentChatList />} />
            <Route path="chat/:recipientId" element={<ChatWindow />} />
            <Route path="notifications" element={<StudentNotifications />} />
            <Route path="courses/:courseId" element={<StudentCourseView />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="courses/:courseId" element={<ManageCourse />} />
            <Route path="courses/:courseId/modules/:moduleId" element={<ManageModule />} />
            <Route path="courses/:courseId/lessons/:lessonId" element={<ManageLesson />} />
            <Route path="forum" element={<ForumList />} />
            <Route path="forum/create" element={<CreatePost />} />
            <Route path="forum/:id" element={<PostDetails />} />
            <Route path="instructors" element={<Instructors />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentDetails />} />
            <Route path="categories" element={<Categories />} />
            <Route path="quizzes" element={<Quizzes />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
            <Route path="activity-log" element={<ActivityLog />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* Instructor Routes */}
          <Route path="/instructor" element={<InstructorLayout />}>
            <Route index element={<Navigate to="/instructor/dashboard" replace />} />
            <Route path="dashboard" element={<InstructorDashboard />} />
            <Route path="courses" element={<InstructorCourses />} />
            <Route path="students" element={<InstructorStudents />} />
            <Route path="chat" element={<InstructorChat />} />
            <Route path="schedule" element={<InstructorSchedule />} />
            <Route path="share-video" element={<InstructorShareVideo />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
