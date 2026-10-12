import type { AuthService } from './authService'
import type { SessionService } from './sessionService'
import { supabaseAuthService } from './supabase/authService'
import { supabaseSessionService } from './supabase/sessionService'

export const sessionService: SessionService = supabaseSessionService
export const authService: AuthService = supabaseAuthService
export { moderationService } from './moderationService'
