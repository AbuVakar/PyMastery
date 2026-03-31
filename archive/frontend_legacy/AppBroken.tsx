import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ProfessionalNavbar } from './components';
import AIAssistant from './components/AIAssistant';
import FinalHome from './pages/FinalHome';
import WorldClassLogin from './pages/WorldClassLogin';
import WorldClassDashboard from './pages/WorldClassDashboard';
import WorldClassProblems from './pages/WorldClassProblems';
import SolveFixed from './pages/SolveFixed';
import Roadmap from './pages/Roadmap';
import RoleComposer from './pages/RoleComposer';
import ExplainToEarn from './pages/ExplainToEarn';
import EnhancedConcepts from './pages/EnhancedConcepts';
import EnhancedCapstone from './pages/EnhancedCapstone';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import CompanyMocks from './pages/CompanyMocks';
import PaymentIntegration from './pages/PaymentIntegration';
import CoursePage from './pages/CoursePage';
import PremiumHome from './pages/PremiumHome';
import ProfileManagement from './pages/ProfileManagement';
import ProtectedRoute from './components/ProtectedRoute';
import Settings from './pages/Settings';
import CommunityForum from './pages/CommunityForum';
import StudyGroups from './pages/StudyGroups';
import MentorshipProgram from './pages/MentorshipProgram';
import CodePlayground from './pages/CodePlayground';
import ResourceLibrary from './pages/ResourceLibrary';
import SharedCode from './pages/SharedCode';
import CurriculumSystem from './pages/CurriculumSystem';
import SmartIDE from './pages/SmartIDE';
import PlacementTracks from './pages/PlacementTracks';
import AIMentorSystem from './pages/AIMentorSystem';
import AdminDashboard from './pages/AdminDashboard';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <ProfessionalNavbar />
            <AIAssistant />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<PremiumHome />} />
                <Route path="/classic" element={<FinalHome />} />
                <Route path="/login" element={<WorldClassLogin />} />
                <Route path="/dashboard" element={<WorldClassDashboard />} />
                <Route path="/problems" element={<WorldClassProblems />} />
                <Route path="/solve/:id" element={<SolveFixed />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/composer" element={<RoleComposer />} />
                <Route path="/explain" element={<ExplainToEarn />} />
                <Route path="/concepts" element={<EnhancedConcepts />} />
                <Route path="/capstone" element={<EnhancedCapstone />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/mocks" element={<CompanyMocks />} />
                <Route path="/payment" element={<PaymentIntegration />} />
                <Route path="/course/:id" element={<CoursePage />} />
                <Route path="/profile" element={<ProfileManagement />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/forum" element={<CommunityForum />} />
                <Route path="/study-groups" element={<StudyGroups />} />
                <Route path="/mentorship" element={<MentorshipProgram />} />
                <Route path="/playground" element={<CodePlayground />} />
                <Route path="/resources" element={<ResourceLibrary />} />
                <Route path="/shared/:id" element={<SharedCode />} />
                <Route path="/curriculum" element={<CurriculumSystem />} />
                <Route path="/smart-ide" element={<SmartIDE />} />
                <Route path="/placement" element={<PlacementTracks />} />
                <Route path="/ai-mentor" element={<AIMentorSystem />} />
                <Route path="/admin" element={<AdminDashboard />} />
                
                {/* Protected Routes */}
                <Route path="/protected" element={<ProtectedRoute><div>Protected Content</div></ProtectedRoute>} />
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
