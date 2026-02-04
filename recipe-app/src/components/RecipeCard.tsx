'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Recipe } from '@/lib/supabase'
import FavoriteButton from './FavoriteButton'

type RecipeCardProps = {
  recipe: Recipe
}

function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = recipe.total_time_minutes || 
    ((recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)) || null

  const allTags = [
    ...(recipe.tags?.protein || []),
    ...(recipe.tags?.cuisine || []),
    ...(recipe.tags?.method || []),
  ].slice(0, 3)

  return (
    <Link href={`/recipe/${recipe.id}`}>
      <div className="card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        {/* Photo */}
        <div className="aspect-video bg-gray-100 relative overflow-hidden">
          {recipe.photo_urls && recipe.photo_urls.length > 0 ? (
            <img
              src={recipe.photo_urls[0]}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🍽️
            </div>
          )}
          {/* Favorite button */}
          <div className="absolute top-2 right-2">
            <FavoriteButton recipeId={recipe.id} size="sm" />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{recipe.title}</h3>
          
          {/* Time */}
          {totalTime && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
              <Clock size={14} />
              <span>{formatTime(totalTime)}</span>
            </div>
          )}

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {allTags.map((tag, index) => (
                <span key={index} className="tag-chip text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
