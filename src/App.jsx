import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PortalProvider, usePortal } from './app/providers/PortalProvider';
import { PortalLayout } from './layouts/PortalLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { CoachDashboard } from './pages/coach/CoachDashboard';
import { CoachPaymentsPage } from './pages/coach/CoachPaymentsPage';
import { CoachPlanningHub } from './pages/coach/CoachPlanningHub';
import { CoachStudentDetailPage } from './pages/coach/CoachStudentDetailPage';
import { CoachStudents } from './pages/coach/CoachStudents';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentMQL } from './pages/student/StudentMQL';
import { StudentPaymentsPage } from './pages/student/StudentPaymentsPage';
import { StudentSections } from './pages/student/StudentSections';
import { StudentWeeklyPlan } from './pages/student/StudentWeeklyPlan';

function RequireAuth({ children }) {
  const { session, loading } = usePortal();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0a1f0f',
      }}
      >
        <div style={{ textAlign: 'center', color: '#c9a84c' }}>
          <div style={{ fontSize: '1.2rem', letterSpacing: '0.1em' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate replace to="/login" />;
  return children;
}

function RequireRole({ role, children }) {
  const { session, loading } = usePortal();
  if (loading) return null;
  if (!session) return <Navigate replace to="/login" />;
  if (session.role !== role) return <Navigate replace to="/" />;
  return children;
}

function RoleRedirect() {
  const { session, loading } = usePortal();
  if (loading) return null;
  if (!session) return <Navigate replace to="/login" />;
  if (session.role === 'coach') return <Navigate replace to="/coach/dashboard" />;
  return <Navigate replace to="/student/dashboard" />;
}

export default function App() {
  return (
    <PortalProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RequireAuth><PortalLayout /></RequireAuth>}>
            <Route index element={<RoleRedirect />} />

            <Route path="student/dashboard" element={<RequireRole role="student"><StudentDashboard /></RequireRole>} />
            <Route path="student/weekly-plan" element={<RequireRole role="student"><StudentWeeklyPlan /></RequireRole>} />
            <Route path="student/practice-tests" element={<RequireRole role="student"><StudentSections /></RequireRole>} />
            <Route path="student/mql" element={<RequireRole role="student"><StudentMQL /></RequireRole>} />
            <Route path="student/payments" element={<RequireRole role="student"><StudentPaymentsPage /></RequireRole>} />
            <Route path="student/sections" element={<Navigate replace to="/student/practice-tests" />} />
            <Route path="student/check-in" element={<Navigate replace to="/student/practice-tests" />} />
            <Route path="student/missed-questions" element={<Navigate replace to="/student/mql" />} />
            <Route path="student/progress" element={<Navigate replace to="/student/dashboard" />} />
            <Route path="student/self-assessment" element={<Navigate replace to="/student/dashboard" />} />

            <Route path="coach/dashboard" element={<RequireRole role="coach"><CoachDashboard /></RequireRole>} />
            <Route path="coach/students" element={<RequireRole role="coach"><CoachStudents /></RequireRole>} />
            <Route path="coach/students/:studentId" element={<RequireRole role="coach"><CoachStudentDetailPage /></RequireRole>} />
            <Route path="coach/planning-hub" element={<RequireRole role="coach"><CoachPlanningHub /></RequireRole>} />
            <Route path="coach/payments" element={<RequireRole role="coach"><CoachPaymentsPage /></RequireRole>} />
            <Route path="coach/schedule-builder" element={<Navigate replace to="/coach/planning-hub" />} />
            <Route path="coach/diagnostic" element={<Navigate replace to="/coach/students" />} />
            <Route path="coach/session-flow" element={<Navigate replace to="/coach/students" />} />
          </Route>
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </BrowserRouter>
    </PortalProvider>
  );
}
