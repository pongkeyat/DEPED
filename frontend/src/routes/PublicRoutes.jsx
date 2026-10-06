import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

// ============================================================
// PAGES
// ============================================================

import LandingPage from "../pages/LandingPage";
import LandingPageApplication from "../pages/LandingPageApplication";
import Login from "../pages/Login";
import ChangePassword from "../pages/ChangePassword";
import DashBoard from "../pages/Dashboard";
import PostVacancy from "../pages/PostVacancy";
import ReceiveApplications from "../pages/ReceiveApplications";
import VacancyPosting from "../pages/VacancyPosting";
import AllApplication from "../pages/AllApplication";
import ApplicantDetails from "../pages/ApplicantDetails";
import InitialEvaluation from "../pages/InitialEvaluation";
import ApplicantEvaluation from "../pages/ApplicantEvaluation";
import InterviewSession from "../pages/InterviewSession";
import InitialEvaluationResults from "../pages/InitialEvaluationResults";
import AssessmentScoring from "../pages/AssessmentScoring";
import Ranking from "../pages/Ranking";
import CARRQA from "../pages/CARRQA";
import PositionsManagement from "../pages/PositionsManagement";
import UserManagement from "../pages/UserManagement";
import DatabaseBackup from "../pages/DatabaseBackup";
import AuditLogs from "../pages/AuditLogs";
import ApplicantSummaryReport from "../pages/ApplicantSummaryReport";

// ============================================================
// HELP CENTER
// ============================================================

import HelpCenter from "../pages/HelpCenter";

// ============================================================
// COMPONENTS
// ============================================================

import Header from "../components/Headers";
import SideBar from "../components/Sidebar";
import ProtectedRoute from "./ProtectedRoutes";

// ============================================================
// CONTEXT
// ============================================================

import { useAuth } from "../context/AuthContext";


// ============================================================
// APP LAYOUT
// ============================================================

function AppLayout() {
  const { token } = useAuth();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#edf2f8]">

      {/* ======================================================
          TOP HEADER
      ====================================================== */}

      <div className="print:hidden">
        <Header isLoggedIn={!!token} />
      </div>


      {/* ======================================================
          MAIN CONTAINER
      ====================================================== */}

      <div className="flex flex-1 overflow-hidden">

        {/* ====================================================
            SIDEBAR
        ==================================================== */}

        <aside
          className="
            print:hidden
            w-64
            flex-shrink-0
            h-full
            overflow-y-auto
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-white/10
            [&::-webkit-scrollbar-thumb]:rounded-full
            hover:[&::-webkit-scrollbar-thumb]:bg-amber-500/40
            [scrollbar-width:thin]
            [scrollbar-color:rgba(255,255,255,0.1)_transparent]
          "
        >
          <SideBar />
        </aside>


        {/* ====================================================
            DYNAMIC PAGE CONTENT
        ==================================================== */}

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>

    </div>
  );
}


// ============================================================
// PUBLIC ROUTES
// ============================================================

export default function PublicRoutes() {

  return (
    <Router>

      <Routes>

        {/* ====================================================
            PUBLIC ROUTES
        ==================================================== */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/apply"
          element={<LandingPageApplication />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/change-password"
          element={<ChangePassword />}
        />


        {/* ====================================================
            PROTECTED APPLICATION ROUTES
        ==================================================== */}

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >

          {/* ==================================================
              DASHBOARD
          ================================================== */}

          <Route
            path="/dashboard"
            element={<DashBoard />}
          />


          {/* ==================================================
              VACANCIES
          ================================================== */}

          <Route
            path="/postVacancies"
            element={<PostVacancy />}
          />

          <Route
            path="/receiveApplicant"
            element={<ReceiveApplications />}
          />

          <Route
            path="/vacancyPosting"
            element={<VacancyPosting />}
          />


          {/* ==================================================
              APPLICATIONS
          ================================================== */}

          <Route
            path="/allApplications"
            element={<AllApplication />}
          />


          {/* ==================================================
              INITIAL SCREENING
          ================================================== */}

          <Route
            path="/initialScreening"
            element={<InitialEvaluation />}
          />


          {/* ==================================================
              INTERVIEW SESSION
          ================================================== */}

          <Route
            path="/interviewSession"
            element={<InterviewSession />}
          />


          {/* ==================================================
              INITIAL EVALUATION RESULTS
          ================================================== */}

          <Route
            path="/initialEvaluationResults"
            element={<InitialEvaluationResults />}
          />


          {/* ==================================================
              ASSESSMENT / SCORING
          ================================================== */}

          <Route
            path="/Scoring"
            element={<AssessmentScoring />}
          />


          {/* ==================================================
              RANKING
          ================================================== */}

          <Route
            path="/comparative-assessment-result"
            element={<Ranking />}
          />


          {/* ==================================================
              CARRQA
          ================================================== */}

          <Route
            path="/carrqa"
            element={<CARRQA />}
          />


          {/* ==================================================
              POSITIONS
          ================================================== */}

          <Route
            path="/positions"
            element={<PositionsManagement />}
          />


          {/* ==================================================
              APPLICANTS
          ================================================== */}

          <Route
            path="/applicants/:id"
            element={<ApplicantDetails />}
          />

          <Route
            path="/applicants/:id/evaluation"
            element={<ApplicantEvaluation />}
          />


          {/* ==================================================
              USER MANAGEMENT
          ================================================== */}

          <Route
            path="/users"
            element={<UserManagement />}
          />


          {/* ==================================================
              DATABASE BACKUP
          ================================================== */}

          <Route
            path="/database-backup"
            element={<DatabaseBackup />}
          />


          {/* ==================================================
              AUDIT LOGS
          ================================================== */}

          <Route
            path="/audit-logs"
            element={<AuditLogs />}
          />


          {/* ==================================================
              APPLICANT SUMMARY REPORT
          ================================================== */}

          <Route
            path="/applicant-summary-report"
            element={<ApplicantSummaryReport />}
          />


          {/* ==================================================
              HELP CENTER
          ================================================== */}

          <Route
            path="/help-center"
            element={<HelpCenter />}
          />

        </Route>


        {/* ====================================================
            FALLBACK
        ==================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </Router>
  );
}