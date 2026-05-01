export function filterBySearch(recipes, query) {
  if (!query.trim()) return recipes
  const q = query.toLowerCase()
  return recipes.filter((r) => r.name.toLowerCase().includes(q))
}

export function filterByTags(recipes, tags) {
  if (!tags.length) return recipes
  return recipes.filter((r) => tags.every((t) => r.tags?.includes(t)))
}

export function filterRecipes(recipes, query, tags) {
  return filterByTags(filterBySearch(recipes, query), tags)
}
