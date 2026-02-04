'use client'

import Link from 'next/link'
import { Clock, Utensils } from 'lucide-react'
import { Recipe } from '@/lib/supabase'
import FavoriteButton from './FavoriteButton'

type RecipeListItemProps = {
  recipe: Recipe
}

function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export default function RecipeListItem({ recipe }: RecipeListItemProps) {
  const totalTime = recipe.total_time_minutes ||
    ((recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)) || null

  const allTags = [
    ...(recipe.tags?.protein || []),
    ...(recipe.tags?.cuisine || []),
    ...(recipe.tags?.method || []),
  ].slice(0, 4)

  // Get primary cuisine for placeholder
  const primaryCuisine = recipe.tags?.cuisine?.[0] || recipe.tags?.protein?.[0] || null

  return (
    <Link href={`/recipe/${recipe.id}`}>
      <div className="card overflow-hidden cursor-pointer flex group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]">
        {/* Photo */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-100 relative overflow-hidden">
          {recipe.photo_urls && recipe.photo_urls.length > 0 ? (
            <img
              src={recipe.photo_urls[0]}
              alt={recipe.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--color-background)] to-[var(--color-border)]">
              <Utensils size={24} className="text-[var(--color-accent)] opacity-50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base sm:text-lg line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">{recipe.title}</h3>
              <FavoriteButton recipeId={recipe.id} size="sm" />
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {allTags.map((tag, index) => (
                  <span key={index} className="tag-chip text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Time */}
          {totalTime && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
              <Clock size={14} />
              <span>{formatTime(totalTime)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
