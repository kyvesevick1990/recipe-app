'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type FavoriteButtonProps = {
  recipeId: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export default function FavoriteButton({
  recipeId,
  size = 'md',
  showLabel = false,
  className = ''
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20

  useEffect(() => {
    checkIfFavorite()
  }, [recipeId])

  async function checkIfFavorite() {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('recipe_id', recipeId)
      .maybeSingle()

    if (!error) {
      setIsFavorite(!!data)
    }
    setLoading(false)
  }

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (loading) return

    setLoading(true)

    if (isFavorite) {
      // Remove from favorites
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('recipe_id', recipeId)

      if (!error) {
        setIsFavorite(false)
      }
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('favorites')
        .insert({ recipe_id: recipeId })

      if (!error) {
        setIsFavorite(true)
      }
    }

    setLoading(false)
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`tap-target flex items-center gap-1.5 transition-all ${className}`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        size={iconSize}
        className={`transition-colors ${
          isFavorite
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400 hover:text-red-400'
        } ${loading ? 'opacity-50' : ''}`}
      />
      {showLabel && (
        <span className={`text-sm ${isFavorite ? 'text-red-500' : 'text-gray-500'}`}>
          {isFavorite ? 'Favorited' : 'Favorite'}
        </span>
      )}
    </button>
  )
}
