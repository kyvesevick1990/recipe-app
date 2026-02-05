'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Edit2, Check, Book } from 'lucide-react'
import { supabase, RecipeBook } from '@/lib/supabase'

type ManageBooksModalProps = {
  books: RecipeBook[]
  onClose: () => void
  onBooksChanged: () => void
}

export default function ManageBooksModal({ books, onClose, onBooksChanged }: ManageBooksModalProps) {
  const [newBookName, setNewBookName] = useState('')
  const [newBookIcon, setNewBookIcon] = useState('📖')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreateBook = async () => {
    if (!newBookName.trim() || saving) return
    setSaving(true)

    const { error } = await supabase.from('recipe_books').insert({
      name: newBookName.trim(),
      icon: newBookIcon || '📖',
      sort_order: books.length + 1
    })

    if (!error) {
      setNewBookName('')
      setNewBookIcon('📖')
      onBooksChanged()
    }
    setSaving(false)
  }

  const handleUpdateBook = async (id: string) => {
    if (!editName.trim() || saving) return
    setSaving(true)

    const { error } = await supabase
      .from('recipe_books')
      .update({ name: editName.trim(), icon: editIcon || '📖' })
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      onBooksChanged()
    }
    setSaving(false)
  }

  const handleDeleteBook = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Recipes in this book will become uncategorized.`)) return

    await supabase.from('recipe_books').delete().eq('id', id)
    onBooksChanged()
  }

  const startEditing = (book: RecipeBook) => {
    setEditingId(book.id)
    setEditName(book.name)
    setEditIcon(book.icon)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Book size={20} className="text-[var(--color-accent)]" />
            <h2 className="text-lg font-semibold">Manage Recipe Books</h2>
          </div>
          <button
            onClick={onClose}
            className="tap-target p-1 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Existing books */}
          <div className="space-y-2 mb-6">
            {books.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No recipe books yet</p>
            ) : (
              books.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center gap-2 p-3 bg-[var(--color-background)] rounded-lg"
                >
                  {editingId === book.id ? (
                    <>
                      <input
                        type="text"
                        value={editIcon}
                        onChange={(e) => setEditIcon(e.target.value)}
                        className="w-12 text-center text-lg"
                        maxLength={2}
                        placeholder="📖"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1"
                        placeholder="Book name"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateBook(book.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                      />
                      <button
                        onClick={() => handleUpdateBook(book.id)}
                        disabled={saving}
                        className="tap-target p-1.5 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="tap-target p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-xl w-8 text-center">{book.icon}</span>
                      <span className="flex-1 font-medium">{book.name}</span>
                      <button
                        onClick={() => startEditing(book)}
                        className="tap-target p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Edit book"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book.id, book.name)}
                        className="tap-target p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete book"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Create new book */}
          <div className="border-t border-[var(--color-border)] pt-4">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Create New Book</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBookIcon}
                onChange={(e) => setNewBookIcon(e.target.value)}
                className="w-12 text-center text-lg"
                maxLength={2}
                placeholder="📖"
              />
              <input
                type="text"
                value={newBookName}
                onChange={(e) => setNewBookName(e.target.value)}
                placeholder="Book name"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateBook()
                }}
              />
              <button
                onClick={handleCreateBook}
                disabled={!newBookName.trim() || saving}
                className="btn btn-primary px-3"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
