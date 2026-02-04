'use client'

import { X } from 'lucide-react'

type TagFilterProps = {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function TagFilter({ label, options, selected, onChange }: TagFilterProps) {
  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter(t => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => toggleTag(option)}
            className={`tag-chip tap-target ${selected.includes(option) ? 'active' : ''}`}
          >
            {option}
            {selected.includes(option) && <X size={14} className="ml-1" />}
          </button>
        ))}
      </div>
    </div>
  )
}
