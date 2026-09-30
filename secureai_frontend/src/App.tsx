import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout }              from './components/layout/Layout'
import { LoginPage }           from './pages/Auth/LoginPage'
import { HomePage }            from './pages/Home/HomePage'
import { DashboardPage }       from './pages/Dashboard/DashboardPage'
import { ThreatsPage }         from './pages/Threats/ThreatsPage'
import { ThreatDetailPage }    from './pages/Threats/ThreatDetailPage'
import { AlertsPage }          from './pages/Alerts/AlertsPage'
import { IncidentsPage }       from './pages/Incidents/IncidentsPage'
import { ScanPage }            from './pages/Scan/ScanPage'
import { EmailAnalyzePage }    from './pages/Email/EmailAnalyzePage'
import { BaselineComparePage } from './pages/Baseline/BaselineComparePage'
import { UsersPage }           from './pages/Users/UsersPage'
import { StatisticsPage }      from './pages/Statistics/StatisticsPage'
import { RuleEnginePage }      from './pages/Rules/RuleEnginePage'
import { SafetySettingsPage }  from './pages/ChildSafeNet/SafetySettingsPage'
import { ScanLogsPage }        from './pages/ChildSafeNet/ScanLogsPage'
import { DatasetReviewPage }   from './pages/ChildSafeNet/DatasetReviewPage'
import { TrainJobsPage }       from './pages/ChildSafeNet/TrainJobsPage'

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
          <Route index              element={<HomePage />} />
          <Route path="dashboard"   element={<DashboardPage />} />
          <Route path="scan"        element={<ScanPage />} />
          <Route path="settings"    element={<SafetySettingsPage />} />
          <Route path="logs"        element={<ScanLogsPage />} />
          <Route path="dataset"     element={<DatasetReviewPage />} />
          <Route path="train"       element={<TrainJobsPage />} />
          <Route path="threats"     element={<ThreatsPage />} />
          <Route path="threats/:id" element={<ThreatDetailPage />} />
          <Route path="alerts"      element={<AlertsPage />} />
          <Route path="incidents"   element={<IncidentsPage />} />
          <Route path="email"       element={<EmailAnalyzePage />} />
          <Route path="baseline"    element={<BaselineComparePage />} />
          <Route path="statistics"  element={<StatisticsPage />} />
          <Route path="rules"       element={<RuleEnginePage />} />
          <Route path="users"       element={<UsersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
