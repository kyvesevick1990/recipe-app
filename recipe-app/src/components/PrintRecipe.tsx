'use client'

import { useState } from 'react'
import { Printer, Download, Share2, X } from 'lucide-react'
import { Recipe, Ingredient, Direction } from '@/lib/supabase'

type PrintRecipeProps = {
  recipe: Recipe
  ingredients: Ingredient[]
  directions: Direction[]
  currentServings: number
  originalServings: number
}

function formatTime(minutes: number | null): string {
  if (!minutes) return '-'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function formatAmount(amount: number | null): string {
  if (amount === null) return ''

  const rounded = Math.round(amount * 4) / 4

  if (rounded === Math.floor(rounded)) {
    return rounded.toString()
  }

  const whole = Math.floor(rounded)
  const fraction = rounded - whole

  let fractionStr = ''
  if (Math.abs(fraction - 0.25) < 0.01) fractionStr = '¼'
  else if (Math.abs(fraction - 0.5) < 0.01) fractionStr = '½'
  else if (Math.abs(fraction - 0.75) < 0.01) fractionStr = '¾'
  else if (Math.abs(fraction - 0.33) < 0.1) fractionStr = '⅓'
  else if (Math.abs(fraction - 0.67) < 0.1) fractionStr = '⅔'
  else return rounded.toFixed(1)

  return whole > 0 ? `${whole} ${fractionStr}` : fractionStr
}

function scaleAmount(amount: number | null, originalServings: number, newServings: number): number | null {
  if (amount === null) return null
  return (amount / originalServings) * newServings
}

export default function PrintRecipe({
  recipe,
  ingredients,
  directions,
  currentServings,
  originalServings
}: PrintRecipeProps) {
  const [showModal, setShowModal] = useState(false)

  const handlePrint = () => {
    // Create a printable HTML document
    const printContent = generatePrintHTML()
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
    setShowModal(false)
  }

  const handleDownload = () => {
    // Create downloadable HTML file
    const printContent = generatePrintHTML()
    const blob = new Blob([printContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${recipe.title.replace(/[^a-z0-9]/gi, '_')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowModal(false)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: `Check out this recipe: ${recipe.title}`,
          url: window.location.href
        })
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy URL to clipboard
      await navigator.clipboard.writeText(window.location.href)
      alert('Recipe link copied to clipboard!')
    }
    setShowModal(false)
  }

  const generatePrintHTML = () => {
    const isScaled = currentServings !== originalServings

    const ingredientsList = ingredients.map(ing => {
      const scaledAmount = ing.scalable
        ? scaleAmount(ing.amount, originalServings, currentServings)
        : ing.amount

      if (ing.amount !== null) {
        const amountStr = formatAmount(scaledAmount)
        const unscaledNote = isScaled && !ing.scalable ? ' (unscaled)' : ''
        return `${amountStr} ${ing.unit || ''} ${ing.item || ''}${unscaledNote}`.trim()
      }
      return ing.text
    }).join('\n')

    const directionsList = directions
      .sort((a, b) => a.step_number - b.step_number)
      .map((dir, idx) => `${idx + 1}. ${dir.text}`)
      .join('\n\n')

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${recipe.title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      max-width: 700px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
      line-height: 1.6;
    }
    h1 {
      font-size: 28px;
      margin-bottom: 10px;
      color: #222;
      border-bottom: 2px solid #c17c60;
      padding-bottom: 10px;
    }
    .meta {
      color: #666;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .meta span {
      margin-right: 20px;
    }
    h2 {
      font-size: 18px;
      color: #c17c60;
      margin-top: 30px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .ingredients {
      columns: 2;
      column-gap: 30px;
    }
    .ingredients p {
      margin: 0 0 8px 0;
      break-inside: avoid;
    }
    .directions p {
      margin: 0 0 15px 0;
      text-align: justify;
    }
    .notes {
      background: #f9f9f9;
      padding: 15px;
      border-left: 3px solid #c17c60;
      font-style: italic;
    }
    .source {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #888;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 1in; }
    }
  </style>
</head>
<body>
  <h1>${recipe.title}</h1>
  <div class="meta">
    <span><strong>Servings:</strong> ${currentServings}</span>
    ${recipe.prep_time_minutes ? `<span><strong>Prep:</strong> ${formatTime(recipe.prep_time_minutes)}</span>` : ''}
    ${recipe.cook_time_minutes ? `<span><strong>Cook:</strong> ${formatTime(recipe.cook_time_minutes)}</span>` : ''}
    ${recipe.total_time_minutes ? `<span><strong>Total:</strong> ${formatTime(recipe.total_time_minutes)}</span>` : ''}
  </div>

  <h2>Ingredients</h2>
  <div class="ingredients">
    ${ingredientsList.split('\n').map(ing => `<p>• ${ing}</p>`).join('')}
  </div>

  <h2>Directions</h2>
  <div class="directions">
    ${directionsList.split('\n\n').map(dir => `<p>${dir}</p>`).join('')}
  </div>

  ${recipe.notes ? `
  <h2>Notes</h2>
  <div class="notes">
    ${recipe.notes}
  </div>
  ` : ''}

  ${recipe.source ? `
  <div class="source">
    Source: ${recipe.source}
  </div>
  ` : ''}
</body>
</html>
    `
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn btn-secondary"
        title="Print or share recipe"
      >
        <Share2 size={18} />
        <span className="hidden sm:inline ml-1">Share</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface)] rounded-xl max-w-sm w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Share Recipe</h3>
              <button
                onClick={() => setShowModal(false)}
                className="tap-target p-2 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePrint}
                className="w-full btn btn-secondary justify-start"
              >
                <Printer size={20} className="mr-3" />
                Print Recipe
              </button>

              <button
                onClick={handleDownload}
                className="w-full btn btn-secondary justify-start"
              >
                <Download size={20} className="mr-3" />
                Download as HTML
              </button>

              <button
                onClick={handleShare}
                className="w-full btn btn-primary justify-start"
              >
                <Share2 size={20} className="mr-3" />
                Share Link
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Printed version excludes photos and personal notes
            </p>
          </div>
        </div>
      )}
    </>
  )
}
