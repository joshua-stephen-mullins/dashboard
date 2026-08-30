import { describe, it, expect } from 'vitest'
import { filterBatches, dueDoses } from './filters'

const batches = [
  { id: '1', name: 'Orange Blossom Traditional', style: 'traditional', status: 'primary',  honey_varietal: 'orange blossom', yeast_strain: 'D47',     tags: ['dry'] },
  { id: '2', name: 'Blackberry Melomel',         style: 'melomel',     status: 'bottled',  honey_varietal: 'wildflower',     yeast_strain: '71B',     tags: ['fruit', 'sweet'] },
  { id: '3', name: 'Autumn Cyser',               style: 'cyser',       status: 'bulk_aging', honey_varietal: 'clover',       yeast_strain: 'EC-1118', tags: ['fruit'] },
]

describe('filterBatches', () => {
  it('returns everything with no filters', () => {
    expect(filterBatches(batches, {})).toHaveLength(3)
  })

  it('searches name, varietal and yeast', () => {
    expect(filterBatches(batches, { search: 'blackberry' })).toHaveLength(1)
    expect(filterBatches(batches, { search: 'clover' })[0].id).toBe('3')
    expect(filterBatches(batches, { search: 'ec-1118' })[0].id).toBe('3')
  })

  it('ignores case and surrounding whitespace', () => {
    expect(filterBatches(batches, { search: '  MELOMEL ' })).toHaveLength(1)
  })

  it('filters by style', () => {
    expect(filterBatches(batches, { styles: ['melomel', 'cyser'] })).toHaveLength(2)
  })

  it('filters by status', () => {
    expect(filterBatches(batches, { status: 'primary' })[0].id).toBe('1')
  })

  it('requires every selected tag', () => {
    expect(filterBatches(batches, { tags: ['fruit'] })).toHaveLength(2)
    expect(filterBatches(batches, { tags: ['fruit', 'sweet'] })).toHaveLength(1)
  })

  it('combines filters', () => {
    expect(filterBatches(batches, { search: 'a', styles: ['cyser'], tags: ['fruit'] })).toHaveLength(1)
  })
})

describe('dueDoses', () => {
  const now = new Date('2026-08-04T12:00:00Z')

  it('returns doses whose scheduled time has passed', () => {
    const additions = [
      { id: 'a', category: 'nutrient', scheduled_at: '2026-08-02T12:00:00Z', added_at: null },
      { id: 'b', category: 'nutrient', scheduled_at: '2026-08-08T12:00:00Z', added_at: null },
    ]
    expect(dueDoses(additions, null, now).map((d) => d.id)).toEqual(['a'])
  })

  it('excludes doses already given', () => {
    const additions = [
      { id: 'a', category: 'nutrient', scheduled_at: '2026-08-02T12:00:00Z', added_at: '2026-08-02T13:00:00Z' },
    ]
    expect(dueDoses(additions, null, now)).toHaveLength(0)
  })

  it('ignores non-nutrient additions', () => {
    const additions = [
      { id: 'f', category: 'fruit', scheduled_at: '2026-08-02T12:00:00Z', added_at: null },
    ]
    expect(dueDoses(additions, null, now)).toHaveLength(0)
  })

  it('fires a gravity-triggered dose once the must drops to the break', () => {
    const additions = [
      { id: 'd4', category: 'nutrient', scheduled_at: '2026-08-08T12:00:00Z', added_at: null, gravity_at_addition: 1.0667 },
    ]
    expect(dueDoses(additions, 1.070, now)).toHaveLength(0)
    expect(dueDoses(additions, 1.060, now).map((d) => d.id)).toEqual(['d4'])
  })
})
