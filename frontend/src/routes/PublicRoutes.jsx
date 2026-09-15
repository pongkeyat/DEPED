import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Pages
import LandingPage from '../pages/LandingPage';
import LandingPageApplication from '../pages/LandingPageApplication';
import Header from '../components/Headers';
import Login from '../pages/Login';
import ChangePassword from '../pages/ChangePassword';
import ProtectedRoute from './ProtectedRoutes';
import DashBoard from '../pages/Dashboard';
import SideBar from '../components/Sidebar';
import PostVacancy from '../pages/PostVacancy';
import ReceiveApplications from '../pages/ReceiveApplications';
import VacancyPosting from '../pages/VacancyPosting';
import AllApplication from '../pages/AllApplication';
import ApplicantDetails from "../pages/ApplicantDetails";
import InitialScreening from '../pages/InitialScreening';
import ApplicantEvaluation from '../pages/ApplicantEvaluation';

import { useAuth } from '../context/AuthContext';
import InterviewSession from '../pages/InterviewSession';
import InitialEvaluationResults from '../pages/InitialEvaluationResults';
import AssessmentScoring from '../pages/AssessmentScoring';
import Ranking from '../pages/Ranking';
import PositionsManagement from '../pages/PositionsManagement';
import PanelistManagement from '../pages/PanelistManagement';
import UserManagement from '../pages/UserManagement';

function AppLayout() {
  const { token } = useAuth();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#edf2f8]">
      {/* Top Header */}
      <Header isLoggedIn={!!token} />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Container */}
        <aside className="w-64 flex-shrink-0 h-full overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-amber-500/40 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
          <SideBar />
        </aside>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function PublicRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/apply" element={<LandingPageApplication />} />
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashBoard />} />
          <Route path="/postVacancies" element={<PostVacancy />} />
          <Route path="/receiveApplicant" element={<ReceiveApplications />} />
          <Route path="/vacancyPosting" element={<VacancyPosting />} />
          <Route path="/allApplications" element={<AllApplication />} />
          <Route path="/initialScreening" element={<InitialScreening />} />
          <Route path="/interviewSession" element={<InterviewSession />} />
          <Route path="/initialEvaluationResults" element={<InitialEvaluationResults />} />
          <Route path="/Scoring" element ={<AssessmentScoring />} />
          <Route path="/comparative-assessment-result" element={<Ranking />} />
          <Route path="/positions" element={<PositionsManagement />} />
          <Route path="/panelists" element={<PanelistManagement />} />
          {/* Applicant Routes */}
          <Route path="/applicants/:id" element={<ApplicantDetails />} />
          <Route path="/applicants/:id/evaluation" element={<ApplicantEvaluation />} />
          <Route path="/users" element={<UserManagement />} />
        </Route>

        {/* Fallback Catch-All Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}