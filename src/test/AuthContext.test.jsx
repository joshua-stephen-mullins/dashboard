import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useState } from 'react'
import './mocks/supabase'
import { supabase } from '../lib/supabase'
import { AuthProvider, useAuth } from '../context/AuthContext'

function TestConsumer() {
  const { user, loading, login, logout } = useAuth()
  const [loginError, setLoginError] = useState(null)
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <span data-testid="login-error">{loginError ?? ''}</span>
      <button onClick={() => login('a@b.com', 'pass').catch(e => setLoginError(e.message))}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  )
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('starts loading and resolves to no user when no session exists', async () => {
    renderWithAuth()
    expect(screen.getByTestId('loading').textContent).toBe('true')
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('user').textContent).toBe('none')
  })

  it('sets user from an existing session on mount', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { email: 'me@example.com' } } },
    })
    renderWithAuth()
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('me@example.com'))
  })

  it('updates user when onAuthStateChange fires', async () => {
    let authCallback
    supabase.auth.onAuthStateChange.mockImplementation((cb) => {
      authCallback = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    renderWithAuth()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    act(() => authCallback('SIGNED_IN', { user: { email: 'new@example.com' } }))
    expect(screen.getByTestId('user').textContent).toBe('new@example.com')
  })

  it('calls signInWithPassword with credentials', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null })
    renderWithAuth()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    await userEvent.click(screen.getByText('login'))
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pass',
    })
  })

  it('surfaces error when signInWithPassword returns an error', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ error: new Error('bad creds') })
    renderWithAuth()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    await userEvent.click(screen.getByText('login'))
    await waitFor(() => expect(screen.getByTestId('login-error').textContent).toBe('bad creds'))
  })

  it('calls signOut on logout', async () => {
    supabase.auth.signOut.mockResolvedValue({})
    renderWithAuth()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    await userEvent.click(screen.getByText('logout'))
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})
