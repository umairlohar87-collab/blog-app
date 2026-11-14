import { useParams, useSearchParams } from 'react-router-dom'
import { getUser, getUserPosts } from '../api/posts'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { formatDate } from '../utils/format'
import PostGrid, { PostGridSkeleton } from '../components/PostGrid'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Spinner from '../components/Spinner'
import NotFound from './NotFound'

export default function Profile() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1)
  const isMe = me?.id === Number(id)

  const profile = useAsync((signal) => getUser(id, { signal }), [id])
  const posts = useAsync(
    (signal) => getUserPosts(id, { page, limit: 9 }, { signal }),
    [id, page, me?.id],
  )

  if (profile.loading) return <Spinner center label="Loading profile…" />
  if (profile.error?.status === 404 || profile.error?.status === 400) return <NotFound />
  if (profile.error) {
    return (
      <div className="container page">
        <ErrorState message={profile.error.message} onRetry={profile.reload} />
      </div>
    )
  }

  const u = profile.data

  return (
    <div className="container page">
      <header className="profile-header card">
        <span className="avatar avatar-lg" aria-hidden="true">
          {u.username.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1>{u.username}</h1>
          {u.bio ? <p className="profile-bio">{u.bio}</p> : <p className="muted">No bio yet.</p>}
          <p className="muted profile-stats">
            Joined {formatDate(u.created_at, { year: 'numeric', month: 'long' })} · {u.post_count}{' '}
            published {u.post_count === 1 ? 'post' : 'posts'}
          </p>
        </div>
      </header>

      <div className="section-head">
        <h2 className="section-title">{isMe ? 'Your posts' : `Posts by ${u.username}`}</h2>
        {isMe && <span className="muted">Drafts are only visible to you</span>}
      </div>

      {posts.loading ? (
        <PostGridSkeleton count={3} />
      ) : posts.error ? (
        <ErrorState message={posts.error.message} onRetry={posts.reload} />
      ) : posts.data.posts.length === 0 ? (
        <EmptyState
          icon="✍️"
          title="No posts yet"
          message={isMe ? 'Your posts will appear here once you write one.' : `${u.username} has not published anything yet.`}
        />
      ) : (
        <>
          <PostGrid posts={posts.data.posts} showStatus={isMe} />
          <Pagination
            page={posts.data.page}
            totalPages={posts.data.totalPages}
            onPageChange={(p) => setParams(p > 1 ? { page: String(p) } : {})}
          />
        </>
      )}
    </div>
  )
}
