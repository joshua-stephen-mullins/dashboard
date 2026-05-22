const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { isbn } = await req.json()
    if (!isbn || typeof isbn !== 'string') return json({ error: 'isbn is required' }, 400)

    const clean = isbn.replace(/[-\s]/g, '')

    // Use the search API — returns cover_i, author, and page count in one call
    const searchUrl = `https://openlibrary.org/search.json?isbn=${clean}&fields=title,author_name,cover_i,number_of_pages_median`
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'dashboard-app/1.0' },
    })
    if (!searchRes.ok) throw new Error(`Open Library responded with ${searchRes.status}`)

    const searchData = await searchRes.json() as { docs?: Array<Record<string, unknown>> }
    const doc = searchData.docs?.[0]

    if (!doc) return json({ error: 'No book found for that ISBN' }, 404)

    const title = typeof doc.title === 'string' ? doc.title : null

    let author: string | null = null
    const authorNames = doc.author_name as string[] | undefined
    if (Array.isArray(authorNames) && authorNames.length > 0) {
      author = authorNames.join(', ')
    }

    let cover_url: string | null = null
    if (typeof doc.cover_i === 'number') {
      cover_url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
    }

    const page_count = typeof doc.number_of_pages_median === 'number' ? doc.number_of_pages_median : null

    const source_url = `https://openlibrary.org/isbn/${clean}`

    return json({ title, author, cover_url, page_count, source_url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json({ error: message }, 500)
  }
})
