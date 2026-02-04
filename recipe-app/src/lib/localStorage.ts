// Local storage utilities for user preferences

const RECENTLY_VIEWED_KEY = 'recipe_recently_viewed'
const MAX_RECENTLY_VIEWED = 10
const THEME_KEY = 'recipe_theme'
const VIEW_MODE_KEY = 'recipe_view_mode'

// Theme utilities
export type Theme = 'light' | 'dark' | 'system'

export function getThemePreference(): Theme {
  if (typeof window === 'undefined') return 'system'

  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
    return 'system'
  } catch {
    return 'system'
  }
}

export function setThemePreference(theme: Theme): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch (error) {
    console.error('Error saving theme preference:', error)
  }
}

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return

  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme

  if (effectiveTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// View mode utilities
export type ViewMode = 'tile' | 'list' | 'compact'

export function getViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'tile'

  try {
    const stored = localStorage.getItem(VIEW_MODE_KEY)
    if (stored === 'tile' || stored === 'list' || stored === 'compact') {
      return stored
    }
    return 'tile'
  } catch {
    return 'tile'
  }
}

export function setViewMode(mode: ViewMode): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(VIEW_MODE_KEY, mode)
  } catch (error) {
    console.error('Error saving view mode:', error)
  }
}

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
