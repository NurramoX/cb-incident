import { createSignal } from 'solid-js'
import { makePersisted } from '@solid-primitives/storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

if (!SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

// ============ Edge Function Calls (no auth required) ============

interface ApiResponse<T> {
  data?: T
  error?: string
}

async function callEdgeFunction<T>(
  functionName: string,
  body: object
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'Request failed' }
    }

    return { data }
  } catch {
    return { error: 'Network error' }
  }
}

// Registration
export interface RegisterInput {
  name: string
  surname: string
  email: string
  password: string
  registrationToken: string
}

export interface RegisterResponse {
  message: string
  user: {
    id: string
    email: string
    name: string
    surname: string
  }
}

export async function register(input: RegisterInput): Promise<ApiResponse<RegisterResponse>> {
  return callEdgeFunction<RegisterResponse>('register', input)
}

// Login
export interface LoginInput {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  user: {
    id: string
    email: string
  }
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}

export async function login(input: LoginInput): Promise<ApiResponse<LoginResponse>> {
  const result = await callEdgeFunction<LoginResponse>('login', input)

  if (result.data?.session) {
    saveTokens(result.data.session.access_token, result.data.session.refresh_token)
  }

  return result
}

// ============ Session Management ============

const [accessToken, setAccessToken] = makePersisted(createSignal<string | null>(null), {
  name: 'cb_access_token',
})

const [refreshToken, setRefreshToken] = makePersisted(createSignal<string | null>(null), {
  name: 'cb_refresh_token',
})

function saveTokens(newAccessToken: string, newRefreshToken: string) {
  setAccessToken(newAccessToken)
  setRefreshToken(newRefreshToken)
}

export function getAccessToken(): string | null {
  return accessToken()
}

export function getRefreshToken(): string | null {
  return refreshToken()
}

function clearTokens() {
  setAccessToken(null)
  setRefreshToken(null)
}

export function isAuthenticated(): boolean {
  return !!accessToken()
}

// Export reactive signal for components
export { accessToken }

// ============ Authenticated Supabase Client ============

let supabaseClient: SupabaseClient | null = null
let cachedToken: string | null = null

export function getSupabaseClient(): SupabaseClient {
  const token = accessToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  // Recreate client if token changed
  if (!supabaseClient || cachedToken !== token) {
    cachedToken = token
    supabaseClient = createClient(SUPABASE_URL, '', {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return supabaseClient
}

function clearSupabaseClient() {
  supabaseClient = null
  cachedToken = null
}

export function logout() {
  clearTokens()
  clearSupabaseClient()
}
