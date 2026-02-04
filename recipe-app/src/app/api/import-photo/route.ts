import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicApiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Extract base64 data and media type
    const matches = image.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
    }

    const mediaType = matches[1]
    const base64Data = matches[2]

    // Validate media type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(mediaType)) {
      return NextResponse.json({ error: 'Unsupported image format' }, { status: 400 })
    }

    // Use Claude to extract recipe data from image
    const prompt = `Extract the recipe from this image and return structured JSON with these exact fields:
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
  "source": "cookbook or source name if visible",
  "wine_pairing": "1-2 wine suggestions + 1 non-alcoholic, 2-3 sentences"
}

For ingredients:
- Parse amounts as numbers (e.g., "1/2" = 0.5, "1 1/2" = 1.5)
- Set scalable to false for items like bay leaves, cinnamon sticks, or items that don't logically scale
- Keep the full text in the "text" field

For directions:
- Consolidate into logical steps
- Each array element should be one complete step

If any section is not visible or readable in the image, set it to null or empty array.
Return ONLY valid JSON, no other text or markdown.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', errorText)
      return NextResponse.json({ error: 'Failed to parse recipe' }, { status: 500 })
    }

    const data = await response.json()
    const responseText = data.content[0]?.text?.trim()

    if (!responseText) {
      return NextResponse.json({ error: 'No recipe data extracted' }, { status: 500 })
    }

    // Parse the JSON response
    try {
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
    console.error('Import photo error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
