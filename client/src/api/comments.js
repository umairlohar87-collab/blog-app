import { request } from './client'

export const getComments = (postId, opts) => request(`/posts/${postId}/comments`, opts)

export const createComment = (postId, content) =>
  request(`/posts/${postId}/comments`, { method: 'POST', body: { content } })

export const deleteComment = (id) => request(`/comments/${id}`, { method: 'DELETE' })
