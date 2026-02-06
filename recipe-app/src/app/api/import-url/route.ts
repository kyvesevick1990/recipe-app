import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicApiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to Vercel environment variables.' }, { status: 500 })
    }

    // Fetch the webpage content
    let pageContent: string
    try {
      const pageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RecipeApp/1.0)'
        }
      })

      if (!pageResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 })
      }

      pageContent = await pageResponse.text()

      // Limit content size for API
      if (pageContent.length > 100000) {
        pageContent = pageContent.substring(0, 100000)
      }
    } catch (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 })
    }

    // Use Claude to extract recipe data
    const prompt = `Extract the recipe from this webpage content and return structured JSON with these exact fields:
{
  "title": "string",
  "servings": number,
  "prep_time_minutes": number or null,
  "cook_time_minutes": number or null,
  "total_time_minutes": number or null,
  "ingredients": [
    {
      "text": "full ingredient text",
      "amount": number or null,
      "unit": "string or null",
      "item": "ingredient name",
      "scalable": boolean
    }
  ],
  "directions": ["step 1 text", "step 2 text", ...],
  "notes": "string or null",
  "tags": {
    "protein": ["array of proteins like Beef, Pork, Chicken, Seafood, Lamb, Vegetarian, Vegan"],
    "cuisine": ["array like Mexican, Italian, Chinese, American, French, Thai, Japanese, Indian, Korean"],
    "method": ["array like Braised, Grilled, Stir-Fried, Roasted, Baked, Slow-Cooked, Fried, Raw"],
    "meal_type": ["array like Dinner, Lunch, Breakfast, Appetizer, Side, Dessert, Snack"],
    "effort": "Quick (<30 min)" or "Moderate" or "Project (2+ hours)" or null
  },
  "source": "website or cookbook name",
  "wine_pairing": "1-2 wine suggestions + 1 non-alcoholic, 2-3 sentences"
}

For ingredients:
- Parse amounts as numbers (e.g., "1/2" = 0.5, "1 1/2" = 1.5)
- Set scalable to false for items like bay leaves, cinnamon sticks, or items that don't logically scale
- Keep the full text in the "text" field as fallback

For directions:
- Consolidate fragmented steps into logical paragraphs
- Each array element should be one complete step

Return ONLY valid JSON, no other text or markdown.

Webpage content:
${pageContent}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', errorText)
      if (response.status === 401) {
        return NextResponse.json({ error: 'Invalid Anthropic API key. Please check your ANTHROPIC_API_KEY in Vercel.' }, { status: 500 })
      }
      if (response.status === 429) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again in a moment.' }, { status: 429 })
      }
      return NextResponse.json({ error: `Failed to parse recipe (API error ${response.status})` }, { status: 500 })
    }

    const data = await response.json()
    const responseText = data.content[0]?.text?.trim()

    if (!responseText) {
      return NextResponse.json({ error: 'No recipe data extracted' }, { status: 500 })
    }

    // Parse the JSON response
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const recipeData = JSON.parse(jsonMatch[0])
      return NextResponse.json({ recipe: recipeData })

    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Response was:', responseText)
      return NextResponse.json({ error: 'Failed to parse recipe data' }, { status: 500 })
    }

  } catch (error) {
    console.error('Import URL error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
