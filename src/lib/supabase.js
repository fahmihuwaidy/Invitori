import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if credentials look valid (must start with https://)
const isConfigured = supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20

let supabase

if (isConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn(
    '⚠️ Supabase credentials not configured. Please update your .env file with valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
  // Create a mock client that won't crash the app
  const noop = () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
  const noopObj = new Proxy({}, { get: () => (...args) => {
    // If called as a function, return noop promise
    // If accessed as property, return another proxy
    const result = noop()
    result.select = () => result
    result.insert = () => result
    result.update = () => result
    result.delete = () => result
    result.eq = () => result
    result.in = () => result
    result.single = () => result
    result.order = () => result
    return result
  }})

  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: noop,
      signUp: noop,
      signInWithOAuth: noop,
      signOut: () => Promise.resolve(),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    from: () => noopObj,
    rpc: noop,
  }
}

export { supabase, isConfigured }
