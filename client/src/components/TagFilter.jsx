/** Horizontal list of tag chips; clicking the active tag clears the filter. */
export default function TagFilter({ tags, active, onChange }) {
  if (!tags?.length) return null

  return (
    <div className="tag-filter" role="group" aria-label="Filter by tag">
      <button
        type="button"
        className={`chip ${!active ? 'is-active' : ''}`}
        aria-pressed={!active}
        onClick={() => onChange('')}
      >
        All
      </button>
      {tags.map(({ tag, count }) => (
        <button
          key={tag}
          type="button"
          className={`chip ${active === tag ? 'is-active' : ''}`}
          aria-pressed={active === tag}
          onClick={() => onChange(active === tag ? '' : tag)}
        >
          #{tag} <span className="chip-count">{count}</span>
        </button>
      ))}
    </div>
  )
}
