/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth'
import { tokenStore } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => tokenStore.get())
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()))

  // Hydrate the user from a stored token on first load.
  useEffect(() => {
    if (!tokenStore.get()) return
    let cancelled = false
    authApi
      .getMe()
      .then(({ user }) => !cancelled && setUser(user))
      .catch(() => {
        if (cancelled) return
        tokenStore.clear()
        setToken(null)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const applySession = useCallback(({ user, token }) => {
    tokenStore.set(token)
    setToken(token)
    setUser(user)
    return user
  }, [])

  const login = useCallback(
    async (email, password) => applySession(await authApi.login(email, password)),
    [applySession],
  )

  const register = useCallback(
    async (data) => applySession(await authApi.register(data)),
    [applySession],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      tokenStore.clear()
      setToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
