import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import Landing        from './pages/Landing'
import Login          from './pages/auth/Login'
import Register       from './pages/auth/Register'
import PatientLayout  from './components/Layout/PatientLayout'
import DoctorLayout   from './components/Layout/DoctorLayout'

import Dashboard      from './pages/patient/Dashboard'
import SymptomChecker from './pages/patient/SymptomChecker'
import Analyze        from './pages/patient/Analyze'
import Results        from './pages/patient/Results'
import History        from './pages/patient/History'
import Chat           from './pages/patient/Chat'
import HealthAssistant from './pages/patient/HealthAssistant'

import DoctorDashboard  from './pages/doctor/Dashboard'
import PatientDetail    from './pages/doctor/PatientDetail'
import PatientSearch    from './pages/doctor/PatientSearch'
import AdminLayout      from './components/Layout/AdminLayout'
import AdminDashboard   from './pages/admin/Dashboard'
import AdminUsers       from './pages/admin/Users'
import AdminReports     from './pages/admin/Reports'

function RequireAuth({ children, role }) {
  const { user, token } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const refreshUser = useAuthStore(s => s.refreshUser)

  // Re-sync user profile from server on every app mount / page refresh
  useEffect(() => { refreshUser() }, [refreshUser])

  return (
    <Routes>
      <Route path="/"         element={<Landing />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Patient portal */}
      <Route path="/patient" element={
        <RequireAuth role="patient"><PatientLayout /></RequireAuth>
      }>
        <Route index           element={<Dashboard />} />
        <Route path="symptoms" element={<SymptomChecker />} />
        <Route path="analyze"  element={<Analyze />} />
        <Route path="results"  element={<Results />} />
        <Route path="history"  element={<History />} />
        <Route path="chat"     element={<Chat />} />
        <Route path="health-assistant" element={<HealthAssistant />} />
      </Route>

      {/* Doctor portal */}
      <Route path="/doctor" element={
        <RequireAuth role="doctor"><DoctorLayout /></RequireAuth>
      }>
        <Route index                      element={<DoctorDashboard />} />
        <Route path="search"              element={<PatientSearch />} />
        <Route path="patients/:patientId" element={<PatientDetail />} />
      </Route>

      {/* Admin portal */}
      <Route path="/admin" element={
        <RequireAuth role="admin"><AdminLayout /></RequireAuth>
      }>
        <Route index          element={<AdminDashboard />} />
        <Route path="users"   element={<AdminUsers />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
