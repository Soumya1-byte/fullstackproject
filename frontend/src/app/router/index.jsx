import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AuthLayout from '../../layouts/AuthLayout';
import DashboardLayout from '../../layouts/DashboardLayout';
import LoginPage from '../../pages/auth/LoginPage';
import RegisterPage from '../../pages/auth/RegisterPage';
import AdminOverviewPage from '../../pages/admin/AdminOverviewPage';
import CourseManagerPage from '../../pages/admin/CourseManagerPage';
import FormBuilderPage from '../../pages/admin/FormBuilderPage';
import FormsListPage from '../../pages/admin/FormsListPage';
import FormResponsesPage from '../../pages/admin/FormResponsesPage';
import AnalyticsPage from '../../pages/admin/AnalyticsPage';
import ReportExportPage from '../../pages/admin/ReportExportPage';
import StudentOverviewPage from '../../pages/student/StudentOverviewPage';
import CourseListPage from '../../pages/student/CourseListPage';
import SubmitFeedbackPage from '../../pages/student/SubmitFeedbackPage';
import InsightsPage from '../../pages/student/InsightsPage';
import ProfilePage from '../../pages/common/ProfilePage';
import NotFoundPage from '../../pages/common/NotFoundPage';
import { useAuth } from '../../hooks/useAuth';
import AppBootLoader from '../../components/system/AppBootLoader';

function AnimatedOutlet({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
      {children}
    </motion.div>
  );
}

function HomeRedirect() {
  const { role, isAuthenticated, bootstrapping } = useAuth();
  if (bootstrapping) {
    return <AppBootLoader />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
}

export default function AppRouter() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomeRedirect />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/profile" element={<AnimatedOutlet><ProfilePage /></AnimatedOutlet>} />

            <Route element={<ProtectedRoute allow="admin" />}>
              <Route path="/admin/dashboard" element={<AnimatedOutlet><AdminOverviewPage /></AnimatedOutlet>} />
              <Route path="/admin/courses" element={<AnimatedOutlet><CourseManagerPage /></AnimatedOutlet>} />
              <Route path="/admin/forms" element={<AnimatedOutlet><FormsListPage /></AnimatedOutlet>} />
              <Route path="/admin/form-builder" element={<AnimatedOutlet><FormBuilderPage /></AnimatedOutlet>} />
              <Route path="/admin/responses" element={<AnimatedOutlet><FormResponsesPage /></AnimatedOutlet>} />
              <Route path="/admin/analytics" element={<AnimatedOutlet><AnalyticsPage /></AnimatedOutlet>} />
              <Route path="/admin/export" element={<AnimatedOutlet><ReportExportPage /></AnimatedOutlet>} />
            </Route>

            <Route element={<ProtectedRoute allow="student" />}>
              <Route path="/student/dashboard" element={<AnimatedOutlet><StudentOverviewPage /></AnimatedOutlet>} />
              <Route path="/student/courses" element={<AnimatedOutlet><CourseListPage /></AnimatedOutlet>} />
              <Route path="/student/feedback" element={<AnimatedOutlet><SubmitFeedbackPage /></AnimatedOutlet>} />
              <Route path="/student/insights" element={<AnimatedOutlet><InsightsPage /></AnimatedOutlet>} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}
