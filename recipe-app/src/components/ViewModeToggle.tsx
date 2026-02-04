'use client'

import { LayoutGrid, List, AlignJustify } from 'lucide-react'
import { ViewMode } from '@/lib/localStorage'

type ViewModeToggleProps = {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}

export default function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
      <button
        onClick={() => onChange('tile')}
        className={`p-2 transition-colors ${
          viewMode === 'tile'
            ? 'bg-[var(--color-accent)] text-white'
            : 'text-gray-500 hover:bg-[var(--color-background)]'
        }`}
        title="Tile view"
      >
        <LayoutGrid size={18} />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`p-2 transition-colors border-l border-r border-[var(--color-border)] ${
          viewMode === 'list'
            ? 'bg-[var(--color-accent)] text-white'
            : 'text-gray-500 hover:bg-[var(--color-background)]'
        }`}
        title="List view"
      >
        <List size={18} />
      </button>
      <button
        onClick={() => onChange('compact')}
        className={`p-2 transition-colors ${
          viewMode === 'compact'
            ? 'bg-[var(--color-accent)] text-white'
            : 'text-gray-500 hover:bg-[var(--color-background)]'
        }`}
        title="Compact view"
      >
        <AlignJustify size={18} />
      </button>
    </div>
  )
}
