'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, History } from 'lucide-react'
import { supabase, Recipe } from '@/lib/supabase'
import { getRecentlyViewed } from '@/lib/localStorage'

function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export default function RecentlyViewed() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentlyViewed()
  }, [])

  async function loadRecentlyViewed() {
    const recentIds = getRecentlyViewed()

    if (recentIds.length === 0) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .in('id', recentIds)

    if (error) {
      console.error('Error loading recently viewed:', error)
      setLoading(false)
      return
    }

    // Sort by the order in recentIds (most recent first)
    const sortedRecipes = recentIds
      .map(id => data?.find(r => r.id === id))
      .filter((r): r is Recipe => r !== undefined)

    setRecipes(sortedRecipes)
    setLoading(false)
  }

  if (loading || recipes.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <History size={18} className="text-[var(--color-accent)]" />
        <h2 className="font-semibold text-lg">Recently Viewed</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin">
        {recipes.map((recipe) => {
          const totalTime = recipe.total_time_minutes ||
            ((recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)) || null

          return (
            <Link
              key={recipe.id}
              href={`/recipe/${recipe.id}`}
              className="flex-shrink-0 w-40"
            >
              <div className="card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                {/* Photo */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {recipe.photo_urls && recipe.photo_urls.length > 0 ? (
                    <img
                      src={recipe.photo_urls[0]}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      🍽️
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 mb-1">{recipe.title}</h3>
                  {totalTime && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{formatTime(totalTime)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
