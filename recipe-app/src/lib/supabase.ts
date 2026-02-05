import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Recipe = {
  id: string
  title: string
  servings: number
  photo_urls: string[]
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  total_time_minutes: number | null
  source: string | null
  notes: string | null
  wine_pairing: string | null
  book_id: string | null
  tags: {
    protein: string[]
    cuisine: string[]
    method: string[]
    meal_type: string[]
    effort: string | null
    source: string[]
  }
  created_at: string
  updated_at: string
}

export type Ingredient = {
  id: string
  recipe_id: string
  sort_order: number
  text: string
  amount: number | null
  unit: string | null
  item: string | null
  metric_amount: number | null
  metric_unit: string | null
  scalable: boolean
  created_at: string
}

export type Direction = {
  id: string
  recipe_id: string
  step_number: number
  text: string
  user_note: string | null
  created_at: string
  updated_at: string
}

export type RecipeBook = {
  id: string
  name: string
  description: string | null
  icon: string
  sort_order: number
  created_at: string
  updated_at: string
}
