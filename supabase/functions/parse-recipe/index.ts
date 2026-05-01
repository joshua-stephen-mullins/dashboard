const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Ingredient {
  quantity: string
  unit: string
  name: string
}

interface ParsedRecipe {
  name?: string
  ingredients?: Ingredient[]
  instructions?: string
  tags?: string[]
  servings?: number
  cook_time?: string
  image_url?: string
}

const UNITS = new Set([
  'cup', 'cups', 'tbsp', 'tsp', 'tablespoon', 'tablespoons',
  'teaspoon', 'teaspoons', 'oz', 'ounce', 'ounces', 'lb', 'lbs',
  'pound', 'pounds', 'g', 'gram', 'grams', 'kg', 'ml', 'l',
  'liter', 'liters', 'pinch', 'dash', 'handful', 'clove', 'cloves',
  'slice', 'slices', 'can', 'cans', 'package', 'packages', 'bunch',
])

function parseIngredient(raw: string): Ingredient {
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

function parseIsoDuration(iso: string): string {
  const match = iso.match(/P(?:T?(\d+)H)?(?:T?(\d+)M)?/i)
  if (!match) return iso
  const hours = parseInt(match[1] || '0')
  const mins = parseInt(match[2] || '0')
  if (hours && mins) return `${hours}h ${mins}min`
  if (hours) return `${hours}h`
  if (mins) return `${mins} min`
  return iso
}

function extractJsonLdBlocks(html: string): string[] {
  const blocks: string[] = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) blocks.push(m[1])
  return blocks
}

// deno-lint-ignore no-explicit-any
function findRecipeNode(json: any): any | null {
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

function parseRecipeNode(node: Record<string, unknown>): ParsedRecipe {
  // Instructions
  let instructions = ''
  const rawInstr = node.recipeInstructions
  if (typeof rawInstr === 'string') {
    instructions = rawInstr
  } else if (Array.isArray(rawInstr)) {
    instructions = rawInstr
      .map((s, idx) => {
        if (typeof s === 'string') return `${idx + 1}. ${s}`
        const step = s as Record<string, string>
        return `${idx + 1}. ${step.text || step.name || ''}`
      })
      .join('\n')
  }

  // Ingredients
  const ingredients: Ingredient[] = Array.isArray(node.recipeIngredient)
    ? (node.recipeIngredient as string[]).map(parseIngredient)
    : []

  // Tags
  let tags: string[] = []
  const kw = node.keywords
  if (typeof kw === 'string') tags = kw.split(',').map((t) => t.trim()).filter(Boolean)
  else if (Array.isArray(kw)) tags = kw.map(String)

  // Servings
  let servings: number | undefined
  const yieldVal = node.recipeYield
  if (yieldVal) {
    const n = parseInt(Array.isArray(yieldVal) ? String(yieldVal[0]) : String(yieldVal))
    if (!isNaN(n)) servings = n
  }

  // Cook time
  let cook_time: string | undefined
  const time = node.totalTime || node.cookTime
  if (time && typeof time === 'string') cook_time = parseIsoDuration(time)

  // Image
  let image_url: string | undefined
  const img = node.image
  if (typeof img === 'string') image_url = img
  else if (Array.isArray(img)) image_url = (img[0] as Record<string, string>)?.url ?? String(img[0])
  else if (img && typeof img === 'object') image_url = (img as Record<string, string>).url

  return {
    name: typeof node.name === 'string' ? node.name : undefined,
    ingredients,
    instructions,
    tags,
    servings,
    cook_time,
    image_url,
  }
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
    const { url } = await req.json()
    if (!url || typeof url !== 'string') return json({ error: 'url is required' }, 400)

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    let html: string
    if (res.ok) {
      html = await res.text()
    } else if (res.status === 403 || res.status === 401 || res.status === 429) {
      // Site blocks datacenter IPs — fall back to Jina Reader which handles anti-bot measures
      const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
        headers: { 'X-Return-Format': 'html' },
      })
      if (!jinaRes.ok) throw new Error(`Couldn't fetch that URL (${res.status})`)
      html = await jinaRes.text()
    } else {
      throw new Error(`Couldn't fetch that URL (${res.status})`)
    }

    const blocks = extractJsonLdBlocks(html)

    for (const block of blocks) {
      try {
        const parsed = JSON.parse(block)
        const node = findRecipeNode(parsed)
        if (node) return json(parseRecipeNode(node))
      } catch {
        // malformed JSON-LD, skip
      }
    }

    return json({ error: 'No recipe data found on this page. Try adding it manually.' }, 422)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json({ error: message }, 500)
  }
})
