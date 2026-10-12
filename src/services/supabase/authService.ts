import type { User } from '@supabase/supabase-js'
import type { HostUser } from '@/domain/types'
import { supabase } from '@/lib/supabase'
import type { AuthService, AuthSnapshot } from '../authService'

const listeners = new Set<() => void>()
let snapshot: AuthSnapshot = { status: 'loading', host: null }
let initialized = false

function set(next: AuthSnapshot) {
  snapshot = next
  listeners.forEach((l) => l())
}

async function lookupHost(user: User): Promise<HostUser | null> {
  const { data, error } = await supabase().from('hosts').select('display_name').eq('user_id', user.id).maybeSingle()
  if (error) throw error
  return data ? { id: user.id, name: data.display_name as string, email: user.email ?? '' } : null
}

async function resolve(user: User | null) {
  if (!user) return set({ status: 'signed-out', host: null })
  try {
    const host = await lookupHost(user)
    set(host ? { status: 'host', host } : { status: 'signed-out', host: null })
  } catch {
    set({ status: 'signed-out', host: null })
  }
}

function init() {
  if (initialized) return
  initialized = true
  supabase().auth.onAuthStateChange((_event, session) => {
    // Defer: Supabase recommends not awaiting other calls inside this callback.
    setTimeout(() => void resolve(session?.user ?? null), 0)
  })
}

export const supabaseAuthService: AuthService = {
  getSnapshot() {
    init()
    return snapshot
  },

  async signIn(email, password) {
    init()
    const { data, error } = await supabase().auth.signInWithPassword({ email, password })
    if (error) {
      if (/invalid login credentials/i.test(error.message)) throw new Error('That email and password do not match.')
      if (/email not confirmed/i.test(error.message)) throw new Error('Please confirm your email address first.')
      throw new Error(error.message)
    }
    const host = await lookupHost(data.user)
    if (!host) {
      await supabase().auth.signOut()
      throw new Error('This account is not a prayer host. Ask an administrator to add you to the host list.')
    }
    set({ status: 'host', host })
    return host
  },

  async signOut() {
    await supabase().auth.signOut()
    set({ status: 'signed-out', host: null })
  },

  subscribe(listener) {
    init()
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
