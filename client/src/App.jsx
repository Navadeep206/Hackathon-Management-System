import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Landing from './pages/Landing';
import Hackathons from './pages/Hackathons';
import HackathonDetails from './pages/HackathonDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Team from './pages/Team';
import Submission from './pages/Submission';
import DashboardRedirect from './pages/DashboardRedirect';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserManagement from './pages/AdminUserManagement';
import OrganizerDashboard from './pages/OrganizerDashboard';
import ParticipantDashboard from './pages/ParticipantDashboard';
import JudgeDashboard from './pages/JudgeDashboard';
import Forbidden from './pages/Forbidden';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Public Views */}
          <Route index element={<Landing />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route
            path="hackathons"
            element={
              <ProtectedRoute>
                <Hackathons />
              </ProtectedRoute>
            }
          />
          <Route
            path="hackathons/:id"
            element={
              <ProtectedRoute>
                <HackathonDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="leaderboard/:hackathonId"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          
          {/* Generic Protected Dash & Profile */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Participant Protected Team & Submission Hubs */}
          <Route
            path="team"
            element={
              <ProtectedRoute allowedRoles={['Participant']}>
                <Team />
              </ProtectedRoute>
            }
          />
          <Route
            path="submission"
            element={
              <ProtectedRoute allowedRoles={['Participant']}>
                <Submission />
              </ProtectedRoute>
            }
          />

          {/* Role-Specific Workspaces (Protected) */}
          <Route
            path="admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminUserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="organizer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Organizer']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="participant/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Participant']}>
                <ParticipantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="judge/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Judge']}>
                <JudgeDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallbacks */}
          <Route path="403" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
