'use client'

import { useState } from 'react'
import { Wine, RefreshCw, Edit2, Check, X } from 'lucide-react'
import { supabase, Recipe, Ingredient } from '@/lib/supabase'

type WinePairingProps = {
  recipe: Recipe
  ingredients: Ingredient[]
  onUpdate: (pairing: string) => void
}

export default function WinePairing({ recipe, ingredients, onUpdate }: WinePairingProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(recipe.wine_pairing || '')
  const [error, setError] = useState<string | null>(null)

  const generatePairing = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      // Get key ingredients (first 5-6 items)
      const keyIngredients = ingredients
        .slice(0, 6)
        .map(ing => ing.item || ing.text)
        .join(', ')

      const response = await fetch('/api/wine-pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: recipe.id,
          title: recipe.title,
          proteins: recipe.tags?.protein || [],
          cuisines: recipe.tags?.cuisine || [],
          ingredients: keyIngredients
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate pairing')
      }

      const data = await response.json()
      onUpdate(data.pairing)
    } catch (err) {
      setError('Failed to generate pairing. Please try again.')
      console.error(err)
    }

    setIsGenerating(false)
  }

  const saveEdit = async () => {
    const { error: updateError } = await supabase
      .from('recipes')
      .update({ wine_pairing: editText || null })
      .eq('id', recipe.id)

    if (!updateError) {
      onUpdate(editText)
      setIsEditing(false)
    }
  }

  const cancelEdit = () => {
    setEditText(recipe.wine_pairing || '')
    setIsEditing(false)
  }

  // If no pairing exists, show generate button
  if (!recipe.wine_pairing && !isGenerating) {
    return (
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <Wine size={20} className="text-[var(--color-accent)]" />
            <span>Wine & Beverage Pairing</span>
          </div>
          <button
            onClick={generatePairing}
            className="btn btn-secondary text-sm"
          >
            <RefreshCw size={16} className="mr-1" />
            Generate Pairing
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
    )
  }

  // Loading state
  if (isGenerating) {
    return (
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-2 text-gray-500">
          <Wine size={20} className="text-[var(--color-accent)]" />
          <span>Generating pairing...</span>
          <RefreshCw size={16} className="animate-spin" />
        </div>
      </div>
    )
  }

  // Display pairing
  return (
    <div className="card p-4 mb-6">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wine size={20} className="text-[var(--color-accent)]" />
          <h2 className="text-lg font-semibold">Wine & Beverage Pairing</h2>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setEditText(recipe.wine_pairing || '')
                setIsEditing(true)
              }}
              className="tap-target p-1.5 text-gray-400 hover:text-gray-600"
              title="Edit pairing"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={generatePairing}
              className="tap-target p-1.5 text-gray-400 hover:text-gray-600"
              title="Regenerate pairing"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full text-sm"
            rows={3}
            placeholder="Enter wine pairing suggestions..."
          />
          <div className="flex gap-2">
            <button onClick={saveEdit} className="btn btn-primary text-sm py-1">
              <Check size={16} className="mr-1" /> Save
            </button>
            <button onClick={cancelEdit} className="btn btn-secondary text-sm py-1">
              <X size={16} className="mr-1" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 text-sm leading-relaxed">{recipe.wine_pairing}</p>
      )}
    </div>
  )
}
