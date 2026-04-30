import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import Layout from './components/Layout/Layout'
import LoginPage from './tabs/login/index'
import SoccerTab from './tabs/soccer/index'
import RecipesTab from './tabs/recipes/index'
import StocksTab from './tabs/stocks/index'
import CalendarTab from './tabs/calendar/index'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/soccer" replace />} />
              <Route path="/soccer" element={<ProtectedRoute><SoccerTab /></ProtectedRoute>} />
              <Route path="/recipes" element={<ProtectedRoute><RecipesTab /></ProtectedRoute>} />
              <Route path="/stocks" element={<ProtectedRoute><StocksTab /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarTab /></ProtectedRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
