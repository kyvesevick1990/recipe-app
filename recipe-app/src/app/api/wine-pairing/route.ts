import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { recipeId, title, proteins, cuisines, ingredients } = await request.json()

    if (!recipeId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicApiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Build the prompt
    const prompt = `Suggest wine and beverage pairings for this dish:

Title: ${title}
${proteins?.length ? `Proteins: ${proteins.join(', ')}` : ''}
${cuisines?.length ? `Cuisine: ${cuisines.join(', ')}` : ''}
${ingredients ? `Key ingredients: ${ingredients}` : ''}

Provide:
1. 1-2 specific wine recommendations (include grape varietal and region if relevant)
2. 1 non-alcoholic alternative

Keep your response to 2-3 sentences total. Be specific and helpful.`

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
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
      return NextResponse.json({ error: 'Failed to generate pairing' }, { status: 500 })
    }

    const data = await response.json()
    const pairing = data.content[0]?.text?.trim()

    if (!pairing) {
      return NextResponse.json({ error: 'No pairing generated' }, { status: 500 })
    }

    // Save to database
    const { error: updateError } = await supabase
      .from('recipes')
      .update({ wine_pairing: pairing })
      .eq('id', recipeId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: 'Failed to save pairing' }, { status: 500 })
    }

    return NextResponse.json({ pairing })

  } catch (error) {
    console.error('Wine pairing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
