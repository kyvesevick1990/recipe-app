'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, GripVertical, Upload, Image as ImageIcon } from 'lucide-react'
import { supabase, Recipe, Ingredient, Direction } from '@/lib/supabase'

type RecipeFormProps = {
  recipeId?: string
}

const TAG_OPTIONS = {
  protein: ['Beef', 'Pork', 'Chicken', 'Seafood', 'Lamb', 'Vegetarian', 'Vegan'],
  cuisine: ['Mexican', 'Italian', 'Chinese', 'American', 'French', 'Thai', 'Japanese', 'Indian', 'Korean'],
  method: ['Braised', 'Grilled', 'Stir-Fried', 'Roasted', 'Baked', 'Slow-Cooked', 'Fried', 'Raw'],
  meal_type: ['Dinner', 'Lunch', 'Breakfast', 'Appetizer', 'Side', 'Dessert', 'Snack'],
  effort: ['Quick (<30 min)', 'Moderate', 'Project (2+ hours)'],
}

type IngredientInput = {
  id?: string
  text: string
  amount: string
  unit: string
  item: string
  scalable: boolean
}

type DirectionInput = {
  id?: string
  step_number: number
  text: string
}

export default function RecipeForm({ recipeId }: RecipeFormProps) {
  const router = useRouter()
  const isEditing = !!recipeId

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [servings, setServings] = useState('4')
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [totalTime, setTotalTime] = useState('')
  const [source, setSource] = useState('')
  const [notes, setNotes] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tags
  const [selectedTags, setSelectedTags] = useState<{
    protein: string[]
    cuisine: string[]
    method: string[]
    meal_type: string[]
    effort: string | null
  }>({
    protein: [],
    cuisine: [],
    method: [],
    meal_type: [],
    effort: null,
  })

  // Ingredients and Directions
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { text: '', amount: '', unit: '', item: '', scalable: true }
  ])
  const [directions, setDirections] = useState<DirectionInput[]>([
    { step_number: 1, text: '' }
  ])

  useEffect(() => {
    if (isEditing) {
      loadRecipe()
    }
  }, [recipeId])

  async function loadRecipe() {
    setLoading(true)
    
    const [recipeRes, ingredientsRes, directionsRes] = await Promise.all([
      supabase.from('recipes').select('*').eq('id', recipeId).single(),
      supabase.from('ingredients').select('*').eq('recipe_id', recipeId).order('sort_order'),
      supabase.from('directions').select('*').eq('recipe_id', recipeId).order('step_number'),
    ])

    if (recipeRes.data) {
      const r = recipeRes.data
      setTitle(r.title)
      setServings(r.servings.toString())
      setPrepTime(r.prep_time_minutes?.toString() || '')
      setCookTime(r.cook_time_minutes?.toString() || '')
      setTotalTime(r.total_time_minutes?.toString() || '')
      setSource(r.source || '')
      setNotes(r.notes || '')
      setPhotoUrls(r.photo_urls || [])
      setSelectedTags({
        protein: r.tags?.protein || [],
        cuisine: r.tags?.cuisine || [],
        method: r.tags?.method || [],
        meal_type: r.tags?.meal_type || [],
        effort: r.tags?.effort || null,
      })
    }

    if (ingredientsRes.data && ingredientsRes.data.length > 0) {
      setIngredients(ingredientsRes.data.map(ing => ({
        id: ing.id,
        text: ing.text,
        amount: ing.amount?.toString() || '',
        unit: ing.unit || '',
        item: ing.item || '',
        scalable: ing.scalable,
      })))
    }

    if (directionsRes.data && directionsRes.data.length > 0) {
      setDirections(directionsRes.data.map(dir => ({
        id: dir.id,
        step_number: dir.step_number,
        text: dir.text,
      })))
    }

    setLoading(false)
  }

  const toggleTag = (category: keyof typeof selectedTags, value: string) => {
    if (category === 'effort') {
      setSelectedTags(prev => ({
        ...prev,
        effort: prev.effort === value ? null : value,
      }))
    } else {
      setSelectedTags(prev => ({
        ...prev,
        [category]: prev[category].includes(value)
          ? prev[category].filter(t => t !== value)
          : [...prev[category], value],
      }))
    }
  }

  const addIngredient = () => {
    setIngredients([...ingredients, { text: '', amount: '', unit: '', item: '', scalable: true }])
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: keyof IngredientInput, value: string | boolean) => {
    setIngredients(ingredients.map((ing, i) => 
      i === index ? { ...ing, [field]: value } : ing
    ))
  }

  const addDirection = () => {
    setDirections([...directions, { step_number: directions.length + 1, text: '' }])
  }

  const removeDirection = (index: number) => {
    setDirections(directions.filter((_, i) => i !== index).map((d, i) => ({
      ...d,
      step_number: i + 1,
    })))
  }

  const updateDirection = (index: number, text: string) => {
    setDirections(directions.map((dir, i) => 
      i === index ? { ...dir, text } : dir
    ))
  }

  const addPhotoUrl = () => {
    if (newPhotoUrl.trim()) {
      setPhotoUrls([...photoUrls, newPhotoUrl.trim()])
      setNewPhotoUrl('')
    }
  }

  const removePhotoUrl = async (index: number) => {
    const urlToRemove = photoUrls[index]

    // If it's a Supabase storage URL, try to delete the file
    if (urlToRemove.includes('supabase') && urlToRemove.includes('recipe-photos')) {
      try {
        // Extract the file path from the URL
        const urlParts = urlToRemove.split('/recipe-photos/')
        if (urlParts[1]) {
          await supabase.storage.from('recipe-photos').remove([urlParts[1]])
        }
      } catch (error) {
        console.error('Error deleting photo from storage:', error)
      }
    }

    setPhotoUrls(photoUrls.filter((_, i) => i !== index))
  }

  const uploadPhoto = async (file: File) => {
    setUploadingPhoto(true)

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('recipe-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('recipe-photos')
        .getPublicUrl(fileName)

      setPhotoUrls([...photoUrls, publicUrl])
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Error uploading photo. Please try again.')
    }

    setUploadingPhoto(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      uploadPhoto(file)
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      uploadPhoto(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const recipeData = {
        title,
        servings: parseInt(servings) || 4,
        prep_time_minutes: prepTime ? parseInt(prepTime) : null,
        cook_time_minutes: cookTime ? parseInt(cookTime) : null,
        total_time_minutes: totalTime ? parseInt(totalTime) : null,
        source: source || null,
        notes: notes || null,
        photo_urls: photoUrls,
        tags: selectedTags,
      }

      let savedRecipeId = recipeId

      if (isEditing) {
        await supabase.from('recipes').update(recipeData).eq('id', recipeId)
        
        // Delete existing ingredients and directions
        await Promise.all([
          supabase.from('ingredients').delete().eq('recipe_id', recipeId),
          supabase.from('directions').delete().eq('recipe_id', recipeId),
        ])
      } else {
        const { data } = await supabase.from('recipes').insert(recipeData).select().single()
        savedRecipeId = data?.id
      }

      if (savedRecipeId) {
        // Insert ingredients
        const ingredientData = ingredients
          .filter(ing => ing.text.trim() || ing.item.trim())
          .map((ing, index) => ({
            recipe_id: savedRecipeId,
            sort_order: index,
            text: ing.text || `${ing.amount} ${ing.unit} ${ing.item}`.trim(),
            amount: ing.amount ? parseFloat(ing.amount) : null,
            unit: ing.unit || null,
            item: ing.item || null,
            scalable: ing.scalable,
          }))

        if (ingredientData.length > 0) {
          await supabase.from('ingredients').insert(ingredientData)
        }

        // Insert directions
        const directionData = directions
          .filter(dir => dir.text.trim())
          .map((dir, index) => ({
            recipe_id: savedRecipeId,
            step_number: index + 1,
            text: dir.text,
          }))

        if (directionData.length > 0) {
          await supabase.from('directions').insert(directionData)
        }

        router.push(`/recipe/${savedRecipeId}`)
      }
    } catch (error) {
      console.error('Error saving recipe:', error)
      alert('Error saving recipe. Please try again.')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--color-background)] border-b border-[var(--color-border)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href={isEditing ? `/recipe/${recipeId}` : '/'} className="tap-target flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-semibold">{isEditing ? 'Edit Recipe' : 'New Recipe'}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 pt-6">
        {/* Basic Info */}
        <div className="card p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Basic Info</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Recipe title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Servings *</label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Source</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g., Serious Eats"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Prep (min)</label>
                <input
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Cook (min)</label>
                <input
                  type="number"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Total (min)</label>
                <input
                  type="number"
                  value={totalTime}
                  onChange={(e) => setTotalTime(e.target.value)}
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="card p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Photos</h2>

          {/* Existing photos */}
          {photoUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {photoUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt=""
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhotoUrl(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-6 text-center hover:border-[var(--color-accent)] transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {uploadingPhoto ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
                <span className="text-sm text-gray-500">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[var(--color-background)] flex items-center justify-center">
                  <Upload size={24} className="text-[var(--color-accent)]" />
                </div>
                <div>
                  <span className="text-[var(--color-accent)] font-medium">Click to upload</span>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <span className="text-xs text-gray-400">PNG, JPG, HEIC up to 10MB</span>
              </div>
            )}
          </div>

          {/* URL input as alternative */}
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <p className="text-sm text-gray-500 mb-2">Or add by URL:</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="Paste photo URL"
                className="flex-1"
              />
              <button
                type="button"
                onClick={addPhotoUrl}
                disabled={!newPhotoUrl.trim()}
                className="btn btn-secondary"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="card p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Tags</h2>
          
          {Object.entries(TAG_OPTIONS).map(([category, options]) => (
            <div key={category} className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-2 capitalize">
                {category.replace('_', ' ')}
              </label>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                  const isSelected = category === 'effort' 
                    ? selectedTags.effort === option
                    : selectedTags[category as keyof typeof selectedTags]?.includes(option)
                  
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleTag(category as keyof typeof selectedTags, option)}
                      className={`tag-chip ${isSelected ? 'active' : ''}`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Ingredients */}
        <div className="card p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Ingredients</h2>
          
          {ingredients.map((ing, index) => (
            <div key={index} className="flex items-start gap-2 mb-3">
              <div className="text-gray-300 mt-3">
                <GripVertical size={18} />
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={ing.text}
                  onChange={(e) => updateIngredient(index, 'text', e.target.value)}
                  placeholder="Full ingredient text (e.g., 2 cups flour)"
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                    placeholder="Amount"
                    className="w-20 text-sm"
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    placeholder="Unit"
                    className="w-24 text-sm"
                  />
                  <input
                    type="text"
                    value={ing.item}
                    onChange={(e) => updateIngredient(index, 'item', e.target.value)}
                    placeholder="Item name"
                    className="flex-1 text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={ing.scalable}
                    onChange={(e) => updateIngredient(index, 'scalable', e.target.checked)}
                  />
                  Scalable
                </label>
              </div>
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="tap-target p-2 text-red-500 hover:bg-red-50 rounded mt-1"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addIngredient}
            className="btn btn-secondary w-full mt-2"
          >
            <Plus size={18} className="mr-1" /> Add Ingredient
          </button>
        </div>

        {/* Directions */}
        <div className="card p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Directions</h2>
          
          {directions.map((dir, index) => (
            <div key={index} className="flex items-start gap-2 mb-3">
              <span className="mt-3 text-gray-400 font-medium">{index + 1}.</span>
              <textarea
                value={dir.text}
                onChange={(e) => updateDirection(index, e.target.value)}
                placeholder={`Step ${index + 1}`}
                rows={2}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => removeDirection(index)}
                className="tap-target p-2 text-red-500 hover:bg-red-50 rounded mt-1"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addDirection}
            className="btn btn-secondary w-full mt-2"
          >
            <Plus size={18} className="mr-1" /> Add Step
          </button>
        </div>

        {/* Notes */}
        <div className="card p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Original recipe notes..."
            rows={4}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="btn btn-primary w-full"
        >
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Recipe'}
        </button>
      </form>
    </div>
  )
}
