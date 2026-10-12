import { ServerError } from 'npm:livekit-server-sdk@2.19.1'

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allow = allowedOrigins.includes('*') ? '*' : allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? ''
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

export function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

/** Wraps a handler with CORS, method checks, JSON parsing, and uniform error responses. */
export function serve(handler: (req: Request, body: Record<string, unknown>) => Promise<unknown>) {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
    if (req.method !== 'POST') return json(req, 405, { code: 'method-not-allowed', message: 'Use POST.' })
    try {
      let body: Record<string, unknown> = {}
      try {
        body = (await req.json()) as Record<string, unknown>
      } catch {
        throw new HttpError(400, 'bad-request', 'Request body must be JSON.')
      }
      return json(req, 200, await handler(req, body))
    } catch (error) {
      if (error instanceof HttpError) return json(req, error.status, { code: error.code, message: error.message })
      console.error(error)
      return json(req, 500, describeUnexpected(error))
    }
  })
}

/**
 * Turns configuration and upstream failures into actionable messages. These describe setup
 * problems only and never include secret values.
 */
function describeUnexpected(error: unknown): { code: string; message: string } {
  const e = error as { code?: string; message?: string; details?: unknown; hint?: unknown }
  const message = e?.message ?? String(error)

  if (error instanceof ServerError) {
    if (error.status === 401 || error.status === 403 || /unauthori[sz]ed|invalid.*(key|token|signature)/i.test(message)) {
      return {
        code: 'livekit-auth',
        message: 'LiveKit rejected the server credentials. Check the LIVEKIT_API_KEY and LIVEKIT_API_SECRET secrets belong to the same LiveKit project as LIVEKIT_URL.',
      }
    }
    return { code: 'livekit-error', message: `LiveKit returned an error: ${message}` }
  }
  if (error instanceof TypeError && /fetch|dns|connect|lookup|resolve|sending request/i.test(message)) {
    return {
      code: 'livekit-unreachable',
      message: 'The server could not reach LiveKit. Check the LIVEKIT_URL secret (wss://your-project.livekit.cloud).',
    }
  }
  if (e && typeof e.code === 'string' && ('details' in e || 'hint' in e)) {
    return { code: 'database-error', message: `Database error: ${message}` }
  }
  return { code: 'server-error', message: 'Something went wrong on the server. Please try again.' }
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function requireSessionId(value: unknown): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) {
    throw new HttpError(400, 'bad-request', 'A valid session id is required.')
  }
  return value
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value) throw new HttpError(400, 'bad-request', `${field} is required.`)
  return value
}
