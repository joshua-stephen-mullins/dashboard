import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import RecipeCard from './RecipeCard'

const baseRecipe = {
  id: '1',
  name: 'Pasta Carbonara',
  cook_time: '30 min',
  servings: 4,
  tags: ['italian', 'pasta'],
  image_url: null,
}

describe('RecipeCard', () => {
  it('renders the recipe name', () => {
    render(<RecipeCard recipe={baseRecipe} onClick={() => {}} />)
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
  })

  it('renders cook time when provided', () => {
    render(<RecipeCard recipe={baseRecipe} onClick={() => {}} />)
    expect(screen.getByText('⏱ 30 min')).toBeInTheDocument()
  })

  it('renders servings when provided', () => {
    render(<RecipeCard recipe={baseRecipe} onClick={() => {}} />)
    expect(screen.getByText('👤 4')).toBeInTheDocument()
  })

  it('renders tags', () => {
    render(<RecipeCard recipe={baseRecipe} onClick={() => {}} />)
    expect(screen.getByText('italian')).toBeInTheDocument()
    expect(screen.getByText('pasta')).toBeInTheDocument()
  })

  it('renders image when image_url is provided', () => {
    const recipe = { ...baseRecipe, image_url: 'https://example.com/pasta.jpg' }
    render(<RecipeCard recipe={recipe} onClick={() => {}} />)
    const img = screen.getByRole('img', { name: 'Pasta Carbonara' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/pasta.jpg')
  })

  it('renders placeholder when image_url is null', () => {
    render(<RecipeCard recipe={baseRecipe} onClick={() => {}} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('🍽')).toBeInTheDocument()
  })

  it('does not render cook time when not provided', () => {
    const recipe = { ...baseRecipe, cook_time: null }
    render(<RecipeCard recipe={recipe} onClick={() => {}} />)
    expect(screen.queryByText(/⏱/)).not.toBeInTheDocument()
  })

  it('does not render servings when not provided', () => {
    const recipe = { ...baseRecipe, servings: null }
    render(<RecipeCard recipe={recipe} onClick={() => {}} />)
    expect(screen.queryByText(/👤/)).not.toBeInTheDocument()
  })

  it('shows overflow count when there are more than 3 tags', () => {
    const recipe = { ...baseRecipe, tags: ['a', 'b', 'c', 'd', 'e'] }
    render(<RecipeCard recipe={recipe} onClick={() => {}} />)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('calls onClick when the card is clicked', async () => {
    const onClick = vi.fn()
    render(<RecipeCard recipe={baseRecipe} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
