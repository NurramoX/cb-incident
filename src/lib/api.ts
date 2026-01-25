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
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
  }
}

export async function login(input: LoginInput): Promise<ApiResponse<LoginResponse>> {
  const result = await callEdgeFunction<LoginResponse>('login', input)

  if (result.data) {
    saveTokens(result.data.accessToken, result.data.refreshToken)
  }

  return result
}

// ============ Session Management ============

const ACCESS_TOKEN_KEY = 'cb_access_token'
const REFRESH_TOKEN_KEY = 'cb_refresh_token'

function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

// ============ Authenticated Supabase Client ============

let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error('Not authenticated')
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, '', {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
}

export function logout() {
  clearTokens()
  clearSupabaseClient()
}
