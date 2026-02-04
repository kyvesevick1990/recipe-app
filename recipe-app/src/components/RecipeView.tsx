'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Minus, Plus, Edit, MessageSquarePlus, X, Check } from 'lucide-react'
import { supabase, Recipe, Ingredient, Direction } from '@/lib/supabase'
import FavoriteButton from './FavoriteButton'
import PrintRecipe from './PrintRecipe'

type RecipeViewProps = {
  recipeId: string
}

function formatTime(minutes: number | null): string {
  if (!minutes) return '-'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function scaleAmount(amount: number | null, originalServings: number, newServings: number): number | null {
  if (amount === null) return null
  return (amount / originalServings) * newServings
}

function formatAmount(amount: number | null): string {
  if (amount === null) return ''
  
  // Handle common fractions
  const rounded = Math.round(amount * 4) / 4
  
  if (rounded === Math.floor(rounded)) {
    return rounded.toString()
  }
  
  const whole = Math.floor(rounded)
  const fraction = rounded - whole
  
  let fractionStr = ''
  if (Math.abs(fraction - 0.25) < 0.01) fractionStr = '¼'
  else if (Math.abs(fraction - 0.5) < 0.01) fractionStr = '½'
  else if (Math.abs(fraction - 0.75) < 0.01) fractionStr = '¾'
  else if (Math.abs(fraction - 0.33) < 0.1) fractionStr = '⅓'
  else if (Math.abs(fraction - 0.67) < 0.1) fractionStr = '⅔'
  else return rounded.toFixed(1)
  
  return whole > 0 ? `${whole} ${fractionStr}` : fractionStr
}

export default function RecipeView({ recipeId }: RecipeViewProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [directions, setDirections] = useState<Direction[]>([])
  const [loading, setLoading] = useState(true)
  const [servings, setServings] = useState(4)
  const [originalServings, setOriginalServings] = useState(4)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set())
  const [checkedDirections, setCheckedDirections] = useState<Set<string>>(new Set())
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    loadRecipe()
  }, [recipeId])

  async function loadRecipe() {
    setLoading(true)
    
    const [recipeRes, ingredientsRes, directionsRes] = await Promise.all([
      supabase.from('recipes').select('*').eq('id', recipeId).single(),
      supabase.from('ingredients').select('*').eq('recipe_id', recipeId).order('sort_order'),
      supabase.from('directions').select('*').eq('recipe_id', recipeId).order('step_number'),
    ])

    if (recipeRes.data) {
      setRecipe(recipeRes.data)
      setServings(recipeRes.data.servings)
      setOriginalServings(recipeRes.data.servings)
    }
    if (ingredientsRes.data) setIngredients(ingredientsRes.data)
    if (directionsRes.data) setDirections(directionsRes.data)
    
    setLoading(false)
  }

  const toggleIngredient = (id: string) => {
    const newChecked = new Set(checkedIngredients)
    if (newChecked.has(id)) {
      newChecked.delete(id)
    } else {
      newChecked.add(id)
    }
    setCheckedIngredients(newChecked)
  }

  const toggleDirection = (id: string) => {
    const newChecked = new Set(checkedDirections)
    if (newChecked.has(id)) {
      newChecked.delete(id)
    } else {
      newChecked.add(id)
    }
    setCheckedDirections(newChecked)
  }

  const startEditingNote = (direction: Direction) => {
    setEditingNote(direction.id)
    setNoteText(direction.user_note || '')
  }

  const saveNote = async (directionId: string) => {
    await supabase
      .from('directions')
      .update({ user_note: noteText || null })
      .eq('id', directionId)
    
    setDirections(directions.map(d => 
      d.id === directionId ? { ...d, user_note: noteText || null } : d
    ))
    setEditingNote(null)
    setNoteText('')
  }

  const isScaled = servings !== originalServings

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading recipe...</div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Recipe not found</p>
          <Link href="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    )
  }

  const allTags = [
    ...(recipe.tags?.protein || []),
    ...(recipe.tags?.cuisine || []),
    ...(recipe.tags?.method || []),
    ...(recipe.tags?.meal_type || []),
    recipe.tags?.effort,
  ].filter(Boolean)

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--color-background)] border-b border-[var(--color-border)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="tap-target flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            {recipe && (
              <PrintRecipe
                recipe={recipe}
                ingredients={ingredients}
                directions={directions}
                currentServings={servings}
                originalServings={originalServings}
              />
            )}
            <FavoriteButton recipeId={recipeId} size="md" />
            <Link href={`/recipe/${recipeId}/edit`} className="tap-target flex items-center gap-1 text-gray-600 hover:text-gray-900">
              <Edit size={18} />
              <span className="text-sm">Edit</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {/* Photo */}
        {recipe.photo_urls && recipe.photo_urls.length > 0 && (
          <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mt-4 mb-6">
            <img
              src={recipe.photo_urls[0]}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl font-bold mb-4 mt-6">{recipe.title}</h1>

        {/* Servings Control */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-gray-600">Servings:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="tap-target btn btn-secondary p-2"
            >
              <Minus size={18} />
            </button>
            <span className="text-xl font-semibold w-8 text-center">{servings}</span>
            <button
              onClick={() => setServings(servings + 1)}
              className="tap-target btn btn-secondary p-2"
            >
              <Plus size={18} />
            </button>
          </div>
          {isScaled && (
            <button
              onClick={() => setServings(originalServings)}
              className="text-sm text-[var(--color-accent)] hover:underline"
            >
              Reset to {originalServings}
            </button>
          )}
        </div>

        {/* Time Info */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
          {recipe.prep_time_minutes && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>Prep: {formatTime(recipe.prep_time_minutes)}</span>
            </div>
          )}
          {recipe.cook_time_minutes && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>Cook: {formatTime(recipe.cook_time_minutes)}</span>
            </div>
          )}
          {recipe.total_time_minutes && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>Total: {formatTime(recipe.total_time_minutes)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {allTags.map((tag, index) => (
              <span key={index} className="tag-chip">{tag}</span>
            ))}
          </div>
        )}

        {/* Ingredients */}
        <div className="card p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
          <ul className="space-y-3">
            {ingredients.map((ing) => {
              const scaledAmount = ing.scalable 
                ? scaleAmount(ing.amount, originalServings, servings)
                : ing.amount
              const showUnscaled = isScaled && !ing.scalable

              return (
                <li key={ing.id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checkedIngredients.has(ing.id)}
                    onChange={() => toggleIngredient(ing.id)}
                    className="recipe-checkbox mt-1"
                  />
                  <span className={checkedIngredients.has(ing.id) ? 'checked-item' : ''}>
                    {ing.amount !== null ? (
                      <>
                        <strong>{formatAmount(scaledAmount)}</strong>
                        {ing.unit && ` ${ing.unit}`}
                        {ing.item && ` ${ing.item}`}
                        {showUnscaled && (
                          <span className="text-amber-600 text-sm ml-2">(unscaled from original)</span>
                        )}
                      </>
                    ) : (
                      ing.text
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Directions */}
        <div className="card p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Directions</h2>
          <ol className="space-y-4">
            {directions.map((dir) => (
              <li key={dir.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={checkedDirections.has(dir.id)}
                  onChange={() => toggleDirection(dir.id)}
                  className="recipe-checkbox mt-1"
                />
                <div className="flex-1">
                  <div className={checkedDirections.has(dir.id) ? 'checked-item' : ''}>
                    <span className="font-medium">{dir.step_number}.</span> {dir.text}
                  </div>
                  
                  {/* User Note */}
                  {dir.user_note && editingNote !== dir.id && (
                    <div 
                      className="mt-2 p-2 bg-amber-50 border-l-2 border-amber-400 text-sm text-amber-800 cursor-pointer hover:bg-amber-100"
                      onClick={() => startEditingNote(dir)}
                    >
                      💬 {dir.user_note}
                    </div>
                  )}

                  {/* Note Editor */}
                  {editingNote === dir.id ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add your note..."
                        className="flex-1 text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => saveNote(dir.id)}
                        className="tap-target btn btn-primary p-2"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => setEditingNote(null)}
                        className="tap-target btn btn-secondary p-2"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : !dir.user_note && (
                    <button
                      onClick={() => startEditingNote(dir)}
                      className="mt-1 text-sm text-gray-400 hover:text-[var(--color-accent)] flex items-center gap-1"
                    >
                      <MessageSquarePlus size={14} />
                      Add note
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Notes */}
        {recipe.notes && (
          <div className="card p-4 mb-6">
            <h2 className="text-xl font-semibold mb-2">Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{recipe.notes}</p>
          </div>
        )}

        {/* Source */}
        {recipe.source && (
          <div className="text-center text-sm text-gray-500 mt-8">
            Source: {recipe.source}
          </div>
        )}
      </div>
    </div>
  )
}
