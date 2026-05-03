import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AddPlayerModal from './AddPlayerModal'

const noop = () => {}

beforeEach(() => {
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    bottom: 120,
    left: 40,
    width: 300,
    top: 80, right: 340, height: 40, x: 40, y: 80,
  }))
})

describe('LeaguePicker', () => {
  it('shows the default league label', () => {
    render(<AddPlayerModal onClose={noop} onFollow={noop} followedPlayerIds={[]} />)
    expect(screen.getByText('Premier League')).toBeInTheDocument()
  })

  it('opens the league list when the button is clicked', async () => {
    render(<AddPlayerModal onClose={noop} onFollow={noop} followedPlayerIds={[]} />)
    await userEvent.click(screen.getByText('Premier League'))
    expect(screen.getByText('La Liga')).toBeInTheDocument()
    expect(screen.getByText('Serie A')).toBeInTheDocument()
  })

  it('positions the list using getBoundingClientRect values', async () => {
    render(<AddPlayerModal onClose={noop} onFollow={noop} followedPlayerIds={[]} />)
    await userEvent.click(screen.getByText('Premier League'))
    const list = screen.getByRole('list', { hidden: true })
    expect(list.style.top).toBe('124px') // bottom (120) + 4px offset
    expect(list.style.left).toBe('40px')
    expect(list.style.width).toBe('300px')
  })

  it('closes the list after selecting a league', async () => {
    render(<AddPlayerModal onClose={noop} onFollow={noop} followedPlayerIds={[]} />)
    await userEvent.click(screen.getByText('Premier League'))
    await userEvent.click(screen.getByText('Bundesliga'))
    expect(screen.queryByText('La Liga')).not.toBeInTheDocument()
  })

  it('updates the selected label after choosing a league', async () => {
    render(<AddPlayerModal onClose={noop} onFollow={noop} followedPlayerIds={[]} />)
    await userEvent.click(screen.getByText('Premier League'))
    await userEvent.click(screen.getByText('Bundesliga'))
    expect(screen.getByText('Bundesliga')).toBeInTheDocument()
  })

  it('closes the list when clicking outside', async () => {
    render(
      <div>
        <AddPlayerModal onClose={noop} onFollow={noop} followedPlayerIds={[]} />
        <button>Outside</button>
      </div>
    )
    await userEvent.click(screen.getByText('Premier League'))
    expect(screen.getByText('La Liga')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Outside'))
    expect(screen.queryByText('La Liga')).not.toBeInTheDocument()
  })
})
