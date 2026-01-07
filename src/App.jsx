import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { StudentLayout } from './components/layout/StudentLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { InstructorLayout } from './components/layout/InstructorLayout';
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { Courses } from './pages/public/Courses';
import { Enrollment } from './pages/public/Enrollment';
import { PrivacyPolicy } from './pages/public/PrivacyPolicy';
import { ThankYou } from './pages/public/ThankYou';
import { CareerSupport } from './pages/public/CareerSupport';
import { Equipment } from './pages/public/Equipment';
import { Testimonials } from './pages/public/Testimonials';
import { Gallery } from './pages/public/Gallery';
import { Blog } from './pages/public/Blog';
import { Inclusion } from './pages/public/Inclusion';
import { Contact } from './pages/public/Contact';
import { Certificates as PublicCertificates } from './pages/public/Certificates'; // Renamed
import { Opportunities } from './pages/public/Opportunities';
import { PostOpportunity } from './pages/public/PostOpportunity';
import { SeekerRegister } from './pages/public/SeekerRegister';
import { SeekerLogin } from './pages/auth/SeekerLogin';
import { BusinessRegister } from './pages/business/BusinessRegister';
import { BusinessLogin } from './pages/business/BusinessLogin';
import { BusinessDashboard } from './pages/business/BusinessDashboard';
import { BusinessProfile } from './pages/business/BusinessProfile';
import { BusinessCourseView } from './pages/business/BusinessCourseView';
import { PaymentPending } from './pages/seeker/PaymentPending';
import { SeekerDashboard } from './pages/seeker/SeekerDashboard';
import { SeekerProfile } from './pages/seeker/SeekerProfile';

// Auth Pages
import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { PrivacySettings } from './pages/common/PrivacySettings';

// Student Pages
import { Dashboard as StudentDashboard } from './pages/student/Dashboard';
import { MyCourses } from './pages/student/MyCourses';
import { Profile as StudentProfile } from './pages/student/Profile';
import { Profile as CommonProfile } from './pages/common/Profile';

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



import { AdminOpportunities } from './pages/admin/AdminOpportunities';
import { AdminSeekers } from './pages/admin/AdminSeekers';
import { AdminCourses } from './pages/admin/AdminCourses';
import { ManageCourse } from './pages/admin/ManageCourse';
import { ManageModule } from './pages/admin/ManageModule';
import { ManageLesson } from './pages/admin/ManageLesson';
import { StudentChatList } from './pages/student/StudentChatList';
import { ChatWindow } from './pages/student/ChatWindow';
import { StudentNotifications } from './pages/student/StudentNotifications';
import { StudentCourseView } from './pages/student/StudentCourseView';
import { StudentOpportunities } from './pages/student/StudentOpportunities';
import { CVBuilder } from './pages/student/CVBuilder';
import { Certificates as StudentCertificates } from './pages/student/Certificates'; // Renamed

import { ELearning } from './pages/student/ELearning';
import { AdminBusinessUsers } from './pages/admin/business/AdminBusinessUsers';
import { AdminBusinessCourses } from './pages/admin/business/AdminBusinessCourses';
import { ManageBusinessCourse } from './pages/admin/business/ManageBusinessCourse';

// Instructor Pages (placeholders)
import { InstructorDashboard } from './pages/instructor/Dashboard';
import { InstructorCourses } from './pages/instructor/Courses';
import { InstructorStudents } from './pages/instructor/Students';
import { InstructorChat } from './pages/instructor/Chat';
import { InstructorSchedule } from './pages/instructor/Schedule';
import { InstructorShareVideo } from './pages/instructor/ShareVideo';

// Manager Pages
import { ManagerLayout } from './components/layout/ManagerLayout';
import { ManagerDashboard } from './pages/manager/Dashboard';
import { ManagerContacts } from './pages/manager/Contacts';
import { ManagerSubscribers } from './pages/manager/Subscribers';
import { ManagerMessages } from './pages/manager/Messages';

// CEO Pages
import { CEOLayout } from './components/layout/CEOLayout';
import { CEODashboard } from './pages/ceo/CEODashboard';
import { CEOStaff } from './pages/ceo/CEOStaff';
import { CEORevenue } from './pages/ceo/CEORevenue';
import { CEOSettings } from './pages/ceo/CEOSettings';

// Setup utility
import { SetupCEO } from './pages/public/SetupCEO';

function App() {
  return (
    <ThemeProvider>
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
              <Route path="certificates" element={<PublicCertificates />} />
              <Route path="enroll" element={<Enrollment />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="thank-you" element={<ThankYou />} />
              <Route path="login" element={<Login />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="setup-admin" element={<SetupAdmin />} />
              <Route path="setup-ceo" element={<SetupCEO />} />
              <Route path="opportunities" element={<Opportunities />} />
              <Route path="opportunities/post" element={<PostOpportunity />} />
              <Route path="opportunities/register" element={<SeekerRegister />} />
              <Route path="seeker/login" element={<SeekerLogin />} />
              <Route path="business/register" element={<BusinessRegister />} />
              <Route path="business/login" element={<BusinessLogin />} />
            </Route>

            {/* Seeker Routes */}
            <Route path="/seeker">
              <Route index element={<Navigate to="/seeker/dashboard" replace />} />
              <Route path="payment-pending" element={<PaymentPending />} />
              <Route path="dashboard" element={<SeekerDashboard />} />
              <Route path="profile" element={<SeekerProfile />} />
              <Route path="privacy-settings" element={<PrivacySettings />} />
            </Route>

            {/* Student Routes */}
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="opportunities" element={<StudentOpportunities />} />
              <Route path="courses" element={<MyCourses />} />
              <Route path="e-learning" element={<ELearning />} />
              <Route path="cv-builder" element={<CVBuilder />} />
              <Route path="certificates" element={<StudentCertificates />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="privacy-settings" element={<PrivacySettings />} />
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
              <Route path="opportunities" element={<AdminOpportunities />} />
              <Route path="seekers" element={<AdminSeekers />} />
              <Route path="business/users" element={<AdminBusinessUsers />} />
              <Route path="business/courses" element={<AdminBusinessCourses />} />
              <Route path="business/courses/:courseId" element={<ManageBusinessCourse />} />
              <Route path="profile" element={<CommonProfile />} />
              <Route path="privacy-settings" element={<PrivacySettings />} />
            </Route>

            {/* Instructor Routes */}
            <Route path="/instructor" element={<InstructorLayout />}>
              <Route index element={<Navigate to="/instructor/dashboard" replace />} />
              <Route path="dashboard" element={<InstructorDashboard />} />
              <Route path="courses" element={<InstructorCourses />} />
              <Route path="students" element={<InstructorStudents />} />
              <Route path="chat" element={<InstructorChat />} />
              <Route path="chat/:recipientId" element={<ChatWindow />} />
              <Route path="schedule" element={<InstructorSchedule />} />
              <Route path="share-video" element={<InstructorShareVideo />} />
              <Route path="forum" element={<ForumList />} />
              <Route path="forum/create" element={<CreatePost />} />
              <Route path="forum/:id" element={<PostDetails />} />
              <Route path="profile" element={<CommonProfile />} />
              <Route path="privacy-settings" element={<PrivacySettings />} />
            </Route>

            {/* Manager Routes */}
            <Route path="/manager" element={<ManagerLayout />}>
              <Route index element={<Navigate to="/manager/dashboard" replace />} />
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="contacts" element={<ManagerContacts />} />
              <Route path="subscribers" element={<ManagerSubscribers />} />
              <Route path="messages" element={<ManagerMessages />} />
              <Route path="profile" element={<CommonProfile />} />
              <Route path="privacy-settings" element={<PrivacySettings />} />
            </Route>

            {/* CEO Route */}
            <Route path="/ceo" element={<CEOLayout />}>
              <Route index element={<Navigate to="/ceo/dashboard" replace />} />
              <Route path="dashboard" element={<CEODashboard />} />
              <Route path="staff" element={<CEOStaff />} />
              <Route path="revenue" element={<CEORevenue />} />
              <Route path="settings" element={<CEOSettings />} />
              <Route path="profile" element={<CommonProfile />} />
            </Route>

            {/* Business Student Routes */}
            <Route path="/business">
              <Route path="dashboard" element={<BusinessDashboard />} />
              <Route path="profile" element={<BusinessProfile />} />
              <Route path="courses/:courseId" element={<BusinessCourseView />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
