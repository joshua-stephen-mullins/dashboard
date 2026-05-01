const UNITS = new Set([
  'cup', 'cups', 'tbsp', 'tsp', 'tablespoon', 'tablespoons',
  'teaspoon', 'teaspoons', 'oz', 'ounce', 'ounces', 'lb', 'lbs',
  'pound', 'pounds', 'g', 'gram', 'grams', 'kg', 'ml', 'l',
  'liter', 'liters', 'pinch', 'dash', 'handful', 'clove', 'cloves',
  'slice', 'slices', 'can', 'cans', 'package', 'packages', 'bunch',
])

function parseIngredient(raw) {
  const cleaned = raw.trim().replace(/\s+/g, ' ')
  const parts = cleaned.split(' ')
  let i = 0

  let quantity = ''
  if (parts[i] && /^[\d¼½¾⅓⅔⅛⅜⅝⅞.,\-–\/]+$/.test(parts[i])) {
    quantity = parts[i]
    i++
  }

  let unit = ''
  const candidate = parts[i]?.toLowerCase().replace(/[.,]$/, '')
  if (candidate && UNITS.has(candidate)) {
    unit = parts[i].replace(/[.,]$/, '')
    i++
  }

  const name = parts.slice(i).join(' ')
  return { quantity, unit, name: name || cleaned }
}

function parseIsoDuration(iso) {
  const match = iso.match(/P(?:T?(\d+)H)?(?:T?(\d+)M)?/i)
  if (!match) return iso
  const hours = parseInt(match[1] || '0')
  const mins = parseInt(match[2] || '0')
  if (hours && mins) return `${hours}h ${mins}min`
  if (hours) return `${hours}h`
  if (mins) return `${mins} min`
  return iso
}

function extractJsonLdBlocks(html) {
  const blocks = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) blocks.push(m[1])
  return blocks
}

function findRecipeNode(json) {
  if (!json) return null
  if (json['@graph']) {
    for (const node of json['@graph']) {
      const found = findRecipeNode(node)
      if (found) return found
    }
  }
  const type = json['@type']
  if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) return json
  if (Array.isArray(json)) {
    for (const item of json) {
      const found = findRecipeNode(item)
      if (found) return found
    }
  }
  return null
}

function parseRecipeNode(node, sourceUrl) {
  let instructions = ''
  const rawInstr = node.recipeInstructions
  if (typeof rawInstr === 'string') {
    instructions = rawInstr
  } else if (Array.isArray(rawInstr)) {
    instructions = rawInstr
      .map((s, idx) => {
        if (typeof s === 'string') return `${idx + 1}. ${s}`
        return `${idx + 1}. ${s.text || s.name || ''}`
      })
      .join('\n')
  }

  const ingredients = Array.isArray(node.recipeIngredient)
    ? node.recipeIngredient.map(parseIngredient)
    : []

  let tags = []
  const kw = node.keywords
  if (typeof kw === 'string') tags = kw.split(',').map((t) => t.trim()).filter(Boolean)
  else if (Array.isArray(kw)) tags = kw.map(String)

  let servings
  const yieldVal = node.recipeYield
  if (yieldVal) {
    const n = parseInt(Array.isArray(yieldVal) ? yieldVal[0] : yieldVal)
    if (!isNaN(n)) servings = n
  }

  let cook_time
  const time = node.totalTime || node.cookTime
  if (time && typeof time === 'string') cook_time = parseIsoDuration(time)

  let image_url
  const img = node.image
  if (typeof img === 'string') image_url = img
  else if (Array.isArray(img)) image_url = img[0]?.url ?? img[0]
  else if (img?.url) image_url = img.url

  return {
    name: node.name,
    ingredients,
    instructions,
    tags,
    servings,
    cook_time,
    image_url,
    source_url: sourceUrl,
  }
}

async function fetchHtml(url) {
  const proxies = [
    async () => {
      const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`)
      if (!res.ok) throw new Error(`${res.status}`)
      return res.text()
    },
    async () => {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
      if (!res.ok) throw new Error(`${res.status}`)
      const { contents } = await res.json()
      if (!contents) throw new Error('empty')
      return contents
    },
  ]

  for (const attempt of proxies) {
    try {
      return await attempt()
    } catch {
      // try next proxy
    }
  }

  throw new Error('Unable to fetch this URL. Try adding the recipe manually.')
}

export async function importRecipe(url) {
  const html = await fetchHtml(url)

  const blocks = extractJsonLdBlocks(html)
  for (const block of blocks) {
    try {
      const node = findRecipeNode(JSON.parse(block))
      if (node) return parseRecipeNode(node, url)
    } catch {
      // malformed JSON-LD, skip
    }
  }

  throw new Error('No recipe data found on this page. Try adding it manually.')
}
