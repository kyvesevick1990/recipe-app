'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Recipe } from '@/lib/supabase'
import FavoriteButton from './FavoriteButton'

type RecipeCompactItemProps = {
  recipe: Recipe
}

function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h${mins}m` : `${hours}h`
}

export default function RecipeCompactItem({ recipe }: RecipeCompactItemProps) {
  const totalTime = recipe.total_time_minutes ||
    ((recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)) || null

  const primaryTags = [
    ...(recipe.tags?.cuisine || []).slice(0, 1),
    ...(recipe.tags?.protein || []).slice(0, 1),
  ]

  return (
    <Link href={`/recipe/${recipe.id}`}>
      <div className="card px-3 py-2 sm:px-4 sm:py-3 cursor-pointer flex items-center gap-3 group transition-all duration-200 hover:shadow-md hover:border-[var(--color-accent)] active:scale-[0.995]">
        {/* Title */}
        <h3 className="font-medium flex-1 min-w-0 truncate group-hover:text-[var(--color-accent)] transition-colors">{recipe.title}</h3>

        {/* Tags */}
        <div className="hidden sm:flex gap-1 flex-shrink-0">
          {primaryTags.map((tag, index) => (
            <span key={index} className="tag-chip text-xs py-0.5 px-2">
              {tag}
            </span>
          ))}
        </div>

        {/* Time */}
        {totalTime && (
          <div className="flex items-center gap-1 text-sm text-gray-500 flex-shrink-0">
            <Clock size={12} />
            <span>{formatTime(totalTime)}</span>
          </div>
        )}

        {/* Favorite */}
        <FavoriteButton recipeId={recipe.id} size="sm" />
      </div>
    </Link>
  )
}
