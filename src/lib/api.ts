import { createSignal } from 'solid-js'
import { makePersisted } from '@solid-primitives/storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

if (!SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY environment variable')
}

// Base client for auth operations (no user token needed)
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

// ============ Edge Function Calls (for registration with token validation) ============

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

// Registration (still uses edge function for token validation)
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

// ============ Session Management ============

const [accessToken, setAccessToken] = makePersisted(createSignal<string | null>(null), {
  name: 'cb_access_token',
})

const [refreshToken, setRefreshToken] = makePersisted(createSignal<string | null>(null), {
  name: 'cb_refresh_token',
})

const [expiresAt, setExpiresAt] = makePersisted(createSignal<number | null>(null), {
  name: 'cb_expires_at',
})

function saveSession(newAccessToken: string, newRefreshToken: string, newExpiresAt: number) {
  setAccessToken(newAccessToken)
  setRefreshToken(newRefreshToken)
  setExpiresAt(newExpiresAt)
}

function clearSession() {
  setAccessToken(null)
  setRefreshToken(null)
  setExpiresAt(null)
}

export function getAccessToken(): string | null {
  return accessToken()
}

export function getRefreshToken(): string | null {
  return refreshToken()
}

export function isAuthenticated(): boolean {
  return !!accessToken()
}

export function getCurrentUserId(): string | null {
  const token = accessToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub
  } catch {
    return null
  }
}

function isTokenExpired(): boolean {
  const exp = expiresAt()
  if (!exp) return true
  // Consider expired 60 seconds before actual expiry
  return Date.now() / 1000 > exp - 60
}

// Export reactive signal for components
export { accessToken }

// ============ Auth Operations ============

export interface LoginInput {
  email: string
  password: string
}

export async function login(input: LoginInput): Promise<ApiResponse<{ userId: string }>> {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.session) {
    saveSession(
      data.session.access_token,
      data.session.refresh_token,
      data.session.expires_at ?? 0
    )
  }

  return { data: { userId: data.user.id } }
}

export async function refreshSession(): Promise<boolean> {
  const token = refreshToken()
  if (!token) return false

  const { data, error } = await supabaseAuth.auth.refreshSession({
    refresh_token: token,
  })

  if (error || !data.session) {
    clearSession()
    return false
  }

  saveSession(
    data.session.access_token,
    data.session.refresh_token,
    data.session.expires_at ?? 0
  )

  return true
}

export function logout() {
  clearSession()
  clearSupabaseClient()
}

// ============ Authenticated Supabase Client ============

let supabaseClient: SupabaseClient | null = null
let cachedToken: string | null = null

async function ensureValidToken(): Promise<string> {
  const token = accessToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  if (isTokenExpired()) {
    const refreshed = await refreshSession()
    if (!refreshed) {
      throw new Error('Session expired')
    }
    return accessToken()!
  }

  return token
}

export async function getSupabaseClient(): Promise<SupabaseClient> {
  const token = await ensureValidToken()

  // Recreate client if token changed
  if (!supabaseClient || cachedToken !== token) {
    cachedToken = token
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
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

// ============ Data Fetching ============

export interface Profile {
  id: string
  name: string
  surname: string
}

export async function fetchProfiles(): Promise<Profile[]> {
  const client = await getSupabaseClient()
  const { data, error } = await client
    .from('profiles')
    .select('id, name, surname')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data as Profile[]
}

// ============ Team Management ============

export interface TeamMember {
  name: string
  surname: string
}

export interface Team {
  name: string
  created_at: string
  member_1: string
  member_2: string
  member_1_name: string
  member_2_name: string
}

async function callAuthenticatedEdgeFunction<T>(
  functionName: string,
  method: string,
  body?: object
): Promise<ApiResponse<T>> {
  try {
    const token = await ensureValidToken()

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, options)
    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'Request failed' }
    }

    return { data }
  } catch (err) {
    if (err instanceof Error && (err.message === 'Not authenticated' || err.message === 'Session expired')) {
      return { error: err.message }
    }
    return { error: 'Network error' }
  }
}

export async function fetchTeams(): Promise<Team[]> {
  const client = await getSupabaseClient()
  const { data, error } = await client
    .from('team')
    .select(`
      name,
      created_at,
      member_1,
      member_2,
      member_1_profile:profiles!member_1(name, surname),
      member_2_profile:profiles!member_2(name, surname)
    `)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((t: any) => ({
    name: t.name,
    created_at: t.created_at,
    member_1: t.member_1,
    member_2: t.member_2,
    member_1_name: `${t.member_1_profile?.name ?? ''} ${t.member_1_profile?.surname ?? ''}`.trim(),
    member_2_name: `${t.member_2_profile?.name ?? ''} ${t.member_2_profile?.surname ?? ''}`.trim(),
  }))
}

export interface CreateTeamInput {
  name: string
  partnerId: string
}

export async function createTeam(input: CreateTeamInput): Promise<ApiResponse<{ team: Team }>> {
  return callAuthenticatedEdgeFunction<{ team: Team }>('team', 'POST', {
    name: input.name,
    other_member_id: input.partnerId,
  })
}

export interface UpdateTeamInput {
  name: string
}

export async function updateTeam(input: UpdateTeamInput): Promise<ApiResponse<{ team: Team }>> {
  return callAuthenticatedEdgeFunction<{ team: Team }>('team', 'PUT', {
    name: input.name,
  })
}

export async function disbandTeam(): Promise<ApiResponse<{ message: string }>> {
  return callAuthenticatedEdgeFunction<{ message: string }>('team', 'DELETE')
}

// ============ Profile Management ============

export async function fetchCurrentProfile(): Promise<ApiResponse<Profile>> {
  return callAuthenticatedEdgeFunction<Profile>('profile', 'GET')
}

export interface UpdateProfileInput {
  name: string
  surname: string
}

export async function updateProfile(input: UpdateProfileInput): Promise<ApiResponse<Profile>> {
  return callAuthenticatedEdgeFunction<Profile>('profile', 'PUT', input)
}

export async function deleteAccount(): Promise<ApiResponse<{ message: string }>> {
  const result = await callAuthenticatedEdgeFunction<{ message: string }>('profile', 'DELETE')
  if (!result.error) {
    logout()
  }
  return result
}
