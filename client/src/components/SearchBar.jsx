import { useEffect, useRef, useState } from 'react'
import { useDebounce } from '../hooks/useDebounce'

/** Debounced (300ms) search input. Calls onSearch with the trimmed value. */
export default function SearchBar({ value = '', onSearch, placeholder = 'Search posts by title or content…' }) {
  const [text, setText] = useState(value)
  const debounced = useDebounce(text, 300)
  const lastSent = useRef(value)

  // Keep in sync when the URL changes externally (e.g. navbar search, back button).
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value
      setText(value)
    }
  }, [value])

  useEffect(() => {
    const q = debounced.trim()
    if (q !== lastSent.current) {
      lastSent.current = q
      onSearch(q)
    }
  }, [debounced, onSearch])

  return (
    <div className="search-bar">
      <span className="search-icon" aria-hidden="true">⌕</span>
      <input
        type="search"
        className="input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label="Search posts"
        maxLength={100}
      />
      {text && (
        <button type="button" className="search-clear" aria-label="Clear search" onClick={() => setText('')}>
          ×
        </button>
      )}
    </div>
  )
}
