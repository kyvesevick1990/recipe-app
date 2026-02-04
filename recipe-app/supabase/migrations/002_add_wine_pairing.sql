-- Add wine_pairing column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS wine_pairing TEXT;

-- Add comment for documentation
COMMENT ON COLUMN recipes.wine_pairing IS 'AI-generated wine and beverage pairing suggestions';
