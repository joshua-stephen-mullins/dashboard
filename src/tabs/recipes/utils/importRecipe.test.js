import { describe, it, expect } from 'vitest'
import {
  parseIngredient,
  parseIsoDuration,
  extractJsonLdBlocks,
  findRecipeNode,
} from './importRecipe'

describe('parseIngredient', () => {
  it('parses quantity, unit, and name', () => {
    expect(parseIngredient('2 cups flour')).toEqual({ quantity: '2', unit: 'cups', name: 'flour' })
  })

  it('parses ingredient with no unit', () => {
    expect(parseIngredient('3 eggs')).toEqual({ quantity: '3', unit: '', name: 'eggs' })
  })

  it('parses ingredient with no quantity or unit', () => {
    expect(parseIngredient('salt')).toEqual({ quantity: '', unit: '', name: 'salt' })
  })

  it('handles fractional quantities', () => {
    const result = parseIngredient('1/2 tsp salt')
    expect(result.quantity).toBe('1/2')
    expect(result.unit).toBe('tsp')
    expect(result.name).toBe('salt')
  })

  it('handles unicode fraction characters', () => {
    const result = parseIngredient('½ cup sugar')
    expect(result.quantity).toBe('½')
    expect(result.unit).toBe('cup')
    expect(result.name).toBe('sugar')
  })

  it('handles multi-word ingredient names', () => {
    const result = parseIngredient('1 lb ground beef')
    expect(result.quantity).toBe('1')
    expect(result.unit).toBe('lb')
    expect(result.name).toBe('ground beef')
  })

  it('normalises extra whitespace', () => {
    const result = parseIngredient('  2   cups   milk  ')
    expect(result.quantity).toBe('2')
    expect(result.unit).toBe('cups')
    expect(result.name).toBe('milk')
  })

  it('falls back to full string as name when nothing parses', () => {
    const result = parseIngredient('a pinch of love')
    expect(result.name).toBeTruthy()
  })
})

describe('parseIsoDuration', () => {
  it('parses minutes only', () => {
    expect(parseIsoDuration('PT30M')).toBe('30 min')
  })

  it('parses hours only', () => {
    expect(parseIsoDuration('PT2H')).toBe('2h')
  })

  it('parses hours and minutes', () => {
    expect(parseIsoDuration('PT1H30M')).toBe('1h 30min')
  })

  it('returns the original string when format is unrecognised', () => {
    expect(parseIsoDuration('unknown')).toBe('unknown')
  })

  it('handles uppercase and lowercase', () => {
    expect(parseIsoDuration('pt45m')).toBe('45 min')
  })
})

describe('extractJsonLdBlocks', () => {
  it('extracts a single JSON-LD block', () => {
    const html = `<html><script type="application/ld+json">{"@type":"Recipe"}</script></html>`
    expect(extractJsonLdBlocks(html)).toEqual(['{"@type":"Recipe"}'])
  })

  it('extracts multiple JSON-LD blocks', () => {
    const html = `
      <script type="application/ld+json">{"@type":"Recipe"}</script>
      <script type="application/ld+json">{"@type":"BreadcrumbList"}</script>
    `
    expect(extractJsonLdBlocks(html)).toHaveLength(2)
  })

  it('returns empty array when no JSON-LD blocks exist', () => {
    expect(extractJsonLdBlocks('<html><body>No schema here</body></html>')).toEqual([])
  })

  it('handles single-quoted type attribute', () => {
    const html = `<script type='application/ld+json'>{"@type":"Recipe"}</script>`
    expect(extractJsonLdBlocks(html)).toHaveLength(1)
  })

  it('returns empty array for empty string', () => {
    expect(extractJsonLdBlocks('')).toEqual([])
  })
})

describe('findRecipeNode', () => {
  it('finds a top-level Recipe node', () => {
    const json = { '@type': 'Recipe', name: 'Pasta' }
    expect(findRecipeNode(json)).toBe(json)
  })

  it('finds a Recipe node inside @graph', () => {
    const recipe = { '@type': 'Recipe', name: 'Pasta' }
    const json = { '@graph': [{ '@type': 'WebPage' }, recipe] }
    expect(findRecipeNode(json)).toBe(recipe)
  })

  it('finds a Recipe node in an array', () => {
    const recipe = { '@type': 'Recipe', name: 'Pasta' }
    const json = [{ '@type': 'BreadcrumbList' }, recipe]
    expect(findRecipeNode(json)).toBe(recipe)
  })

  it('handles @type as an array containing Recipe', () => {
    const json = { '@type': ['Recipe', 'Thing'], name: 'Pasta' }
    expect(findRecipeNode(json)).toBe(json)
  })

  it('returns null when no Recipe node exists', () => {
    expect(findRecipeNode({ '@type': 'WebPage' })).toBeNull()
  })

  it('returns null for null input', () => {
    expect(findRecipeNode(null)).toBeNull()
  })
})
