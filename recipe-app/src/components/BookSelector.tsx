'use client'

import { Book } from 'lucide-react'
import { RecipeBook } from '@/lib/supabase'

type BookSelectorProps = {
  books: RecipeBook[]
  selectedBookId: string | null
  onChange: (bookId: string | null) => void
}

export default function BookSelector({ books, selectedBookId, onChange }: BookSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        <Book size={14} className="inline mr-1" />
        Recipe Book
      </label>
      <select
        value={selectedBookId || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full"
      >
        <option value="">No book (uncategorized)</option>
        {books.map((book) => (
          <option key={book.id} value={book.id}>
            {book.icon} {book.name}
          </option>
        ))}
      </select>
    </div>
  )
}
