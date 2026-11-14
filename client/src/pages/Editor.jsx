import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import { createPost, getPost, updatePost } from '../api/posts'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { gradientFor, isHttpUrl, parseTagInput } from '../utils/format'
import { validatePost } from '../utils/validation'
import ConfirmDialog from '../components/ConfirmDialog'
import FormField from '../components/FormField'
import Spinner from '../components/Spinner'
import NotFound from './NotFound'

const EMPTY_FORM = { title: '', content: '', cover_image: '', tags: '', status: 'published' }

function Preview({ form }) {
  const tags = parseTagInput(form.tags)
  const cover = form.cover_image.trim()
  const [failedSrc, setFailedSrc] = useState(null)
  const showImg = isHttpUrl(cover) && failedSrc !== cover

  return (
    <div className="preview" aria-label="Preview">
      {showImg ? (
        <img className="post-cover" src={cover} alt="" onError={() => setFailedSrc(cover)} />
      ) : (
        <div className="post-cover post-cover-placeholder" style={{ background: gradientFor(form.title || 'new') }} />
      )}
      {tags.length > 0 && (
        <ul className="tag-list">
          {tags.map((t) => (
            <li key={t}>
              <span className="tag">#{t}</span>
            </li>
          ))}
        </ul>
      )}
      <h1 className="post-title">{form.title || <span className="muted">Untitled post</span>}</h1>
      {form.status === 'draft' && <span className="badge badge-draft">Draft</span>}
      <div className="prose">{form.content || <span className="muted">Start writing to see a preview…</span>}</div>
    </div>
  )
}

export default function Editor() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { user } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [initial, setInitial] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(isEdit)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mobileTab, setMobileTab] = useState('write')
  const skipGuard = useRef(false)

  // Load the post when editing. (App remounts Editor per route via `key`, so state starts fresh.)
  useEffect(() => {
    if (!isEdit) return
    const controller = new AbortController()
    getPost(id, { signal: controller.signal })
      .then((post) => {
        if (post.author_id !== user.id) {
          show('You can only edit your own posts', 'error')
          navigate('/dashboard', { replace: true })
          return
        }
        const loaded = {
          title: post.title,
          content: post.content,
          cover_image: post.cover_image || '',
          tags: post.tags.join(', '),
          status: post.status,
        }
        setForm(loaded)
        setInitial(loaded)
        setLoading(false)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        if (err.status === 404 || err.status === 400) {
          setNotFound(true)
          setLoading(false)
        } else {
          show(err.status === 403 ? 'You can only edit your own posts' : err.message, 'error')
          navigate('/dashboard', { replace: true })
        }
      })
    return () => controller.abort()
  }, [id, isEdit, user.id, navigate, show])

  const dirty = !loading && JSON.stringify(form) !== JSON.stringify(initial)

  // Guard: in-app navigation.
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        dirty && !skipGuard.current && currentLocation.pathname !== nextLocation.pathname,
      [dirty],
    ),
  )

  // Guard: tab close / reload.
  useEffect(() => {
    if (!dirty) return
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    const errs = validatePost(form)
    setErrors(errs)
    if (Object.keys(errs).length) {
      setMobileTab('write')
      show('Please fix the highlighted fields', 'error')
      return
    }

    const payload = {
      title: form.title.trim(),
      content: form.content,
      cover_image: form.cover_image.trim(),
      tags: parseTagInput(form.tags),
      status: form.status,
    }

    setSaving(true)
    try {
      const saved = isEdit ? await updatePost(id, payload) : await createPost(payload)
      skipGuard.current = true
      show(
        saved.status === 'published'
          ? isEdit ? 'Post updated' : 'Post published'
          : 'Draft saved',
        'success',
      )
      navigate(saved.status === 'published' ? `/posts/${saved.id}` : '/dashboard')
    } catch (err) {
      setSaving(false)
      if (err.status === 403) {
        show('You can only edit your own posts', 'error')
        skipGuard.current = true
        navigate('/dashboard', { replace: true })
        return
      }
      if (err.details?.length) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])))
      }
      show(err.message, 'error')
    }
  }

  function onCancel() {
    // If dirty, the blocker intercepts this and asks for confirmation.
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate(isEdit ? `/posts/${id}` : '/dashboard')
  }

  if (notFound) return <NotFound />
  if (loading) return <Spinner center label="Loading post…" />

  return (
    <div className="container page editor-page">
      <div className="page-head">
        <h1>{isEdit ? 'Edit post' : 'New post'}</h1>
        {dirty && <span className="muted unsaved-dot">Unsaved changes</span>}
      </div>

      <div className="editor-tabs tabs" role="tablist" aria-label="Editor view">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'write'}
          className={`tab ${mobileTab === 'write' ? 'is-active' : ''}`}
          onClick={() => setMobileTab('write')}
        >
          Write
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'preview'}
          className={`tab ${mobileTab === 'preview' ? 'is-active' : ''}`}
          onClick={() => setMobileTab('preview')}
        >
          Preview
        </button>
      </div>

      <div className={`editor-layout show-${mobileTab}`}>
        <form className="editor-form card" onSubmit={onSubmit} noValidate>
          <FormField
            label="Title"
            name="title"
            value={form.title}
            onChange={onChange}
            error={errors.title}
            maxLength={150}
            placeholder="A clear, compelling title"
            autoFocus={!isEdit}
          />
          <FormField
            as="textarea"
            label="Content"
            name="content"
            value={form.content}
            onChange={onChange}
            error={errors.content}
            rows={16}
            placeholder="Write your story… (plain text, line breaks are preserved)"
            className="field-content"
          />
          <FormField
            label="Cover image URL"
            name="cover_image"
            type="url"
            value={form.cover_image}
            onChange={onChange}
            error={errors.cover_image}
            placeholder="https://images.example.com/cover.jpg"
            hint="Optional. Must start with http:// or https://"
          />
          <div className="field-row">
            <FormField
              label="Tags"
              name="tags"
              value={form.tags}
              onChange={onChange}
              error={errors.tags}
              placeholder="react, javascript, tips"
              hint="Comma-separated, up to 5"
            />
            <FormField as="select" label="Status" name="status" value={form.status} onChange={onChange}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </FormField>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : form.status === 'draft' ? 'Save draft' : isEdit ? 'Update post' : 'Publish'}
            </button>
          </div>
        </form>

        <section className="editor-preview card" aria-label="Live preview">
          <div className="preview-label">Live preview</div>
          <Preview form={form} />
        </section>
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Discard unsaved changes?"
        message="You have changes that have not been saved. If you leave now, they will be lost."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        danger
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </div>
  )
}
