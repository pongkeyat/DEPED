import React, { createContext, useContext, useEffect, useState } from 'react'
import { loginUser, getProfile, logoutUser } from '../api/AuthApi'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))

  useEffect(() => {
    let mounted = true
    const init = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const profile = await getProfile(token)
        if (mounted) setUser(profile)
      } catch (err) {
        console.error('Auth init failed', err)
        localStorage.removeItem('auth_token')
        if (mounted) setToken(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()
    return () => {
      mounted = false
    }
  }, [token])

  const login = async (credentials) => {
    setLoading(true)
    const res = await loginUser(credentials)
    
    // Try common response shapes for token/profile
    const authToken = res?.token || res?.accessToken || res?.data?.token || res?.data?.accessToken || res?.user?.token || res?.data?.user?.token
    const profile = res?.user || res?.profile || res?.data?.user || res?.data?.profile || res?.data?.profile

    if (!authToken) {
      setLoading(false)
      throw new Error('Login response did not include a token')
    }

    localStorage.setItem('auth_token', authToken)
    setToken(authToken)

    // Capture profile accurately for immediate return value
    let finalProfile = profile

    if (profile) {
      setUser(profile.user)
    } else {
      const fetched = await getProfile(authToken)
      setUser(fetched.user)
      finalProfile = fetched // Store the fresh data from the API
    }

    setLoading(false)
    return { token: authToken, user: finalProfile } // Fixed: now returns correct user data instantly
  }

  const logout = async () => {
    try {
      if (token) await logoutUser(token)
    } catch (err) {
      console.error('Logout failed', err)
    }
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext;