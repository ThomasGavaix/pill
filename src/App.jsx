import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import Header from './components/layout/Header'
import BottomNav from './components/layout/BottomNav'
import Today from './pages/Today'
import Medications from './pages/Medications'
import Profiles from './pages/Profiles'
import Settings from './pages/Settings'
import Prescriptions from './pages/Prescriptions'
import Login from './pages/Login'

function AppShell() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        Chargement...
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <AppProvider>
      <Header />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/medications" element={<Medications />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <BottomNav />
    </AppProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}
