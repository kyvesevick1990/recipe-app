'use client'

import { Book, Settings } from 'lucide-react'
import { RecipeBook } from '@/lib/supabase'

type BookFilterProps = {
  books: RecipeBook[]
  selectedBookId: string | null
  onChange: (bookId: string | null) => void
  onManageBooks?: () => void
}

export default function BookFilter({ books, selectedBookId, onChange, onManageBooks }: BookFilterProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* "All Recipes" option */}
        <button
          onClick={() => onChange(null)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedBookId === null
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
          }`}
        >
          <Book size={14} />
          All Recipes
        </button>

        {/* Individual books */}
        {books.map((book) => (
          <button
            key={book.id}
            onClick={() => onChange(selectedBookId === book.id ? null : book.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedBookId === book.id
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
            }`}
          >
            <span>{book.icon}</span>
            {book.name}
          </button>
        ))}

        {/* Manage books button */}
        {onManageBooks && (
          <button
            onClick={onManageBooks}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-[var(--color-surface)] text-gray-400 hover:text-gray-600 hover:bg-[var(--color-border)] transition-colors"
            title="Manage Recipe Books"
          >
            <Settings size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
