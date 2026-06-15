import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// --- Utilities ---

function log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...meta }))
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function authenticateUser(req: Request, requestId: string) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await supabaseUser.auth.getUser()
  if (error || !user) {
    log('warn', 'Unauthorized access attempt', { requestId })
    return null
  }
  return user
}

// --- Route Handlers ---

async function handleGetProfile(userId: string, requestId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, name, surname')
    .eq('id', userId)
    .single()

  if (error) {
    log('error', 'Fetch profile failed', { requestId, error: error.message })
    return jsonResponse({ error: 'Failed to fetch profile' }, 500)
  }

  return jsonResponse(data, 200)
}

async function handleUpdateProfile(req: Request, userId: string, requestId: string) {
  const body = await req.json().catch(() => null)
  const { name, surname } = body ?? {}

  if (!name?.trim() || !surname?.trim()) {
    return jsonResponse({ error: 'Name and surname are required' }, 400)
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ name: name.trim(), surname: surname.trim() })
    .eq('id', userId)
    .select('id, name, surname')
    .single()

  if (error) {
    log('error', 'Update profile failed', { requestId, error: error.message })
    return jsonResponse({ error: 'Failed to update profile' }, 500)
  }

  return jsonResponse(data, 200)
}

async function handleDeleteAccount(userId: string, requestId: string) {
  // Remove user from any team first
  const { error: teamError } = await supabaseAdmin
    .from('team')
    .delete()
    .or(`member_1.eq.${userId},member_2.eq.${userId}`)

  if (teamError) {
    log('error', 'Failed to remove user from team', { requestId, error: teamError.message })
    return jsonResponse({ error: 'Failed to clean up team data' }, 500)
  }

  // Delete auth user (profile row cascades via FK)
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (authError) {
    log('error', 'Failed to delete auth user', { requestId, error: authError.message })
    return jsonResponse({ error: 'Failed to delete account' }, 500)
  }

  return jsonResponse({ message: 'Account deleted' }, 200)
}

// --- Main Server ---

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID()
  const startTime = performance.now()

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const user = await authenticateUser(req, requestId)
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401)

    let response: Response
    switch (req.method) {
      case 'GET':    response = await handleGetProfile(user.id, requestId); break
      case 'PUT':    response = await handleUpdateProfile(req, user.id, requestId); break
      case 'DELETE': response = await handleDeleteAccount(user.id, requestId); break
      default:       response = jsonResponse({ error: 'Method not allowed' }, 405)
    }

    log('info', `${req.method} processed`, { requestId, duration: Math.round(performance.now() - startTime) })
    return response

  } catch (error) {
    log('error', 'Server Error', { requestId, error: error.message })
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})

