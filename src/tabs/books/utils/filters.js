export function filterBooks(books, { search = '', genres = [], status = null, rating = null } = {}) {
  const q = search.toLowerCase().trim()
  return books.filter((book) => {
    if (q) {
      const inTitle = book.title?.toLowerCase().includes(q)
      const inAuthor = book.author?.toLowerCase().includes(q)
      if (!inTitle && !inAuthor) return false
    }
    if (genres.length > 0) {
      const bookGenres = book.genre ?? []
      if (!genres.every((g) => bookGenres.includes(g))) return false
    }
    if (status !== null && book.status !== status) return false
    if (rating !== null && book.rating !== rating) return false
    return true
  })
}
