'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Leaf, Clock, ChevronRight, ChevronDown } from 'lucide-react'
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

export default function SeasonalSuggestions() {
  const [seasonalRecipes, setSeasonalRecipes] = useState<SeasonalRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)

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

    // Shuffle and limit to 6 recipes
    const shuffled = matches.sort(() => Math.random() - 0.5).slice(0, 6)
    setSeasonalRecipes(shuffled)
    setLoading(false)
  }

  if (loading) {
    return null
  }

  if (seasonalRecipes.length === 0) {
    return null
  }

  const currentMonth = getMonthName()

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 mb-4 group"
      >
        <Leaf size={18} className="text-green-600" />
        <h2 className="font-semibold text-lg">In Season Now ({currentMonth})</h2>
        {isExpanded ? (
          <ChevronDown size={18} className="text-gray-400" />
        ) : (
          <ChevronRight size={18} className="text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {seasonalRecipes.map(({ recipe, seasonalIngredient }) => {
            const totalTime = recipe.total_time_minutes ||
              ((recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)) || null

            return (
              <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                <div className="card overflow-hidden hover:shadow-lg transition-all cursor-pointer flex h-24 group">
                  {/* Photo */}
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-100 relative overflow-hidden">
                    {recipe.photo_urls && recipe.photo_urls.length > 0 ? (
                      <img
                        src={recipe.photo_urls[0]}
                        alt={recipe.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-green-50 to-green-100">
                        <Leaf size={24} className="text-green-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors">
                      {recipe.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        <Leaf size={10} />
                        {seasonalIngredient}
                      </span>
                      {totalTime && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {formatTime(totalTime)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
