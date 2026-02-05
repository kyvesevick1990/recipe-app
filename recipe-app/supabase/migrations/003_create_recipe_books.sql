-- Migration: Create Recipe Books feature
-- This adds the ability to organize recipes into collections/folders

-- Create recipe_books table
CREATE TABLE IF NOT EXISTS recipe_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📖',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE recipe_books ENABLE ROW LEVEL SECURITY;

-- Create policy (single-user app with password protection)
CREATE POLICY "Allow all operations on recipe_books" ON recipe_books
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add book_id column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES recipe_books(id) ON DELETE SET NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_recipes_book_id ON recipes(book_id);
CREATE INDEX IF NOT EXISTS idx_recipe_books_sort_order ON recipe_books(sort_order);

-- Insert the 7 default recipe books (matching user's folder structure)
INSERT INTO recipe_books (name, icon, sort_order) VALUES
  ('Dinners', '🍽️', 1),
  ('Dessert', '🍰', 2),
  ('Drinks', '🍹', 3),
  ('Salads & Sides', '🥗', 4),
  ('Sauces Dips Dressings', '🫙', 5),
  ('Thanksgiving', '🦃', 6),
  ('Misc', '📦', 7)
ON CONFLICT (name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE recipe_books IS 'Collections/folders for organizing recipes';
COMMENT ON COLUMN recipes.book_id IS 'Reference to the recipe book this recipe belongs to';
