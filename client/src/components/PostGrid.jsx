import PostCard from './PostCard'

export function PostGridSkeleton({ count = 6 }) {
  return (
    <div className="post-grid" aria-busy="true" aria-label="Loading posts">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card post-card skeleton-card" aria-hidden="true">
          <div className="skeleton skeleton-cover" />
          <div className="post-card-body">
            <div className="skeleton skeleton-line skeleton-title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line skeleton-short" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PostGrid({ posts, showStatus = false }) {
  return (
    <div className="post-grid">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} showStatus={showStatus} />
      ))}
    </div>
  )
}
