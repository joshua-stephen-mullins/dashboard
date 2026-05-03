import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FixtureCard from './FixtureCard'

const baseFixture = {
  fixture: {
    id: 1,
    date: '2026-05-10T15:00:00Z',
    status: { short: 'NS' },
  },
  league: { name: 'Premier League' },
  teams: {
    home: { id: 1, name: 'Arsenal', logo: 'arsenal.png' },
    away: { id: 2, name: 'Chelsea', logo: 'chelsea.png' },
  },
  goals: { home: null, away: null },
}

describe('FixtureCard', () => {
  it('renders both team names', () => {
    render(<FixtureCard fixture={baseFixture} />)
    expect(screen.getByText('Arsenal')).toBeInTheDocument()
    expect(screen.getByText('Chelsea')).toBeInTheDocument()
  })

  it('renders the league name', () => {
    render(<FixtureCard fixture={baseFixture} />)
    expect(screen.getByText('Premier League')).toBeInTheDocument()
  })

  it('renders a kickoff time for upcoming fixtures', () => {
    render(<FixtureCard fixture={baseFixture} />)
    expect(screen.getByText(/^\d{2}:\d{2}$/)).toBeInTheDocument()
  })

  it('renders the score for finished fixtures', () => {
    const fixture = {
      ...baseFixture,
      fixture: { ...baseFixture.fixture, status: { short: 'FT' } },
      goals: { home: 2, away: 1 },
    }
    render(<FixtureCard fixture={fixture} />)
    expect(screen.getByText('2 – 1')).toBeInTheDocument()
  })

  it('renders player tags when provided', () => {
    const playersByTeamId = { 1: ['Saka', 'Rice'] }
    render(<FixtureCard fixture={baseFixture} playersByTeamId={playersByTeamId} />)
    expect(screen.getByText('Saka')).toBeInTheDocument()
    expect(screen.getByText('Rice')).toBeInTheDocument()
  })

  it('renders no player tags when playersByTeamId is empty', () => {
    render(<FixtureCard fixture={baseFixture} playersByTeamId={{}} />)
    expect(screen.queryByText('Saka')).not.toBeInTheDocument()
  })

  it('renders player tags after the team name, not before', () => {
    const playersByTeamId = { 1: ['Saka'] }
    render(<FixtureCard fixture={baseFixture} playersByTeamId={playersByTeamId} />)
    const logo = screen.getByRole('img', { name: 'Arsenal' })
    const homeTeam = logo.parentElement
    const children = Array.from(homeTeam.children)
    const logoIndex = children.indexOf(logo)
    const nameIndex = children.findIndex((el) => el.textContent === 'Arsenal')
    const tagsIndex = children.findIndex((el) => el.textContent.includes('Saka'))
    expect(logoIndex).toBeLessThan(tagsIndex)
    expect(nameIndex).toBeLessThan(tagsIndex)
  })
})
