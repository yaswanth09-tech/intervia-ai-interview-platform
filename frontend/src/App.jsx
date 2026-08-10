import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ResumeUpload from './pages/ResumeUpload'
import SelectDifficulty from './pages/SelectDifficulty'
import MCQRound from './pages/MCQRound'
import MCQResults from './pages/MCQResults'
import DescriptiveRound from './pages/DescriptiveRound'
import InterviewResults from './pages/InterviewResults'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/new"
            element={
              <ProtectedRoute>
                <ResumeUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/difficulty"
            element={
              <ProtectedRoute>
                <SelectDifficulty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/mcq"
            element={
              <ProtectedRoute>
                <MCQRound />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/mcq-results"
            element={
              <ProtectedRoute>
                <MCQResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/descriptive"
            element={
              <ProtectedRoute>
                <DescriptiveRound />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/results"
            element={
              <ProtectedRoute>
                <InterviewResults />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
