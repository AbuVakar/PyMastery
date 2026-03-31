import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import DarkModeWrapper from './components/DarkModeWrapper';
import PerformanceMonitor from './components/PerformanceMonitor';

// Import pages with lazy loading for better performance
const FinalHome = React.lazy(() => import('./pages/FinalHome'));
const WorldClassLogin = React.lazy(() => import('./pages/WorldClassLogin'));
const WorldClassDashboard = React.lazy(() => import('./pages/WorldClassDashboard'));
const WorldClassProblems = React.lazy(() => import('./pages/WorldClassProblems'));
const SolveFixed = React.lazy(() => import('./pages/SolveFixed'));
const Roadmap = React.lazy(() => import('./pages/Roadmap'));
const RoleComposer = React.lazy(() => import('./pages/RoleComposer'));
const ExplainToEarn = React.lazy(() => import('./pages/ExplainToEarn'));
const EnhancedConcepts = React.lazy(() => import('./pages/EnhancedConcepts'));
const EnhancedCapstone = React.lazy(() => import('./pages/EnhancedCapstone'));
const AnalyticsDashboard = React.lazy(() => import('./pages/AnalyticsDashboard'));
const CompanyMocks = React.lazy(() => import('./pages/CompanyMocks'));
const PaymentIntegration = React.lazy(() => import('./pages/PaymentIntegration'));
const CoursePage = React.lazy(() => import('./pages/CoursePage'));
const PremiumHome = React.lazy(() => import('./pages/PremiumHome'));
const ProfileManagement = React.lazy(() => import('./pages/ProfileManagement'));
const Settings = React.lazy(() => import('./pages/Settings'));
const CommunityForum = React.lazy(() => import('./pages/CommunityForum'));
const StudyGroups = React.lazy(() => import('./pages/StudyGroups'));
const MentorshipProgram = React.lazy(() => import('./pages/MentorshipProgram'));
const CodePlayground = React.lazy(() => import('./pages/CodePlayground'));
const ResourceLibrary = React.lazy(() => import('./pages/ResourceLibrary'));
const SharedCode = React.lazy(() => import('./pages/SharedCode'));
const CurriculumSystem = React.lazy(() => import('./pages/CurriculumSystem'));
const PlacementTracks = React.lazy(() => import('./pages/PlacementTracks'));
const AIMentorSystem = React.lazy(() => import('./pages/AIMentorSystem'));
const SmartIDE = React.lazy(() => import('./pages/SmartIDE'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Certificates = React.lazy(() => import('./pages/Certificates'));

// Import components
const ProtectedRoute = React.lazy(() => import('./components/ProtectedRoute'));
const LoadingSpinner = React.lazy(() => import('./components/LoadingSpinner'));

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <DarkModeWrapper>
        <PerformanceMonitor enableMonitoring={process.env.NODE_ENV === 'development'}>
          <AuthProvider>
            <BrowserRouter>
              <div className="min-h-screen">
                <React.Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="/home" element={<FinalHome />} />
                    <Route path="/login" element={<WorldClassLogin />} />
                    <Route path="/signup" element={<WorldClassLogin />} />
                    
                    {/* Protected Routes */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <WorldClassDashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/problems" element={
                      <ProtectedRoute>
                        <WorldClassProblems />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/solve/:problemId" element={
                      <ProtectedRoute>
                        <SolveFixed />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/roadmap" element={
                      <ProtectedRoute>
                        <Roadmap />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/role-composer" element={
                      <ProtectedRoute>
                        <RoleComposer />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/explain-to-earn" element={
                      <ProtectedRoute>
                        <ExplainToEarn />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/concepts" element={
                      <ProtectedRoute>
                        <EnhancedConcepts />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/capstone" element={
                      <ProtectedRoute>
                        <EnhancedCapstone />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/analytics" element={
                      <ProtectedRoute>
                        <AnalyticsDashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/mocks" element={
                      <ProtectedRoute>
                        <CompanyMocks />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/payment" element={
                      <ProtectedRoute>
                        <PaymentIntegration />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/courses/:courseId" element={
                      <ProtectedRoute>
                        <CoursePage />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/premium" element={
                      <ProtectedRoute>
                        <PremiumHome />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <ProfileManagement />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/community" element={
                      <ProtectedRoute>
                        <CommunityForum />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/study-groups" element={
                      <ProtectedRoute>
                        <StudyGroups />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/mentorship" element={
                      <ProtectedRoute>
                        <MentorshipProgram />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/playground" element={
                      <ProtectedRoute>
                        <CodePlayground />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/resources" element={
                      <ProtectedRoute>
                        <ResourceLibrary />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/shared/:shareId" element={
                      <ProtectedRoute>
                        <SharedCode />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/curriculum" element={
                      <ProtectedRoute>
                        <CurriculumSystem />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/placement" element={
                      <ProtectedRoute>
                        <PlacementTracks />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/ai-mentor" element={
                      <ProtectedRoute>
                        <AIMentorSystem />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/smart-ide" element={
                      <ProtectedRoute>
                        <SmartIDE />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin" element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/certificates" element={
                      <ProtectedRoute>
                        <Certificates />
                      </ProtectedRoute>
                    } />
                    
                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/home" replace />} />
                  </Routes>
                </React.Suspense>
              </div>
            </BrowserRouter>
          </AuthProvider>
        </PerformanceMonitor>
      </DarkModeWrapper>
    </ErrorBoundary>
  );
}

export default App;
