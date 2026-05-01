import { useMemo, useState } from 'react'
import { useRecipes } from './hooks/useRecipes'
import { filterRecipes } from './utils/filters'
import RecipeCard from './components/RecipeCard/RecipeCard'
import RecipeFormModal from './components/RecipeFormModal/RecipeFormModal'
import RecipeDetailModal from './components/RecipeDetailModal/RecipeDetailModal'
import styles from './Recipes.module.css'

export default function RecipesTab() {
  const { data: recipes = [], isLoading, add, update, remove } = useRecipes()

  const [search, setSearch] = useState('')
  const [activeTags, setActiveTags] = useState([])
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [formRecipe, setFormRecipe] = useState(undefined)
  const [formOpen, setFormOpen] = useState(false)

  const allTags = useMemo(() => {
    const set = new Set()
    for (const r of recipes) {
      for (const t of r.tags ?? []) set.add(t)
    }
    return [...set].sort()
  }, [recipes])

  const filtered = useMemo(
    () => filterRecipes(recipes, search, activeTags),
    [recipes, search, activeTags],
  )

  function toggleTag(tag) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function openAdd() {
    setFormRecipe(undefined)
    setFormOpen(true)
  }

  function openEdit(recipe) {
    setSelectedRecipe(null)
    setFormRecipe(recipe)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setFormRecipe(undefined)
  }

  async function handleSave(payload) {
    if (payload.id) {
      await update.mutateAsync(payload)
    } else {
      await add.mutateAsync(payload)
    }
  }

  async function handleDelete(id) {
    await remove.mutateAsync(id)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Recipes</h1>
          {recipes.length > 0 && (
            <span className={styles.count}>{recipes.length} saved</span>
          )}
        </div>
        <button className={styles.addBtn} onClick={openAdd} type="button">
          + Add Recipe
        </button>
      </header>

      <div className={styles.controls}>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search recipes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {allTags.length > 0 && (
          <div className={styles.tagFilters}>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`${styles.tagFilter}${activeTags.includes(tag) ? ` ${styles.active}` : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loadingRow}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      ) : filtered.length > 0 ? (
        <div className={styles.grid}>
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => setSelectedRecipe(recipe)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🍳</span>
          {recipes.length === 0 ? (
            <>
              <p className={styles.emptyText}>No recipes yet</p>
              <p className={styles.emptySubtext}>Add one manually or import from a URL</p>
            </>
          ) : (
            <p className={styles.emptyText}>No recipes match your search</p>
          )}
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onEdit={openEdit}
          onDelete={handleDelete}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {formOpen && (
        <RecipeFormModal
          recipe={formRecipe}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
