import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let subscription = null

    const init = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }

        // Listen for auth changes
        const { data } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              await fetchProfile(session.user.id)
            } else if (event === 'SIGNED_OUT') {
              setUser(null)
            }
          }
        )
        subscription = data.subscription
      } catch (err) {
        console.warn('Supabase auth init failed:', err.message)
        setLoading(false)
      }
    }

    init()

    return () => subscription?.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet (new user via OAuth)
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const newProfile = {
            id: authUser.id,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email,
            plan: 'Pro Plan',
          }
          await supabase.from('profiles').insert(newProfile)
          setUser(newProfile)
        }
      } else if (data) {
        setUser(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }
    await fetchProfile(data.user.id)
    return { success: true }
  }

  const register = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { success: false, error: error.message }

    // Create profile
    if (data.user) {
      const profile = { id: data.user.id, name, email, plan: 'Pro Plan' }
      const { error: profileError } = await supabase.from('profiles').insert(profile)
      if (profileError) {
        console.error('Profile creation error:', profileError)
        return { success: false, error: 'Account created but profile setup failed. Please login.' }
      }
      setUser(profile)
    }
    return { success: true }
  }

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/admin' }
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
