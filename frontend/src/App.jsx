import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import Login from './pages/auth/Login';
import StudentSignup from './pages/auth/StudentSignup';
import FacultySignup from './pages/auth/FacultySignup';

import StudentDashboard from './pages/student/Dashboard';
import StudentEvents from './pages/student/Events';
import StudentOpportunities from './pages/student/Opportunities';
import StudentCertifications from './pages/student/Certifications';
import StudentVault from './pages/student/Vault';
import AiHub from './pages/student/ai/Hub';
import AiResumeAnalyzer from './pages/student/ai/ResumeAnalyzer';
import AiChat from './pages/student/ai/Chat';
import AiInterview from './pages/student/ai/Interview';
import AiRecommendations from './pages/student/ai/Recommendations';
import StudentMockTest from './pages/student/MockTest';
import StudentProfile from './pages/student/Profile';
import StudentNotifications from './pages/student/Notifications';
import StudentSettings from './pages/student/Settings';
import FacultyDashboard from './pages/faculty/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import AdminFacultyAccounts from './pages/admin/FacultyAccounts';
import ManageEvents from './pages/manage/ManageEvents';
import ManageOpportunities from './pages/manage/ManageOpportunities';
import ManageCertifications from './pages/manage/ManageCertifications';
import ManageMockTestBank from './pages/manage/ManageMockTestBank';
import StaffProfile from './pages/manage/StaffProfile';

const RoleRedirect = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={`/${role}`} replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup/student" element={<StudentSignup />} />
      <Route path="/signup/faculty" element={<FacultySignup />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute allow={['student']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="events" element={<StudentEvents />} />
        <Route path="opportunities" element={<StudentOpportunities />} />
        <Route path="certifications" element={<StudentCertifications />} />
        <Route path="vault" element={<StudentVault />} />
        <Route path="ai" element={<AiHub />} />
        <Route path="ai/resume-analyzer" element={<AiResumeAnalyzer />} />
        <Route path="ai/chat" element={<AiChat />} />
        <Route path="ai/interview" element={<AiInterview />} />
        <Route path="ai/recommendations" element={<AiRecommendations />} />
        <Route path="mocktest" element={<StudentMockTest />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="settings" element={<StudentSettings />} />
      </Route>

      <Route
        path="/faculty"
        element={
          <ProtectedRoute allow={['faculty']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FacultyDashboard />} />
        <Route path="events" element={<ManageEvents scope="own" />} />
        <Route path="opportunities" element={<ManageOpportunities scope="own" />} />
        <Route path="certifications" element={<ManageCertifications scope="own" />} />
        <Route path="mocktest" element={<ManageMockTestBank />} />
        <Route path="profile" element={<StaffProfile />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allow={['admin']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="events" element={<ManageEvents scope="all" />} />
        <Route path="opportunities" element={<ManageOpportunities scope="all" />} />
        <Route path="certifications" element={<ManageCertifications scope="all" />} />
        <Route path="mocktest" element={<ManageMockTestBank />} />
        <Route path="faculty" element={<AdminFacultyAccounts />} />
        <Route path="profile" element={<StaffProfile />} />
      </Route>

      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}
