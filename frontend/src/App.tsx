import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import { ToastProvider, ToastContainer } from './components/Toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { LoadingPage } from './components/ui/LoadingStates';
import AIAssistant from './components/AIAssistant';
import './styles/responsive.css';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const AIChatPage = lazy(() => import('./pages/AIChatPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ProblemsPage = lazy(() => import('./pages/WorldClassProblems'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const SolveFixed = lazy(() => import('./pages/SolveFixed'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));
const DeadlinesPage = lazy(() => import('./pages/DeadlinesPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const CodePlayground = lazy(() => import('./pages/CodePlayground'));
const CommunityForum = lazy(() => import('./pages/CommunityForum'));
const CurriculumSystem = lazy(() => import('./pages/CurriculumSystem'));
const PlacementTracks = lazy(() => import('./pages/PlacementTracks'));
const ResourceLibrary = lazy(() => import('./pages/ResourceLibrary'));
const SharedCode = lazy(() => import('./pages/SharedCode'));
const SmartIDE = lazy(() => import('./pages/SmartIDE'));
const StudyGroups = lazy(() => import('./pages/StudyGroups'));
const PaymentIntegration = lazy(() => import('./pages/PaymentIntegration'));
const WorldClassLogin = lazy(() => import('./pages/WorldClassLogin'));
const WorldClassDashboard = lazy(() => import('./pages/WorldClassDashboard'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const GoogleAuthSuccess = lazy(() => import('./pages/GoogleAuthSuccess'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfUsePage = lazy(() => import('./pages/TermsOfUsePage'));

const withProtectedRoute = (element: React.ReactElement) => <ProtectedRoute>{element}</ProtectedRoute>;
const withPublicOnlyRoute = (element: React.ReactElement) => <PublicOnlyRoute>{element}</PublicOnlyRoute>;

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/home" element={<Navigate to="/" replace />} />
    <Route path="/login" element={withPublicOnlyRoute(<LoginPage />)} />
    <Route path="/signin" element={<Navigate to="/login" replace />} />
    <Route path="/signup" element={withPublicOnlyRoute(<SignupPage />)} />
    <Route path="/register" element={<Navigate to="/signup" replace />} />
    <Route path="/forgot-password" element={withPublicOnlyRoute(<ForgotPasswordPage />)} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/privacy" element={<PrivacyPolicyPage />} />
    <Route path="/terms" element={<TermsOfUsePage />} />
    {/* Google OAuth callback — must NOT be protected or public-only */}
    <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
    <Route path="/dashboard" element={withProtectedRoute(<DashboardPage />)} />
    <Route path="/quiz" element={withProtectedRoute(<QuizPage />)} />
    <Route path="/ai-chat" element={withProtectedRoute(<AIChatPage />)} />
    <Route path="/profile" element={withProtectedRoute(<ProfilePage />)} />
    <Route path="/profile-management" element={withProtectedRoute(<Navigate to="/profile" replace />)} />
    <Route path="/problems" element={withProtectedRoute(<ProblemsPage />)} />
    <Route path="/settings" element={withProtectedRoute(<SettingsPage />)} />
    <Route path="/courses" element={withProtectedRoute(<CoursePage />)} />
    <Route path="/courses/:id" element={withProtectedRoute(<CoursePage />)} />
    <Route path="/solve/:id" element={withProtectedRoute(<SolveFixed />)} />
    <Route path="/activity" element={withProtectedRoute(<ActivityPage />)} />
    <Route path="/deadlines" element={withProtectedRoute(<DeadlinesPage />)} />
    <Route path="/achievements" element={withProtectedRoute(<AchievementsPage />)} />
    <Route path="/admin" element={withProtectedRoute(<AdminDashboard />)} />
    <Route path="/playground" element={withProtectedRoute(<CodePlayground />)} />
    <Route path="/community" element={withProtectedRoute(<CommunityForum />)} />
    <Route path="/curriculum" element={withProtectedRoute(<CurriculumSystem />)} />
    <Route path="/placements" element={withProtectedRoute(<PlacementTracks />)} />
    <Route path="/resources" element={withProtectedRoute(<ResourceLibrary />)} />
    <Route path="/shared-code" element={withProtectedRoute(<SharedCode />)} />
    <Route path="/ide" element={withProtectedRoute(<SmartIDE />)} />
    <Route path="/study-groups" element={withProtectedRoute(<StudyGroups />)} />
    <Route path="/payment" element={withProtectedRoute(<PaymentIntegration />)} />
    <Route path="/world-login" element={withPublicOnlyRoute(<WorldClassLogin />)} />
    <Route path="/world-dashboard" element={withProtectedRoute(<WorldClassDashboard />)} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const AppShell: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-gray-50 dark:bg-slate-900">
      <Navbar />
      <ErrorBoundary resetKey={location.pathname}>
        <main className="flex-1 w-full overflow-x-hidden">
          <Suspense fallback={<LoadingPage fullPage={false} message="Loading page..." />}>
            <AppRoutes />
          </Suspense>
        </main>
      </ErrorBoundary>
      <Footer />
      <AIAssistant />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppShell />
          <ToastContainer />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
