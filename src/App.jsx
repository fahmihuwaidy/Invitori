import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { InvitationProvider } from './contexts/InvitationContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import EditorPage from './pages/EditorPage'
import PublicInvitationPage from './pages/PublicInvitationPage'
import AtelierLayout from './layouts/AtelierLayout'
import ContactPage from './pages/ContactPage'
import ComingSoon from './components/ComingSoon'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
        <p className="serif-italic" style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (user.email !== 'fahmihuwaidy8@gmail.com') return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <ComingSoon>
      <BrowserRouter>
        <AuthProvider>
          <InvitationProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/undangan/:slug" element={<PublicInvitationPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AtelierLayout>
                      <DashboardPage />
                    </AtelierLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editor/:id"
                element={
                  <ProtectedRoute>
                    <EditorPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </InvitationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ComingSoon>
  )
}

export default App
