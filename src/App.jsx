import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import Header from './components/layout/Header'
import BottomNav from './components/layout/BottomNav'
import Today from './pages/Today'
import Medications from './pages/Medications'
import Profiles from './pages/Profiles'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Header />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/medications" element={<Medications />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <BottomNav />
      </AppProvider>
    </BrowserRouter>
  )
}
