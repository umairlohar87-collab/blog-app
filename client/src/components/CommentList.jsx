import { Link } from 'react-router-dom'
import { formatRelative, formatDate } from '../utils/format'

export default function CommentList({ comments, currentUserId, postAuthorId, onDelete }) {
  if (!comments.length) {
    return <p className="muted comment-empty">No comments yet. Start the conversation.</p>
  }

  return (
    <ul className="comment-list">
      {comments.map((c) => {
        const canDelete = currentUserId != null && (currentUserId === c.author_id || currentUserId === postAuthorId)
        return (
          <li key={c.id} className="comment">
            <span className="avatar" aria-hidden="true">
              {c.author_username.charAt(0).toUpperCase()}
            </span>
            <div className="comment-body">
              <div className="comment-head">
                <Link to={`/users/${c.author_id}`} className="comment-author">
                  {c.author_username}
                </Link>
                {c.author_id === postAuthorId && <span className="badge badge-author">Author</span>}
                <time className="muted" dateTime={c.created_at} title={formatDate(c.created_at)}>
                  {formatRelative(c.created_at)}
                </time>
                {canDelete && (
                  <button type="button" className="btn-link btn-link-danger" onClick={() => onDelete(c)}>
                    Delete
                  </button>
                )}
              </div>
              {/* Rendered as a text node: HTML in comments is shown literally, never executed. */}
              <p className="comment-content">{c.content}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
