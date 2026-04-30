import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import './mocks/supabase'
import { supabase } from '../lib/supabase'
import { AuthProvider } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute'
import PublicRoute from '../components/PublicRoute/PublicRoute'

function renderRoutes({ session = null, initialPath = '/' } = {}) {
  supabase.auth.getSession.mockResolvedValue({ data: { session } })

  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="/soccer"
            element={<ProtectedRoute><div>soccer page</div></ProtectedRoute>}
          />
          <Route
            path="/public"
            element={<PublicRoute><div>public page</div></PublicRoute>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('redirects to /login when unauthenticated', async () => {
    renderRoutes({ session: null, initialPath: '/soccer' })
    await waitFor(() => expect(screen.getByText('login page')).toBeInTheDocument())
  })

  it('renders children when authenticated', async () => {
    renderRoutes({
      session: { user: { email: 'me@example.com' } },
      initialPath: '/soccer',
    })
    await waitFor(() => expect(screen.getByText('soccer page')).toBeInTheDocument())
  })
})

describe('PublicRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('renders children when unauthenticated', async () => {
    renderRoutes({ session: null, initialPath: '/public' })
    await waitFor(() => expect(screen.getByText('public page')).toBeInTheDocument())
  })

  it('redirects to /soccer when already authenticated', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { email: 'me@example.com' } } },
    })

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/public']}>
          <Routes>
            <Route path="/soccer" element={<div>soccer page</div>} />
            <Route
              path="/public"
              element={<PublicRoute><div>public page</div></PublicRoute>}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByText('soccer page')).toBeInTheDocument())
  })
})
