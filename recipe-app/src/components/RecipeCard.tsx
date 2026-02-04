'use client'

import Link from 'next/link'
import { Clock, Eye, Utensils } from 'lucide-react'
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

  // Get primary cuisine for placeholder
  const primaryCuisine = recipe.tags?.cuisine?.[0] || recipe.tags?.protein?.[0] || null

  return (
    <Link href={`/recipe/${recipe.id}`}>
      <div className="card overflow-hidden cursor-pointer h-full group transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
        {/* Photo */}
        <div className="aspect-video bg-gray-100 relative overflow-hidden">
          {recipe.photo_urls && recipe.photo_urls.length > 0 ? (
            <img
              src={recipe.photo_urls[0]}
              alt={recipe.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            // Styled placeholder when no photo
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--color-background)] to-[var(--color-border)]">
              <Utensils size={40} className="text-[var(--color-accent)] opacity-50 mb-2" />
              {primaryCuisine && (
                <span className="text-sm text-[var(--color-text-secondary)]">{primaryCuisine}</span>
              )}
            </div>
          )}

          {/* Hover overlay with actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

          {/* Quick actions - visible on hover (desktop) */}
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <FavoriteButton recipeId={recipe.id} size="sm" className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200" />
          </div>

          {/* View button - visible on hover (desktop) */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
            <span className="bg-white/90 text-[var(--color-text-primary)] px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 shadow-md">
              <Eye size={14} />
              View
            </span>
          </div>

          {/* Time badge - bottom left */}
          {totalTime && (
            <div className="absolute bottom-3 left-3">
              <span className="bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Clock size={12} />
                {formatTime(totalTime)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors">
            {recipe.title}
          </h3>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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
