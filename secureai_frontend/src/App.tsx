import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout }              from './components/layout/Layout'
import { LoginPage }           from './pages/Auth/LoginPage'
import { DashboardPage }       from './pages/Dashboard/DashboardPage'
import { ThreatsPage }         from './pages/Threats/ThreatsPage'
import { ThreatDetailPage }    from './pages/Threats/ThreatDetailPage'
import { AlertsPage }          from './pages/Alerts/AlertsPage'
import { EmailAnalyzePage }    from './pages/Email/EmailAnalyzePage'
import { BaselineComparePage } from './pages/Baseline/BaselineComparePage'
import { UsersPage }           from './pages/Users/UsersPage'
import { StatisticsPage }      from './pages/Statistics/StatisticsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index              element={<DashboardPage />} />
          <Route path="threats"     element={<ThreatsPage />} />
          <Route path="threats/:id" element={<ThreatDetailPage />} />
          <Route path="alerts"      element={<AlertsPage />} />
          <Route path="email"       element={<EmailAnalyzePage />} />
          <Route path="baseline"    element={<BaselineComparePage />} />
          <Route path="statistics"  element={<StatisticsPage />} />
          <Route path="users"       element={<UsersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
