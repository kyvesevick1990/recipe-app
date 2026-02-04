'use client'

import { useState, useEffect } from 'react'
import { checkAuthCookie } from '@/lib/auth'
import LoginPage from '@/components/LoginPage'
import RecipeForm from '@/components/RecipeForm'

export default function NewRecipePage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    setAuthenticated(checkAuthCookie())
  }, [])

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

  return <RecipeForm />
}
