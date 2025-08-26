import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isGuest: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  continueAsGuest: () => void
  getDisplayName: () => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    // Check for guest mode in localStorage
    const guestMode = localStorage.getItem('sentix_guest_mode')
    if (guestMode === 'true') {
      setIsGuest(true)
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      // Clear guest mode when user signs in
      if (session?.user) {
        setIsGuest(false)
        localStorage.removeItem('sentix_guest_mode')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    // Clear guest mode immediately on successful sign up
    if (!error) {
      setIsGuest(false)
      localStorage.removeItem('sentix_guest_mode')
    }
    
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // Clear guest mode immediately on successful sign in
    if (!error) {
      setIsGuest(false)
      localStorage.removeItem('sentix_guest_mode')
    }
    
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setIsGuest(false)
    localStorage.removeItem('sentix_guest_mode')
  }

  const continueAsGuest = () => {
    setIsGuest(true)
    setLoading(false)
    localStorage.setItem('sentix_guest_mode', 'true')
  }

  const getDisplayName = () => {
    if (user?.email) {
      return user.email
    }
    if (isGuest) {
      return 'Guest@SentiX'
    }
    return 'User'
  }

  const value = {
    user,
    session,
    loading,
    isGuest,
    signUp,
    signIn,
    signOut,
    continueAsGuest,
    getDisplayName,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
