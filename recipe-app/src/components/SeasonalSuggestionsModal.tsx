'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Leaf, Clock, X } from 'lucide-react'
import { supabase, Recipe, Ingredient } from '@/lib/supabase'
import { getCurrentSeasonalProduce, isSeasonalIngredient, getMonthName } from '@/lib/seasonalProduce'

type SeasonalRecipe = {
  recipe: Recipe
  seasonalIngredient: string
}

function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

type SeasonalSuggestionsModalProps = {
  onClose: () => void
}

export default function SeasonalSuggestionsModal({ onClose }: SeasonalSuggestionsModalProps) {
  const [seasonalRecipes, setSeasonalRecipes] = useState<SeasonalRecipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSeasonalRecipes()
  }, [])

  async function loadSeasonalRecipes() {
    const seasonalProduce = getCurrentSeasonalProduce()

    if (seasonalProduce.length === 0) {
      setLoading(false)
      return
    }

    // Get all recipes with their ingredients
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')

    if (recipesError || !recipes) {
      setLoading(false)
      return
    }

    const { data: allIngredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('*')

    if (ingredientsError || !allIngredients) {
      setLoading(false)
      return
    }

    // Group ingredients by recipe
    const ingredientsByRecipe = new Map<string, Ingredient[]>()
    allIngredients.forEach(ing => {
      const existing = ingredientsByRecipe.get(ing.recipe_id) || []
      existing.push(ing)
      ingredientsByRecipe.set(ing.recipe_id, existing)
    })

    // Find recipes with seasonal ingredients
    const matches: SeasonalRecipe[] = []

    for (const recipe of recipes) {
      const recipeIngredients = ingredientsByRecipe.get(recipe.id) || []

      // Check each ingredient
      for (const ing of recipeIngredients) {
        const matchedProduce = isSeasonalIngredient(
          ing.text || ing.item || '',
          seasonalProduce
        )

        if (matchedProduce) {
          matches.push({
            recipe,
            seasonalIngredient: matchedProduce
          })
          break // Only add each recipe once
        }
      }
    }

    // Shuffle and limit to 12 recipes (more than the section showed)
    const shuffled = matches.sort(() => Math.random() - 0.5).slice(0, 12)
    setSeasonalRecipes(shuffled)
    setLoading(false)
  }

  const currentMonth = getMonthName()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Leaf size={20} className="text-green-600" />
            <h2 className="text-lg font-semibold">In Season ({currentMonth})</h2>
          </div>
          <button
            onClick={onClose}
            className="tap-target p-1 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : seasonalRecipes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No seasonal recipes found.
              <br />
              <span className="text-sm">Add recipes with seasonal ingredients to see suggestions!</span>
            </div>
          ) : (
            <div className="space-y-2">
              {seasonalRecipes.map(({ recipe, seasonalIngredient }) => {
                const totalTime = recipe.total_time_minutes ||
                  ((recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)) || null

                return (
                  <Link
                    key={recipe.id}
                    href={`/recipe/${recipe.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-background)] transition-colors"
                  >
                    {/* Photo */}
                    <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {recipe.photo_urls && recipe.photo_urls.length > 0 ? (
                        <img
                          src={recipe.photo_urls[0]}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
                          <Leaf size={20} className="text-green-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-1">{recipe.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          <Leaf size={10} />
                          {seasonalIngredient}
                        </span>
                        {totalTime && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(totalTime)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
