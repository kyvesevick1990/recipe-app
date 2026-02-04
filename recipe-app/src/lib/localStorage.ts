// Local storage utilities for user preferences

const RECENTLY_VIEWED_KEY = 'recipe_recently_viewed'
const MAX_RECENTLY_VIEWED = 10

export function getRecentlyViewed(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function addToRecentlyViewed(recipeId: string): void {
  if (typeof window === 'undefined') return

  try {
    const current = getRecentlyViewed()
    // Remove if already exists (to move to front)
    const filtered = current.filter(id => id !== recipeId)
    // Add to front
    const updated = [recipeId, ...filtered].slice(0, MAX_RECENTLY_VIEWED)
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error saving recently viewed:', error)
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(RECENTLY_VIEWED_KEY)
}
