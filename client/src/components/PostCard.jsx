import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDate, gradientFor, readingTimeLabel } from '../utils/format'

export default function PostCard({ post, showStatus = false }) {
  const [imgFailed, setImgFailed] = useState(false)
  const hasImage = post.cover_image && !imgFailed

  return (
    <article className="card post-card">
      <Link to={`/posts/${post.id}`} className="post-card-cover" tabIndex={-1} aria-hidden="true">
        {hasImage ? (
          <img src={post.cover_image} alt="" loading="lazy" onError={() => setImgFailed(true)} />
        ) : (
          <div className="cover-placeholder" style={{ background: gradientFor(post.id) }}>
            <span>{post.title.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </Link>
      <div className="post-card-body">
        {showStatus && post.status === 'draft' && <span className="badge badge-draft">Draft</span>}
        <h2 className="post-card-title">
          <Link to={`/posts/${post.id}`}>{post.title}</Link>
        </h2>
        <p className="post-card-excerpt">{post.excerpt}</p>
        {post.tags.length > 0 && (
          <ul className="tag-list" aria-label="Tags">
            {post.tags.map((tag) => (
              <li key={tag}>
                <Link to={`/?tag=${encodeURIComponent(tag)}`} className="tag">
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="post-meta">
          <Link to={`/users/${post.author_id}`} className="post-author">
            <span className="avatar avatar-sm" aria-hidden="true">
              {post.author_username.charAt(0).toUpperCase()}
            </span>
            {post.author_username}
          </Link>
          <span aria-hidden="true">·</span>
          <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
        </div>
        <div className="post-meta post-meta-sub">
          <span>{readingTimeLabel(post.reading_time)}</span>
          <span aria-hidden="true">·</span>
          <span>
            {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </div>
    </article>
  )
}
