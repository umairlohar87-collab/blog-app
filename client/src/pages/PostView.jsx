import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deletePost, getPost } from '../api/posts'
import { createComment, deleteComment, getComments } from '../api/comments'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { useAsync } from '../hooks/useAsync'
import { formatDate, gradientFor, readingTimeLabel } from '../utils/format'
import Spinner from '../components/Spinner'
import ErrorState from '../components/ErrorState'
import ConfirmDialog from '../components/ConfirmDialog'
import CommentList from '../components/CommentList'
import CommentForm from '../components/CommentForm'
import NotFound from './NotFound'

export default function PostView() {
  const { id } = useParams()
  const { user } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()

  const { data, error, loading, reload, setData } = useAsync(
    async (signal) => {
      const [post, comments] = await Promise.all([getPost(id, { signal }), getComments(id, { signal })])
      return { post, comments }
    },
    [id, user?.id],
  )

  const [confirmPost, setConfirmPost] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  const closePostDialog = useCallback(() => setConfirmPost(false), [])
  const closeCommentDialog = useCallback(() => setCommentToDelete(null), [])

  if (loading) return <Spinner center label="Loading post…" />
  if (error?.status === 404 || error?.status === 400) return <NotFound />
  if (error) {
    return (
      <div className="container page">
        <ErrorState
          title={error.status === 403 ? 'This post is private' : 'Could not load post'}
          message={error.status === 403 ? 'Drafts are only visible to their author.' : error.message}
          onRetry={error.status === 403 ? undefined : reload}
        />
      </div>
    )
  }

  const { post, comments } = data
  const isAuthor = user?.id === post.author_id

  async function handleDeletePost() {
    setBusy(true)
    try {
      await deletePost(post.id)
      show('Post deleted', 'success')
      navigate('/', { replace: true })
    } catch (err) {
      show(err.message, 'error')
      setBusy(false)
      setConfirmPost(false)
    }
  }

  async function handleAddComment(content) {
    const comment = await createComment(post.id, content)
    setData((d) => ({ ...d, comments: [...d.comments, comment] }))
    show('Comment posted', 'success')
  }

  async function handleDeleteComment() {
    setBusy(true)
    try {
      await deleteComment(commentToDelete.id)
      setData((d) => ({ ...d, comments: d.comments.filter((c) => c.id !== commentToDelete.id) }))
      show('Comment deleted', 'success')
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setBusy(false)
      setCommentToDelete(null)
    }
  }

  return (
    <article className="container container-narrow page post-view">
      {post.status === 'draft' && (
        <div className="notice notice-draft" role="note">
          This is a <strong>draft</strong>. Only you can see it.
        </div>
      )}

      <header className="post-header">
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
        <h1 className="post-title">{post.title}</h1>
        <div className="post-meta">
          <Link to={`/users/${post.author_id}`} className="post-author">
            <span className="avatar" aria-hidden="true">
              {post.author_username.charAt(0).toUpperCase()}
            </span>
            {post.author_username}
          </Link>
          <span aria-hidden="true">·</span>
          <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
          <span aria-hidden="true">·</span>
          <span>{readingTimeLabel(post.reading_time)}</span>
          {post.updated_at !== post.created_at && (
            <span className="muted">(edited {formatDate(post.updated_at)})</span>
          )}
        </div>

        {isAuthor && (
          <div className="post-actions">
            <Link to={`/editor/${post.id}`} className="btn btn-ghost btn-sm">
              Edit
            </Link>
            <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => setConfirmPost(true)}>
              Delete
            </button>
          </div>
        )}
      </header>

      {post.cover_image && !imgFailed ? (
        <img className="post-cover" src={post.cover_image} alt="" onError={() => setImgFailed(true)} />
      ) : (
        <div className="post-cover post-cover-placeholder" style={{ background: gradientFor(post.id) }} />
      )}

      {/* Plain text with preserved whitespace. Never dangerouslySetInnerHTML. */}
      <div className="prose">{post.content}</div>

      <section className="comments" aria-labelledby="comments-heading">
        <h2 id="comments-heading">
          Comments <span className="muted">({comments.length})</span>
        </h2>

        {user ? (
          <CommentForm onSubmit={handleAddComment} />
        ) : (
          <p className="login-prompt">
            <Link to="/login" state={{ from: { pathname: `/posts/${post.id}` } }}>
              Log in
            </Link>{' '}
            or <Link to="/register">create an account</Link> to join the discussion.
          </p>
        )}

        <CommentList
          comments={comments}
          currentUserId={user?.id}
          postAuthorId={post.author_id}
          onDelete={setCommentToDelete}
        />
      </section>

      <ConfirmDialog
        open={confirmPost}
        title="Delete this post?"
        message={`“${post.title}” and all of its comments will be permanently removed.`}
        confirmLabel="Delete post"
        danger
        busy={busy}
        onConfirm={handleDeletePost}
        onCancel={closePostDialog}
      />
      <ConfirmDialog
        open={Boolean(commentToDelete)}
        title="Delete this comment?"
        message="This cannot be undone."
        confirmLabel="Delete comment"
        danger
        busy={busy}
        onConfirm={handleDeleteComment}
        onCancel={closeCommentDialog}
      />
    </article>
  )
}
