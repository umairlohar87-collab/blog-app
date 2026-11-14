import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { deletePost, getMyPosts } from '../api/posts'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { useAsync } from '../hooks/useAsync'
import { formatDate } from '../utils/format'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
]

const EMPTY = {
  all: { title: 'You have not written anything yet', message: 'Your published posts and drafts will show up here.' },
  published: { title: 'No published posts', message: 'Publish a draft or write something new.' },
  draft: { title: 'No drafts', message: 'Save a post as a draft to keep working on it later.' },
}

/**
 * Data source: GET /api/posts?author=me&status=all|published|draft
 * (the server scopes `author=me` to the authenticated user and allows drafts only there).
 */
export default function Dashboard() {
  const { user } = useAuth()
  const { show } = useToast()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'all'
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1)

  const { data, error, loading, reload } = useAsync(
    (signal) => getMyPosts({ status: tab, page, limit: 10 }, { signal }),
    [tab, page],
  )

  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const closeDialog = useCallback(() => setToDelete(null), [])

  const setTab = (key) => setParams(key === 'all' ? {} : { tab: key })
  const setPage = (p) => setParams({ ...(tab !== 'all' && { tab }), ...(p > 1 && { page: String(p) }) })

  async function confirmDelete() {
    setBusy(true)
    try {
      await deletePost(toDelete.id)
      show(`Deleted “${toDelete.title}”`, 'success')
      setToDelete(null)
      // Step back a page if we just removed the last item on this one.
      if (data.posts.length === 1 && page > 1) setPage(page - 1)
      else reload()
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Signed in as <Link to={`/users/${user.id}`}>{user.username}</Link>
          </p>
        </div>
        <Link to="/editor" className="btn btn-primary">
          + New Post
        </Link>
      </div>

      <div className="tabs" role="tablist" aria-label="Filter posts by status">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`tab ${tab === t.key ? 'is-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {loading ? (
          <Spinner center label="Loading your posts…" />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : data.posts.length === 0 ? (
          <EmptyState
            icon="🗂️"
            {...EMPTY[tab]}
            action={
              <Link to="/editor" className="btn btn-primary">
                Write a post
              </Link>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Status</th>
                    <th scope="col">Created</th>
                    <th scope="col">Comments</th>
                    <th scope="col" className="align-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.posts.map((post) => (
                    <tr key={post.id}>
                      <td data-label="Title">
                        <Link to={`/posts/${post.id}`} className="table-title">
                          {post.title}
                        </Link>
                      </td>
                      <td data-label="Status">
                        <span className={`badge badge-${post.status}`}>
                          {post.status === 'draft' ? 'Draft' : 'Published'}
                        </span>
                      </td>
                      <td data-label="Created">
                        <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
                      </td>
                      <td data-label="Comments">{post.comment_count}</td>
                      <td data-label="Actions" className="align-right">
                        <div className="row-actions">
                          <Link to={`/editor/${post.id}`} className="btn btn-ghost btn-sm">
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="btn btn-danger-outline btn-sm"
                            onClick={() => setToDelete(post)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this post?"
        message={toDelete ? `“${toDelete.title}” and all of its comments will be permanently removed.` : ''}
        confirmLabel="Delete post"
        danger
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={closeDialog}
      />
    </div>
  )
}
