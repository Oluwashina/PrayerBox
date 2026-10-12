import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

const NETWORK_MESSAGE = 'We could not reach the server. Check your internet connection and try again.'

/** Calls a Supabase Edge Function. The signed-in host's access token is attached automatically. */
export async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new ApiError(0, 'network', NETWORK_MESSAGE)
  const { data, error } = await supabase().functions.invoke(name, { body })
  if (!error) return data as T
  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response
    const payload = (await response.json().catch(() => null)) as { code?: string; message?: string } | null
    throw new ApiError(response.status, payload?.code ?? 'error', payload?.message ?? 'The request failed. Please try again.')
  }
  if (error instanceof FunctionsFetchError || error instanceof FunctionsRelayError) {
    throw new ApiError(0, 'network', NETWORK_MESSAGE)
  }
  throw new ApiError(0, 'unknown', error.message)
}

/** Turns Postgres / PostgREST errors into sentences people can act on. */
export function friendlyDbError(error: { code?: string; message: string }) {
  if (error.code === '42501') return new Error('You do not have permission to do this. Please sign in as a host.')
  if (error.code === 'P0001') return new Error(error.message)
  if (error.code === '23514') return new Error('Some details are too long or missing. Please check the form.')
  if (/fetch|network/i.test(error.message)) return new Error(NETWORK_MESSAGE)
  return new Error(error.message)
}
