// Colorado seasonal produce calendar
// Focus on fresh produce, not pantry staples

export type SeasonalProduce = {
  month: number
  produce: string[]
}

export const COLORADO_SEASONAL_PRODUCE: SeasonalProduce[] = [
  {
    month: 1, // January
    produce: ['carrots', 'beets', 'turnips', 'parsnips', 'winter squash', 'butternut squash', 'acorn squash', 'potatoes', 'onions', 'cabbage', 'kale']
  },
  {
    month: 2, // February
    produce: ['carrots', 'beets', 'turnips', 'parsnips', 'winter squash', 'butternut squash', 'potatoes', 'onions', 'cabbage', 'kale']
  },
  {
    month: 3, // March
    produce: ['spinach', 'lettuce', 'carrots', 'beets', 'turnips', 'parsnips', 'kale']
  },
  {
    month: 4, // April
    produce: ['asparagus', 'radishes', 'spinach', 'lettuce', 'green onions', 'scallions', 'rhubarb', 'arugula']
  },
  {
    month: 5, // May
    produce: ['asparagus', 'peas', 'snap peas', 'strawberries', 'lettuce', 'radishes', 'spinach', 'herbs', 'basil', 'cilantro', 'mint', 'chives']
  },
  {
    month: 6, // June
    produce: ['strawberries', 'cherries', 'peas', 'green beans', 'zucchini', 'summer squash', 'cucumbers', 'lettuce', 'herbs', 'basil', 'cilantro']
  },
  {
    month: 7, // July
    produce: ['sweet corn', 'corn', 'tomatoes', 'peaches', 'melons', 'cantaloupe', 'watermelon', 'peppers', 'bell peppers', 'green beans', 'zucchini', 'cucumbers', 'berries', 'raspberries', 'blackberries', 'cherries']
  },
  {
    month: 8, // August
    produce: ['tomatoes', 'peaches', 'sweet corn', 'corn', 'melons', 'cantaloupe', 'watermelon', 'peppers', 'bell peppers', 'eggplant', 'green beans', 'plums', 'grapes', 'zucchini']
  },
  {
    month: 9, // September
    produce: ['apples', 'pears', 'tomatoes', 'peppers', 'bell peppers', 'winter squash', 'butternut squash', 'sweet corn', 'corn', 'grapes', 'carrots', 'beets']
  },
  {
    month: 10, // October
    produce: ['apples', 'pears', 'winter squash', 'butternut squash', 'acorn squash', 'pumpkin', 'carrots', 'beets', 'turnips', 'brussels sprouts', 'kale', 'cabbage']
  },
  {
    month: 11, // November
    produce: ['winter squash', 'butternut squash', 'acorn squash', 'carrots', 'beets', 'turnips', 'parsnips', 'potatoes', 'kale', 'brussels sprouts', 'cabbage', 'apples']
  },
  {
    month: 12, // December
    produce: ['carrots', 'beets', 'turnips', 'parsnips', 'winter squash', 'butternut squash', 'potatoes', 'onions', 'cabbage', 'kale']
  }
]

// Words that indicate a pantry staple version, not fresh
const PANTRY_INDICATORS = [
  'paste', 'canned', 'dried', 'powder', 'powdered', 'frozen',
  'sauce', 'juice', 'puree', 'extract', 'oil', 'vinegar'
]

// Check if an ingredient text matches a seasonal produce item
export function isSeasonalIngredient(ingredientText: string, seasonalProduce: string[]): string | null {
  const lowerText = ingredientText.toLowerCase()

  // Skip if it's clearly a pantry staple
  if (PANTRY_INDICATORS.some(indicator => lowerText.includes(indicator))) {
    return null
  }

  // Check for matches
  for (const produce of seasonalProduce) {
    if (lowerText.includes(produce.toLowerCase())) {
      return produce
    }
  }

  return null
}

// Get current month's seasonal produce
export function getCurrentSeasonalProduce(): string[] {
  const currentMonth = new Date().getMonth() + 1 // getMonth() is 0-indexed
  const monthData = COLORADO_SEASONAL_PRODUCE.find(m => m.month === currentMonth)
  return monthData?.produce || []
}

// Get month name
export function getMonthName(month?: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const m = month ?? new Date().getMonth() + 1
  return months[m - 1]
}
