'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Plus, X, LogOut, Heart, Shuffle, History } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, Recipe, RecipeBook } from '@/lib/supabase'
import { checkAuthCookie, clearAuthCookie } from '@/lib/auth'
import { getViewMode, setViewMode, ViewMode } from '@/lib/localStorage'
import LoginPage from '@/components/LoginPage'
import RecipeCard from '@/components/RecipeCard'
import RecipeListItem from '@/components/RecipeListItem'
import RecipeCompactItem from '@/components/RecipeCompactItem'
import TagFilter from '@/components/TagFilter'
import RecentlyViewedModal from '@/components/RecentlyViewedModal'
import SeasonalSuggestions from '@/components/SeasonalSuggestions'
import ThemeToggle from '@/components/ThemeToggle'
import ViewModeToggle from '@/components/ViewModeToggle'
import BookFilter from '@/components/BookFilter'
import ManageBooksModal from '@/components/ManageBooksModal'

const TAG_OPTIONS = {
  protein: ['Beef', 'Pork', 'Chicken', 'Seafood', 'Lamb', 'Vegetarian', 'Vegan'],
  cuisine: ['Mexican', 'Italian', 'Chinese', 'American', 'French', 'Thai', 'Japanese', 'Indian', 'Korean'],
  method: ['Braised', 'Grilled', 'Stir-Fried', 'Roasted', 'Baked', 'Slow-Cooked', 'Fried', 'Raw'],
  meal_type: ['Dinner', 'Lunch', 'Breakfast', 'Appetizer', 'Side', 'Dessert', 'Snack'],
  effort: ['Quick (<30 min)', 'Moderate', 'Project (2+ hours)'],
}

export default function Home() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [isShuffling, setIsShuffling] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<{
    protein: string[]
    cuisine: string[]
    method: string[]
    meal_type: string[]
    effort: string[]
  }>({
    protein: [],
    cuisine: [],
    method: [],
    meal_type: [],
    effort: [],
  })
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewModeState] = useState<ViewMode>('tile')
  const [books, setBooks] = useState<RecipeBook[]>([])
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [showManageBooks, setShowManageBooks] = useState(false)
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const isAuth = checkAuthCookie()
    setAuthenticated(isAuth)

    if (isAuth) {
      loadRecipes()
      loadFavorites()
      loadBooks()
    }

    // Load view mode preference
    setViewModeState(getViewMode())
  }, [])

  const handleViewModeChange = (mode: ViewMode) => {
    setViewModeState(mode)
    setViewMode(mode)
  }

  async function loadFavorites() {
    const { data, error } = await supabase
      .from('favorites')
      .select('recipe_id')

    if (!error && data) {
      setFavoriteIds(new Set(data.map(f => f.recipe_id)))
    }
  }

  async function loadBooks() {
    const { data, error } = await supabase
      .from('recipe_books')
      .select('*')
      .order('sort_order')

    if (!error && data) {
      setBooks(data)
    }
  }

  async function loadRecipes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('title')

    if (error) {
      console.error('Error loading recipes:', error)
    } else {
      setRecipes(data || [])
    }
    setLoading(false)
  }

  const handleLoginSuccess = () => {
    setAuthenticated(true)
    loadRecipes()
  }

  const handleLogout = () => {
    clearAuthCookie()
    setAuthenticated(false)
    setRecipes([])
  }

  const clearFilters = () => {
    setFilters({
      protein: [],
      cuisine: [],
      method: [],
      meal_type: [],
      effort: [],
    })
    setSearchQuery('')
    setShowFavoritesOnly(false)
    setSelectedBookId(null)
  }

  const hasActiveFilters = Object.values(filters).some(f => f.length > 0) || searchQuery || showFavoritesOnly || selectedBookId

  const handleSurpriseMe = () => {
    if (filteredRecipes.length === 0) return

    setIsShuffling(true)

    // Brief shuffle animation delay
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * filteredRecipes.length)
      const randomRecipe = filteredRecipes[randomIndex]
      router.push(`/recipe/${randomRecipe.id}`)
    }, 400)
  }

  // Filter recipes based on search, favorites, book, and tag filters
  const filteredRecipes = recipes.filter(recipe => {
    // Book filter
    if (selectedBookId && recipe.book_id !== selectedBookId) {
      return false
    }

    // Favorites filter
    if (showFavoritesOnly && !favoriteIds.has(recipe.id)) {
      return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = recipe.title.toLowerCase().includes(query)
      const matchesNotes = recipe.notes?.toLowerCase().includes(query)
      const matchesSource = recipe.source?.toLowerCase().includes(query)
      if (!matchesTitle && !matchesNotes && !matchesSource) {
        return false
      }
    }

    // Tag filters
    for (const [category, selectedTags] of Object.entries(filters)) {
      if (selectedTags.length > 0) {
        const recipeTags = category === 'effort'
          ? (recipe.tags?.effort ? [recipe.tags.effort] : [])
          : (recipe.tags?.[category as keyof typeof recipe.tags] as string[] || [])

        const hasMatch = selectedTags.some(tag => recipeTags.includes(tag))
        if (!hasMatch) {
          return false
        }
      }
    }

    return true
  })

  // Loading auth state
  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Not authenticated - show login
  if (!authenticated) {
    return <LoginPage onSuccess={handleLoginSuccess} />
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--color-background)] border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
              🍳 Recipes
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSurpriseMe}
                disabled={isShuffling || filteredRecipes.length === 0}
                className="btn btn-secondary"
                title="Pick a random recipe"
              >
                <Shuffle size={18} className={isShuffling ? 'animate-spin' : ''} />
                <span className="hidden sm:inline ml-1">Surprise Me</span>
              </button>
              <Link href="/recipe/new" className="btn btn-primary">
                <Plus size={18} className="mr-1" /> <span className="hidden sm:inline">Add</span>
              </Link>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="tap-target p-2 text-gray-500 hover:text-gray-700"
                title="Log out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes..."
                className="w-full search-input"
              />
            </div>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`btn ${showFavoritesOnly ? 'btn-primary' : 'btn-secondary'}`}
              title={showFavoritesOnly ? 'Show all recipes' : 'Show favorites only'}
            >
              <Heart size={18} className={showFavoritesOnly ? 'fill-white' : ''} />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters || Object.values(filters).some(f => f.length > 0) ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Filter size={18} />
              {Object.values(filters).some(f => f.length > 0) && (
                <span className="ml-1 text-xs bg-white text-[var(--color-accent)] rounded-full w-5 h-5 flex items-center justify-center">
                  {Object.values(filters).flat().length}
                </span>
              )}
            </button>
            <ViewModeToggle viewMode={viewMode} onChange={handleViewModeChange} />
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[var(--color-accent)] hover:underline flex items-center gap-1"
                  >
                    <X size={14} /> Clear all
                  </button>
                )}
              </div>

              <TagFilter
                label="Protein"
                options={TAG_OPTIONS.protein}
                selected={filters.protein}
                onChange={(selected) => setFilters({ ...filters, protein: selected })}
              />
              <TagFilter
                label="Cuisine"
                options={TAG_OPTIONS.cuisine}
                selected={filters.cuisine}
                onChange={(selected) => setFilters({ ...filters, cuisine: selected })}
              />
              <TagFilter
                label="Method"
                options={TAG_OPTIONS.method}
                selected={filters.method}
                onChange={(selected) => setFilters({ ...filters, method: selected })}
              />
              <TagFilter
                label="Meal Type"
                options={TAG_OPTIONS.meal_type}
                selected={filters.meal_type}
                onChange={(selected) => setFilters({ ...filters, meal_type: selected })}
              />
              <TagFilter
                label="Effort"
                options={TAG_OPTIONS.effort}
                selected={filters.effort}
                onChange={(selected) => setFilters({ ...filters, effort: selected })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Recipe Grid */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        {/* Book Filter with Recently Viewed button */}
        <div className="flex items-center gap-2 mb-4">
          {/* Recently Viewed button */}
          <button
            onClick={() => setShowRecentlyViewed(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors"
            title="Recently Viewed"
          >
            <History size={14} />
            <span className="hidden sm:inline">Recent</span>
          </button>

          {/* Book Filter */}
          {books.length > 0 && (
            <BookFilter
              books={books}
              selectedBookId={selectedBookId}
              onChange={setSelectedBookId}
              onManageBooks={() => setShowManageBooks(true)}
            />
          )}
        </div>

        {/* Seasonal Suggestions */}
        {!hasActiveFilters && <SeasonalSuggestions />}

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading recipes...</div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {recipes.length === 0 
                ? "No recipes yet. Add your first recipe!"
                : "No recipes match your filters."}
            </p>
            {recipes.length === 0 && (
              <Link href="/recipe/new" className="btn btn-primary">
                <Plus size={18} className="mr-1" /> Add Recipe
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
              {hasActiveFilters && ` (filtered from ${recipes.length})`}
            </p>

            {/* Tile View */}
            {viewMode === 'tile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="flex flex-col gap-4">
                {filteredRecipes.map((recipe) => (
                  <RecipeListItem key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}

            {/* Compact View */}
            {viewMode === 'compact' && (
              <div className="flex flex-col gap-2">
                {filteredRecipes.map((recipe) => (
                  <RecipeCompactItem key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Manage Books Modal */}
      {showManageBooks && (
        <ManageBooksModal
          books={books}
          onClose={() => setShowManageBooks(false)}
          onBooksChanged={loadBooks}
        />
      )}

      {/* Recently Viewed Modal */}
      {showRecentlyViewed && (
        <RecentlyViewedModal onClose={() => setShowRecentlyViewed(false)} />
      )}
    </div>
  )
}
