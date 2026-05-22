import { describe, it, expect } from 'vitest'
import { filterBooks } from './filters'

const books = [
  { id: '1', title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: ['fantasy', 'classic'], status: 'read', rating: 5 },
  { id: '2', title: 'Dune', author: 'Frank Herbert', genre: ['sci-fi'], status: 'reading', rating: 4 },
  { id: '3', title: 'Project Hail Mary', author: 'Andy Weir', genre: ['sci-fi'], status: 'unread', rating: null },
  { id: '4', title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: ['fantasy'], status: 'dnf', rating: 3 },
]

describe('filterBooks', () => {
  it('returns all books with no filters', () => {
    expect(filterBooks(books)).toHaveLength(4)
  })

  it('filters by title search (case-insensitive)', () => {
    expect(filterBooks(books, { search: 'dune' })).toHaveLength(1)
    expect(filterBooks(books, { search: 'dune' })[0].id).toBe('2')
  })

  it('filters by author search', () => {
    const result = filterBooks(books, { search: 'weir' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })

  it('returns no results for non-matching search', () => {
    expect(filterBooks(books, { search: 'xyz123' })).toHaveLength(0)
  })

  it('filters by single genre', () => {
    const result = filterBooks(books, { genres: ['sci-fi'] })
    expect(result).toHaveLength(2)
  })

  it('filters by multiple genres (AND logic)', () => {
    const result = filterBooks(books, { genres: ['fantasy', 'classic'] })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by status', () => {
    const result = filterBooks(books, { status: 'reading' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('filters by rating', () => {
    const result = filterBooks(books, { rating: 5 })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('combines multiple filters', () => {
    const result = filterBooks(books, { genres: ['sci-fi'], status: 'reading' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('handles books with null genre array', () => {
    const withNull = [{ ...books[0], genre: null }]
    expect(filterBooks(withNull, { genres: ['fantasy'] })).toHaveLength(0)
  })
})
