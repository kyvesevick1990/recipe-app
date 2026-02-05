'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, History, X } from 'lucide-react'
import { supabase, Recipe } from '@/lib/supabase'
import { getRecentlyViewed } from '@/lib/localStorage'

function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

type RecentlyViewedModalProps = {
  onClose: () => void
}

export default function RecentlyViewedModal({ onClose }: RecentlyViewedModalProps) {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <History size={20} className="text-[var(--color-accent)]" />
            <h2 className="text-lg font-semibold">Recently Viewed</h2>
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
          ) : recipes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No recently viewed recipes yet.
              <br />
              <span className="text-sm">View some recipes and they'll appear here!</span>
            </div>
          ) : (
            <div className="space-y-2">
              {recipes.map((recipe) => {
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
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-1">{recipe.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        {totalTime && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(totalTime)}
                          </span>
                        )}
                        {recipe.tags?.cuisine?.[0] && (
                          <span>{recipe.tags.cuisine[0]}</span>
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
