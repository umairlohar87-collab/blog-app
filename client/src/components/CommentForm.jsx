import { useState } from 'react'

const MAX = 1000

export default function CommentForm({ onSubmit }) {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const text = content.trim()
    if (!text) return setError('Comment cannot be empty')
    if (text.length > MAX) return setError(`Comment must be at most ${MAX} characters`)

    setSubmitting(true)
    setError('')
    try {
      await onSubmit(text)
      setContent('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="comment" className="sr-only">
        Add a comment
      </label>
      <textarea
        id="comment"
        className="input"
        rows={3}
        placeholder="Share your thoughts…"
        value={content}
        maxLength={MAX}
        onChange={(e) => {
          setContent(e.target.value)
          if (error) setError('')
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'comment-error' : undefined}
      />
      <div className="comment-form-footer">
        <span className={`char-count ${content.length > MAX * 0.9 ? 'is-warn' : ''}`}>
          {content.length}/{MAX}
        </span>
        <button type="submit" className="btn btn-primary" disabled={submitting || !content.trim()}>
          {submitting ? 'Posting…' : 'Post comment'}
        </button>
      </div>
      {error && (
        <p id="comment-error" className="field-error">
          {error}
        </p>
      )}
    </form>
  )
}
