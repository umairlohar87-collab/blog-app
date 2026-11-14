import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPosts, getTags } from '../api/posts'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import PostGrid, { PostGridSkeleton } from '../components/PostGrid'
import Pagination from '../components/Pagination'
import SearchBar from '../components/SearchBar'
import TagFilter from '../components/TagFilter'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'

const PAGE_SIZE = 9

export default function Home() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') || ''
  const tag = searchParams.get('tag') || ''
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1)

  const [tags, setTags] = useState([])
  useEffect(() => {
    getTags().then(setTags).catch(() => setTags([]))
  }, [])

  const { data, error, loading, reload } = useAsync(
    (signal) => getPosts({ page, limit: PAGE_SIZE, search, tag }, { signal }),
    [page, search, tag],
  )

  /** Updates URL params; any filter change resets to page 1. */
  const updateParams = useCallback(
    (changes, { resetPage = true } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(changes)) {
            if (v) next.set(k, String(v))
            else next.delete(k)
          }
          if (resetPage) next.delete('page')
          return next
        },
        { replace: !('page' in changes) },
      )
    },
    [setSearchParams],
  )

  const onSearch = useCallback((q) => updateParams({ search: q }), [updateParams])
  const onTag = (t) => updateParams({ tag: t })
  const onPage = (p) => {
    updateParams({ page: p > 1 ? p : '' }, { resetPage: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = Boolean(search || tag)
  let heading = 'Latest posts'
  if (search && tag) heading = `Results for “${search}” in #${tag}`
  else if (search) heading = `Results for “${search}”`
  else if (tag) heading = `Posts tagged #${tag}`

  return (
    <div className="container page">
      {!filtered && page === 1 && (
        <section className="hero">
          <h1>Ideas worth sharing.</h1>
          <p className="muted">Stories, tutorials, and notes from developers who build things.</p>
          {!user && (
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary">
                Start writing
              </Link>
              <Link to="/login" className="btn btn-ghost">
                Sign in
              </Link>
            </div>
          )}
        </section>
      )}

      <div className="toolbar">
        <SearchBar value={search} onSearch={onSearch} />
        <TagFilter tags={tags} active={tag} onChange={onTag} />
      </div>

      <div className="section-head">
        <h2 className="section-title">{heading}</h2>
        {data && !loading && (
          <span className="muted">
            {data.total} {data.total === 1 ? 'post' : 'posts'}
          </span>
        )}
      </div>

      {loading ? (
        <PostGridSkeleton count={6} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data.posts.length === 0 ? (
        <EmptyState
          icon={filtered ? '🔍' : '📝'}
          title={filtered ? 'No matching posts' : 'No posts yet'}
          message={filtered ? 'Try a different search term or tag.' : 'Be the first to publish something.'}
          action={
            filtered ? (
              <button type="button" className="btn btn-ghost" onClick={() => setSearchParams({})}>
                Clear filters
              </button>
            ) : user ? (
              <Link to="/editor" className="btn btn-primary">
                Write a post
              </Link>
            ) : null
          }
        />
      ) : (
        <>
          <PostGrid posts={data.posts} />
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={onPage} />
        </>
      )}

      {user && (
        <Link to="/editor" className="fab" aria-label="New post" title="New post">
          +
        </Link>
      )}
    </div>
  )
}
