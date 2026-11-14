import { request } from './client'

/** @param {{page?, limit?, search?, tag?, author?, status?}} params */
export const getPosts = (params, opts) => request('/posts', { params, ...opts })

/** Current user's posts. status: 'all' | 'published' | 'draft' */
export const getMyPosts = ({ status = 'all', page = 1, limit = 10 } = {}, opts) =>
  request('/posts', { params: { author: 'me', status, page, limit }, ...opts })

export const getPost = (id, opts) => request(`/posts/${id}`, opts)

export const getTags = (opts) => request('/posts/tags', opts)

export const createPost = (data) => request('/posts', { method: 'POST', body: data })

export const updatePost = (id, data) => request(`/posts/${id}`, { method: 'PUT', body: data })

export const deletePost = (id) => request(`/posts/${id}`, { method: 'DELETE' })

export const getUser = (id, opts) => request(`/users/${id}`, opts)

export const getUserPosts = (id, params, opts) => request(`/users/${id}/posts`, { params, ...opts })
