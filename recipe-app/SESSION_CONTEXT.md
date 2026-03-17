# Roux Recipe App - Complete Development Context

## Project Overview

**Roux** is a personal recipe management web application built for Kyle. It allows organizing, browsing, and managing recipes imported from PDF files originally stored in Google Drive.

- **Live URL**: Deployed on Vercel (check Vercel dashboard for exact URL)
- **Repository**: https://github.com/kyvesevick1990/recipe-app.git
- **Local Path**: `C:\Users\Kyle\Desktop\Claude-sandbox\recipe-app\recipe-app`

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling (with CSS custom properties for theming) |
| **Supabase** | PostgreSQL database + file storage |
| **Vercel** | Hosting & deployment (auto-deploys on git push) |
| **Lucide React** | Icons |

---

## Supabase Configuration

```
URL: https://rifdotvjfzhqcjvidifx.supabase.co
Anon Key: sb_publishable_mrSMoDLlN74gyp0QtfsL0w_SmTeVTVK
```

Environment variables are set in Vercel (not in local .env files):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Database Schema

### Tables

#### `recipes`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Recipe name |
| servings | INTEGER | Number of servings |
| photo_urls | TEXT[] | Array of image URLs (stored in Supabase storage) |
| prep_time_minutes | INTEGER | Prep time |
| cook_time_minutes | INTEGER | Cook time |
| total_time_minutes | INTEGER | Total time |
| source | TEXT | Recipe source/URL |
| notes | TEXT | User notes |
| wine_pairing | TEXT | Wine pairing suggestions (currently unused) |
| book_id | UUID | Foreign key to recipe_books |
| tags | JSONB | `{protein: [], cuisine: [], method: [], meal_type: [], effort: string}` |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `ingredients`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| recipe_id | UUID | Foreign key to recipes |
| sort_order | INTEGER | Display order |
| text | TEXT | Full ingredient text |
| amount | DECIMAL | Numeric amount |
| unit | TEXT | Unit of measurement |
| item | TEXT | Ingredient name |
| metric_amount | DECIMAL | Metric conversion |
| metric_unit | TEXT | Metric unit |
| scalable | BOOLEAN | Whether amount scales with servings |

#### `directions`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| recipe_id | UUID | Foreign key to recipes |
| step_number | INTEGER | Step order |
| text | TEXT | Instruction text |
| user_note | TEXT | User's personal notes |

#### `favorites`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| recipe_id | UUID | Foreign key to recipes |
| created_at | TIMESTAMP | |

#### `recipe_books`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Book name (unique) |
| description | TEXT | Optional description |
| icon | TEXT | Emoji icon |
| sort_order | INTEGER | Display order |

**Default Books**: Dinners 🍽️, Dessert 🍰, Drinks 🍹, Salads & Sides 🥗, Sauces Dips Dressings 🫙, Thanksgiving 🦃, Misc 📦

---

## Project Structure

```
recipe-app/
├── public/
│   └── roux-logo.png          # Logo image (black, inverts to white in dark mode)
├── src/
│   ├── app/
│   │   ├── globals.css        # Global styles, CSS variables, dark mode
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page (recipe browser)
│   │   └── recipe/
│   │       ├── [id]/
│   │       │   └── page.tsx   # Recipe detail view
│   │       └── new/
│   │           └── page.tsx   # New recipe form
│   ├── components/
│   │   ├── BookFilter.tsx     # Horizontal book filter chips
│   │   ├── BookSelector.tsx   # Dropdown for selecting book in forms
│   │   ├── ImportRecipe.tsx   # Import from URL or photo
│   │   ├── LoginPage.tsx      # Simple password authentication
│   │   ├── ManageBooksModal.tsx # CRUD for recipe books
│   │   ├── RecipeCard.tsx     # Tile view card
│   │   ├── RecipeCompactItem.tsx # Compact list item
│   │   ├── RecipeForm.tsx     # Create/edit recipe form
│   │   ├── RecipeListItem.tsx # List view item
│   │   ├── RecentlyViewedModal.tsx # Modal showing recent recipes
│   │   ├── SeasonalSuggestions.tsx # OLD - section component (can be deleted)
│   │   ├── SeasonalSuggestionsModal.tsx # NEW - modal for seasonal recipes
│   │   ├── TagFilter.tsx      # Multi-select tag filter chips
│   │   ├── ThemeToggle.tsx    # Light/dark/system toggle
│   │   └── ViewModeToggle.tsx # Tile/list/compact toggle
│   └── lib/
│       ├── auth.ts            # Cookie-based auth helpers
│       ├── localStorage.ts    # Theme, view mode, recently viewed
│       ├── seasonalProduce.ts # Seasonal ingredient data
│       └── supabase.ts        # Supabase client + TypeScript types
├── scripts/
│   ├── assign_recipes_to_books.py  # Assigns recipes to books based on PDF folders
│   ├── backup_database.py     # Exports all data to JSON files
│   ├── restore_database.py    # Restores from JSON backup
│   └── extract_pdf_photos.py  # Extracts images from PDFs, uploads to Supabase
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_add_favorites.sql
│       └── 003_create_recipe_books.sql
├── backups/
│   └── backup_20260204_194918/  # Current frozen backup
│       ├── recipes.json         # 167 recipes
│       ├── ingredients.json     # 1754 ingredients
│       ├── directions.json      # 806 directions
│       ├── favorites.json       # 0 favorites
│       ├── recipe_books.json    # 7 books
│       └── backup_summary.json
└── SESSION_CONTEXT.md          # This file
```

---

## Implemented Features

### Core Features
- ✅ **Recipe CRUD** - Create, read, update, delete recipes
- ✅ **Ingredients** - Structured with amounts, units, items; scalable
- ✅ **Directions** - Step-by-step with user notes
- ✅ **Photo Support** - Multiple photos per recipe, stored in Supabase

### Organization
- ✅ **Recipe Books** - Folder-like organization (Dinners, Dessert, etc.)
- ✅ **Tag System** - Protein, cuisine, method, meal type, effort level
- ✅ **Search** - Full-text search across title, notes, source
- ✅ **Favorites** - Heart to favorite recipes

### Browse Views
- ✅ **Tile View** - Grid of recipe cards with photos
- ✅ **List View** - Horizontal cards with more details
- ✅ **Compact View** - Dense text-only list

### Smart Features
- ✅ **Recently Viewed** - Modal showing last 10 viewed recipes (localStorage)
- ✅ **Seasonal Suggestions** - Modal showing recipes with in-season ingredients
- ✅ **Surprise Me** - Random recipe picker from current filter

### Import
- ✅ **Import from URL** - Paste recipe URL, AI extracts data
- ✅ **Import from Photo** - Upload photo of recipe, AI extracts data

### UI/UX
- ✅ **Dark Mode** - Light/dark/system theme toggle
- ✅ **Mobile Responsive** - Works on phone, tablet, desktop
- ✅ **Custom Logo** - "Roux" logo (black in light, white in dark mode)
- ✅ **Print View** - Print-friendly recipe pages

### Authentication
- ✅ **Simple Password** - Single shared password stored in cookie
- ⚠️ **Not Multi-User** - Everyone shares the same data (intentional for personal use)

---

## Theming System

CSS custom properties in `globals.css`:

```css
:root {
  --color-background: #faf9f7;
  --color-surface: #ffffff;
  --color-text-primary: #2d2d2d;
  --color-text-secondary: #6b6b6b;
  --color-accent: #c17c60;        /* Terracotta/rust color */
  --color-accent-hover: #a8684f;
  --color-border: #e5e2dd;
  --color-success: #6b9080;
}

.dark {
  --color-background: #1a1a1a;
  --color-surface: #2a2a2a;
  --color-text-primary: #e5e5e5;
  --color-text-secondary: #a0a0a0;
  --color-accent: #c17c60;
  --color-accent-hover: #d4917a;
  --color-border: #3d3d3d;
}
```

Logo inversion for dark mode:
```css
.logo {
  height: 100px;
  width: auto;
}
.dark .logo {
  filter: invert(1);
}
```

---

## Known Issues & Workarounds

### Mobile ViewModeToggle Not Working
**Status**: Fixed with latest commit, but may still have issues on some devices.

**Fix Applied**:
- Added `type="button"` to prevent form submission
- Added `onTouchEnd` handlers as backup
- Added `touchAction: manipulation` CSS
- Increased touch targets to 44px minimum
- Added `preventDefault()` and `stopPropagation()`

If still broken, the issue may be something intercepting events higher in the DOM.

### Supabase Free Tier Limitations
- No automatic database backups
- Row limit of 1000 per query (handled with pagination in backup script)

---

## Backup & Restore

### Current Frozen State

**Git Tag**: `v1.0-frozen`
**Database Backup**: `backups/backup_20260204_194918/`

### To Restore Code
```bash
cd "C:\Users\Kyle\Desktop\Claude-sandbox\recipe-app\recipe-app"
git checkout v1.0-frozen .
git add .
git commit -m "Revert to frozen version"
git push
```

### To Restore Database
```bash
cd "C:\Users\Kyle\Desktop\Claude-sandbox\recipe-app\recipe-app"
python scripts/restore_database.py backup_20260204_194918
# Type YES when prompted
```

### To Create New Backup
```bash
python scripts/backup_database.py
```

---

## Git Workflow

1. Make changes locally
2. Commit with descriptive message
3. Push to `main` branch
4. Vercel auto-deploys within ~1-2 minutes

```bash
git add <files>
git commit -m "Description of changes

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
git push
```

---

## Files That Can Be Deleted

- `src/components/SeasonalSuggestions.tsx` - Replaced by SeasonalSuggestionsModal

---

## Pending/Future Ideas

1. **Multi-user support** - Proper authentication with user accounts
2. **Meal planning** - Weekly meal planner feature
3. **Shopping lists** - Generate from selected recipes
4. **Nutritional info** - Calorie/macro tracking
5. **Recipe scaling** - Adjust servings dynamically

---

## Important Commands

```bash
# Start dev server
cd "C:\Users\Kyle\Desktop\Claude-sandbox\recipe-app\recipe-app"
npm run dev

# Build for production
npm run build

# Check git status
git status

# View recent commits
git log --oneline -10

# List available backups
python scripts/restore_database.py
```

---

## Contact/Resources

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repo**: https://github.com/kyvesevick1990/recipe-app

---

## Session Handoff Notes

When continuing development:

1. **Always commit and push** after making changes - Vercel deploys from git
2. **Test on mobile** - Many issues only appear on touch devices
3. **Check Vercel deployment** - Sometimes builds fail silently
4. **Backup before major changes** - Run `python scripts/backup_database.py`
5. **CSS variables** - Use `var(--color-*)` for all colors to support theming
6. **Touch targets** - Minimum 44px for mobile buttons

The app is fully functional. Current state is "frozen" with tag `v1.0-frozen` and database backup `backup_20260204_194918` for safe sharing with a friend.
