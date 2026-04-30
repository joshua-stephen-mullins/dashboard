import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import './mocks/supabase'
import { supabase } from '../lib/supabase'
import { AuthProvider } from '../context/AuthContext'
import LoginPage from '../tabs/login/index'

function renderLogin() {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/soccer" element={<div>soccer page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('renders email, password inputs and sign in button', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('navigates to /soccer on successful login', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null })
    renderLogin()

    await userEvent.type(screen.getByPlaceholderText('Email'), 'me@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(screen.getByText('soccer page')).toBeInTheDocument())
  })

  it('shows error message on failed login', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ error: new Error('bad creds') })
    renderLogin()

    await userEvent.type(screen.getByPlaceholderText('Email'), 'me@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
  })

  it('disables the button and shows loading text while submitting', async () => {
    let resolve
    supabase.auth.signInWithPassword.mockReturnValue(new Promise((r) => { resolve = r }))
    renderLogin()

    await userEvent.type(screen.getByPlaceholderText('Email'), 'me@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    resolve({ error: null })
  })
})
