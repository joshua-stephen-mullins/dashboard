import { describe, it, expect } from 'vitest'
import { filterBySearch, filterByTags, filterRecipes } from './filters'

const recipes = [
  { name: 'Pasta Carbonara', tags: ['italian', 'pasta', 'quick'] },
  { name: 'Red Beans and Rice', tags: ['cajun', 'rice'] },
  { name: 'Beef Tacos', tags: ['mexican', 'quick'] },
  { name: 'Pasta Primavera', tags: ['italian', 'pasta', 'vegetarian'] },
]

describe('filterBySearch', () => {
  it('returns all recipes when query is empty', () => {
    expect(filterBySearch(recipes, '')).toHaveLength(4)
  })

  it('returns all recipes when query is only whitespace', () => {
    expect(filterBySearch(recipes, '   ')).toHaveLength(4)
  })

  it('filters by name case-insensitively', () => {
    expect(filterBySearch(recipes, 'pasta')).toHaveLength(2)
    expect(filterBySearch(recipes, 'PASTA')).toHaveLength(2)
  })

  it('returns matching recipe by partial name', () => {
    const result = filterBySearch(recipes, 'taco')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Beef Tacos')
  })

  it('returns empty array when no recipes match', () => {
    expect(filterBySearch(recipes, 'sushi')).toHaveLength(0)
  })

  it('returns empty array when given empty recipes', () => {
    expect(filterBySearch([], 'pasta')).toHaveLength(0)
  })
})

describe('filterByTags', () => {
  it('returns all recipes when tags array is empty', () => {
    expect(filterByTags(recipes, [])).toHaveLength(4)
  })

  it('filters recipes that include a single tag', () => {
    expect(filterByTags(recipes, ['italian'])).toHaveLength(2)
  })

  it('requires all tags to match (AND logic)', () => {
    const result = filterByTags(recipes, ['italian', 'quick'])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Pasta Carbonara')
  })

  it('returns empty array when no recipes match all tags', () => {
    expect(filterByTags(recipes, ['italian', 'cajun'])).toHaveLength(0)
  })

  it('handles recipes with no tags', () => {
    const noTagRecipes = [{ name: 'Plain Rice', tags: [] }, ...recipes]
    expect(filterByTags(noTagRecipes, ['italian'])).toHaveLength(2)
  })

  it('handles recipes where tags is undefined', () => {
    const noTagRecipes = [{ name: 'Plain Rice' }, ...recipes]
    expect(filterByTags(noTagRecipes, ['italian'])).toHaveLength(2)
  })
})

describe('filterRecipes', () => {
  it('applies both search and tag filters together', () => {
    const result = filterRecipes(recipes, 'pasta', ['quick'])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Pasta Carbonara')
  })

  it('returns all recipes when both search and tags are empty', () => {
    expect(filterRecipes(recipes, '', [])).toHaveLength(4)
  })

  it('returns empty array when search matches but tags do not', () => {
    expect(filterRecipes(recipes, 'pasta', ['cajun'])).toHaveLength(0)
  })
})
