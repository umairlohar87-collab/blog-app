import { request } from './client'

export const login = (email, password) => request('/auth/login', { method: 'POST', body: { email, password } })

export const register = ({ username, email, password }) =>
  request('/auth/register', { method: 'POST', body: { username, email, password } })

export const logout = () => request('/auth/logout', { method: 'POST' })

export const getMe = () => request('/auth/me')
