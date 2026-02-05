'use client'

import { LayoutGrid, List, AlignJustify } from 'lucide-react'
import { ViewMode } from '@/lib/localStorage'

type ViewModeToggleProps = {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}

export default function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  const handleClick = (mode: ViewMode) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(mode)
  }

  return (
    <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={handleClick('tile')}
        onTouchEnd={handleClick('tile')}
        style={{ touchAction: 'manipulation' }}
        className={`p-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer select-none ${
          viewMode === 'tile'
            ? 'bg-[var(--color-accent)] text-white'
            : 'text-gray-500 hover:bg-[var(--color-background)]'
        }`}
        title="Tile view"
        aria-label="Tile view"
        aria-pressed={viewMode === 'tile'}
      >
        <LayoutGrid size={18} />
      </button>
      <button
        type="button"
        onClick={handleClick('list')}
        onTouchEnd={handleClick('list')}
        style={{ touchAction: 'manipulation' }}
        className={`p-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors border-l border-r border-[var(--color-border)] cursor-pointer select-none ${
          viewMode === 'list'
            ? 'bg-[var(--color-accent)] text-white'
            : 'text-gray-500 hover:bg-[var(--color-background)]'
        }`}
        title="List view"
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
      >
        <List size={18} />
      </button>
      <button
        type="button"
        onClick={handleClick('compact')}
        onTouchEnd={handleClick('compact')}
        style={{ touchAction: 'manipulation' }}
        className={`p-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer select-none ${
          viewMode === 'compact'
            ? 'bg-[var(--color-accent)] text-white'
            : 'text-gray-500 hover:bg-[var(--color-background)]'
        }`}
        title="Compact view"
        aria-label="Compact view"
        aria-pressed={viewMode === 'compact'}
      >
        <AlignJustify size={18} />
      </button>
    </div>
  )
}
