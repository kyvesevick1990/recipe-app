'use client'

import { useState } from 'react'
import { Link2, Camera, Loader2, X, AlertCircle } from 'lucide-react'

type ImportedIngredient = {
  text: string
  amount: number | null
  unit: string | null
  item: string | null
  scalable: boolean
}

type ImportedRecipe = {
  title: string
  servings: number
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  total_time_minutes: number | null
  ingredients: ImportedIngredient[]
  directions: string[]
  notes: string | null
  tags: {
    protein: string[]
    cuisine: string[]
    method: string[]
    meal_type: string[]
    effort: string | null
  }
  source: string | null
  wine_pairing: string | null
}

type ImportRecipeProps = {
  onImport: (recipe: ImportedRecipe) => void
}

export default function ImportRecipe({ onImport }: ImportRecipeProps) {
  const [showModal, setShowModal] = useState(false)
  const [importType, setImportType] = useState<'url' | 'photo' | null>(null)
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUrlImport = async () => {
    if (!url.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import recipe')
      }

      onImport(data.recipe)
      setShowModal(false)
      setUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import recipe')
    }

    setIsLoading(false)
  }

  const handlePhotoImport = async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const response = await fetch('/api/import-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import recipe')
      }

      onImport(data.recipe)
      setShowModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import recipe')
    }

    setIsLoading(false)
  }

  return (
    <>
      {/* Import Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => {
            setImportType('url')
            setShowModal(true)
            setError(null)
          }}
          className="btn btn-secondary flex-1 min-h-[44px]"
        >
          <Link2 size={18} className="mr-2" />
          Import from URL
        </button>
        <button
          type="button"
          onClick={() => {
            setImportType('photo')
            setShowModal(true)
            setError(null)
          }}
          className="btn btn-secondary flex-1 min-h-[44px]"
        >
          <Camera size={18} className="mr-2" />
          Import from Photo
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface)] rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {importType === 'url' ? 'Import from URL' : 'Import from Photo'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setUrl('')
                  setError(null)
                }}
                className="tap-target p-2 text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                disabled={isLoading}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {importType === 'url' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Recipe URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/recipe"
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Paste a URL from any recipe website. The recipe will be automatically extracted and you can review before saving.
                </p>
                <button
                  type="button"
                  onClick={handleUrlImport}
                  disabled={!url.trim() || isLoading}
                  className="btn btn-primary w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import Recipe'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Hidden file input */}
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  disabled={isLoading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePhotoImport(file)
                    // Reset input so same file can be selected again
                    e.target.value = ''
                  }}
                />

                {/* Clickable label for file input */}
                <label
                  htmlFor="photo-upload"
                  className="block border-2 border-dashed border-[var(--color-border)] rounded-lg p-8 text-center hover:border-[var(--color-accent)] active:border-[var(--color-accent)] transition-colors cursor-pointer"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
                      <span className="text-sm text-gray-500">Processing image...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                      <Camera size={32} className="text-[var(--color-accent)]" />
                      <span className="text-sm text-gray-600">
                        <span className="text-[var(--color-accent)] font-medium">Take a photo</span>
                        {' '}or upload an image
                      </span>
                      <span className="text-xs text-gray-400">
                        JPG, PNG, HEIC up to 10MB
                      </span>
                    </div>
                  )}
                </label>
                <p className="text-xs text-gray-500">
                  Take a photo of a recipe from a cookbook, magazine, or handwritten card. The text will be automatically extracted.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
