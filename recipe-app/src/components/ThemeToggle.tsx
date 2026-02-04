'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { getThemePreference, setThemePreference, applyTheme, getSystemTheme, Theme } from '@/lib/localStorage'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Get saved preference or system default
    const savedTheme = getThemePreference()
    setTheme(savedTheme)
    applyTheme(savedTheme)
    setMounted(true)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (mounted) {
      applyTheme(theme)
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    // Simple toggle: if currently showing dark, switch to light, and vice versa
    const currentEffective = theme === 'system' ? getSystemTheme() : theme
    const newTheme = currentEffective === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    setThemePreference(newTheme)
  }

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button className="tap-target p-2 text-gray-500">
        <Sun size={20} />
      </button>
    )
  }

  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme
  const isDark = effectiveTheme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="tap-target p-2 text-gray-500 hover:text-gray-700 transition-colors"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
