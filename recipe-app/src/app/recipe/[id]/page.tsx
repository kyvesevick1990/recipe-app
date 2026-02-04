'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { checkAuthCookie } from '@/lib/auth'
import { addToRecentlyViewed } from '@/lib/localStorage'
import LoginPage from '@/components/LoginPage'
import RecipeView from '@/components/RecipeView'

export default function RecipePage() {
  const params = useParams()
  const recipeId = params.id as string
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const isAuth = checkAuthCookie()
    setAuthenticated(isAuth)

    // Track this recipe as recently viewed if authenticated
    if (isAuth && recipeId) {
      addToRecentlyViewed(recipeId)
    }
  }, [recipeId])

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!authenticated) {
    return <LoginPage onSuccess={() => setAuthenticated(true)} />
  }

  return <RecipeView recipeId={recipeId} />
}
